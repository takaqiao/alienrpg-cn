/**
 * alienrpg-cn —— 「重新汉化本世界」原地修复工具
 * =============================================
 *
 * 为什么需要它（上游缺陷，不是本模块的 bug）
 * ------------------------------------------
 * `alienrpg` 系统会在**第一次 ready 时自行导入** Adventure 包：
 *   systems/alienrpg/module/apps/init.mjs:48-56  ->  :74-82 `FirstTimeSetup()`
 *       const pack = game.packs.get(adventurePack)
 *       await pack.getDocuments()
 *       await pack.getName(adventurePackName).sheet._updateObject({}, new FormData())
 * 这次导入不问 Babele 准备好了没有。若它跑在 Babele 会话建成之前（或那次开世界
 * 根本没启用 Babele），世界里落地的 Folder / Macro / RollTable / Item / Actor /
 * JournalEntry / Scene 全是英文名，而**此后没有任何东西会再去改它们的名字**：
 *   · `Adventure#import` 只在**再次导入**时才会覆盖已存在的文档
 *     （client/documents/adventure.mjs:130-157 partition + :188-197
 *      `cls.updateDocuments(updateData, {diff:false, recursive:false, ...})`），
 *   · Babele 的补名钩子只有 `createFolder` 一条
 *     （modules/babele/script/babele.js:72-74），而它要求
 *     `_stats.compendiumSource` 以 `Compendium.` 开头
 *     （script/compendium/folder-translations.js:153-159 的 `#collectionFromSourceId`），
 *     本包的 folders 带的却是世界式 `Folder.<id>` —— 那条路径直接 early-return；
 *     Macro / RollTable **连这样的钩子都没有**。
 *
 * 于是出现了本工具要修的那个典型症状：**日志正文是中文、侧边栏名字是英文**。
 * （正文之所以是中文，是系统自己的 `showReleaseNotes()`
 *   systems/alienrpg/module/alienrpg.mjs:567-621 在版本变更时**只**强刷了那一篇
 *   JournalEntry，而且 :596 明确排除了 `folders`，也从不碰 macros / tables。）
 *
 * 删掉世界重导可以解决，但那会连同 GM 已经做的工作一起丢掉。本工具做的是**原地
 * 改名 / 原地补正文**，不删不建、不动 `_id`、不动文件夹结构。
 *
 * ⚠⚠ 硬冻结登记表是**运行时加载**的，不是抄一份写死在这里
 * ------------------------------------------------------
 * `data/DO-NOT-TRANSLATE.json` 与 `7-其他内容/DO-NOT-TRANSLATE.json` 是同一份文件。
 * 加载失败 = **拒绝运行**（不是「降级为无守卫地跑」）。理由很直白：这张表里的每
 * 一条，改错了都是静默坏功能 —— 比如把 `Alien Creature Tables` 文件夹改名，
 * 生物卡的攻击表下拉框会塌成一个 `None`，然后攻击按钮抛 TypeError
 * （systems/alienrpg/module/helpers/rollTableData.mjs:27 +
 *  module/documents/actor.mjs:2497 无守卫的 `table.roll()`）。
 * 没有守卫就跑，比不跑坏得多。
 *
 * 暴露方式：设置菜单按钮 + 模块 API
 * ---------------------------------
 * 见文件末尾 `registerRetranslateWorld()` 的注释，那里写了为什么不是合集宏包。
 *
 * 本文件的**纯函数部分**（buildGuard / checkRename / indexTranslationFile /
 * planRetranslation / hasCJK / rangeKey / reportToMarkdown）不碰任何 Foundry 全局，
 * 可以在 node 里直接 import 做离线验证。幂等性就是这么证的：
 *   node "4-常用脚本/qa/gate_retranslate_world.mjs"
 * 那道闸用 Babele 2.9.1 的**真 converter** 把 raw dump 翻一遍当输入，
 * 跑「规划 -> 应用 -> 再规划」，第二遍必须是 0 条。
 */

export const MODULE_ID = "alienrpg-cn";

/** 硬冻结登记表在包内的位置。fetch 失败即拒绝运行。 */
export const REGISTER_URL = `modules/${MODULE_ID}/data/DO-NOT-TRANSLATE.json`;

/**
 * 本工具覆盖的世界文档类型。
 * 与任务约定一致，也正好是三个 Adventure 包里真正出现过的七种。
 * Playlist / Cards / Combat 不在内：三个包都没有，出现了会在报告里如实说「未覆盖」。
 */
export const COVERED_TYPES = Object.freeze([
  "Folder",
  "Macro",
  "RollTable",
  "Item",
  "Actor",
  "JournalEntry",
  "Scene",
]);

/**
 * Babele 的 Adventure 默认 mapping 里，每个内容集合的 **mapping key** 与它承载的
 * 文档类型。逐字对照 modules/babele/script/mapping/default-mappings.js:3-59。
 *
 * ⚠ 注意 `journals` 是 mapping key，Foundry 那边的**数据字段名**叫 `journal`
 *   （default-mappings.js:11-16 `"journals": {"path": "journal", ...}`）。译文文件
 *   用的是 mapping key，`Adventure.contentFields` 用的是数据字段名，两者只有这一处
 *   不同 —— 混用会让日志整类漏修。
 */
export const DOC_TYPE_BY_MAPPING_KEY = Object.freeze({
  folders: "Folder",
  journals: "JournalEntry",
  scenes: "Scene",
  macros: "Macro",
  playlists: "Playlist",
  tables: "RollTable",
  items: "Item",
  actors: "Actor",
  cards: "Cards",
});

/* ================================================================== *
 * 1. 硬冻结守卫                                                       *
 * ================================================================== */

/**
 * 从 role 文本里判定这条冻结项管的是哪种文档。
 *
 * 登记表的 `sections.name_lookups.entries[].role` 是人写的自然语言，但每一条都
 * 恰好含有 Foundry 的文档类名（"Adventure document name" /
 * "JournalEntry name shown after import" / "Scene name activated after import"）。
 * 认不出来时**不猜**：返回 null，调用方会把这条冻结到**所有**类型上并留下告警。
 * 宁可多冻（表现为「某个名字没改，报告里写明原因」）也不能漏冻。
 *
 * @param {string} role
 * @returns {string|null}
 */
export function docTypeFromRole(role) {
  const text = String(role ?? "");
  // 长名在前，避免 "Journal" 抢在 "JournalEntry" 前面命中。
  const known = ["JournalEntry", "RollTable", "ActiveEffect", "Adventure", "Playlist", "Folder", "Macro", "Scene", "Actor", "Item", "Cards"];
  for (const t of known) {
    if (text.includes(t)) return t;
  }
  return null;
}

/**
 * 把 DO-NOT-TRANSLATE.json 编译成一组可执行的判据。
 *
 * @param {object} register 登记表原文
 * @returns {{
 *   frozenByType: Map<string, Set<string>>,
 *   frozenUpperByType: Map<string, Set<string>>,
 *   prefixRules: Array<{docType:string, prefix:string}>,
 *   substringRules: Array<{docType:string, tests:Array<{op:string, literal:string}>, semantics:string}>,
 *   noneSentinel: string,
 *   warnings: string[],
 *   stats: object
 * }}
 * @throws 当登记表缺少任何一个必备小节时。守卫不完整 = 不许跑。
 */
