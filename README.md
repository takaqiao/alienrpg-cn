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

> **当前状态：0.1.0 —— 系统层已完整，内容包尚未开工。**
>
> ✅ **已完成**：系统界面 **600 个键**（`en.json` 的 590 个键覆盖 584 个，6 个有意保持英文）·
> 系统自带合集 `alienrpg.alien-rpg-system` **全译**（81.8 KB：MU/TH/ER 使用说明 66K 字、
> 三张恐慌/压力表、26 个物品、文件夹与宏名）· MU-TH-UR / Motion Tracker /
> Token Action Hud / Babele 四个插件的中文语言文件 · CJK 字体回退 · 运行时补丁。
>
> ⬜ **尚未开工**：新手包（34 万字）与核心书（229 万字）的正文。
> 那是另外两个模块的事，**装不装本模块都不影响**——本模块自己是完整可用的。
>
> ⚠ **尚未做过实机冒烟测试。** 全部校验都是静态的（闸门、不变式、合并仿真）。
> 首次导入的名称查找、经典模式下的技能炫技按钮、Evolved/Classic 双世界的标签覆盖
> 都还没有在真实世界里验证过。遇到问题请开 issue。

---

## 三个模块怎么分工

| 模块 | 仓库目录 | 装什么 | 何时需要 |
|---|---|---|---|
| **`alienrpg-cn`**（本仓） | `1-系统汉化插件/` | 系统界面译文、四个插件的语言文件、运行时补丁、CJK 字体、**全项目唯一的 Babele 全局 mapping 层**、系统自带的 `alienrpg.alien-rpg-system` 合集译文 | **始终需要** |
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
| `scripts/alienrpg-hardcoded-cn.mjs` | 系统侧写死串的运行时补丁 | ✅ |
| `scripts/plugins-hardcoded-cn.mjs` | 插件侧写死串的运行时补丁 | ✅ |
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
于是一个模块可以同时携带系统覆盖和四份插件语言文件，没装那些插件的世界零成本。

### `languages` 为什么是 5 条不是 6 条

有 i18n 通道的只有这几个：系统覆盖 1 条 + `alien-mu-th-ur` / `motion_tracker` /
`token-action-hud-alien` 3 条 + `babele` 自身 1 条 = **5 条**。

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
```

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
