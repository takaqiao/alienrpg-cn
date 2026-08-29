import { DOCUMENT_MAPPINGS, PROJECT_CONVERTERS } from './babele-mappings.js';

/**
 * alienrpg-cn —— 汉化中枢的运行时注册入口。
 *
 * 本文件只做三件事，且**只在 `babele.init` 里做**：
 *   1. 注册本模块自己的译文目录 `compendium/cn`
 *   2. 注册本项目的自定义 converter
 *   3. 注册全项目**唯一**的 Babele 全局 mapping 层
 *
 * ────────────────────────────────────────────────────────────────────
 * 为什么是 `babele.init` 而不是 Foundry 的 `init`（已核对 Babele 2.9.1 源码）
 * ────────────────────────────────────────────────────────────────────
 * modules/babele/script/babele.js:26-34
 *     Hooks.once('init', () => {
 *         let babele = new BabeleFacade();
 *         BabeleFacade.instance = babele;
 *         game["babele"] = babele;
 *         registerModuleSettings();
 *         initWrapper();
 *         uiBridge.registerHooks();
 *         Hooks.callAll('babele.init', babele);
 *     });
 * 也就是说 `game.babele` 是在 Babele **自己的 init 监听器**里才建出来的，随后
 * 同步派发 `babele.init`。模块的 init 监听器与 Babele 的 init 监听器谁先跑，
 * 取决于 esmodule 的加载顺序 —— 在我们自己的 `init` 里碰 `game.babele` 是在赌
 * 加载顺序。`babele.init` 则由 Babele 亲自在对象建好之后派发，没有竞态。
 *
 * 三个 register* API 都先跑 `#assertConfigurable()`（babele.js:167 / :198 / :292），
 * 会话已建成时会抛：
 *     babele.js:989-993
 *     `Babele | ${operation} must be called during the babele.init hook,
 *      before the runtime session is initialized. `
 *
 * ⚠ 更正（2026-08-29 复核）：原注释写「放 ready / setup 是**直接报错**」，这是**错的**。
 *   babele.js:984-987 的 `#assertConfigurable` 头一句就是
 *       if (!this.#session) { return; }
 *   而 `#session` 只在 `game.babele.init()` -> `#replaceSession()`（:859-903）里才建，
 *   那是 Babele 自己的 `ready` 监听器（:36-42）干的事。所以：
 *     · `setup` 阶段 `#session` 必为 null —— **不报错**，注册照样生效；
 *     · `ready` 阶段是**赌钩子顺序**：跑在 Babele 的 ready 之前不报错，之后才报错。
 *   真正选 `babele.init` 的理由只有一条，而且够充分：它是 Babele 亲手在
 *   `game.babele` 建好之后同步派发的，既没有对象存在性竞态，也没有会话时序竞态。
 *   把「会报错」当护栏是靠不住的——它只在一半的情况下报。
 *
 * ────────────────────────────────────────────────────────────────────
 * `babele.register({module, lang, dir})` 的 module 是**我们自己**的 id
 * ────────────────────────────────────────────────────────────────────
 * modules/babele/script/translation/translation-source-registry.js:61-62
 *     translationDirectories: () => registration.dirs.map(
 *         (dir) => `modules/${registration.module}/${dir}`),
 *     mappingDirectories:     () => registration.dirs.map(
 *         (dir) => `modules/${registration.module}/${dir}`),
 * 即路径拼成 `modules/alienrpg-cn/compendium/cn`。填被翻译方的 id 会指向别人的目录。
 *
 * ⚠ 注册这个目录同时开了一条**没人提过**的第二条 mapping 通道（2026-08-29 新发现）：
 *   translation-source-registry.js:61-62 把同一个 dir 既当 translationDirectories
 *   又当 mappingDirectories。而 translation/translation-source.js:14-15 定义
 *       MAPPING_FILENAME        = "mappings.json"
 *       LEGACY_MAPPING_FILENAME = "mapping.json"
 *   :115-126 的 #isMappingFile / #matchesKind 就靠**文件名**分流：目录里名字正好是
 *   这两个之一的 .json 会被当成 MAPPING 读走，其余 .json 才当译文。
 *   后果两条，都要记住：
 *     1. 这样读进来的 mapping 进的是 `loadedMappings`，而 document-mappings.js:267-278
 *        的 #rebuild 顺序是 builtIn -> registered -> **loaded**，
 *        所以它**压过**中枢用 registerMapping 注册的全局层。
 *     2. 反过来，谁要是把一份**译文**取名 compendium/cn/mappings.json，它会被静默
 *        当成 mapping 吃掉，一个字都不翻，而且不报错。
 *   本项目不用这条通道：mapping 一律走中枢的 babele-mappings.js。
 *   compendium/cn/ 下**不许**出现 mappings.json 或 mapping.json，发布工作流已加断言。
 *
 * 同文件 :29-34 的 `register(source)` 是**按 name 去重覆盖**的：
 *     this._sources = [...this._sources.filter(r => r?.name !== source?.name), source];
 * 而 name 不是裸 id，是 `#moduleSourceName()`（同文件 :229-231）拼的
 *     `module:${module.module}:${module.lang ?? "*"}`
 * 即 `module:alienrpg-cn:cn`。三个汉化模块 id 不同 -> name 不同 -> 互不顶掉。
 * 推论：**同一个 id 用不同 lang 注册会得到两个源**，同一个 id + 同一个 lang 再注册
 * 一次则会走 :212-225 的 `#moduleRegistrationFor`，把 dir 并进同一条注册里（去重），
 * 而不是新增一条。
 *
 * ────────────────────────────────────────────────────────────────────
 * 为什么 registerMapping 只能由本模块调用一次
 * ────────────────────────────────────────────────────────────────────
 * `registerMapping` 注册的是**全局层**（babele.js:281-294 —— 文档块 281-290，
 * 方法体 291-294；原注释逐字为
 * "Register one global document mapping layer.
 *  Registered mappings enrich or override the built-in defaults for every
 *  session built after bootstrap. Runtime sessions reject late mapping
 *  registration to keep configuration and loaded data coherent."）。
 * 它不属于某个 pack、也不属于调用它的模块。新手包 / 核心书两个模块如果各自再调
 * 一次，同一份层会被合并三遍。因此那两个模块的 register.js 只有 `babele.register`，
 * 没有 registerMapping —— 改动那两个文件前先读这一段。
 *
 * 「enrich 而非替换」已在源码验明，不是照抄文档：
 *   mapping/document-mappings.js:267-281 `#rebuild()` 按
 *     builtInMappings -> registeredMappings -> loadedMappings 三层顺序叠；
 *   :283-287 `#mergeLayer()` 逐 documentType 调 `#mergedDefinition()`；
 *   :347-361 `#mergedDefinition()` 把 `_variants` 摘出来**追加拼接**，其余字段走
 *     `foundry.utils.mergeObject(base, override, {inplace:false})`。
 * 所以本层的 `Adventure` 只写了 name/description/caption/items/tables，
 * 内置的 folders / journals / scenes / macros / playlists / actors / cards
 * （mapping/default-mappings.js:3-59）原样保留；`Item` 只有 `_variants`，
 * 内置的 `Item.description = "system.description.value"`（同文件:131）也保留 ——
 * 这正是 EC 那次「description 键整体顶掉内置默认值」事故的反面写法。
 */