export function buildGuard(register) {
  const sections = register?.sections;
  if (!sections || typeof sections !== "object") {
    throw new Error("DO-NOT-TRANSLATE.json 里没有 sections —— 守卫不完整，拒绝运行。");
  }

  // 缺任何一节都拒绝：少一节就等于少一整类冻结判据，而它的失效形态是**静默的**。
  const REQUIRED = ["name_lookups", "rolltable_names", "folder_names", "item_names", "name_substring_tests"];
  const missing = REQUIRED.filter((k) => !sections[k]);
  if (missing.length) {
    throw new Error(`DO-NOT-TRANSLATE.json 缺少必备小节：${missing.join(", ")} —— 守卫不完整，拒绝运行。`);
  }

  const frozenByType = new Map();
  const frozenUpperByType = new Map();
  const warnings = [];
  const add = (map, type, value) => {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type).add(value);
  };

  // ── name_lookups：按 role 分型 ────────────────────────────────────────
  // 带 `unfrozen_by_shim` 的条目是 **T-SHIMMED，不是 T-FROZEN**：它们在包里就是
  // 中文，靠 scripts/alienrpg-hardcoded-cn.mjs 的 game.journal.getName 垫片让
  // 英文键仍然查得到（登记表 sections.name_lookups.tier_exception 明写了这一点）。
  // 把它们当冻结项会**倒过来**：世界里那篇日志永远改不成中文。
  let shimmed = 0;
  for (const e of sections.name_lookups.entries ?? []) {
    if (e?.unfrozen_by_shim) { shimmed++; continue; }
    const str = e?.string;
    if (typeof str !== "string" || !str.length) continue;
    const type = docTypeFromRole(e.role);
    if (type) {
      add(frozenByType, type, str);
    } else {
      for (const t of COVERED_TYPES) add(frozenByType, t, str);
      warnings.push(`冻结项 ${e.id ?? str} 的 role「${e.role}」无法判定文档类型，已按最保守处理：对所有类型冻结。`);
    }
  }

  // ── rolltable_names：11 条写死的 game.tables.getName() 实参 ──────────
  for (const e of sections.rolltable_names.entries ?? []) {
    if (typeof e?.string === "string" && e.string.length) add(frozenByType, "RollTable", e.string);
  }
  const prefixRules = [];
  for (const p of sections.rolltable_names.prefix_filters ?? []) {
    if (typeof p?.prefix === "string" && p.prefix.length) prefixRules.push({ docType: "RollTable", prefix: p.prefix });
  }

  // ── folder_names：3 条 ────────────────────────────────────────────────
  // ⚠ 登记表给了 `type: "RollTable"`，但那是**文件夹自己的 type**，不是查找的过滤条件：
  //   真正的查找是 `game.folders.getName("Alien Tables")` /
  //   `game.folders.contents.find(x => x.name === ...)`（登记表 lookup 字段逐字如此），
  //   两者都**不按 type 过滤**。所以冻结范围是「任何 Folder」，不能按 type 收窄。
  for (const e of sections.folder_names.entries ?? []) {
    if (typeof e?.string === "string" && e.string.length) add(frozenByType, "Folder", e.string);
  }

  // ── item_names：6 条 `.toUpperCase() === "…"` 的天赋名 ────────────────
  for (const e of sections.item_names.entries ?? []) {
    const s = e?.string_compared;
    if (typeof s === "string" && s.length) add(frozenUpperByType, "Item", s.toUpperCase());
  }
  // 「None」是**哨兵值**不是文档名（sections.item_names.none_sentinel）。它在下面的
  // Actor 表引用同步里要用到，同样从登记表读，不写死。
  const noneSentinel = sections.item_names?.none_sentinel?.string ?? "None";

  // ── name_substring_tests：负重代码按**名字子串**判弹药重量 ────────────
  const substringRules = [];
  for (const e of sections.name_substring_tests.entries ?? []) {
    const tests = (e?.tests ?? []).filter((t) => typeof t?.op === "string" && typeof t?.literal === "string");
    if (tests.length) {
      substringRules.push({ docType: "Item", tests, semantics: e.semantics ?? "at_least_one" });
    }
  }

  const stats = {
    schemaVersion: register?.schema_version ?? null,
    generatedOn: register?.generated_on ?? null,
    frozenExact: [...frozenByType.values()].reduce((n, s) => n + s.size, 0),
    frozenUpper: [...frozenUpperByType.values()].reduce((n, s) => n + s.size, 0),
    prefixRules: prefixRules.length,
    substringRules: substringRules.length,
    shimmedSkipped: shimmed,
  };

  if (stats.frozenExact === 0) {
    // 一条都没编译出来 = 判据空转。本项目吃过太多次「闸在跑但表是空的」，这里直接拒绝。
    throw new Error("DO-NOT-TRANSLATE.json 编译出 0 条精确冻结名 —— 判据空转，拒绝运行。");
  }
  if (register?.schema_version !== 1) {
    warnings.push(`登记表 schema_version = ${register?.schema_version}，本工具是照 v1 写的。请人工复核后再执行。`);
  }

  return { frozenByType, frozenUpperByType, prefixRules, substringRules, noneSentinel, warnings, stats };
}

/** 子串判据：至少满足一条 / 全部满足。 */
function satisfiesSubstring(name, rule) {
  const hit = rule.tests.map((t) => {
    const s = String(name ?? "");
    if (t.op === "includes") return s.includes(t.literal);
    if (t.op === "startsWith") return s.startsWith(t.literal);
    if (t.op === "endsWith") return s.endsWith(t.literal);
    // 认不出的算子按「没满足」处理 —— 宁可误判成不满足（会挡住改名），也不放行。
    return false;
  });
  return rule.semantics === "all" ? hit.every(Boolean) : hit.some(Boolean);
}

/**
 * 一次改名是否被硬冻结登记表挡住。
 *
 * @returns {null|{reason:string, rule:string}} null = 放行
 */
export function checkRename(docType, from, to, guard) {
  if (typeof to !== "string" || !to.length) return { reason: "目标名不是非空字符串", rule: "sanity" };
  if (from === to) return null; // 无变化，无需判据

  if (guard.frozenByType.get(docType)?.has(from)) {
    return { reason: `「${from}」是 ${docType} 的硬冻结名，代码按字节相等查它`, rule: "T-FROZEN/name" };
  }
  const upper = String(from).toUpperCase();
  if (guard.frozenUpperByType.get(docType)?.has(upper) && String(to).toUpperCase() !== upper) {
    return { reason: `「${from}」被 .toUpperCase() 比较，改名后大写形态不再相等`, rule: "T-FROZEN/uppercase" };
  }
  for (const r of guard.prefixRules) {
    if (r.docType !== docType) continue;
    if (String(from).startsWith(r.prefix) && !String(to).startsWith(r.prefix)) {
      return { reason: `以「${r.prefix}」开头的 ${docType} 被 startsWith 过滤器收集，改名会让它掉出列表`, rule: "T-FROZEN/prefix" };
    }
  }
  for (const r of guard.substringRules) {
    if (r.docType !== docType) continue;
    if (satisfiesSubstring(from, r) && !satisfiesSubstring(to, r)) {
      const lits = r.tests.map((t) => `${t.op}(${JSON.stringify(t.literal)})`).join(" / ");
      return { reason: `原名满足 ${lits}，新名不满足；负重代码按名字子串判弹药重量`, rule: "T-FROZEN-SUBSTRING" };
    }
  }
  return null;
}

/* ================================================================== *
 * 2. 译文文件索引（英文键 -> 中文值）                                  *
 * ================================================================== */

/** 取译文条目的名字：folders 是裸字符串，其余是 {name, ...}。 */
function translatedName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.name === "string") return value.name;
  return null;
}

/**
 * 把一份 Babele 译文文件（compendium/cn/<collection>.json）索引成
 * `{docType -> Map<英文名, 中文名>}`。
 *
 * 这条路径只用于**按名字**补匹配 —— 世界里因为手工重建而丢了 `_id` 对应的文档。
 * 主路径是按 `_id` 匹配（见 planRetranslation），因为 `Adventure#import` 是
 * `keepId: true` 建档的（client/documents/adventure.mjs:174-186）。
 *
 * @param {object} json
 * @returns {{byType: Map<string, Map<string,string>>, adventures: string[]}}
 */
export function indexTranslationFile(json) {
  const byType = new Map();
  const adventures = [];
  for (const [advName, adv] of Object.entries(json?.entries ?? {})) {
    adventures.push(advName);
    for (const [key, coll] of Object.entries(adv ?? {})) {
      const docType = DOC_TYPE_BY_MAPPING_KEY[key];
      if (!docType || !coll || typeof coll !== "object") continue;
      if (!byType.has(docType)) byType.set(docType, new Map());
      const m = byType.get(docType);
      for (const [en, v] of Object.entries(coll)) {
        const cn = translatedName(v);
        if (typeof cn === "string" && cn.length) m.set(en, cn);
      }
    }
  }
  return { byType, adventures };
}

/* ================================================================== *
 * 3. 规划器（纯函数）                                                 *
 * ================================================================== */

/**
 * 含 CJK？用来判断「这个字段还是原始英文，没人动过」。
 *
 * 基本多文种平面的汉字 + 扩展 A + 兼容汉字，再加上通过代理对表达的扩展 B 及以上。
 * 判据方向是**保守**的：只要现值里已经有汉字，就当它「已经本地化过或被人改过」，
 * 一律不覆盖。代价是「换了一版译文后旧中文不会被刷新」——那由 `force` 选项显式开启。
 */
export function hasCJK(s) {
  return /[㐀-鿿豈-﫿]|[\uD840-\uD87F][\uDC00-\uDFFF]/.test(String(s ?? ""));
}

/** 结果区间归一化成译文文件用的键形态：`[1,6]` -> `"1-6"`。 */
export function rangeKey(range) {
  if (Array.isArray(range) && range.length >= 2) return `${range[0]}-${range[1]}`;
  if (typeof range === "string") return range;
  return null;
}

/**
 * 多个来源对同一个字段给出的值是否一致。
 *
 * 三个包**故意共用 _id**（实测：system∩starterset 文件夹 4 / 表 2；
 * starterset∩corerules 文件夹 11 / 表 9 / 物品 18 / 角色 4 / 场景 1）。世界里同一个
 * _id 只会有一份文档 —— `Adventure#import` 的 update 分支会用后导入的那个包覆盖它
 * （client/documents/adventure.mjs:141-142 `collection.has(d._id)` -> u 桶）——
 * 而**它最后是被哪个包写的，运行时无从得知**。
 * 所以规矩是：几个包给出的答案一致就用，不一致就**不猜**。
 */
function agreeOn(values) {
  const set = new Set(values.filter((v) => typeof v === "string"));
  if (set.size === 0) return { conflict: false, value: null, values: [] };
  if (set.size === 1) return { conflict: false, value: [...set][0], values: [...set] };
  return { conflict: true, value: null, values: [...set] };
}

