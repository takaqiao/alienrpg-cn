# Alien Evolved 中文汉化（非官方） / Alien Evolved Chinese Translation (Unofficial)

[![GitHub release](https://img.shields.io/github/v/release/takaqiao/alienrpg-cn?style=flat-square&label=release&logo=github)](https://github.com/takaqiao/alienrpg-cn/releases/latest)
[![Foundry version](https://img.shields.io/endpoint?url=https%3A%2F%2Ffoundryshields.com%2Fversion%3Furl%3Dhttps%3A%2F%2Fgithub.com%2Ftakaqiao%2Falienrpg-cn%2Freleases%2Flatest%2Fdownload%2Fmodule.json&style=flat-square)](https://github.com/takaqiao/alienrpg-cn/releases/latest)
[![Total downloads](https://img.shields.io/github/downloads/takaqiao/alienrpg-cn/total?style=flat-square&label=downloads&color=brightgreen)](https://github.com/takaqiao/alienrpg-cn/releases)
[![Foundry VTT](https://img.shields.io/badge/Foundry%20VTT-v13%20%7C%20v14-orange?style=flat-square&logo=foundryvirtualtabletop&logoColor=white)](https://foundryvtt.com/)
[![System](https://img.shields.io/badge/system-alienrpg%204.1.13-1a7f37?style=flat-square)](https://foundryvtt.com/packages/alienrpg)
[![Babele](https://img.shields.io/badge/Babele-required-7b3f99?style=flat-square)](https://foundryvtt.com/packages/babele)
[![Unofficial](https://img.shields.io/badge/%E9%9D%9E%E5%AE%98%E6%96%B9-unofficial-lightgrey?style=flat-square)](https://github.com/takaqiao/alienrpg-cn)

Foundry VTT 的 **Alien Evolved**（`alienrpg`）系统简体中文汉化的**中枢模块**。
界面字符串走 Foundry 原生 i18n，合集正文经 Babele 加载。

> **当前状态：0.2.5 —— 系统层完整，插件与新手包已补齐，内容包只差核心书。**
>
> ✅ **已完成**：系统界面 **600 个键**（`en.json` 的 590 个键覆盖 584 个，6 个有意保持英文）·
> 系统自带合集 `alienrpg.alien-rpg-system` **全译**（81.8 KB：MU/TH/ER 使用说明 66K 字、
> 三张恐慌/压力表、26 个物品、文件夹与宏名）· CJK 字体回退 · 运行时补丁。
>
> 🆕 **0.2.5：按实机反馈重裁状态与特技术语。** 状态栏改为
> `Freezing → 受冻`、`Encumbered → 超重`、`Gravity Dyspraxia → 重力失调`；
> `Critical Injuries` 的**界面状态标签**改为「重伤」，但代码查找用的 RollTable 名仍保持英文。
> `Stunts → 特技`、`Skill-Stunts → 技能特技`，并同步系统合集、Evolved 插件语言文件、
> 新手包正文与 12 个中文动态键别名。
>
> 🆕 **0.2.4：`yze-combat`（Year Zero Engine: Combat）界面全译**（80 键）。
> 该模块是 alienrpg 系统**官方支持**的先攻方案 —— 系统自带
> `Hooks.once("yzeCombatReady", …)`（`alienrpg.mjs:500`），装上即自动写入
> `actorSpeedAttribute` 与 `duplicateCombatantOnCombatStart`。
>
> ⚠ 追踪器上那对动作按钮译作**「完整动作／快速动作」**（跟《异形》进化版的说法）。
> YZE 通称是「慢速／快速动作」，经典版《异形》也用后者 —— 若你跑的是经典版，
> 把 `YZEC.CombatTracker.SlowAction` 改回「慢速动作」即可。
>
> 🆕 **0.2.3：补上技能特技与天赋正文。** `alien-evolved-starterset` 与
> `alien-evolved-corerules` 各自带了 19 个 `ALIENRPG.*` 键（技能特技清单 + 天赋描述），
> 系统自己的 `en.json` 里没有，此前**整类未译**。现由
> `lang/plugins/evolved-stunts-cn.json` 提供，两个模块共用同一份（上游两包逐字节相同）。
>
> 同时修了一条**中文下必然失效**的查找：经典角色卡的特技按钮用
> 「已本地化的技能名」拼 key（`character-sheet.mjs:1113`），英文下
> `Close Combat → ALIENRPG.CloseCombat` 正好命中，中文下拼出的是
> `ALIENRPG.近战` —— 上游没有这个键。本版额外提供 12 个中文键别名，
> 内容与英文键逐字节相同。`4-常用脚本/qa/scan_stunt_aliases.py` 盯着它们别走散。
>
> ✅ **插件语言文件（0.2.0 起随包出货）**：`lang/plugins/` 下 MU-TH-UR **276 键**
> （上游 275 键全覆盖，另补一条上游 `en.json` 漏掉、但 `main.js:4868` 确实会读的
> `MOTHER.commandNotFound`）、Motion Tracker **69 键**、Babele **102 键**，占位符与上游 1:1。
> 另有 motion-tracker-multideck 与 terminal 两个**无 i18n 管线**的插件走运行时补丁。
> ⚠ **v0.1.0 里这三份是 `{}` 空壳**（骨架残留，当时的发布闸只看 `lang/cn.json`）；
> 用 v0.1.0 且装了对应插件的世界看不到中文，**升到 0.2.0 即可**。
> （`tah-alien-cn.json` 例外：Token Action Hud Alien 的标签本来就全是 `ALIENRPG.*` 键，
> 翻了系统就等于翻了它，那份文件本来就该是空的，**现在也仍然是空的**。）
>
> ✅ **新手包已完成**：34 万字原文对应的规则、剧本、角色、场景、图钉与图内文字均已汉化，
> 由独立模块 `alien-evolved-starterset-cn` 出货。
>
> ⬜ **只剩核心书**（约 229 万字符）尚未汉化；本模块的系统层与插件层已经完整可用。
>
> ✅ **0.2.0 已按 v0.1.0 的实机反馈重排界面用词**：21 个压力/恐慌状态名与 12 个面板标签
> 全部收成两字并**按各自的规则描述重新取名**（`搞砸`→`失误`、`失去物品`→`脱手`、
> `失去知觉`→`木僵`、`视野狭窄`→`恍惚`、`最远射程`→`射程`、`水`→`饮水` 等），
> 日志条目名也已可译（`MU/TH/ER 使用说明`，由译名回退垫片兜住上游 5 处按英文名查找）。
>
> ⚠ **仍未做过完整实机冒烟。** v0.1.0 得到过一轮用户反馈（已全部处理），但下列面仍未验证：
> 首次导入的名称查找、经典模式下的技能特技按钮、Evolved/Classic 双世界的标签覆盖
> 都还没有在真实世界里验证过。遇到问题请开 issue。

---

## 三个模块怎么分工

| 模块 | 仓库目录 | 装什么 | 何时需要 |
|---|---|---|---|
| **`alienrpg-cn`**（本仓） | `1-系统汉化插件/` | 系统界面译文、六份插件语言文件（七个条件入口）、运行时补丁、CJK 字体、**全项目唯一的 Babele 全局 mapping 层**、系统自带的 `alienrpg.alien-rpg-system` 合集译文 | **始终需要** |
| `alien-evolved-starterset-cn` | `2-新手包汉化插件/` | 新手包 `alien-evolved-starterset.alien-evolved-starter-set` 的译文 | 装了新手包才需要 |
| `alien-evolved-corerules-cn` | `3-核心书汉化插件/` | 核心书 `alien-evolved-corerules.alien-evolved-core-rules` 的译文 | 装了核心书才需要 |

拆开的理由不是技术边界，是**授权与生命周期边界**：`alien-evolved-corerules` 在它
自己的 `module.json` 里是 `"protected": true`（Free League 付费内容），对应译文必须
能独立发布、独立撤下、独立打版本号。

**`registerMapping` 只能由本仓调用。** 它注册的是 Babele 的**全局层**，不属于任何
一个包。另外两个模块的 `register.js` 里只有 `babele.register(...)`，没有
`registerMapping` —— 三个模块各调一次会把同一份层合并三遍。

---

## 安装 / Install

在 Foundry → **附加模块 → 安装模块** 中粘贴 manifest URL：

```
https://github.com/takaqiao/alienrpg-cn/releases/latest/download/module.json
```

装好后启用本模块与 **Babele**，把世界语言切到**中文**。本模块不在 Foundry 官方包
浏览器中收录，只能用上面的 manifest 安装。

---

## 仓库内容 / Contents

| 路径 | 作用 | 进发布包 |
|---|---|:--:|
| `module.json` | 模块清单 | ✅ |
| `register.js` | Babele 注册入口（译文目录 + converter + 全局 mapping 层） | ✅ |
| `babele-mappings.js` | **生成文件**，由 `4-常用脚本/release/generate_runtime.mjs` 产出 | ✅ |
| `lang/cn.json` | 系统界面译文（覆盖 `systems/alienrpg/lang/cn.json`） | ✅ |
| `lang/plugins/muthur-cn.json` | MU-TH-UR 的中文语言文件 | ✅ |
| `lang/plugins/motiontracker-cn.json` | Motion Tracker 的中文语言文件 | ✅ |
| `lang/plugins/tah-alien-cn.json` | Token Action Hud Alien 的落点（现为空，见下） | ✅ |
| `lang/plugins/babele-cn.json` | Babele 自身设置界面的中文 | ✅ |
| `lang/plugins/evolved-stunts-cn.json` | Starter Set / Core Rules 共用的技能特技与天赋正文（按两个模块分别门控） | ✅ |
| `lang/plugins/yzecombat-cn.json` | YZE Combat 的中文界面（80 键） | ✅ |
| `scripts/alienrpg-hardcoded-cn.mjs` | 系统侧写死串的运行时补丁 | ✅ |
| `scripts/plugins-hardcoded-cn.mjs` | 插件侧写死串的运行时补丁 | ✅ |
| `scripts/retranslate-world.mjs` | 「重新汉化本世界」原地修复工具（设置菜单按钮 + 模块 API） | ✅ |
| `data/DO-NOT-TRANSLATE.json` | 硬冻结登记表，修复工具在**运行时**加载；与 `7-其他内容/` 那份逐字节相同 | ✅ |
| `styles/alienrpg-cn.css` | CJK 字形回退与排版修正 | ✅ |
| `compendium/cn/*.json` | 合集译文 | ✅ |
| `compendium/en/*.json` | 英文基准，只用于跨版本算 drift | ❌ |
| `lang/en.json` | 上游英文快照（`lang_gap.py` 的 OLD 基准） | ❌ |
| `lang/_baseline.json` | 上面那份快照的溯源元数据 | ❌ |
| `lang/lang_keep_english.json` | 保持英文的两张表（`keep_english` 写英文串 / `never_write` 一个字都不写）+ 逐条理由，只给 QA 脚本用 | ❌ |

---

## 三条汉化通道

1. **Babele** —— 合集正文。三个包都是单 Adventure 包。
2. **Foundry 原生 i18n** —— 系统的界面键与插件的语言文件。
3. **运行时补丁**（`scripts/`）—— 前两条都够不到的写死串。

### 为什么系统的 `lang/cn.json` 是「覆盖」而不是「fork」

`Localization#getTranslations`（`client/helpers/localization.mjs:283-321`）按固定顺序把
翻译文件推进一个**扁平字典**：core（`:288-290`）→ `game.system`（`:293-297`）→
**每个启用的模块**（`:300-305`，遍历 `game.modules.values()`）→ world（`:308-312`），
最后 `:316-319` 按**推入顺序**（不是 resolve 顺序）逐个
`foundry.utils.mergeObject(translations, json, {inplace:true})`。

**后者胜**这四个字是有源码的，不是推断：`mergeObject` 的默认参数里
`overwrite=true`（`common/utils/helpers.mjs:1126`），命中同名键时走 `:1163` 的
`_mergeUpdate`，在 `:1219-1224` 直接 `original[k] = deepClone(v)`。
所以模块的 `lang/cn.json` 会逐键盖掉系统的同名键。系统源文件一个字都不用改，
系统升级也不会把我们的译文冲掉。

三条已核对的必要前提（2026-08-29 逐条从安装的 v14.366 源码重新推导）：

- **系统确实声明了 `cn`。** `systems/alienrpg/system.json` 的 `languages` 里有
  `{"lang":"cn","name":"中文","path":"lang/cn.json"}`，所以这真的是一次**覆盖**，
  不是「系统没有 cn、我们是唯一来源」那种更弱的情形。
- **扁平点号与嵌套两种形状都行。** `#loadTranslationFile:368` 对每份 JSON 跑
  `expandObject`，`mergeObject` 在 `helpers.mjs:1142-1153` 的 `_d===0` 分支里对**两侧**
  再跑一次。所以系统用嵌套、我们用扁平（或反过来）不会各存一份互不覆盖。
- **core 不提供 `cn`。** `CONST.CORE_SUPPORTED_LANGUAGES` 是
  `Object.freeze(["en"])`（`common/constants.mjs:275`），`:288` 那一支对 `cn` 永远不触发。
  界面的 core 部分来自 `foundry_chn` 这类模块，不是 Foundry 自带。

### ⚠ 覆盖只能写，不能删 —— 影子覆盖（shadow），不是删除

`mergeObject` 的默认参数里 `applyOperators=false`（`common/utils/helpers.mjs:1127`），
所以 `-=key` / `ForcedDeletion` 那套删除语法在 i18n 这条路上**根本不生效**：
`:1158` 的 `isDeletionKey` 分支只是把键名迁移一下，真正执行删除要靠 `:1211` /
`:1223` 的 `applyDataOperators(v)`，而那两处都写着
`options.applyOperators ? applyDataOperators(v) : …`。旧的 `performDeletions`
开关自 v14 起废弃（`:1132-1138` 的 `logCompatibilityWarning`，
`{since: 14, until: 16}`），也别去打它的主意。

**没有任何一份模块 lang 文件能删掉上游已有的键。** 想让某个键回落英文，只有两条路：

| 手法 | 做法 | 适用前提 |
|---|---|---|
| **(A) 影子覆盖 shadow** | 在我们的 `cn.json` 里**写上英文串**，压过上游的中文 | 上游那份 cn 值是一个正常的中文字符串 |
| **(B) 一个字都不写** | 我们的 `cn.json` 里**完全不出现这个键** | 上游那份 cn 值 `localize()` 本来就不认（例如 JSON `null`） |

判据在 `client/helpers/localization.mjs:435-445`：`:436` 先从 `this.translations`
取值，`:437` `if ( typeof translation !== "string" )` —— **非字符串就当没有**，
于是 `:441` `translation = foundry.utils.getProperty(this._fallback, stringId);`
拿英文。而 `_fallback` 是 `:236` 的 `await this.#getTranslations("en")`。
⇒ 值为 `null` 的键天然走 (B)；值为中文的键**必须**走 (A)，指望删掉它是白费功夫。

两张表连同逐条理由都在 `lang/lang_keep_english.json` 的 `_README` 里。

**上游 `cn.json` 的实测存量（2026-08-29，alienrpg 4.1.13）：**

- 511 条叶子 vs `en.json` 的 590 条；其中 **14 条只在 `cn.json` 里存在**，全是
  v11 之前的文档类型标签命名法 —— `ACTOR.TypeCharacter` / `TypeColony` /
  `TypeCreature` / `TypePlanet` / `TypeSpacecraft` / `TypeSynthetic` /
  `TypeTerritory` / `TypeVehicles`，`ITEM.TypeAgenda` / `TypeArmor` /
  `TypeColony-initiative` / `TypeCritical-injury` / `TypeItem` / `TypeWeapon`。
  `en.json` 里**根本没有 `ACTOR` 命名空间**，取而代之的是 v11+ 的
  `TYPES.Actor.*` / `TYPES.Item.*`；`ACTOR.Type` / `ITEM.Type` 在整个系统代码里
  **0 命中**。它们删不掉，也不用管 —— 但**不要**把它们抄进我们的 `cn.json`
  「翻译」一遍，那只是给死键多做一份中文副本。
- 恰好 **1 个 JSON `null` 值**：`ALIENRPG.EVCriticalInjuries`。它就是 (B) 的唯一一例，
  详见下面「命名冻结」第 2 条。

### 插件语言文件为什么装在本模块里

同文件 `#filterLanguagePaths`（`:331-339`）：

```js
#filterLanguagePaths(pkg, lang) {
  return pkg.languages.reduce((arr, l) => {
    if ( l.lang !== lang ) return arr;
    const checkSystem = !l.system || (game.system && (l.system === game.system.id));
    const checkModule = !l.module || game.modules.get(l.module)?.active;
    if (checkSystem && checkModule) arr.push(l.path);
    return arr;
  }, []);
}
```

每条 `languages` 记录都可以带一个 `"module"` 门控：**目标模块没启用就整条跳过**。
于是一个模块可以同时携带系统覆盖和多份插件语言文件，没装目标插件的世界零成本。

### `languages` 为什么是 8 条、但只有 7 份物理语言文件

清单现在声明：系统覆盖 1 条；`alien-mu-th-ur` / `motion_tracker` /
`token-action-hud-alien` / `babele` / `yze-combat` 各 1 条；以及同一份
`evolved-stunts-cn.json` 分别受 `alien-evolved-starterset` 与
`alien-evolved-corerules` 门控的 2 条，合计 **8 个入口**。Evolved 两条共用一个文件，
所以磁盘上是 **7 份语言文件**（系统 1 + 插件 6）。

另两个周边插件**没有可声明的落点**（本机实测）：

| 插件 | `module.json` 的 `languages` | `game.i18n` 命中 | `{{localize` 命中 |
|---|---|---|---|
| `terminal` 4.0.11 | 无此字段 | 0 | 0 |
| `motion-tracker-multideck` 1.0.2 | 无此字段 | 0 | 0 |

给它们声明语言文件是**没有读者的写入**，它们只能走 `scripts/plugins-hardcoded-cn.mjs`
的模板抢注。

`tah-alien-cn.json` 目前是空的，也是有意的：`token-action-hud-alien` 自己的
`languages/en.json` 就是 `{"tokenActionHud":{}}`（0 个键），它的所有标签都是
`ALIENRPG.*` 与 `tokenActionHud.*` 两个**外部命名空间**的键 —— 翻译系统的
`lang/cn.json` 就等于翻译了 HUD。这个文件保留为将来它自己长出键时的落点。

### ⛔ `MOTHER.Keywords.*` 是命令词表，不是文案 —— 一个字都不许翻

MU/TH/UR 终端的四个键 `MOTHER.Keywords.Ordre / Special / Special2 / Protocol`
**必须与上游 `en.json` 逐字节相同**（`ORDER` / `SPECIAL` / `SPECIAL` / `PROTOCOL`）。

它们不是给人看的字符串。`alien-mu-th-ur/scripts/main.js` 全模块只有四个读取点
（`:1148 :1152 :1153 :1156`），全部形如

```js
const orderWords = [ game.i18n.localize('MOTHER.Keywords.Ordre').toUpperCase(), 'ORDER' ];
```

只喂给 `isSpecialOrder()` / `isCerberus()` 做 `includes` 判定，**永不渲染**。
而真正把编号解析出来的 `handleSpecialOrder()`（`:4567-4579`）用的是 12 条写死的
ASCII／法语正则剥前缀，**没有中文分支**。所以把它们译成中文的后果是：

- `指令 937` 被 `isSpecialOrder()` 放行 → 走进特殊指令分支 → `orderKey` 仍是
  `指令 937` → `orders[orderKey]` 落空 → 只弹一句 `MOTHER.commandNotFound`；
- 对**没 hack 的玩家**更糟：放行后先撞 `MOTHER.AccessDenied`，同时给 GM 发一条
  `MUTHUR.SpecialOrderAttempt` 入侵告警 —— 一次中文误输入变成一次假警报。

玩家该敲的命令词本来就是英文（`HELP` / `SPECIAL ORDER 937` / `CERBERUS`），
`MUTHUR.help` 与 `helpMenu.*` 里列的也是英文命令名，翻这四个键**没有任何收益**。

判据由 `4-常用脚本/qa/gate_plugin_lang.mjs` 的 P8 组盯死：除了逐字节比对，还顺带
复核「读取点仍是这四个」「剥前缀链里仍然没有非 ASCII 分支」「`MOTHER.Keywords.`
在 `main.js` 里仍然只出现 4 次（即仍然只用于解析）」—— 上游哪天改了，闸门先红。

---

## ⚠ 命名冻结：改译文前必读

系统在若干处**拿本地化后的字符串当查找键**。这些位置的译文与合集内容必须同步，
否则不是显示英文，而是**功能静默失效**。

### 1. 重伤表解析（`module/documents/actor.mjs:1888-1940`）

```js
if (testArray[9] !== game.i18n.localize("ALIENRPG.Permanent")) {   // :1888
  if (testArray[9] === "Shift") { … }                             // :1890 裸字面量
switch (testArray[3]) {
  case game.i18n.localize("ALIENRPG.Yes") + " ":            cFatal = true;   // :1903
  case game.i18n.localize("ALIENRPG.Yes") + ", –1 ":                         // :1906
  case game.i18n.localize("ALIENRPG.Yes") + ", –2 ":                         // :1912
switch (testArray[5]) {
  case game.i18n.localize("ALIENRPG.None")     + " ": healTime = 0;          // :1924
  case game.i18n.localize("ALIENRPG.OneRound") + " ": healTime = 1;          // :1927
  case game.i18n.localize("ALIENRPG.OneTurn")  + " ": healTime = 2;          // :1930
  case game.i18n.localize("ALIENRPG.OneShift") + " ": healTime = 3;          // :1933
  case game.i18n.localize("ALIENRPG.OneDay")   + " ": healTime = 4;          // :1936
```

**`:1906` / `:1912` 里的短横线是 EN DASH（U+2013），不是 ASCII 连字符（U+002D）。**
按 ASCII 抄一遍会得到永远匹配不上的 case，`cFatal` 分支静默失效。

上游系统自带的 `lang/cn.json` **已经踩了这个坑**：它把 `None` / `OneRound` /
`OneTurn` / `OneShift` 翻成了中文，而随包发的英文重伤表仍写 `None` / `One Round` /
`One Shift` —— 于是 `healTime` 永远落到 `default: 0`。

本仓的做法：这 7 个键写进 `lang/lang_keep_english.json` **保持英文**，直到重伤表
本身与它们同步翻译为止。第 8 项 `"Shift"` 是**裸字面量**、没有 i18n 键，属于合集侧的
冻结项（表格里的愈合时间格必须原样保留 `Shift`）。

### 2. 用本地化字符串查 RollTable（`module/documents/actor.mjs:1812 / :1815-1817`）

```js
atable = game.tables.getName(game.i18n.localize("ALIENRPG.EVCriticalInjuries"))
      || game.tables.getName("EV - Critical Injuries");
atable = game.tables.getName(game.i18n.localize("ALIENRPG.CriticalInjuries"))
      || game.tables.getName("Critical Injuries")
      || game.tables.getName("Critical injuries");
```

表名按 T-FROZEN 决议保持英文，所以这两个键都要让**首次查找就命中**，不去依赖
`||` 兜底。但两者的手法**不一样**，别抄错：

| 键 | 上游 cn.json 的值 | 我们的做法 | 为什么 |
|---|---|---|---|
| `ALIENRPG.CriticalInjuries` | `"重伤"` | **(A) 写上英文串** `Critical injuries` | 上游是正常中文，删不掉，只能压过去。不压也不崩（`:1817` 的第三个 `||` 正好是 `"Critical injuries"`），但每次都要多绕两跳 |
| `ALIENRPG.EVCriticalInjuries` | **JSON `null`** | **(B) 一个字都不写** | `localize` 在 `:437` 判 `typeof !== "string"` 直接回落 `_fallback`，拿到 `en.json` 的 `EV - Critical Injuries` —— 已经是我们要的值。再写一份英文副本零收益，只多一处上游改名后会**静默过期**的冻结拷贝 |

⚠ 两张表**不在本仓**。它们在 `2-新手包汉化插件` / `3-核心书汉化插件` 的合集里，
名字（两仓 `compendium/en` 基准，2026-08-29 复核）分别是 `EV - Critical Injuries`
与 `Critical injuries`（**小写 i**），与系统 `en.json` 里对应键的值**逐字节相同**。
⇒ 这是一条**跨仓 lockstep**：改那两张表的中文名之前，先回来改这里。

### 3. 技能特技条目按本地化技能名查（`module/sheets/character-sheet.mjs:1119`）

```js
item = game.items.getName(dataset.pmbut);   // dataset.pmbut = 本地化后的技能名
```

`data-pmbut='{{skill.description}}'`（`templates/actor/character-skills.hbs:15`、
`templates/actor/crt/crtui-character-skills.hbs:13`），而
`skill.description` 是**派生字段**：`module/data/actor-character.mjs:468` 与
`module/data/actor-synthetic.mjs:458` 每次 `prepareDerivedData` 都把它覆写成
`game.i18n.localize(CONFIG.ALIENRPG.skills[skl].name)`。

⇒ 12 个技能特技 Item 的名字必须与 `lang/cn.json` 的 `ALIENRPG.Skill<key>`
**逐字节相等，不带英文尾巴**（决议 T-EXACT）。

同一函数 `:1113-1116` 还会把这个标签去空格后拼成第二个键：

```js
const newLangStr = langStr.replace(/\s+/g, "");
temp3 = game.i18n.localize("ALIENRPG." + newLangStr);
```

已核实：12 个派生键（`ALIENRPG.HeavyMachinery` / `ALIENRPG.CloseCombat` / …）
在 `lang/en.json` 里**一个都不存在**，`localize` 返回原键，随后的
`temp3.startsWith("<ol>")` 判定为假 —— 这条路径在 4.1.13 英文下**本来就是空转**。
翻成中文后依然空转，**不会引入新问题**，不必为它造键。

---

## 🛠 「重新汉化本世界」—— 已导入的世界里名字还是英文时用它

**入口**：`配置设置 → 模块设置 → Alien Evolved - 简体中文 → 重新汉化本世界 → 打开修复面板`
（仅 GM 可见，就在系统自己那个「Import Adventure / Re-Import」按钮旁边）

**默认只试运行**。面板先列出它打算改什么，你看完再决定要不要点「执行」。

### 什么时候需要它

侧边栏里**文件夹 / 宏 / 随机表还是英文名**，但日志正文已经是中文 —— 这个组合是典型症状。
也可能整个世界的合集内容都还是英文。两种都用它修。

> **⚠ 先说清楚它修不到的那一部分。** 系统自带的三张表 —— `Panic Table` /
> `Panic Response Table` / `Stress Response Table` —— **跑完还是英文名**，这不是工具的
> 毛病：`compendium/cn/alienrpg.alien-rpg-system.json` 里这三条 `tables.*.name`
> 本来就映射到它们自己的英文原串（它们同时也在硬冻结登记表的 `rolltable_names` 里）。
> 表里的**结果正文**是中文的，会被修好；表名不会动。文件夹名和 4 个宏名则会全部修好。
> 换句话说：典型症状里的 6 项修得掉，3 张表名修不掉。

它做的是**原地改名 / 原地补正文**：不删文档、不重新导入、不动 `_id`、不动文件夹结构，
所以你在世界里已经做的工作（改过的场景、加的笔记、调过的角色）都还在。

### 为什么会这样 —— 上游缺陷，删了重装也可能再来一次

`alienrpg` 系统会在**第一次进世界时自行导入**它的 Adventure 包
（`systems/alienrpg/module/apps/init.mjs:48-56 → :74-82 FirstTimeSetup()`），
而这次导入**不问 Babele 准备好了没有**。跑在 Babele 会话建成之前（或那次开世界压根没启用
Babele）的话，落地的文档全是英文名 —— 而此后**没有任何东西会再去改它们的名字**：

- `Adventure#import` 只在**再次导入**时才覆盖已存在的文档
  （`client/documents/adventure.mjs:130-157` + `:188-197`）；
- Babele 的补名钩子只有 `createFolder` 一条（`babele/script/babele.js:72-74`），
  而它要求文档带 `Compendium.` 开头的 `_stats.compendiumSource`，本包的文件夹带的却是
  世界式 `Folder.<id>`，那条路径直接 early-return；**宏和随机表连这样的钩子都没有**。

日志正文之所以偏偏是中文，是系统自己的 `showReleaseNotes()`
（`systems/alienrpg/module/alienrpg.mjs:567-621`）在版本变更时**只**强刷了那一篇 JournalEntry，
而且 `:596` 明确排除了 `folders`，也从不碰 macros / tables。

⚠ **这是上游的数据/时序缺陷，不是本模块能一次性根治的。** 新建的世界仍有可能出现同样的状态
（例如首次进世界时 Babele 还没启用、或先开了世界再装汉化）。出现了就再跑一次这个工具，
它是**幂等**的 —— 第二次跑是空操作。

### 它改什么

| 覆盖 | 说明 |
|---|---|
| 七类文档的**名字** | Folder / Macro / RollTable / Item / Actor / JournalEntry / Scene |
| **随机表结果** | `TableResult.description`；`TableResult.name` 仅限**不带 `documentUuid`** 的结果 |
| **日志页面** | 页名 + 正文 HTML（`JournalEntryPage.name` / `text.content`） |
| **角色的表名引用** | `system.rTables` / `system.cTables`，与表名**同步移动**（见下） |

匹配方式有两条，主次分明：

1. **按 `_id`**（主）—— `Adventure#import` 是 `keepId: true` 建档的，世界文档的 id 就是包里的 id。
   目标值直接取**当前这份合集包经 Babele 翻译后的样子**，也就是「一次干净的重新导入会写成什么」。
2. **按英文名**（补）—— 只用于世界里那些被手工删掉重建、id 已经对不上的文档。
   这一路会去读对应模块的 `compendium/cn/<包名>.json`，拿英文键换中文值。

   ⚠ 这一路会碰到**不属于本项目**的文档：世界里叫 `Weapons` / `Creatures` / `Careers`
   的文件夹，可能是你自己建的，也可能是别的模块建的。所以它带两道收窄判据，
   任何一道成立就跳过并写进报告：

   - 这个英文名**已经有一份文档按 `_id` 认到包里的正主**了；
   - 想改成的那个中文名，**世界里已经有别的文档在用**了。

   净效果：包里那份改，同名的第二份不动。真正被手工重建、世界里再没有第二份的，
   照常修好 —— 这一路没有变成摆设。

3. **译文没生效的包不参与判定。** 三个 Adventure 包**故意共用 `_id`**，而
   `alien-evolved-corerules` 目前**还没有译文文件**。一个没有译文的包读出来的就是
   英文原名，那是**弃权**不是反对票；早先版本把它当成「两个包给的译名不一致」，
   于是整片正确译名被自己人挡掉（实测：三包环境下 172 条待办 / 32 条被挡 / 95 条跳过，
   而应有的是 299 条 / 0 条 / 3 条）。现在这类包会被静音，并在报告里点名。

### 它**不**改什么（明说，不含糊）

- **物品 / 角色的正文**（描述、笔记、天赋说明……）。这些字段的真实路径随
  `Item.type` 变（见 `babele-mappings.js` 的 `_variants`），在运行时重推一遍等于把 Babele 的
  mapping 引擎抄第二份，抄错了是静默写错字段。要全量刷新请用合集里的 **Adventure 导入器**
  （那会**整份覆盖**已存在的文档，你在这些文档上做的改动会丢）。
- **宏的 `command`**。里面有一批必须逐字节保持英文的字面量（登记表 `macro_commands` 一节）。
- **场景的 notes / drawings / regions**、**Playlist / Cards**。
- **带 `documentUuid` 的随机表结果的 `name`**（引用了别的文档的那种结果）。这一格走
  `referencedDocumentField` converter，值可能是从被引用文档现取的，原地写死会钉成快照。

  > **不带 `documentUuid` 的结果名照修。** 那个 converter 的**第一优先级是本地译文**
  > （`babele/script/converter/referenced-document-field-converter.js:15-17`
  > `if (typeof context.translation !== "undefined" && context.translation !== null)
  > { return context.translation; }`），只有本地没给译文时才去 UUID 那边现取。
  > 实测两份有译文的包共 155 条结果，其中包里已是中文的结果名 43 条、
  > **带 `documentUuid` 的 0 条**；全语料带 `documentUuid` 的一共 2 条且都没有译名。
  > 早先的版本一刀切不修 `name`，白白漏掉这批已经译好的结果名，而它想防的情况一条都没出现。
- **合集包本身**。工具只改世界文档，合集永远由 Babele 在读取时翻译。

另外，**现值里已经有汉字的字段一律跳过**（当作「你自己改过的」），并在报告里逐条列出。
真要强制对齐，面板上有「强制对齐已中文化的名称与正文」这个勾选框 —— 它会覆盖你的改动。

### ⛔ Babele 没生效时它会拒绝运行

「现值已含汉字就跳过」是唯一挡住反向破坏的东西，而上面那个 `force` 勾选框恰好绕过它。
于是有一条真实的破坏性路径：**Babele 关着（或语言不是中文、或汉化模块没开）+ 勾了 force**
—— 此时从合集包里读出来的**全是英文**，工具会把一个已经汉化好的世界整体刷回英文。
实测（三份 raw dump + 已中文化的模拟世界）：**104 个名字 + 190 处正文由中文改回英文**，
而且**没有撤销键**。

所以现在：**只要一个 Adventure 包的译文都没生效，工具直接抛错拒绝运行**，
不是「跑出 0 条待办」。报告里会点名是哪些包。光靠一条告警是挡不住的 ——
在修掉 `isTranslated` 传参错误之前（`babele.js:552-559` 收的是合集 id 字符串，
工具却传了 `CompendiumCollection` 对象，于是**每个包都报 false**），
那句告警在完全健康的世界里也每次都弹，早被训练成噪音了。

### ⛔ 硬冻结的名字一个都不会被改

工具在运行时加载 `data/DO-NOT-TRANSLATE.json`（与 `7-其他内容/DO-NOT-TRANSLATE.json` 是同一份文件），
把「必须逐字节保持英文」的那些名字编成判据：3 个文件夹名、11 个随机表名、6 个按
`.toUpperCase()` 比较的天赋名、3 个 Adventure 名与 2 个开场场景名，外加
`Critical Injuries` 前缀过滤器和武器名的 ` RPG ` 子串判据。
任何一次会破坏这些判据的改名都会被**拦下并写进报告**（在「被硬冻结登记表挡住」一栏，
连原因带 `file:line` 依据），不是静默跳过。

⚠ **登记表读不到 = 工具拒绝运行**，不会「降级为无守卫地跑」。理由很直白：把
`Alien Creature Tables` 文件夹改个名，生物卡的攻击表下拉框会塌成一个 `None`，
攻击按钮随即抛 `TypeError`（`rollTableData.mjs:27` + `actor.mjs:2497` 那个无守卫的
`table.roll()`）—— 没有守卫就跑，比不跑坏得多。

同理，随机表一旦改名，指向它的生物角色的 `system.rTables` / `system.cTables`
会**同一次一起改**（表名和引用「要么一起动，要么都不动」）；哨兵值 `None` 永远不动。

### 报告与回退

没有撤销按钮，所以工具把**每一条改动的原值**都留下来了：

- 面板里一张表，逐条列出「类型 / 文档 / 位置 / 原 / 新」；
- 一条只有你看得见的聊天摘要；
- F12 控制台里的完整 `console.table`（不截断）；
- 面板上的「复制报告」（Markdown，可直接贴 issue）与「导出 JSON」；
- `game.modules.get("alienrpg-cn").api.lastReport` 里存着完整报告对象。

**建议先在世界备份上跑一遍。**

### 脚本入口

```js
// 只扫描，不写盘，返回完整报告对象
await game.modules.get("alienrpg-cn").api.retranslateWorld();

// 真正执行
await game.modules.get("alienrpg-cn").api.retranslateWorld({ apply: true });

// 打开带确认的面板（等价于设置里那个按钮）
await game.modules.get("alienrpg-cn").api.openRetranslateDialog();
```

选项：`content`（正文，默认 `true`）、`nameFallback`（按名字兜底，默认 `true`）、
`force`（覆盖已中文化的现值，默认 `false`）、`chat`（发聊天摘要，默认 `true`）。

若某个包的译文文件不在 `<被翻译方 id>-cn` 这个命名约定里，用
`api.registerRepairSource("<包 collection>", "modules/<模块 id>/compendium/cn/<包 collection>.json")`
显式登记；不登记也不会出错，只是那个包用不了「按名字兜底」，报告里会明说。

### 闸门

```bash
node "4-常用脚本/qa/gate_retranslate_world.mjs"
```

105 项检查，其中：用 Babele 2.9.1 的**真 converter** 把两份 raw dump 翻一遍当输入，
跑「规划 → 应用 → 再规划」证明**幂等**（第一遍 106 处改名 + 193 处正文，第二、三遍 0 条）；
灵敏度档故意把冻结名译成中文，验证守卫**真的会拦**（防「判据空转」）；
还端到端验了两条硬闸：非 GM 拒绝运行、登记表读不到拒绝运行。

---

## 依赖 / Requires

- **Foundry VTT v13+**（`compatibility`：minimum 13 / verified 14 / maximum 14.999）
- **`alienrpg` 系统 4.1.13+** —— 系统自身声明的是 `{minimum: "13", verified: "14", maximum: "14"}`。
  本仓 `maximum` 写 `"14.999"`：`common/packages/base-package.mjs:455-456` 对
  `maximum` 的判定是
  `!isNewerVersion(release.version, maximum, {majorOnly: Number.isInteger(Number(maximum))})`
  —— `"14"` 走 majorOnly、`"14.999"` 走完整比较，在 14.366 上**两者结论相同**。
  写 `"14.999"` 是为了与 EC 项目的既有约定一致，不改变任何行为。
- **[Babele](https://foundryvtt.com/packages/babele) 2.9.1+** —— 合集译文的加载框架，必须启用。

可选（装了才生效，没装零成本）：`alien-mu-th-ur`、`motion_tracker`、
`token-action-hud-alien`、`terminal`、`motion-tracker-multideck`。

---

## 开发 / Development

```bash
# 重新生成 babele-mappings.js（改过 mappings.mjs 或 converter 之后必须跑）
node "4-常用脚本/release/generate_runtime.mjs"

# 只校验、不写盘（发版前用）
node "4-常用脚本/release/generate_runtime.mjs" --check

# 「重新汉化本世界」修复工具的闸门（守卫编译 / 判据行为 / 真 Babele 译文 /
#  端到端幂等 / 灵敏度 / 出货，共 105 项）
node "4-常用脚本/qa/gate_retranslate_world.mjs"
```

改动 `7-其他内容/DO-NOT-TRANSLATE.json` 后，**必须**把它复制到 `1-系统汉化插件/data/`：
修复工具读的是包内那一份，两处不同步 = 判据用的是旧登记表。
`gate_retranslate_world.mjs` 的 P 档会逐字节比对，忘了复制就红。

`babele-mappings.js` 是**生成文件，禁止手改** —— 抽取器按
`4-常用脚本/extract/mappings.mjs` 决定写出哪些 key，Babele 按这个文件决定查哪些 key，
两边各留手抄件迟早对不上，而对不上的表现是「某些字段静默不翻」，没有报错。

发版：把 `module.json` 的 `version` / `download` / `changelog` 三处版本号一起改好，
提交，然后打 `v<版本号>` 标签推上去。工作流会核对三处与 tag 一致，核对声明的文件
确实存在，再打包。

---

## 说明 / Notes

- 这是**非官方**爱好者翻译，与 Free League Publishing、20th Century Studios、
  Foundry Gaming LLC 及 ALIEN Evolved 系统、相关模块的作者均无隶属关系，也未经其审核。
- 本模块**只含译文**，不含上游的任何美术、音频、排版或未翻译原文。核心书与新手包
  是需要自行拥有的第三方内容。
- 代码与译文的授权范围**不同**，见 [`LICENSE`](LICENSE)：MIT 只覆盖本仓自己写的
  代码与配置；`lang/` 与 `compendium/` 里的中文文本是第三方版权作品的**衍生作品**，
  MIT 不适用，也无权适用。

## 致谢 / Credits

- **ALIEN 角色扮演游戏** —— Free League Publishing / Fria Ligan AB
- **ALIEN Evolved** 系统与 Starter Set / Core Rules 模块 —— Paul Watson
- **Babele** —— Simone Ricciardi，<https://gitlab.com/riccisi/foundryvtt-babele>
- 翻译与维护 —— Taka

Issue / PR 欢迎 —— 错译、术语建议、兼容性反馈都会处理。