const MODULE_ID = 'alienrpg-cn';

Hooks.once('babele.init', (babele) => {
  // Babele 未启用时本模块的 lang/ 与 styles/ 仍然有效，只是合集正文不翻译。
  if (!game.modules.get('babele')?.active) return;

  babele.register({
    module: MODULE_ID,
    lang: 'cn',
    dir: 'compendium/cn',
  });

  // ⚠ converter 与 mapping 目前由 babele-mappings.js 提供，而那是一个**生成文件**。
  // 骨架阶段它是空壳（见该文件头部）。空注册对 Babele 是合法但无意义的调用，所以
  // 这里按「有内容才注册」处理：一来避免在日志里制造「已注册」的假象，二来一旦
  // 生成器没跑就发版，控制台会明确说出来，而不是静默地什么都没翻。
  const converterCount = Object.keys(PROJECT_CONVERTERS ?? {}).length;
  const mappingCount = Object.keys(DOCUMENT_MAPPINGS ?? {}).length;

  if (converterCount > 0) babele.registerConverters(PROJECT_CONVERTERS);
  if (mappingCount > 0) babele.registerMapping(DOCUMENT_MAPPINGS);

  if (mappingCount === 0) {
    console.warn(
      `${MODULE_ID} | babele-mappings.js 尚未生成（DOCUMENT_MAPPINGS 为空），` +
        `合集正文将只按 Babele 内置默认映射翻译。执行 ` +
        `node "4-常用脚本/release/generate_runtime.mjs" 后重新打包。`
    );
  }

  // ── 本项目自有 converter 的到位自检 ──────────────────────────────────────
  //
  // mapping 里引用一个**没注册**的 converter，Babele 是**失败即放行**的：
  //   modules/babele/script/mapping/field-mapping.js:236-238
  //       if (!this.converter) { this._logMissingConverter(...); return undefined; }
  //   同文件 :279 `_skipDynamicField(fieldMapping, runtime, "missing_converter")`
  //   同文件 :410-424 `_logMissingConverter` 只 console.warn 一行（:419）
  //       `Babele | missing converter '<name>' for dynamic field '<field>', field skipped during <phase>`
  // 即**不崩、不报错、那个字段静默不翻**。这正是本项目最难发现的一类缺陷。
  //
  // 判据用的是**项目自有命名前缀 `alien`**，不是「Babele 内置清单」：内置 converter
  // 并不住在 `babele.converters` 里（core/babele.js:55 的 `new ConverterRegistry()`
  // 是空的，内置目录另有其所），拿它当白名单会把 `document` / `nameCollection`
  // 这类内置名误报成缺失。凡是我们自己写的 converter 一律以 `alien` 开头，
  // 这条判据因此既无漏报也无误报，且与 Babele 内部结构完全解耦。
  const referenced = new Set();
  (function walk(node) {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    if (typeof node.converter === 'string') referenced.add(node.converter);
    for (const v of Object.values(node)) walk(v);
  })(DOCUMENT_MAPPINGS);

  const missing = [...referenced].filter(
    (name) => name.startsWith('alien') && !(name in (PROJECT_CONVERTERS ?? {}))
  );
  if (missing.length) {
    console.warn(
      `${MODULE_ID} | mapping 引用了未注册的项目 converter：${missing.join(', ')}。` +
        `Babele 会**静默跳过**这些字段（field-mapping.js:236-238 / :410-424），不会报错。` +
        `补上 4-常用脚本/release/runtime-converters.alien.js 后重跑 generate_runtime.mjs。`
    );
  }

  console.log(
    `${MODULE_ID} | 已注册 Babele 译文源 compendium/cn` +
      `（converter ${converterCount} 个，mapping 文档类型 ${mappingCount} 个）`
  );
});