/**
 * 规划一次「重新汉化」。**不写任何东西**，只产出待办清单。
 *
 * @param {object} args
 * @param {Array} args.sources     每个 Adventure 包一条：
 *        `{key, label, packCollection, translationUrl|null,
 *          byType: {<DocType>: {byId: Map<id, packDoc>, byName: Map<en, cn>}}}`
 *        `packDoc` 是**已被 Babele 翻译过的** Adventure 内嵌文档对象
 *        （`{_id, name, results?, pages?}`）。
 * @param {object} args.world      `{<DocType>: Array<worldDoc>}`，worldDoc 形如
 *        `{_id, name, results?: [{_id, range, description}],
 *          pages?: [{_id, name, text:{content}}], system?: {rTables, cTables}}`
 * @param {object} args.guard      buildGuard() 的产物
 * @param {object} [args.options]  `{content:boolean, nameFallback:boolean, force:boolean}`
 * @returns {object} 报告
 */
export function planRetranslation({ sources, world, guard, options = {} }) {
  const opt = { content: true, nameFallback: true, force: false, ...options };
  const ops = [];
  const blocked = [];
  const skipped = [];
  const warnings = [...(guard.warnings ?? [])];

  // ── 只有「译文确实生效了」的包才有投票权 ────────────────────────────────
  //
  // `agreeOn` 的本意是「两个包对同一个 _id 给出**不同的译名**时不猜」。但一个
  // **压根没有译文文件**的包读出来的就是英文原名 —— 那不是一票反对，那是弃权。
  // 把弃权当反对，后果是整类修复被自己人挡住。
  //
  // 实测（2026-08-30，用 Babele 2.9.1 真 converter 跑三份 raw dump）：
  //   仅 system + starterset（闸门 gate_retranslate_world.mjs 只喂了这两个）：
  //     301 条待办 / 0 条被挡 / 0 条跳过
  //   加上已安装但**尚无译文文件**的 alien-evolved-corerules（真实世界的样子）：
  //     172 条待办 / 32 条被挡 / 95 条跳过    ← 少修 129 条
  //   被挡的正是 Careers 之外那批：异形子表 / 异形宏 / 武器 / 生物 / 职业天赋 …
  //   每一条的「冲突」都长成 `"异形子表 / Alien Sub-Tables"` —— 后半截就是
  //   corerules 包没译文时读出来的英文原名。
  //
  // 另一个同样重要的作用：Babele 没启用时**所有**包都是 false，投票池为空，
  // 规划器直接得到 0 条待办。这挡住了本工具唯一的破坏性路径 ——
  // 「Babele 关着 + 勾了强制对齐」会把一个已经中文化的世界整体刷回英文
  // （实测 104 个名字 + 190 处正文）。仅靠一条告警是挡不住的。
  //
  // `babeleTranslated === null`（拿不准）按有投票权处理，与旧行为一致。
  const voting = sources.filter((s) => s.babeleTranslated !== false);
  const muted = sources.filter((s) => s.babeleTranslated === false);
  if (muted.length) {
    warnings.push(
      `这些包没有生效的译文，本次**不参与判定**（它们读出来的就是英文原名，` +
        `算进去只会把别的包的正确译名挡掉）：${muted.map((s) => s.packCollection).join("、")}。`
    );
  }
  if (sources.length && !voting.length) {
    warnings.push("没有任何一个 Adventure 包的译文生效 —— 无从查起，本次不产生任何待办。");
  }

  // ── 按英文名补匹配之前，先算出「这个英文名已经被某份按 _id 认领的文档占了」──
  //
  // 补匹配的**唯一**用途是救那些被手工删掉重建、id 已经对不上的文档。但它的判据
  // 只是「名字对得上」，而世界里的文档并不都来自本项目的三个包：车主自己建的
  // `Weapons` / `Creatures` 文件夹、别的模块建的同名文件夹，都会被一并改掉
  // （2026-08-30 实测：造 4 个陌生 _id 的文件夹 Careers / Weapons / Creatures /
  //   Alien Evolved，加一件 Combat Knife、一个角色、一篇日志，7/7 全被改名）。
  //
  // 判据收窄成一句话：**这个英文名已经有一份按 _id 认领的文档了，就不再按名字认第二份。**
  //   · 包里的 Careers 已经找到它的正主 -> 车主自己那个 Careers 不动；
  //   · 包里的文档被删了重建（没有任何 _id 认领它）-> 补匹配照常生效，正是它该管的场景。
  const idClaimedNames = new Map();
  for (const docType of COVERED_TYPES) {
    const claimed = new Set();
    for (const doc of world[docType] ?? []) {
      if (voting.some((s) => s.byType?.[docType]?.byId?.get(doc._id))) claimed.add(doc.name);
    }
    idClaimedNames.set(docType, claimed);
  }

  const stats = {
    packs: sources.length,
    votingPacks: voting.length,
    scanned: {},
    matchedById: 0,
    matchedByName: 0,
    unmatched: 0,
    nameOps: 0,
    contentOps: 0,
    refOps: 0,
  };

  // 改名台账：每份扫到的文档都记一条 {id, from, to}，收尾时据此算「改名后撞名」。
  // 只统计 ops 是不够的 —— 一个没被改名的文档也可能与被改名的文档撞上。
  const nameLedger = new Map();

  for (const docType of COVERED_TYPES) {
    const docs = world[docType] ?? [];
    stats.scanned[docType] = docs.length;
    nameLedger.set(docType, []);

    for (const doc of docs) {
      // ── 主路径：按 _id 找到它在包里的（已翻译）对应文档 ──────────────
      // `Adventure#import` 是 `keepId: true` 建档的
      // （client/documents/adventure.mjs:174-186），所以世界文档的 _id 就是包里的 _id。
      const hits = [];
      for (const s of voting) {
        const hit = s.byType?.[docType]?.byId?.get(doc._id);
        if (hit) hits.push({ s, hit });
      }
      const packDocs = hits.map((h) => h.hit);
      const src = hits[0]?.s ?? null;

      let target = null;
      let match = null;
      if (packDocs.length) {
        match = "id";
        stats.matchedById++;
        const agreed = agreeOn(packDocs.map((p) => p.name));
        if (agreed.conflict) {
          blocked.push({
            docType, docId: doc._id, docName: doc.name, from: doc.name, to: agreed.values.join(" / "),
            reason: `这个 _id 同时存在于 ${hits.map((h) => h.s.packCollection).join("、")}，而它们给的译名不一致；世界里这份文档最后由哪个包写入无从得知，不猜`,
            rule: "ambiguous-id-match",
          });
        } else {
          target = agreed.value;
        }
      } else if (opt.nameFallback) {
        // ── 补路径：按英文名匹配译文文件的键 ──────────────────────────
        const candidates = [];
        for (const s of voting) {
          const cn = s.byType?.[docType]?.byName?.get(doc.name);
          if (typeof cn === "string") candidates.push({ s, cn });
        }
        // ── 补路径的收窄判据（两侧都要看，缺一侧就不幂等）─────────────────
        //   (a) 英文侧：这个英文名已经有一份文档按 _id 认到正主了；
        //   (b) 中文侧：想改成的那个中文名，世界里已经有别的文档在用了。
        // 只看 (a) 的话第二遍会翻车：第一遍把正主改成中文后，(a) 就不再成立，
        // 于是同名的第二份文档在第二遍被改名 —— 实测第二遍冒出 2 条
        // （Folder「Alien Evolved」、Item「Reckless」，都是 corerules 独有、
        //   而 corerules 没有译文所以按 _id 匹配不上的那一份）。
        // 两侧都看，第一遍 (a) 挡住、第二遍起 (b) 挡住，前后一致。
        const collide = candidates.length
          ? (() => {
              const a = idClaimedNames.get(docType)?.has(doc.name) === true;
              const target = agreeOn(candidates.map((c) => c.cn)).value;
              const b = typeof target === "string"
                && (world[docType] ?? []).some((o) => o._id !== doc._id && o.name === target);
              return a || b;
            })()
          : false;
        if (collide) {
          // 同名的正主已经在世界里了 —— 这一份多半不是包里那个文档，不动。
          stats.unmatched++;
          skipped.push({
            docType, docId: doc._id, docName: doc.name, path: "name",
            from: doc.name, to: candidates[0].cn, match: null,
            reason: "世界里另有一份文档已经占住了这个名字的正主位置（按 _id 认到包里，或已经叫上了目标中文名）。" +
              "这一份没有可用的 _id 对应，只凭同名就改会误伤你自己或别的模块建的文档，跳过。",
          });
          nameLedger.get(docType).push({ id: doc._id, from: doc.name, to: doc.name });
          continue;
        }
        if (candidates.length) {
          const agreed = agreeOn(candidates.map((c) => c.cn));
          if (agreed.conflict) {
            blocked.push({
              docType, docId: doc._id, docName: doc.name, from: doc.name, to: agreed.values.join(" / "),
              reason: "同一个英文名在多个包里被译成不同的中文，且世界里这份文档没有可用的 _id 对应，无法判定该用哪一个",
              rule: "ambiguous-name-match",
            });
            stats.unmatched++;
            nameLedger.get(docType).push({ id: doc._id, from: doc.name, to: doc.name });
            continue;
          }
          target = agreed.value;
          match = "name";
          stats.matchedByName++;
        } else {
          stats.unmatched++;
          nameLedger.get(docType).push({ id: doc._id, from: doc.name, to: doc.name });
          continue;
        }
      } else {
        stats.unmatched++;
        nameLedger.get(docType).push({ id: doc._id, from: doc.name, to: doc.name });
        continue;
      }

      // ── 改名 ──────────────────────────────────────────────────────────
      let finalName = doc.name;
      if (typeof target === "string" && target !== doc.name) {
        const verdict = checkRename(docType, doc.name, target, guard);
        if (verdict) {
          blocked.push({ docType, docId: doc._id, docName: doc.name, from: doc.name, to: target, ...verdict, match });
        } else if (!opt.force && hasCJK(doc.name)) {
          skipped.push({
            docType, docId: doc._id, docName: doc.name, path: "name", from: doc.name, to: target, match,
            reason: "现名已含汉字（可能是你自己改的），默认不覆盖。要强制对齐请勾选「强制对齐已中文化的名称」。",
          });
        } else {
          ops.push({ kind: "name", docType, docId: doc._id, docName: doc.name, path: "name", from: doc.name, to: target, match, pack: src?.key ?? null });
          stats.nameOps++;
          finalName = target;
        }
      }
      nameLedger.get(docType).push({ id: doc._id, from: doc.name, to: finalName });

      if (!opt.content || !packDocs.length) continue;

      // ── RollTable 结果：正文 + （有条件的）结果名 ──────────────────────
      //
      // `description` 无条件修。`name` 要看这条结果**引不引用别的文档**：
      //   default-mappings.js 的 "TableResult" 块把 name 交给 `referencedDocumentField`
      //   converter（`{"path":"name","converter":"referencedDocumentField",
      //   "uuidPath":"documentUuid","referencedField":"name"}`）。
      //   但那个 converter 的第一优先级是**本地译文**：
      //     converter/referenced-document-field-converter.js:15-17
      //       `if (typeof context.translation !== "undefined" && context.translation !== null)
      //          { return context.translation; }`
      //   只有本地没给译文时才去 `documentUuid` 指的文档上现取（:24-39）。
      //
      // 所以「name 是动态值、写死会钉成快照」这个顾虑**只对带 documentUuid 的结果成立**。
      // 实测（2026-08-30，两份有译文的包共 155 条结果）：
      //   包里已是中文的结果名 43 条，其中带 documentUuid 的 **0 条**；
      //   全语料里带 documentUuid 的结果一共 2 条，都没有译名。
      // 即：一刀切不修 name，白白漏掉 43 条，而它想防的那种情况一条都没出现。
      // 判据因此收窄成「带 documentUuid 的不动，其余照修」—— 精确对上顾虑本身。
      if (docType === "RollTable" && Array.isArray(doc.results)) {
        for (const wr of doc.results) {
          // TableResult 的身份判据用 Babele 自己写的 `_identity.match: ["_id","range"]`
          const hits = [];
          for (const pd of packDocs) {
            const hit = (pd.results ?? []).find((r) => r?._id === wr?._id)
              ?? (pd.results ?? []).find((r) => rangeKey(r?.range) !== null && rangeKey(r?.range) === rangeKey(wr?.range));
            if (hit) hits.push(hit);
          }
          if (!hits.length) continue;

          // 只要世界侧或包侧任何一边说它引用了别的文档，name 就不碰。
          const dynamicName = !!wr?.documentUuid || hits.some((h) => !!h?.documentUuid);
          const fields = [["description", wr?.description, (h) => h?.description]];
          if (!dynamicName) fields.push(["name", wr?.name, (h) => h?.name]);

          for (const [path, fromV, getTo] of fields) {
            const agreed = agreeOn(hits.map(getTo));
            const from = typeof fromV === "string" ? fromV : "";
            if (agreed.conflict) {
              skipped.push({ docType, docId: doc._id, docName: doc.name, embeddedId: wr._id, path: `results[].${path}`, reason: "多个包对这条结果给出不同译文，不猜" });
              continue;
            }
            const to = agreed.value;
            if (typeof to !== "string" || !to.length || to === from) continue;
            if (!opt.force && hasCJK(from)) {
              skipped.push({ docType, docId: doc._id, docName: doc.name, embeddedId: wr._id, path: `results[].${path}`, reason: "结果内容已含汉字，默认不覆盖" });
              continue;
            }
            ops.push({
              kind: "result", docType, docId: doc._id, docName: doc.name,
              embeddedType: "TableResult", embeddedId: wr._id,
              path, from, to, match, pack: src?.key ?? null,
              label: `${doc.name} · ${rangeKey(wr?.range) ?? wr._id} · ${path}`,
            });
            stats.contentOps++;
          }
        }
      }

      // ── JournalEntry 页面（页名 + 正文 HTML） ─────────────────────────
      if (docType === "JournalEntry" && Array.isArray(doc.pages)) {
        for (const wp of doc.pages) {
          const cands = [];
          for (const pd of packDocs) {
            const hit = (pd.pages ?? []).find((p) => p?._id === wp?._id)
              ?? (pd.pages ?? []).find((p) => typeof p?.name === "string" && p.name === wp?.name);
            if (hit) cands.push(hit);
          }
          if (!cands.length) continue;
          for (const [path, fromV, getTo] of [
            ["name", wp?.name, (p) => p?.name],
            ["text.content", wp?.text?.content, (p) => p?.text?.content],
          ]) {
            const agreed = agreeOn(cands.map(getTo));
            const from = typeof fromV === "string" ? fromV : "";
            if (agreed.conflict) {
              skipped.push({ docType, docId: doc._id, docName: doc.name, embeddedId: wp._id, path: `pages[].${path}`, reason: "多个包对这一页给出不同译文，不猜" });
              continue;
            }
            const to = agreed.value;
            if (typeof to !== "string" || !to.length || to === from) continue;
            if (!opt.force && hasCJK(from)) {
              skipped.push({ docType, docId: doc._id, docName: doc.name, embeddedId: wp._id, path: `pages[].${path}`, reason: "页面内容已含汉字，默认不覆盖" });
              continue;
            }
            ops.push({
              kind: "page", docType, docId: doc._id, docName: doc.name,
              embeddedType: "JournalEntryPage", embeddedId: wp._id,
              path, from, to, match, pack: src?.key ?? null,
              label: `${doc.name} · ${wp?.name ?? wp._id} · ${path}`,
            });
            stats.contentOps++;
          }
        }
      }
    }
  }

  // ── Actor 的 RollTable 名引用必须与表名同步移动 ───────────────────────
  // 生物 Actor 把**表名字符串**存在 system.rTables / system.cTables 里，两个消费者
  // 按名字回查（登记表 sections.actor_table_refs）：
  //   · module/documents/actor.mjs:1839 `game.tables.getName(dataset.atttype)`（有守卫）
  //   · module/documents/actor.mjs:2497 `game.tables.contents.find(b => b.name === targetTable)`
  //     —— **无守卫**，下一行 `table.roll()` 直接抛 TypeError，攻击按钮当场死掉。
  // 不变量：表名和这两个字段**要么一起动，要么都不动**；`None` 是哨兵，永远不动。
  //
  // 这里不依赖「本次是否真的改了那张表」，而是独立地把英文引用推到中文 —— 这样
  // 中途失败 / 分两次跑也能自愈，而且天然幂等。
  {
    const tableRename = new Map(); // en -> cn
    const conflictedNames = new Set();
    for (const src of voting) {
      for (const [en, cn] of src.byType?.RollTable?.byName ?? new Map()) {
        if (en === cn) continue;
        if (tableRename.has(en) && tableRename.get(en) !== cn) { conflictedNames.add(en); continue; }
        tableRename.set(en, cn);
      }
    }
    for (const en of conflictedNames) tableRename.delete(en);
    if (tableRename.size) {
      for (const actor of world.Actor ?? []) {
        for (const field of ["rTables", "cTables"]) {
          const cur = actor?.system?.[field];
          if (typeof cur !== "string" || !cur.length) continue;
          if (cur === guard.noneSentinel) continue; // 哨兵值，绝不动
          const to = tableRename.get(cur);
          if (!to || to === cur) continue;
          // 目标表名本身若被冻结判据挡住，引用也不能动 —— 否则就是单边移动。
          if (checkRename("RollTable", cur, to, guard)) {
            blocked.push({
              docType: "Actor", docId: actor._id, docName: actor.name, from: cur, to,
              reason: `system.${field} 指向的表名被冻结，引用同样不动（单边移动会让攻击按钮抛 TypeError）`,
              rule: "actor_table_refs/lockstep",
            });
            continue;
          }
          ops.push({
            kind: "tableRef", docType: "Actor", docId: actor._id, docName: actor.name,
            path: `system.${field}`, from: cur, to, match: "lockstep", pack: null,
            label: `${actor.name} · system.${field}`,
          });
          stats.refOps++;
        }
      }
    }
  }

  // ── 撞名告警 ────────────────────────────────────────────────────────
  // 只报**本次改名新造出来的**撞名：原本就同名的两份文档（三个包共用 _id 的那些
  // 文件夹与表，英文态下就已经同名）改完还是同名，那不是本工具造成的，报了只会
  // 喂噪音。判据是「同一个最终名下，出现了两个以上**不同的原名**」。
  for (const [docType, rows] of nameLedger) {
    const groups = new Map();
    for (const r of rows) {
      if (!groups.has(r.to)) groups.set(r.to, []);
      groups.get(r.to).push(r);
    }
    for (const [name, group] of groups) {
      if (group.length < 2) continue;
      const origins = new Set(group.map((r) => r.from));
      if (origins.size < 2) continue; // 原本就同名，不是本次造成的
      warnings.push(`改名后有 ${group.length} 份 ${docType} 会同叫「${name}」（原名：${[...origins].join(" / ")}）。按名字查文档的代码只会拿到其中一份。`);
    }
  }

  for (const src of voting) {
    if (!src.translationUrl) {
      warnings.push(`包 ${src.packCollection} 没找到对应的 compendium/cn 译文文件，本次只能按 _id 匹配（手工重建过的文档修不到）。`);
    }
  }

  return { ops, blocked, skipped, warnings, stats, options: opt, generatedAt: new Date().toISOString() };
}

/* ================================================================== *
 * 4. Foundry 侧：采集 / 执行 / 报告                                    *
 * ================================================================== */

/** 运行期可追加的译文文件来源：`packCollection -> url`。见 api.registerRepairSource。 */
const EXTRA_TRANSLATION_URLS = new Map();

/**
 * 猜某个包的译文文件住在哪个模块里。
 *
 * 本项目三个汉化模块的 id 恰好都是 `<被翻译方 id>-cn`：
 *   alienrpg               -> alienrpg-cn          （系统，本模块）
 *   alien-evolved-starterset -> alien-evolved-starterset-cn
 *   alien-evolved-corerules  -> alien-evolved-corerules-cn
 * 所以这里用**推导**而不是写死清单 —— 写死的清单在加第四个包时会静默漏掉。
 * 推不出来的，用 `api.registerRepairSource()` 显式登记；再不行就在报告里明说
 * 「这个包没有译文文件，按名字匹配不可用」，不假装成功。
 */
function translationUrlCandidates(pack) {
  const collection = pack.metadata?.id ?? pack.collection;
  const explicit = EXTRA_TRANSLATION_URLS.get(collection);
  if (explicit) return [explicit];
  const pkg = pack.metadata?.packageName;
  const ids = [];
  if (pkg) ids.push(`${pkg}-cn`);
  ids.push(MODULE_ID); // 中枢兜底：系统包的译文就住在这里
  return [...new Set(ids)]
    .filter((id) => id === MODULE_ID || game.modules.get(id)?.active)
    .map((id) => `modules/${id}/compendium/cn/${collection}.json`);
}