/*
 * ────────────────────────────────────────────────────────────────────
 * 预留位：Foundry / alienrpg 数据形状兼容垫片
 * ────────────────────────────────────────────────────────────────────
 * EC 项目里这一段承载的是 preUpdateActor / preUpdateItem 的形状消毒与两个一次性
 * 迁移。alienrpg 侧目前**没有已确证需要垫片的形状问题**，所以这里故意留空 ——
 * 不照抄 EC 的 crucible 专用垫片（那些函数问的是 crucible 的 schema，搬过来即是
 * 对 alienrpg 文档做无依据的改写）。
 *
 * 真要加时，注意 alienrpg 的已知取名/取值耦合（行号 2026-08-29 逐条重新推导）：
 *   · systems/alienrpg/module/documents/actor.mjs **:1902-1921** —— switch(testArray[3])，
 *     三个 case 是 `localize("ALIENRPG.Yes") + " "` / `+ ", –1 "` / `+ ", –2 "`。
 *     ⚠ 那两个破折号是 **U+2013 EN DASH**（:1906 / :1912，已 hexdump 验明），
 *     不是 ASCII `-`。用 ASCII 连字符做的表永远匹配不上，cFatal 分支静默丢失。
 *   · 同文件 **:1923-1942** —— switch(testArray[5])，五个 case 是
 *     `localize("ALIENRPG.None"|"OneRound"|"OneTurn"|"OneShift"|"OneDay") + " "`；
 *     落 default 则 `healTime = 0`，**静默**。
 *   · **:1888** `testArray[9] !== localize("ALIENRPG.Permanent")`（注意此处**不**补空格）。
 *   · **:1890** `testArray[9] === "Shift"` —— **裸英文字面量**，没有 localize()。
 *     ⚠ 这一条的失效形态不是「静默」：不等于 "Shift" 且非空时会掉进 :1893
 *     `testArray[9].match(/^\[\[([0-9]d[0-9]+)]/)[1]`，正则不匹配 -> null[1] ->
 *     **TypeError 抛出**，重伤检定当场中断。所以重伤表的 heal-time 单元格必须留英文。
 * 这些判据必须与（Babele 翻译后的）重伤表内容同步，详见
 * lang/lang_keep_english.json 与 7-其他内容/glossary/glossary_alien.provenance.json
 * 的 `_meta.lockstep_literals`。
 */