/**
 * 采集所有 Adventure 包的**已翻译**内容 + 对应的译文文件索引。
 *
 * ⚠ 这里刻意用 `pack.getDocument(...)` 而不是 `pack.index` —— Babele 的翻译发生在
 *   `CONFIG.DatabaseBackend._getDocuments` 的 libWrapper 包装里
 *   （modules/babele/script/foundry/wrapper.js:11-14），拿到的对象就是「一次干净的
 *   重新导入会写进世界的那个样子」。也**不按名字**去 index 里找 Adventure：包里的
 *   名字已经被翻译过了，按英文名找会落空。直接遍历 index 的全部条目。
 */
async function collectSources() {
  const AdventureCls = CONFIG.Adventure?.documentClass ?? foundry.documents?.Adventure;
  const contentFields = AdventureCls?.contentFields ?? {};
  const babeleActive = !!game.modules?.get?.("babele")?.active;
  const sources = [];

  for (const pack of game.packs) {
    if (pack.metadata?.type !== "Adventure") continue;
    const collection = pack.metadata?.id ?? pack.collection;

    // 译文文件（按名字补匹配用）
    let byNameByType = new Map();
    let translationUrl = null;
    for (const url of translationUrlCandidates(pack)) {
      try {
        const json = await foundry.utils.fetchJsonWithTimeout(url, {}, { timeoutMs: 15000 });
        if (json && typeof json === "object" && json.entries) {
          byNameByType = indexTranslationFile(json).byType;
          translationUrl = url;
          break;
        }
      } catch (_err) {
        // 404 / 解析失败都只是「这个模块没有这份译文」，继续试下一个。
      }
    }

    const index = await pack.getIndex();
    for (const entry of index) {
      let adv;
      try {
        adv = await pack.getDocument(entry._id);
      } catch (err) {
        console.error(`${MODULE_ID} | 读取 ${collection}.${entry._id} 失败：`, err);
        continue;
      }
      if (!adv) continue;
      const data = adv.toObject();

      const byType = {};
      for (const [field, cls] of Object.entries(contentFields)) {
        const docType = cls?.documentName;
        if (!docType || !COVERED_TYPES.includes(docType)) continue;
        const byId = new Map();
        for (const d of data[field] ?? []) {
          if (d?._id) byId.set(d._id, d);
        }
        byType[docType] = { byId, byName: byNameByType.get(docType) ?? new Map() };
      }
      // 译文文件里有、但 contentFields 没覆盖到的类型，也保留 byName（理论上不会发生）
      for (const [docType, m] of byNameByType) {
        if (!byType[docType] && COVERED_TYPES.includes(docType)) byType[docType] = { byId: new Map(), byName: m };
      }

      sources.push({
        key: `${collection}#${data.name}`,
        label: data.name,
        packCollection: collection,
        translationUrl,
        // ⚠ `isTranslated` 收的是**合集 id 字符串**（"alienrpg.alien-rpg-system"），
        //   不是 CompendiumCollection 对象：
        //     modules/babele/script/babele.js:552-559
        //       `@param {string} pack compendium name (ex. dnd5e.classes)`
        //       `isTranslated(pack) { return this.#session?.isTranslated?.(pack) ?? false; }`
        //     -> translation/translation-session.js:111 -> compendium/mapped-compendiums.js:60-63
        //       `translated(pack) { const c = this.get(pack); ... }`
        //       `get(pack) { return this.packs.get(pack) ?? null; }`   // Collection 是 Map，按字符串键
        //   传对象进去 `Map.get(<对象>)` 必然 undefined，于是**每个包都报 false**，
        //   报告里那句「Babele 报告这些包没有译文生效」会在完全健康的世界里每次都弹。
        //   （2026-08-30 实测：isTranslated("alienrpg.alien-rpg-system") === true，
        //     isTranslated(<pack 对象>) === false。）
        // Babele 模块整个没启用时 `game.babele` 可能压根不存在，此时不能落到 `null`
        // ——`null` 会被下面的「有没有包在翻译」判据当成「不知道」而放行，而这时候
        // 从包里读出来的**必然是英文**，放行就等于允许把中文世界刷回英文。
        babeleTranslated: babeleActive ? (game.babele?.isTranslated?.(collection) ?? null) : false,
        byType,
      });
    }
  }
  return sources;
}

/** 把世界里的文档抽成规划器要的纯数据。 */
function snapshotWorld() {
  const world = {};
  for (const docType of COVERED_TYPES) {
    const collection = game.collections.get(docType);
    world[docType] = [];
    if (!collection) continue;
    for (const doc of collection) {
      const row = { _id: doc.id, name: doc.name };
      if (docType === "RollTable") {
        // `documentUuid` 决定这条结果的 name 是不是动态值（见 planRetranslation 里的说明）。
        row.results = [...(doc.results ?? [])].map((r) => ({
          _id: r.id, range: r.range, name: r.name, description: r.description,
          documentUuid: r.documentUuid ?? null,
        }));
      }
      if (docType === "JournalEntry") {
        row.pages = [...(doc.pages ?? [])].map((p) => ({ _id: p.id, name: p.name, text: { content: p.text?.content } }));
      }
      if (docType === "Actor") {
        row.system = { rTables: doc.system?.rTables, cTables: doc.system?.cTables };
      }
      world[docType].push(row);
    }
  }
  return world;
}

/**
 * 执行报告里的待办。
 *
 * 顺序有讲究：**先改表名，再改引用它的 Actor 字段**。两者之间任何一步失败都会造成
 * 单边移动，所以整段包在 try 里，出错时把已经写下去的部分原样打进控制台与聊天，
 * 让 GM 知道当前处于哪个中间态（而不是只看到一行红字）。
 */
async function applyPlan(report) {
  const applied = [];
  const failed = [];

  const nameOps = report.ops.filter((o) => o.kind === "name");
  const refOps = report.ops.filter((o) => o.kind === "tableRef");
  const resultOps = report.ops.filter((o) => o.kind === "result");
  const pageOps = report.ops.filter((o) => o.kind === "page");

  // 1) 顶层改名，按类型批量
  const byType = new Map();
  for (const op of nameOps) {
    if (!byType.has(op.docType)) byType.set(op.docType, []);
    byType.get(op.docType).push(op);
  }
  // RollTable 放最前：它的引用同步紧随其后，中间态窗口越短越好。
  const order = ["RollTable", ...COVERED_TYPES.filter((t) => t !== "RollTable")];
  for (const docType of order) {
    const list = byType.get(docType);
    if (!list?.length) continue;
    try {
      const cls = getDocumentClass(docType);
      await cls.updateDocuments(list.map((o) => ({ _id: o.docId, name: o.to })), { render: false });
      applied.push(...list);
    } catch (err) {
      console.error(`${MODULE_ID} | ${docType} 改名失败：`, err);
      failed.push(...list.map((o) => ({ ...o, error: String(err?.message ?? err) })));
    }
  }

  // 2) Actor 的表名引用（与上一步的 RollTable 改名成对）
  if (refOps.length) {
    const updates = new Map();
    for (const op of refOps) {
      if (!updates.has(op.docId)) updates.set(op.docId, { _id: op.docId });
      updates.get(op.docId)[op.path] = op.to;
    }
    try {
      await getDocumentClass("Actor").updateDocuments([...updates.values()], { render: false });
      applied.push(...refOps);
    } catch (err) {
      console.error(`${MODULE_ID} | Actor 表名引用同步失败（此时表名可能已改、引用未改，请立刻重跑本工具）：`, err);
      failed.push(...refOps.map((o) => ({ ...o, error: String(err?.message ?? err) })));
    }
  }

  // 3) 内嵌文档：RollTable 的结果、JournalEntry 的页面
  for (const [embeddedType, opsList] of [["TableResult", resultOps], ["JournalEntryPage", pageOps]]) {
    const byParent = new Map();
    for (const op of opsList) {
      if (!byParent.has(op.docId)) byParent.set(op.docId, []);
      byParent.get(op.docId).push(op);
    }
    for (const [parentId, list] of byParent) {
      const parentType = embeddedType === "TableResult" ? "RollTable" : "JournalEntry";
      const parent = game.collections.get(parentType)?.get(parentId);
      if (!parent) {
        failed.push(...list.map((o) => ({ ...o, error: "父文档已不在世界里" })));
        continue;
      }
      const updates = new Map();
      for (const op of list) {
        if (!updates.has(op.embeddedId)) updates.set(op.embeddedId, { _id: op.embeddedId });
        updates.get(op.embeddedId)[op.path] = op.to;
      }
      try {
        await parent.updateEmbeddedDocuments(embeddedType, [...updates.values()], { render: false });
        applied.push(...list);
      } catch (err) {
        console.error(`${MODULE_ID} | ${parentType}「${parent.name}」的 ${embeddedType} 更新失败：`, err);
        failed.push(...list.map((o) => ({ ...o, error: String(err?.message ?? err) })));
      }
    }
  }

  return { applied, failed };
}

/* ---------------------------------------------------------------- *
 * 报告渲染                                                          *
 * ---------------------------------------------------------------- */

const KIND_LABEL = { name: "改名", result: "表结果正文", page: "日志页面", tableRef: "表名引用" };

function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function truncate(s, n = 90) {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/** 报告转 Markdown（「复制报告」按钮的产物，也是给维护者贴 issue 用的）。 */
export function reportToMarkdown(report, { title = "重新汉化本世界" } = {}) {
  const L = [];
  L.push(`# ${title}`, "");
  L.push(`- 生成时间：${report.generatedAt}`);
  L.push(`- 模式：${report.applied ? "已执行" : "试运行（未写盘）"}`);
  L.push(`- 待办：改名 ${report.stats.nameOps} · 正文 ${report.stats.contentOps} · 表名引用 ${report.stats.refOps}`);
  L.push(`- 被冻结判据挡住：${report.blocked.length} · 主动跳过：${report.skipped.length}`);
  L.push(`- 扫描：${Object.entries(report.stats.scanned).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  L.push(`- 按 _id 匹配 ${report.stats.matchedById} · 按名字匹配 ${report.stats.matchedByName} · 未匹配 ${report.stats.unmatched}`, "");
  if (report.warnings.length) {
    L.push("## 告警", "");
    for (const w of report.warnings) L.push(`- ⚠ ${w}`);
    L.push("");
  }
  if (report.ops.length) {
    L.push("## 变更清单", "", "| 类型 | 文档 | 位置 | 原 | 新 | 匹配 |", "|---|---|---|---|---|---|");
    for (const o of report.ops) {
      L.push(`| ${KIND_LABEL[o.kind] ?? o.kind} | ${o.docType} · ${truncate(o.docName, 40)} | ${o.path} | ${truncate(o.from, 60)} | ${truncate(o.to, 60)} | ${o.match} |`);
    }
    L.push("");
  }
  if (report.blocked.length) {
    L.push("## 被硬冻结登记表挡住（**这是对的，不要绕过**）", "", "| 文档 | 原 | 想改成 | 判据 | 原因 |", "|---|---|---|---|---|");
    for (const b of report.blocked) {
      L.push(`| ${b.docType} · ${truncate(b.docName, 40)} | ${truncate(b.from, 40)} | ${truncate(b.to, 40)} | ${b.rule} | ${truncate(b.reason, 120)} |`);
    }
    L.push("");
  }
  if (report.skipped.length) {
    L.push("## 主动跳过（现值已含汉字）", "");
    for (const s of report.skipped) L.push(`- ${s.docType} · ${truncate(s.docName, 40)} · ${s.path ?? "name"} —— ${s.reason}`);
    L.push("");
  }
  if (report.failed?.length) {
    L.push("## 执行失败", "");
    for (const f of report.failed) L.push(`- ${f.docType} · ${truncate(f.docName, 40)} · ${f.path} —— ${f.error}`);
    L.push("");
  }
  return L.join("\n");
}

function buildReportElement(report, { dryRun }) {
  const div = document.createElement("div");
  div.classList.add("alienrpg-cn-retranslate");
  const rows = (list, cols) => list.map((r) => `<tr>${cols(r).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");

  const head = `
    <p><strong>${dryRun ? "试运行 —— 还没有写任何东西。" : "已执行。"}</strong></p>
    <ul style="margin:.25rem 0 .5rem 1rem">
      <li>改名 <b>${report.stats.nameOps}</b> · 表结果正文 <b>${report.stats.contentOps}</b> · 表名引用 <b>${report.stats.refOps}</b></li>
      <li>被冻结判据挡住 <b>${report.blocked.length}</b> · 主动跳过 <b>${report.skipped.length}</b></li>
      <li>扫描 ${esc(Object.entries(report.stats.scanned).map(([k, v]) => `${k} ${v}`).join(" · "))}</li>
      <li>按 _id 匹配 ${report.stats.matchedById} · 按名字匹配 ${report.stats.matchedByName} · 未匹配 ${report.stats.unmatched}</li>
    </ul>`;

  const warn = report.warnings.length
    ? `<div style="border-left:3px solid #c93; padding-left:.5rem; margin:.5rem 0">${report.warnings.map((w) => `<div>⚠ ${esc(w)}</div>`).join("")}</div>`
    : "";

  const opsTable = report.ops.length
    ? `<details open><summary><b>变更清单（${report.ops.length}）</b></summary>
       <table style="width:100%; font-size:.85em"><thead><tr><th>类型</th><th>文档</th><th>位置</th><th>原</th><th>新</th></tr></thead>
       <tbody>${rows(report.ops, (o) => [
         esc(KIND_LABEL[o.kind] ?? o.kind),
         `${esc(o.docType)}<br><small>${esc(truncate(o.docName, 40))}</small>`,
         esc(o.path),
         `<code>${esc(truncate(o.from, 70))}</code>`,
         `<code>${esc(truncate(o.to, 70))}</code>`,
       ])}</tbody></table></details>`
    : `<p><em>没有需要修改的地方。</em></p>`;

  const blockedTable = report.blocked.length
    ? `<details><summary><b>被硬冻结登记表挡住（${report.blocked.length}）—— 这是对的</b></summary>
       <table style="width:100%; font-size:.85em"><thead><tr><th>文档</th><th>原</th><th>想改成</th><th>判据</th><th>原因</th></tr></thead>
       <tbody>${rows(report.blocked, (b) => [
         `${esc(b.docType)}<br><small>${esc(truncate(b.docName, 30))}</small>`,
         `<code>${esc(truncate(b.from, 40))}</code>`,
         `<code>${esc(truncate(b.to, 40))}</code>`,
         `<small>${esc(b.rule)}</small>`,
         `<small>${esc(truncate(b.reason, 160))}</small>`,
       ])}</tbody></table></details>`
    : "";

  const skippedTable = report.skipped.length
    ? `<details><summary>主动跳过（${report.skipped.length}）—— 现值已含汉字 / 多包分歧</summary>
       <ul style="font-size:.85em">${report.skipped.map((s) => `<li>${esc(s.docType)} · ${esc(truncate(s.docName, 40))} · ${esc(s.path ?? "name")} —— ${esc(truncate(s.reason, 80))}</li>`).join("")}</ul></details>`
    : "";

  // 执行失败必须**显式**摆在最上面，不能藏在折叠区里 —— 半写成功是最危险的状态
  // （表名改了、Actor 引用没跟上 = 攻击按钮抛 TypeError）。
  const failedBlock = report.failed?.length
    ? `<div style="border:2px solid #a33; padding:.4rem; margin:.5rem 0">
         <p><b>有 ${report.failed.length} 处没写成功。</b>世界可能处于中间态，<b>请立刻再跑一次本工具</b>（它是幂等的，会把剩下的补上）。</p>
         <ul style="font-size:.85em">${report.failed.map((f) => `<li>${esc(f.docType)} · ${esc(truncate(f.docName, 40))} · ${esc(f.path)} —— ${esc(truncate(f.error, 120))}</li>`).join("")}</ul>
       </div>`
    : "";

  const opts = `
    <fieldset style="margin-top:.6rem"><legend>选项</legend>
      <label style="display:block"><input type="checkbox" name="content" ${report.options.content ? "checked" : ""}> 同时修复表结果正文与日志页面正文</label>
      <label style="display:block"><input type="checkbox" name="nameFallback" ${report.options.nameFallback ? "checked" : ""}> 对没有 _id 对应的文档按英文名匹配</label>
      <label style="display:block"><input type="checkbox" name="force" ${report.options.force ? "checked" : ""}> 强制对齐已中文化的名称与正文（会覆盖你自己改过的中文）</label>
      <p style="font-size:.8em; margin:.3rem 0 0">改选项后点「重新扫描」。</p>
    </fieldset>`;

  div.innerHTML = head + failedBlock + warn + opsTable + blockedTable + skippedTable + (dryRun ? opts : "");
  return div;
}

/* ---------------------------------------------------------------- *
 * 主流程                                                            *
 * ---------------------------------------------------------------- */

let cachedRegister = null;

async function loadRegister() {
  if (cachedRegister) return cachedRegister;
  // 加载失败 = 拒绝运行。绝不「降级为无守卫」。
  const json = await foundry.utils.fetchJsonWithTimeout(REGISTER_URL, {}, { timeoutMs: 20000 });
  if (!json || typeof json !== "object") throw new Error(`${REGISTER_URL} 读到的不是 JSON 对象`);
  cachedRegister = json;
  return json;
}

/**
 * 扫描 + （可选）执行。
 *
 * @param {object} [options]
 * @param {boolean} [options.apply=false]        true 才写盘。默认试运行。
 * @param {boolean} [options.content=true]       是否修复表结果正文 / 日志页面正文
 * @param {boolean} [options.nameFallback=true]  是否对无 _id 对应的文档按英文名匹配
 * @param {boolean} [options.force=false]        是否覆盖已含汉字的现值
 * @param {boolean} [options.chat=true]          是否发一条只给自己看的聊天摘要
 * @returns {Promise<object>} 报告对象
 */
export async function retranslateWorld(options = {}) {
  const opt = { apply: false, content: true, nameFallback: true, force: false, chat: true, ...options };

  if (!game.user?.isGM) throw new Error(`${MODULE_ID} | 只有 GM 能跑这个工具。`);

  const register = await loadRegister(); // 失败会抛，正是我们要的
  const guard = buildGuard(register);

  const sources = await collectSources();
  if (!sources.length) {
    ui.notifications?.warn(`${MODULE_ID} | 没有找到任何 Adventure 合集包，无从修起。`);
  }

  // Babele 没在工作时，包里读出来的就是英文，规划器会得到 0 条待办 —— 那不是「没问题」，
  // 是「无从查起」。这条必须显式说出来，不能让人误以为世界已经是好的。
  const untranslated = sources.filter((s) => s.babeleTranslated === false).map((s) => s.packCollection);

  // ⛔ 一个包的译文都没生效 = 拒绝运行，不是「跑出 0 条」。
  //
  // 这不是洁癖，是本工具唯一的破坏性路径。此时从包里读出来的**全是英文**，而
  // 面板上「强制对齐已中文化的名称与正文」那个勾选框会绕过「现值已含汉字就跳过」
  // 的保护 —— 于是一个已经汉化好的世界会被整体刷回英文。
  // 实测（2026-08-30，三份 raw dump + 已中文化的模拟世界）：
  //   Babele 关 + force=true -> 296 条待办，其中 104 个名字、190 处正文由中文改回英文。
  // 光靠告警拦不住：告警只是文字，而且（在本次修掉 isTranslated 传参之前）它在
  // 完全健康的世界里也每次都弹，早就被训练成噪音了。
  if (sources.length && untranslated.length === sources.length) {
    throw new Error(
      `${MODULE_ID} | 没有任何一个 Adventure 合集包的译文生效（${untranslated.join("、")}）。` +
        `此时从包里读出来的全是英文，跑下去只会把世界刷回英文 —— 拒绝运行。` +
        `请先确认 Babele 已启用、语言设为中文、且对应的汉化模块已开启。`
    );
  }
  const world = snapshotWorld();
  const report = planRetranslation({ sources, world, guard, options: opt });
  report.register = { generated_on: register.generated_on ?? null, schema_version: register.schema_version ?? null, ...guard.stats };
  report.sources = sources.map((s) => ({ pack: s.packCollection, adventure: s.label, translationUrl: s.translationUrl, babeleTranslated: s.babeleTranslated }));
  if (untranslated.length) {
    report.warnings.unshift(`Babele 报告这些包**没有译文生效**：${untranslated.join(", ")}。此时读出来的就是英文，本次「0 条待办」不代表世界是好的。先确认 Babele 已启用且语言是中文。`);
  }
  if (!game.modules.get("babele")?.active) {
    report.warnings.unshift("Babele 没有启用。合集读出来必然是英文，本工具此时什么也修不了。");
  }

  if (opt.apply && report.ops.length) {
    const { applied, failed } = await applyPlan(report);
    report.applied = applied;
    report.failed = failed;
  } else if (opt.apply) {
    report.applied = [];
    report.failed = [];
  }

  // 控制台：完整清单（聊天里会截断，这里不截断）
  console.groupCollapsed(`${MODULE_ID} | 重新汉化本世界 —— ${opt.apply ? "已执行" : "试运行"}：${report.ops.length} 条待办 / ${report.blocked.length} 条被冻结挡住`);
  console.table(report.ops.map((o) => ({ 类型: KIND_LABEL[o.kind] ?? o.kind, 文档类型: o.docType, 文档: o.docName, 位置: o.path, 原: truncate(o.from, 60), 新: truncate(o.to, 60), 匹配: o.match })));
  if (report.blocked.length) console.table(report.blocked.map((b) => ({ 文档类型: b.docType, 文档: b.docName, 原: b.from, 想改成: b.to, 判据: b.rule, 原因: b.reason })));
  for (const w of report.warnings) console.warn(`${MODULE_ID} | ⚠ ${w}`);
  console.log(`${MODULE_ID} | 完整报告对象：game.modules.get("${MODULE_ID}").api.lastReport`);
  console.groupEnd();

  const api = game.modules.get(MODULE_ID)?.api;
  if (api) api.lastReport = report;

  if (opt.chat) await postChatSummary(report, { dryRun: !opt.apply });
  return report;
}

async function postChatSummary(report, { dryRun }) {
  const MAX = 40;
  const shown = report.ops.slice(0, MAX);
  const more = report.ops.length - shown.length;
  const lines = shown.map((o) => `<li><small>${esc(KIND_LABEL[o.kind] ?? o.kind)} · ${esc(o.docType)}</small><br><code>${esc(truncate(o.from, 50))}</code> → <code>${esc(truncate(o.to, 50))}</code></li>`).join("");
  const content = `
    <div>
      <p><strong>${MODULE_ID} · 重新汉化本世界</strong> —— ${dryRun ? "试运行（未写盘）" : "已执行"}</p>
      <p>改名 ${report.stats.nameOps} · 正文 ${report.stats.contentOps} · 表名引用 ${report.stats.refOps} ·
         被冻结挡住 ${report.blocked.length} · 跳过 ${report.skipped.length}</p>
      ${report.failed?.length ? `<p style="color:#a33"><b>有 ${report.failed.length} 处没写成功，世界可能处于中间态 —— 请立刻再跑一次本工具（幂等，会补上剩下的）。</b></p>` : ""}
      ${report.warnings.length ? `<p style="color:#c93">⚠ ${report.warnings.map((w) => esc(w)).join("<br>⚠ ")}</p>` : ""}
      ${report.ops.length ? `<details><summary>变更清单</summary><ul>${lines}</ul>${more > 0 ? `<p><em>另有 ${more} 条，见 F12 控制台。</em></p>` : ""}</details>` : "<p><em>没有需要修改的地方。</em></p>"}
      <p><small>完整报告（含每一条的原值，可据此回退）：控制台 <code>game.modules.get("${MODULE_ID}").api.lastReport</code></small></p>
    </div>`;
  try {
    await ChatMessage.create({ content, whisper: [game.user.id], speaker: { alias: MODULE_ID } });
  } catch (err) {
    console.error(`${MODULE_ID} | 聊天摘要发送失败（不影响修复结果）：`, err);
  }
}

/**
 * 打开试运行面板：先看清单，再决定要不要执行。
 * 「默认试运行 + 显式确认」这条是硬要求 —— 这个工具改的是世界文档，没有 undo。
 */
export async function openRetranslateDialog(initialOptions = {}) {
  let opt = { content: true, nameFallback: true, force: false, ...initialOptions };
  const DialogV2 = foundry.applications.api.DialogV2;

  for (;;) {
    let report;
    try {
      report = await retranslateWorld({ ...opt, apply: false, chat: false });
    } catch (err) {
      console.error(`${MODULE_ID} | 扫描失败：`, err);
      await DialogV2.prompt({
        window: { title: "重新汉化本世界 —— 扫描失败" },
        content: `<p>没有开始任何修改。</p><p><code>${esc(err?.message ?? err)}</code></p>
                  <p><small>本工具在两种情况下会拒绝运行，都是故意的：<br>
                  · <b>硬冻结登记表读不到</b> —— 无守卫地改名比不改坏得多；<br>
                  · <b>没有任何合集包的译文生效</b>（Babele 没启用 / 语言不是中文 / 汉化模块没开）
                  —— 此时包里读出来的全是英文，跑下去只会把世界刷回英文。</small></p>`,
        ok: { label: "知道了" },
      });
      return null;
    }

    const result = await DialogV2.wait({
      window: { title: `重新汉化本世界（试运行）`, resizable: true },
      position: { width: 820, height: 640 },
      content: buildReportElement(report, { dryRun: true }),
      buttons: [
        { action: "rescan", label: "重新扫描", icon: "fa-solid fa-rotate", callback: (_e, btn) => ({ do: "rescan", form: new foundry.applications.ux.FormDataExtended(btn.form).object }) },
        { action: "copy", label: "复制报告", icon: "fa-solid fa-clipboard", callback: () => ({ do: "copy" }) },
        { action: "save", label: "导出 JSON", icon: "fa-solid fa-download", callback: () => ({ do: "save" }) },
        { action: "apply", label: `执行（${report.ops.length} 条）`, icon: "fa-solid fa-language", default: true, callback: (_e, btn) => ({ do: "apply", form: new foundry.applications.ux.FormDataExtended(btn.form).object }) },
      ],
      rejectClose: false,
    });

    if (!result) return report; // 关窗 = 什么也不做
    if (result.form) {
      opt = { ...opt, content: !!result.form.content, nameFallback: !!result.form.nameFallback, force: !!result.form.force };
    }
    if (result.do === "rescan") continue;
    if (result.do === "copy") {
      await game.clipboard.copyPlainText(reportToMarkdown(report));
      ui.notifications?.info("报告已复制（Markdown）。");
      continue;
    }
    if (result.do === "save") {
      foundry.utils.saveDataToFile(JSON.stringify(report, null, 2), "application/json", `alienrpg-cn-retranslate-${Date.now()}.json`);
      continue;
    }
    if (result.do === "apply") {
      if (!report.ops.length) { ui.notifications?.info("没有需要修改的地方。"); continue; }
      const ok = await DialogV2.confirm({
        window: { title: "确认执行" },
        content: `<p>将修改 <b>${report.ops.length}</b> 处（改名 ${report.stats.nameOps} · 正文 ${report.stats.contentOps} · 表名引用 ${report.stats.refOps}）。</p>
                  <p>没有撤销按钮。执行后会把**每一条的原值**打进控制台与聊天，可据此手工回退。</p>
                  <p><small>建议先在世界备份上跑一遍。</small></p>`,
        yes: { label: "执行" }, no: { label: "再想想" },
      });
      if (!ok) continue;
      const done = await retranslateWorld({ ...opt, apply: true, chat: true });
      await DialogV2.prompt({
        window: { title: "重新汉化本世界 —— 已执行", resizable: true },
        position: { width: 820, height: 620 },
        content: buildReportElement(done, { dryRun: false }),
        ok: { label: "完成" },
      });
      return done;
    }
  }
}

/* ================================================================== *
 * 5. 注册                                                             *
 * ================================================================== */

/**
 * 为什么是「设置菜单按钮 + 模块 API」，不是合集宏包
 * ------------------------------------------------
 * 三种做法都在本机装着的模块里有先例，逐条权衡：
 *
 * (a) **合集 Macro 包**（`module.json` 的 `packs: [{type:"Macro"}]`）
 *     —— 否决。Foundry 14（本机 14.366）的合集包是 **LevelDB 目录**，不是 JSON：
 *     systems/alienrpg/packs/alien-rpg-system/ 里是 `000005.ldb / MANIFEST-000028 /
 *     CURRENT / LOCK`。要发一个宏包就得在发布流水线里加一步 LevelDB 构建，而本仓
 *     现在**一个 pack 都没有**、也没有任何 pack 构建步骤。更要命的是宏包的用法是
 *     「导入到世界」——导入后世界里那份宏就是**快照**，模块升级不会更新它，
 *     于是「修复工具本身过期了」会变成下一个要修的 bug。
 *
 * (b) **设置菜单按钮**（`game.settings.registerMenu`）—— 采用。
 *     · 与本项目自己的先例一致：crucible-cn 的自检面板就是这么挂的
 *       （modules/crucible-cn/selfcheck/cn-selfcheck.mjs:1761-1768）。
 *     · 与用户已经在用的入口相邻：alienrpg 系统自己的「Re-Import」按钮就在同一个
 *       面板里（systems/alienrpg/module/apps/init.mjs:38-45），GM 找它的时候会顺手
 *       看到我们这个。
 *     · `restricted: true` 天然只对 GM 可见。
 *     · 跑的永远是**当前安装版本**的代码，不存在快照过期。
 *     · 零构建成本。
 *
 * (c) **模块 API**（`game.modules.get(...).api`）—— 一并提供，但不是主入口。
 *     给「想写脚本 / 想在控制台里只跑试运行 / 想在别的宏里复用」的人用。
 *
 * 注册时机用 `init`：`registerMenu` 必须在 `setup` 之前完成，`api` 则要在别人
 * `ready` 里能取到 —— 两个都放 init 最省事。
 */
export function registerRetranslateWorld() {
  const mod = game.modules.get(MODULE_ID);

  // 极薄的「按钮」Application：点开就跑面板，然后立刻把自己关掉。
  // 基类用 globalThis.* 取 —— 裸标识符在 `extends` 表达式求值时抛 ReferenceError，
  // 外面的 try/catch 包不住，整个 esmodule 加载会挂。（这条是 crucible-cn 那边
  // 实测撞出来的，见 cn-selfcheck.mjs:1746-1752。）
  const Base = globalThis.foundry?.applications?.api?.ApplicationV2 ?? globalThis.Application ?? class {};
  class RetranslateLauncher extends Base {
    static DEFAULT_OPTIONS = { id: "alienrpg-cn-retranslate-launcher", window: { title: "重新汉化本世界" } };
    async render(...args) {
      openRetranslateDialog().catch((err) => {
        console.error(`${MODULE_ID} | 重新汉化面板出错：`, err);
        ui.notifications?.error(`${MODULE_ID} | 重新汉化面板出错，详见 F12 控制台。`);
      });
      return this;
    }
    async close() { return this; }
  }

  try {
    game.settings.registerMenu(MODULE_ID, "retranslateWorld", {
      name: "重新汉化本世界",
      label: "打开修复面板",
      hint: "世界已经导入、但侧边栏里的文件夹 / 宏 / 随机表还是英文名时用它。原地改名，不删不重导，默认只试运行。硬冻结的名字一律不动。",
      icon: "fa-solid fa-language",
      type: RetranslateLauncher,
      restricted: true,
    });
  } catch (err) {
    console.error(`${MODULE_ID} | 「重新汉化本世界」设置菜单注册失败（汉化本身不受影响）：`, err);
  }

  if (mod) {
    mod.api = Object.assign(mod.api ?? {}, {
      /** 试运行（默认）或执行。见 retranslateWorld 的 JSDoc。 */
      retranslateWorld,
      /** 打开带确认的面板。 */
      openRetranslateDialog,
      /** 报告转 Markdown。 */
      reportToMarkdown,
      /**
       * 给一个包显式登记译文文件地址 —— 当模块 id 不是 `<被翻译方 id>-cn` 时用。
       * @param {string} packCollection 例如 "alienrpg.alien-rpg-system"
       * @param {string} url            例如 "modules/xxx/compendium/cn/alienrpg.alien-rpg-system.json"
       */
      registerRepairSource(packCollection, url) { EXTRA_TRANSLATION_URLS.set(packCollection, url); },
      lastReport: null,
    });
  }
}

// node 里 import 本文件做离线验证时没有 Hooks —— 纯函数部分照样可用。
if (typeof Hooks !== "undefined") {
  Hooks.once("init", registerRetranslateWorld);
}
