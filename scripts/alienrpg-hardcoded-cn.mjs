/**
 * alienrpg-hardcoded-cn.mjs —— 第三条汉化通道：系统侧写死字符串的运行时补丁。
 *
 * 前两条通道是 Babele（合集正文）与 Foundry 原生 i18n（lang/cn.json）。这个文件
 * 只处理**两条都够不到**的东西：alienrpg 4.1.13 把英文原文直接写进 JS 或模板、
 * 没有 i18n 键的地方。
 *
 * ⚠ 铁律：**凡是 lang/cn.json 够得到的，一律不在这里做**。那条通道更便宜、
 *   上游改文案时不会静默过期，而且不需要任何钩子。
 *
 * ══════════════════════════════════════════════════════════════════════
 * 全局门（GATE）—— 本文件所有改动都只在中文世界生效
 * ══════════════════════════════════════════════════════════════════════
 * `game.i18n.lang !== 'cn'` 时本文件是**完全的空操作**：不注入键、不抢模板、
 * 不装通知垫片、不碰 DOM。理由不是洁癖，是正确性：
 *   · 通道 A 往 `game.i18n.translations` 写的是**以英文原文为键**的顶层键，
 *     它是全局的；在英文世界里注入等于把别人的英文串也换成中文。
 *   · 通道 B 抢注的是已经译好的模板；在英文世界里抢注就是把英文界面改成中文。
 * module.json 的 `lang/cn.json` 本来就只在 lang==='cn' 时装载，本文件与它对齐。
 * （zh-tw 走的是系统自带的 zh-tw.json，与本模块无关，不能顺手覆盖。）
 *
 * ══════════════════════════════════════════════════════════════════════
 * 通道 A —— 扁平顶层 i18n 键（LITERAL_LABELS）
 * ══════════════════════════════════════════════════════════════════════
 * 适用于 `game.settings.register` 的 name/hint、`game.keybindings.register` 的
 * name/hint、SceneControl 的 title、`element.dataset.tooltip` —— 这些位置在渲染时
 * 会拿**英文原文**去查 i18n 表。往 `game.i18n.translations` 写入**以英文原文为键**
 * 的扁平顶层键即可命中：
 *   common/utils/helpers.mjs:822-824 的 getProperty 第一分支就是
 *       if ( key in object ) return object[key];
 *   而 client/helpers/localization.mjs 的 has(:390) / localize(:435) 都走 getProperty，
 *   所以带空格、带句点的整句作为顶层键**可以**命中（不会被 key.split(".") 拆开）。
 *
 * 🔑 2026-08-29 新发现，这条通道的射程比骨架阶段以为的大得多：
 *   client/applications/ui/notifications.mjs:108 `notify(message, type, {localize=false, …})`
 *   的第 **:121** 行是 `message = _loc(message, format);` —— **无条件**执行，
 *   跟 `localize` 选项无关（那个选项只影响 :116/:119 的 cleanHTML 豁免）。
 *   `_loc` 就是 `Localization#localize`（client/global.d.mts:32）。
 *   ⇒ **凡是传给 ui.notifications 的静态英文字面量，都能用通道 A 直接翻掉**，
 *     不需要给 notify 打垫片。只有模板字符串（每次内容都不同）才需要通道 D。
 *   同理 Dice So Nice 的 colorset.description / system.name 也走 localize：
 *     modules/dice-so-nice/main.js `prepareColorsetList()` 里
 *       label: game.i18n.localize(o.description), group: game.i18n.localize(o.category)
 *     `prepareSystemList()` 里 label: game.i18n.localize(r.name)
 *
 * 为什么不能写进 lang/cn.json：
 *   client/helpers/localization.mjs:348-378 的 #loadTranslationFile 在 **:368**
 *   对每份 lang JSON 跑 `json = foundry.utils.expandObject(json)`，
 *   带句点的整句会被拆成嵌套键而查不到（"Alien RPG News" 这种无点号的整句倒是不会
 *   被拆，但会打破发版前「cn 键数 == en 键数」的三数相等检查）。
 *   顺带：foundry.utils.mergeObject 在 common/utils/helpers.mjs:1142-1153 的 _d===0
 *   分支里对**两侧**都跑 expandObject，所以扁平点号与嵌套两种 lang 形状在 v14 下
 *   合并后等价——这也是为什么写进 lang 文件的点号整句一定会被拆开。
 *
 * ⚠ 顶层键是**全局**的（i18n 表跨包合并）。写入一律「别人已定义就让给别人」，
 *   宁可露英文也不顶掉别的包。泛用单词在收进来之前必须先证明本机 modules/ +
 *   systems/ + core 里冲突面为 0。
 *   2026-08-29 实测（判据已固化进 4-常用脚本/qa/test_hardcoded_patch.mjs 的 C2）：
 *   扫了本机 core lang 与 systems/ 、modules/ 下共 201 份语言 JSON（已去重），
 *   下表 9 条英文键在**任何**包里都不作为顶层键或扁平路径出现，冲突面 = 0。
 *   即便真撞上，失效形态也与「Mirror Image」那类子串正则事故不同：整串相等才命中，
 *   而整串相等意味着译文对那句话**本来就是对的**。
 */

/** 值可以是字符串，也可以是 {key, fallback, requires} —— 见 resolveLiteral()。 */
const LITERAL_LABELS = {
  // ── ui.notifications 的静态英文字面量（活跃引用图内，逐条 file:line 复核） ──
  // systems/alienrpg/module/apps/init.mjs:80  FirstTimeSetup()
  // systems/alienrpg/module/apps/init.mjs:106 ModuleImport() 的 importAdventure 钩子
  'Import Complete': '导入完成',
  // systems/alienrpg/module/apps/init.mjs:110
  'There was a problem with the Import': '导入过程中出现问题',
  // systems/alienrpg/module/alienrpg.mjs:522  createDocMacro()
  'You can only create macro buttons for owned Items': '只能为角色已拥有的物品创建宏按钮',
  // systems/alienrpg/module/helpers/alienRPGConfig.mjs:82  toggleConfigButton()
  'No submenu found for the provided key': '未找到该键对应的子菜单',

  // ── Dice So Nice 注册项（systems/alienrpg/module/alienrpg.mjs 的 diceSoNiceReady） ──
  // :386 colorset description（:385 的 name 是 "yellow"，**与 DSN 内置同名**，
  //      实测会覆盖 DSN 自带的 yellow 配色；所以标签跟随 DSN 自己的译名最不突兀）
  Yellow: { key: 'DICESONICE.ColorYellow', fallback: '黄色', requires: 'dice-so-nice' },
  // :397 colorset description（:396 的 name 是 "AlienBlack"，DSN 无同名内置）
  AlienBlack: '异形黑',
  // :387/:398 的 category 都是裸字面 "Colors"，而 DSN 自己用的是 "DICESONICE.Colors"。
  // 不翻 → 这两个配色在下拉里自成一个英文 "Colors" 组；翻成 DSN 的同一个译名 →
  // 它们并回 DSN 的「颜色」组。所以这一条必须取 **DSN 当前语言下的实际值**，
  // 写死中文反而可能与 DSN 的译名不一致而继续分组。
  Colors: { key: 'DICESONICE.Colors', fallback: null, requires: 'dice-so-nice' },
  // :407 / :435 dice system name
  'Alien RPG - Blank': '异形 RPG - 空白骰面',
  'Alien RPG - Full Dice': '异形 RPG - 完整骰面',
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * 通道 A′ —— 把设置菜单改指向**已经存在却没人用**的 i18n 键
 * ══════════════════════════════════════════════════════════════════════
 * systems/alienrpg/module/apps/init.mjs:37-44 的 registerMenu 三个可见字段全是
 * 英文字面量：
 *     :38 name  = "Import Adventure"
 *     :39 label = "Re-Import"
 *     :40 hint  = `Welcome to the ${adventurePackName}.  Click above to import …`
 * 而系统自己的 lang/en.json + cn.json 里 **ALIENRPG.forceImportName /
 * forceImportLabel / forceImportHint 三个键早就译好了，却一处都没被引用**
 * （`grep -rn forceImport systems/alienrpg/module` 命中 0）。
 * 它们的英文原文正是这个菜单该说的话，hint 甚至比上游那句更准确：
 *   forceImportHint = "Forces a reimport … will not overwrite existing data but
 *                      will replace missing data."
 * 而 ReImport()（init.mjs:132-172）确实是**非破坏性**的（只补世界里缺的资源）。
 *
 * 为什么改指向键、而不是往通道 A 塞三条英文顶层键：
 *   改指向 = 这三句话回到 lang/cn.json 那条便宜通道，上游哪天改了英文原文也不会
 *   静默失配；塞顶层键 = 上游改一个字，我们的三条键当场失效且无人察觉。
 *
 * 渲染侧已核对：`registerMenu` 只是把 data 原样塞进 `game.settings.menus`
 * （client/helpers/client-settings.mjs:185-194，**不**做任何本地化），
 * 真正 localize 发生在渲染时：
 *   client/applications/settings/config.mjs:59-64 把 menu.name/hint/label 摘进
 *   entry.label/hint/buttonText；
 *   templates/settings/config-category.hbs:4 `{{localize entry.label}}`
 *                                        :10 `{{localize entry.buttonText}}`
 *                                        :14 `{{localize entry.hint}}`
 * ⇒ 渲染时才查表，所以我们在 i18nInit 改写 `game.settings.menus` 完全来得及。
 *
 * 三个 expect 是**保险丝**：上游哪天自己把这三句改了或者换成 i18n 键，
 * 我们就什么都不做并在控制台说一声，绝不盲改。
 */
const SETTINGS_MENU_RETARGET = {
  'alienrpg.import': {
    name: { expect: 'Import Adventure', key: 'ALIENRPG.forceImportName' },
    label: { expect: 'Re-Import', key: 'ALIENRPG.forceImportLabel' },
    // hint 是模板字符串，${adventurePackName} 在 init.mjs:9 是 T-FROZEN 的
    // "Alien RPG System"，所以运行期是一个确定的常量串。注意两处**双空格**。
    hint: {
      expect:
        'Welcome to the Alien RPG System.  Click above to import any missing (deleted) content to your world.  ' +
        'If you want to do a full refresh (overwrite) open the Compendium and use the Adventure Importer. ',
      key: 'ALIENRPG.forceImportHint',
    },
  },
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * 通道 B —— Handlebars 模板整份替换（TEMPLATE_OVERRIDES）
 * ══════════════════════════════════════════════════════════════════════
 * Foundry 的 getTemplate 第一行就短路：
 *   client/applications/handlebars.mjs:31
 *       if ( id in Handlebars.partials ) return Handlebars.partials[id];
 *   :41 编译上游模板用的是 `Handlebars.compile(resp.html, {preventIndent: true})`
 * 所以在 `i18nInit`（语言定下来后最早的钩子，理由见下面的装配段）用同名 partial
 * 抢先注册一份已汉化的模板，之后每次渲染都用我们的。
 *
 * key   = 上游模板路径（与 sheet 的 PARTS.template 逐字节相同）
 * value = 我们仓里那份译文模板的路径（modules/alienrpg-cn/... 开头）
 *
 * ⚠ 抢注是**整份替换**：上游模板一改，我们这份就静默过期且不会报错。
 *   所以这张表只收**两类**：
 *     (1) 写死串多到整份接管才划算的（planet-general.hbs：整张殖民行星卡
 *         30 处写死标签，全文只有 1 个 {{localize}}）；
 *     (2) 写死串在**属性**里、且那个属性会流进 JS 逻辑的（creature-header.hbs
 *         的 4 个 data-label，见下）。
 *   只有一两处纯文本的模板一律走通道 C（DOM），不整份接管。
 *   每加一条都在 7-其他内容/english-baseline/alienrpg-4.1.13/templates/ 留一份
 *   对应版本的英文原件，供跨版本 diff。
 *
 * ── creature-header.hbs 的 4 个 data-label 不是死标记 ──────────────────
 * systems/alienrpg/templates/actor/creature-header.hbs
 *   :26 data-label='Speed'        :42 data-label='Mobility'
 *   :48 data-label='Observation'  :54 data-label='Acid Splash'
 * 同一份模板 :18 / :34 的两个 data-label 却是 `{{localize "…"}}` —— 上游自己就
 * 不一致。这个属性会经 target.dataset 一路流到：
 *   systems/alienrpg/module/sheets/creature-sheet.mjs:571-582 `_onRollAbility`
 *     -> actor.abilityRoll / rollAbilityMod
 *   systems/alienrpg/module/documents/actor.mjs:189  `let label = dataset.label;`
 *   systems/alienrpg/module/documents/actor.mjs:281 / :379 / :766 / :1034 / :1274 / :1752
 *     `localize("ALIENRPG.DialTitle1") + " " + dataset.label + " " + localize("ALIENRPG.DialTitle2")`
 * cn.json 里 DialTitle1='投骰已修正'、DialTitle2='检定'，于是中文世界里点「速度」
 * 弹出的对话框标题是 **「投骰已修正 Speed 检定」** —— 中文夹一个英文单词。
 * 译文模板把这 4 个属性改成 `{{localize "ALIENRPG.Speed"|"…Skillmobility"|
 * "…Skillobservation"|"…SkillAcidSplash"}}`，与同文件 :18/:34 的写法一致，
 * 字符串因此回到 lang 通道，**不写死中文**。
 */
const TEMPLATE_OVERRIDES = {
  'systems/alienrpg/templates/actor/creature-header.hbs':
    'modules/alienrpg-cn/templates/alienrpg/actor/creature-header.hbs',
  'systems/alienrpg/templates/actor/planet-general.hbs':
    'modules/alienrpg-cn/templates/alienrpg/actor/planet-general.hbs',
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * 通道 C —— DOM 兜底
 * ══════════════════════════════════════════════════════════════════════
 * 用于「模板里只有一两处写死串、整份接管不划算」以及「写死串在属性里但不进逻辑」
 * 的情况。每条规则都必须同时满足三个收窄条件，缺一不可：
 *   1. `scope`：宿主应用必须匹配这个选择器（默认 '.alienrpg' —— 系统自己四类
 *      sheet 的 DEFAULT_OPTIONS.classes 第一项都是 "alienrpg"，见
 *      character-sheet.mjs:16 / creature-sheet.mjs:16 / item-sheet.mjs:19 /
 *      territory-sheet.mjs:14 / synthetic-sheet.mjs:16）。
 *   2. `selector`：系统自有的类名 / id，不用泛用标签。
 *   3. `from`：**整串相等**（文本节点用 trim 后全等，属性用全等或带 ^…$ 的正则）。
 * 只改文本节点与属性值，绝不重写 innerHTML —— 那会把带监听器的元素重建掉。
 *
 * `to` 可以是字符串，也可以是 `{key, suffix}`：后者在应用时才 localize，
 * 好处是字符串留在 lang 通道里，将来改译名不用动这个文件。
 */
const DOM_TEXT_REPLACEMENTS = [
  // <h3 class='resource-label gCol5 tooltip'>NPC?</h3>  —— 4 处，全部活跃：
  //   templates/actor/character-header.hbs:62
  //   templates/actor/character-enhanced-header.hbs:69
  //   templates/actor/synthetic-header.hbs:64
  //   templates/actor/synthetic-enhanced-header.hbs:65
  // ALIENRPG.NPC 这个键**存在**（en='NPC'，上游 cn 也='NPC'），所以走 key 形式：
  // 当前语言下输出仍是 "NPC?"（视觉零变化），但字符串从此在 lang 通道里，
  // 谁要改成中文只需改 lang 值。
  {
    selector: 'h3.resource-label.tooltip',
    from: 'NPC?',
    to: { key: 'ALIENRPG.NPC', suffix: '?' },
    sites: ['character-header.hbs:62', 'character-enhanced-header.hbs:69', 'synthetic-header.hbs:64', 'synthetic-enhanced-header.hbs:65'],
  },
  // <label class="speciality-label">SPECIALTY</label> —— 2 处，都在 CRT 皮肤里：
  //   templates/actor/crt/crtui-character-general.hbs:219
  //   templates/actor/crt/crtui-synthetic-general.hbs:211
  // 这两份模板分别是 281 / 267 行，为一个词整份接管不划算 —— 所以走 DOM。
  // ALIENRPG.SPECIALTY 已存在（en='SPECIALTY'，cn='专业'）。
  {
    selector: 'label.speciality-label',
    from: 'SPECIALTY',
    to: { key: 'ALIENRPG.SPECIALTY' },
    sites: ['crt/crtui-character-general.hbs:219', 'crt/crtui-synthetic-general.hbs:211'],
  },
  // 被删掉的乘员在飞船/载具乘员表里显示成字面 "{MISSING_CREW}"：
  //   systems/alienrpg/module/sheets/spacecraft-sheet.mjs:367
  //   systems/alienrpg/module/sheets/vehicle-sheet.mjs:363
  // 渲染点（`{{ actor.name }}`）：
  //   templates/actor/spacecraft-general.hbs:110  .occupant > .grid-ship-crew > .gSC6
  //   templates/actor/vehicle-crew.hbs:18         同上
  // 保留花括号，因为它在界面上就是一个「占位符」语气，不是普通名字。
  {
    selector: '.occupant .gSC6',
    from: '{MISSING_CREW}',
    to: '{乘员已删除}',
    sites: ['spacecraft-sheet.mjs:367', 'vehicle-sheet.mjs:363'],
  },
  // 系统设置面板（FormApplication，id=alienprgSettings）里的按钮：
  //   systems/alienrpg/module/helpers/alienprgSettings.hbs:43
  // ⚠ 这份 .hbs 在 **module/helpers/** 下，不是 templates/system/ 下那份同名文件。
  //   alienRPGConfig.mjs:12 的 template 指向前者；templates/system/alienprgSettings.hbs
  //   全仓 0 引用，是死文件（2026-08-29 可达性分析）。
  // 这个应用不带 .alienrpg 类，所以单独给 scope。
  {
    scope: '#alienprgSettings',
    selector: 'button[name="addcrt"]',
    from: 'CRT UI Sheets',
    to: 'CRT 风格角色卡',
    sites: ['module/helpers/alienprgSettings.hbs:43'],
  },
  // 技能炫技面板在**找不到对应 skill-stunts 物品**时写回的兜底文案：
  //   character-sheet.mjs:1132 / synthetic-sheet.mjs:1119 /
  //   spacecraft-sheet.mjs:1097 / vehicle-sheet.mjs:1020
  //   `chatData = "<h2>No Stunts Entered</h2>"`，随后 `li2.innerHTML = chatData`。
  // 它是**点击后**才写进 #panel 的，renderApplicationV2 抓不到 —— 由下面的
  // PANEL 观察器（观察 `#panel` 的 childList）补上，规则本身仍写在这里。
  // 战斗跟踪器右键菜单「交换先攻」的确认框：
  //   systems/alienrpg/module/helpers/CBTracker.mjs:96-112  new Dialog({...})
  //     :104 `label: "OK"`                                   <- 写死英文
  //     :109 `label: game.i18n.localize("ALIENRPG.DialCancel")` <- 同一个框里却走了 lang
  // 中文世界里这个框长成「取消」旁边一个「OK」。上游自己前后不一致。
  //
  // CBTracker.mjs 是活的（alienrpg.mjs:14 `import AlienRPGCTContext from "./helpers/CBTracker.mjs"`）。
  // 这是 appv1 `Dialog`（v14 仍在：client/client.mjs:170 `Dialog: appv1.api.Dialog`，
  // dialog-v1.mjs:85-87 template=templates/hud/dialog.html、classes=["dialog"]）。
  //
  // ⚠ 收窄：`.dialog` + 一个「OK」按钮是**全世界最泛的形状**，光靠它必然误伤别的模块。
  //   所以加第二道 `contains` 锚点 —— 这个框的内容模板
  //   systems/alienrpg/templates/dialog/switch-initiative.html:4 有 `<select id="initiative-swap">`，
  //   而 `initiative-swap` 这个 id 在本机 295 个模块 + 全部 system + core 里**只有 alienrpg 用**
  //   （判据固化在 qa/adversarial_hardcoded_patch.mjs 的 N2）。两道锚点同时成立才动手。
  // `data-button="one"` 来自 dialog.html:6 `data-button="{{id}}"`，id 即 buttons 对象的键名 `one`。
  //
  // 术语：系统 lang 里**没有**任何可复用的确认键（en.json 里只有 DialCancel/SubmitButton/
  //   ResetButton/Yes 四个近义键，而 `ALIENRPG.Yes` 属于重伤解析的 8 个锁步键、本期必须留英文），
  //   core 的 `COMMON.Confirm` 又要赌 foundry_chn 装没装，所以这里写死中文，登记进 glossary_gaps。
  {
    scope: '.dialog',
    contains: '#initiative-swap',
    selector: 'button.dialog-button[data-button="one"]',
    from: 'OK',
    to: '确定',
    sites: ['module/helpers/CBTracker.mjs:104'],
  },
  {
    scope: null, // 由 #panel 观察器调用，不参与 render 时的整表扫描
    selector: 'h2',
    from: 'No Stunts Entered',
    to: '未录入炫技',
    panelOnly: true,
    sites: ['character-sheet.mjs:1132', 'synthetic-sheet.mjs:1119', 'spacecraft-sheet.mjs:1097', 'vehicle-sheet.mjs:1020'],
  },
];

/**
 * 属性值改写。与文本节点分开，因为属性不能用 childNodes 那套。
 * `from` 为字符串时要求**全等**；为正则时必须自带 ^…$ 锚点。
 */
const DOM_ATTR_REPLACEMENTS = [
  // 18 个加减档位按钮的 title（浏览器原生 tooltip）。
  // 全部 file:line（2026-08-29 复核，均在活跃模板内）：
  //   character-header.hbs:10,30 (Minus) / :19,36 (Plus)
  //   character-enhanced-header.hbs:11,28 (Minus) / :19,34 (Plus)
  //   synthetic-header.hbs:10 (Minus) / :19 (Plus)
  //   synthetic-enhanced-header.hbs:10 (Minus) / :18 (Plus)
  //   crt/crtui-character-header.hbs:11,36 (Minus) / :20,42 (Plus)
  //   crt/crtui-synthetic-header.hbs:13 (Minus) / :21 (Plus)
  // 系统 lang 里**没有** ALIENRPG.Minus / ALIENRPG.Plus（实测 en.json / cn.json 均无），
  // 所以只能写死中文；见报告里的 glossary_gaps。
  { selector: 'button.minus-btn i[title]', attr: 'title', from: 'Minus', to: '减少' },
  { selector: 'button.plus-btn i[title]', attr: 'title', from: 'Plus', to: '增加' },
  // 炫技按钮 title：character-skills.hbs:15 / crt/crtui-character-skills.hbs:13
  // ALIENRPG.Stunts 已存在（en='Stunts'，cn='炫技'，与 glossary_alien.json 的
  // "Stunts = 炫技" 一致），走 key。
  { selector: 'button.stunt-btn i[title]', attr: 'title', from: 'Stunts', to: { key: 'ALIENRPG.Stunts' } },
  // 领地系统页的新建按钮：territory-systems.hbs:9  title="Create item"（小写 i）
  // ALIENRPG.CreateItemTitle 已存在（en='Create Item'，cn='新建物品'）却没被引用。
  { selector: 'a.item-control.item-create[title]', attr: 'title', from: 'Create item', to: { key: 'ALIENRPG.CreateItemTitle' } },
];

/**
 * @DRAW / @TEXTDRAW 富文本增强器写死的 data-tooltip 前缀。
 * systems/alienrpg/module/helpers/enricher.mjs:16 与 :34（两个增强器各一份）：
 *     `Draw from ${tableName}. <br> ${localize("ALIENRPG.dialog.Tooltip-Rollontable")}`
 * 后半截已经是译文，前半截 "Draw from X. " 是英文 —— 一句话里中英夹杂。
 * 这个元素会出现在日志页、聊天卡、物品卡里，所以它的 scope 不能限定在
 * `.alienrpg`；收窄靠的是 `span.draw-from-table` 这个**系统自有类名**加上
 * 带锚点的正则。改的是 tooltip 文案，data-uuid / data-roll 一个字不碰。
 */
const DRAW_TOOLTIP_RULE = {
  selector: 'span.draw-from-table[data-tooltip]',
  attr: 'data-tooltip',
  pattern: /^Draw from ([\s\S]*)\. <br> ([\s\S]*)$/,
  replace: (m) => `从 ${m[1]} 抽取。<br> ${m[2]}`,
  site: 'systems/alienrpg/module/helpers/enricher.mjs:16,34',
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * 通道 D —— ui.notifications 垫片（**只**给模板字符串用）
 * ══════════════════════════════════════════════════════════════════════
 * 静态字面量已经被通道 A 接走（见文件头 :121 那条发现），这里只剩三条**每次内容
 * 都不同**、通道 A 结构上够不到的：
 *
 *   1. systems/alienrpg/module/alienrpg.mjs:559  rollItemMacro()
 *        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
 *   2. systems/alienrpg/module/apps/init.mjs:170  ReImport()
 *        `Re-Import Completed Created ${created} Assets`
 *   3. systems/alienrpg/module/helpers/logger.mjs:19  logger.error()
 *        `${COMMON?.DATA?.title || ""} | ERROR | ${args[0]}`
 *        COMMON.DATA.title 在 module/helpers/common.mjs:12 是常量 "Alien RPG - Core System"。
 *
 * ⚠ 这是本文件唯一一处**全局钩子**（垫片挂在 ui.notifications 实例上，别的模块
 *   发的通知也会流经它）。上一个项目正是在这种位置翻过车：一条为自己写的**子串**
 *   正则把别的模块的 'Mirror Image does not exist!' 改成了 '镜子 Image 不存在！'。
 *   本表的三条纪律，逐条对着那次事故写的：
 *     · 全部是 `^…$` **整串**锚定正则 —— 不做子串替换，匹配不上就原样放行；
 *     · 第 3 条的锚点是**系统自己的标题常量**，别的包结构上产生不出来；
 *     · 第 1、2 条的英文原文若真被别的包一字不差地发出来，那句话的中文译文
 *       对它**也是对的** —— 整串相等的失效形态和子串替换根本不是一回事。
 *   垫片对非字符串（Error 对象）原样透传：notifications.mjs:109-110 会先做
 *   `message instanceof Error ? message : null` 再 String()，我们在它之前放行。
 *
 * 装载时机：`ready`。`ui.notifications` 是 client/game.mjs:764 的 initializeUI()
 * 里才 `new` 出来的（:740 setup 之后、:779 ready 之前），所以 ready 是能拿到实例的
 * 最早的钩子。残留窗口：ready 阶段系统自己的 ready 监听器若先跑并触发
 * logger.error，那一条会漏英文 —— 已知且可接受，不值得为它去改原型。
 */
const NOTIFICATION_PATTERNS = [
  {
    pattern: /^Could not find item ([\s\S]+)\. You may need to delete and recreate this macro\.$/,
    replace: (m) => `未找到物品 ${m[1]}。可能需要删除并重新创建这个宏。`,
    site: 'systems/alienrpg/module/alienrpg.mjs:559',
  },
  {
    pattern: /^Re-Import Completed Created (\d+) Assets$/,
    replace: (m) => `重新导入完成，共创建 ${m[1]} 项资源`,
    site: 'systems/alienrpg/module/apps/init.mjs:170',
  },
  {
    pattern: /^Alien RPG - Core System \| ERROR \| ([\s\S]*)$/,
    replace: (m) => `异形 RPG - 核心系统 | 错误 | ${m[1]}`,
    site: 'systems/alienrpg/module/helpers/logger.mjs:19 (title 常量在 helpers/common.mjs:12)',
  },
];

/**
 * ══════════════════════════════════════════════════════════════════════
 * 通道 E —— 文档创建前改写（preCreateChatMessage / preCreateItem）
 * ══════════════════════════════════════════════════════════════════════
 * 这些英文是**写进文档**的，不是渲染时拼的，所以只能在落库前拦。
 * 每条都带一个额外的结构锚点（flag / speaker / 文档类型），不是光靠文本匹配。
 */

/** preCreateChatMessage 规则。 */
const CHAT_RULES = [
  {
    id: 'devmsg-alias',
    // systems/alienrpg/module/devmsg.js:24
    //   speaker: ChatMessage.getSpeaker({ alias: "Alien RPG News" })
    // devmsg.js 在活跃引用图里（alienrpg.mjs:11 `import { sendDevMessage } from "./devmsg.js"`）。
    // alias **不**过 localize（ChatMessage 直接渲染 speaker.alias），所以通道 A 无效。
    // 2026-08-29 发现：上一轮 i18n 面盘点只扫了 62 个 .mjs，12 个 .js 一个没扫。
    match: (data) => data?.speaker?.alias === 'Alien RPG News',
    apply: (data, update) => {
      update['speaker.alias'] = '异形 RPG 快讯';
    },
    site: 'systems/alienrpg/module/devmsg.js:24',
  },
  {
    id: 'panic-over',
    // systems/alienrpg/module/documents/actor.mjs:1589  checkAndEndPanic()
    //   ChatMessage.create({ speaker: {actor}, content: "Panic is over" })
    // 整串相等，不做子串。
    match: (data) => data?.content === 'Panic is over',
    apply: (data, update) => {
      update.content = '恐慌结束';
    },
    site: 'systems/alienrpg/module/documents/actor.mjs:1589',
  },
  {
    id: 'initiative-flavor',
    // systems/alienrpg/module/helpers/combat.mjs:91 与 :130
    //   flavor: `${combatant.token.name} rolls for Initiative! <br> ${cardPath}`
    //   flavor: `${combatant.token.name} rolls for Initiative! <br> `
    // 双重锚点：① flags.core.initiativeRoll === true（combat.mjs:92/:131 自己设的）；
    //           ② 必须带那个 ' <br> ' —— core 自己的先攻消息用的是
    //              localize("COMBAT.RollsInitiative")，结构上产生不出这个形状。
    match: (data) =>
      data?.flags?.core?.initiativeRoll === true &&
      typeof data?.flavor === 'string' &&
      /^([\s\S]*?) rolls for Initiative! <br> ([\s\S]*)$/.test(data.flavor),
    apply: (data, update) => {
      const m = data.flavor.match(/^([\s\S]*?) rolls for Initiative! <br> ([\s\S]*)$/);
      update.flavor = `${m[1]} 掷先攻！<br> ${m[2]}`;
    },
    site: 'systems/alienrpg/module/helpers/combat.mjs:91,130',
  },
  {
    id: 'push-button-title',
    // systems/alienrpg/module/helpers/YZEDiceRoller.mjs:389
    //   `<button class="alien-Push-button" title="PUSH Roll?">` + localize("ALIENRPG.Push") + "</button>"
    // 按钮文字已经是译文，只有 title 是英文。锚点是系统自有类名 alien-Push-button，
    // 且要求 title 属性紧跟其后、逐字节相同。
    // 术语：glossary_alien.json 的 Push = 追骰。
    match: (data) => typeof data?.content === 'string' && data.content.includes('class="alien-Push-button" title="PUSH Roll?"'),
    apply: (data, update) => {
      update.content = data.content.replaceAll(
        'class="alien-Push-button" title="PUSH Roll?"',
        'class="alien-Push-button" title="要追骰吗？"'
      );
    },
    site: 'systems/alienrpg/module/helpers/YZEDiceRoller.mjs:389',
  },
  {
    id: 'crit-medaid-glue',
    // systems/alienrpg/module/documents/actor.mjs:1909 / :1915
    //   speanex += "<br> -1 to <strong>" + localize("ALIENRPG.SkillmedicalAid") + "</strong> roll";
    // 中间那个技能名是译文，两侧的 ' to ' 与 ' roll' 是英文 —— 中文世界里这一行
    // 长成「<br> -1 to <strong>医疗</strong> roll」。
    // speanex 同时进两处：:2058 写进 critical-injury 物品的 system.attributes.effects，
    //                      :2085 进 htmlData.effects -> chat/crit-roll-character.hbs:29。
    // 所以聊天卡与物品**两条路都要拦**（物品那条见 ITEM_RULES）。
    match: (data) => typeof data?.content === 'string' && CRIT_GLUE_RE.test(data.content),
    apply: (data, update) => {
      update.content = rewriteCritGlue(data.content);
    },
    site: 'systems/alienrpg/module/documents/actor.mjs:1909,1915',
  },
];

/** 只匹配「<br> -N to <strong>…</strong> roll」这一个形状，N 只能是 1 或 2。 */
const CRIT_GLUE_RE = /<br> -([12]) to <strong>([\s\S]*?)<\/strong> roll/;
const CRIT_GLUE_RE_G = /<br> -([12]) to <strong>([\s\S]*?)<\/strong> roll/g;
function rewriteCritGlue(text) {
  return text.replace(CRIT_GLUE_RE_G, (_all, n, skill) => `<br> <strong>${skill}</strong>检定 -${n}`);
}

/** preCreateItem 规则。 */
const ITEM_RULES = [
  {
    id: 'crit-injury-effects-glue',
    // systems/alienrpg/module/documents/actor.mjs:2050-2068 的 rollData
    //   { type: "critical-injury", …, "system.attributes.effects": speanex }
    // 双锚点：文档类型必须是 critical-injury，且 effects 必须命中那个形状。
    match: (data) => data?.type === 'critical-injury' && typeof data?.system?.attributes?.effects === 'string' && CRIT_GLUE_RE.test(data.system.attributes.effects),
    apply: (data, update) => {
      update['system.attributes.effects'] = rewriteCritGlue(data.system.attributes.effects);
    },
    site: 'systems/alienrpg/module/documents/actor.mjs:2058',
  },
];

const MODULE_ID = 'alienrpg-cn';
const SYSTEM_ID = 'alienrpg';
/** 本模块只负责 lang === 'cn'。zh-tw 有系统自带的 zh-tw.json，不归我们管。 */
const TARGET_LANG = 'cn';

/**
 * 钩子注册入口。
 *
 * 在 Foundry 里 `HOOKS === globalThis.Hooks`，行为与直接写 `Hooks.on(...)` 完全一样。
 * 之所以绕这一层：4-常用脚本/qa/test_hardcoded_patch.mjs 要在**裸 node 子进程**里
 * `import()` 本文件，直接跑出货的那几个函数（translateNotification / applyDocRules /
 * rewriteCritGlue）做正反例测试。裸 node 里没有 `Hooks` 这个全局，模块顶层的
 * `Hooks.on(...)` 会当场 ReferenceError，测试就只能去测一份**抄过来的副本** ——
 * 那种测试测的是副本，不是出货代码，等于没测。空实现让 import 在 node 下静默通过，
 * 而在 Foundry 里这一行取到的就是真的 Hooks。
 */
const HOOKS = globalThis.Hooks ?? { on() {}, once() {} };

/* ------------------------------------------------------------------ *
 * 判据
 * ------------------------------------------------------------------ */

/** 系统对不对。`game.system` 在 init 之前就装配好了（client/game.mjs:617-630 setupPackages()）。 */
function systemOk() {
  return globalThis.game?.system?.id === SYSTEM_ID;
}

/**
 * 语言对不对。
 *
 * ⚠ **`init` 阶段读 `game.i18n.lang` 是错的**，这条 2026-08-29 逐行推导过：
 *   client/helpers/localization.mjs:10-19  constructor(serverLanguage)
 *       const [defaultLanguage] = (serverLanguage || "en.core").split(".");
 *       this.lang = defaultLanguage;                 <- 这是**服务器默认语言**
 *   :79-87 `initialize()` 里才去读世界/客户端的实际设置：
 *       :80  const clientLanguage = await game.settings.get("core", "language") || this.lang;
 *       :87  await this.setLanguage(clientLanguage || this.lang);
 *   :226-237 `setLanguage()` 的 **:231** 才 `this.lang = lang;`
 *   而 `initialize()` 是 client/game.mjs:663 调的，在 :652 的 `callAll("init")` **之后**。
 *   ⇒ `init` 阶段拿到的是服务器默认语言，中文世界里可能读成 'en'（漏做），
 *     英文世界里也可能读成 'cn'（误做）。两个方向都会错。
 *   ⇒ 所以本文件所有需要语言判据的动作都挂在 **`i18nInit` 或更晚**，
 *     那时 `setLanguage()` 已经跑过（callAll("i18nInit") 在 :104，是
 *     `initialize()` 的最后一句）。
 *   同理也不能在 `init` 里 `game.settings.get("core","language")` 兜底 ——
 *   core 的设置是 game.mjs:660 `registerSettings()` 注册的，同样在 init 之后，
 *   提前取会抛「not a registered game setting」。
 */
function langOk() {
  return globalThis.game?.i18n?.lang === TARGET_LANG;
}

function enabled() {
  return systemOk() && langOk();
}

/** LITERAL_LABELS 的值可以是字符串，也可以是 {key, fallback, requires}。 */
function resolveLiteral(value) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;
  if (value.requires && !globalThis.game?.modules?.get(value.requires)?.active) return null;
  if (value.key && globalThis.game?.i18n?.has(value.key, false)) return globalThis.game.i18n.localize(value.key);
  return value.fallback ?? null;
}

/** DOM 规则的 `to` 可以是字符串，也可以是 {key, suffix}。 */
function resolveTo(to) {
  if (typeof to === 'string') return to;
  if (!to || typeof to !== 'object' || !to.key) return null;
  const base = globalThis.game?.i18n?.localize(to.key);
  if (base === to.key) return null; // 键不存在时别把 key 名写进界面
  return base + (to.suffix ?? '');
}

/* ------------------------------------------------------------------ *
 * 通道 A + A′ —— i18nInit
 * ------------------------------------------------------------------ */

/**
 * ⚠ 已核对：`i18nInit` 在 `init` **之后**触发。
 *   client/game.mjs:648-676 `Game#initialize()` 的实际顺序是
 *       :652  Hooks.callAll("init");
 *       :660  this.registerSettings();
 *       :663  await this.i18n.initialize();     <- 这里面才 callAll("i18nInit")
 *   而 `i18nInit` 本身在 client/helpers/localization.mjs:104。
 *   也就是说 **`init` 阶段 `game.i18n.translations` 还没建好**；`i18nInit` 是
 *   译文表建好后最早的一个钩子，也是**系统自己的 init 监听器已经跑完**之后的
 *   第一个钩子 —— 通道 A′ 要改的 `game.settings.menus` 正是在系统的 init 里
 *   （init.mjs:22-45）填好的，所以这里一定拿得到。
 *
 * 之所以够早：设置 / 按键 / 场景控件的 name·hint·title 都是**渲染时**才 localize 的。
 */
HOOKS.once('i18nInit', () => {
  if (!enabled()) return;
  const translations = game.i18n?.translations;
  if (!translations) return;

  // ── 通道 A ──────────────────────────────────────────────────────────
  let added = 0;
  const skipped = [];
  for (const [key, raw] of Object.entries(LITERAL_LABELS)) {
    // 顶层键是全局的：别人已经定义过就让给别人。
    if (typeof translations[key] === 'string') {
      skipped.push(key);
      continue;
    }
    const value = resolveLiteral(raw);
    if (value === null) continue; // requires 未装 / 目标键不存在 / 没有 fallback
    translations[key] = value;
    added += 1;
  }
  if (added) console.log(`${MODULE_ID} | 已注入 ${added} 条系统写死串的顶层 i18n 键`);
  if (skipped.length) {
    console.warn(`${MODULE_ID} | 以下顶层键已被别的包定义，已让出：${skipped.join(', ')}`);
  }

  // ── 通道 A′ ─────────────────────────────────────────────────────────
  for (const [menuKey, fields] of Object.entries(SETTINGS_MENU_RETARGET)) {
    const menu = game.settings?.menus?.get(menuKey);
    if (!menu) continue;
    for (const [field, { expect, key }] of Object.entries(fields)) {
      if (menu[field] !== expect) {
        // 上游改了文案 / 自己换成 i18n 键了 —— 保险丝熔断，什么都不做。
        console.warn(
          `${MODULE_ID} | 设置菜单 ${menuKey}.${field} 与预期的英文原文不符，已跳过改指向。` +
            ` 期望 ${JSON.stringify(expect)}，实际 ${JSON.stringify(menu[field])}`
        );
        continue;
      }
      if (!game.i18n.has(key, false)) {
        console.warn(`${MODULE_ID} | 设置菜单 ${menuKey}.${field} 的目标键 ${key} 不存在，已跳过`);
        continue;
      }
      menu[field] = key;
    }
  }
});

/* ------------------------------------------------------------------ *
 * 通道 B —— 抢注模板
 * ------------------------------------------------------------------ */

/**
 * 译文模板是**真实文件**（1-系统汉化插件/templates/alienrpg/…），不是内联字符串，
 * 所以要先 fetch 再编译。取回后用与 core 完全一致的编译选项：
 *   client/applications/handlebars.mjs:41
 *       Handlebars.compile(resp.html, {preventIndent: true})
 * 少了 preventIndent，我们这份 partial 被 `{{> …}}` 内联时会按缩进重排。
 *
 * ── 为什么挂在 `i18nInit` 而不是 `init` ──────────────────────────────
 * 骨架阶段这一段写的是 `init`，那是**错的**：见 langOk() 上方那段推导 ——
 * `init` 阶段 `game.i18n.lang` 还是服务器默认语言，中文世界里可能读成 'en'
 * 而整份不抢注（静默漏做），英文世界里可能读成 'cn' 而把英文界面改成中文
 * （静默误做）。`i18nInit` 是 `setLanguage()` 之后最早的钩子，两个方向都对。
 *
 * 够不够早：`getTemplate` 只在**首次渲染那份模板**时才查 Handlebars.partials，
 * 而上游那两张卡（creature / planet）都要用户点开 Actor 才渲染；
 * client/game.mjs:764 的 initializeUI() 只渲染 core 自己的几个单例。
 * i18nInit(:663) → setup(:740) → ready(:779) 这一整段都在用户点开之前。
 * 退一万步：真没赶上，getTemplate 就照常去服务器取上游英文原件 ——
 * 退化成**不翻译**，不报错、不白屏。所以最坏情况是可接受的。
 */
let templatePromise = null;

async function installTemplateOverrides() {
  const entries = Object.entries(TEMPLATE_OVERRIDES);
  let ok = 0;
  for (const [upstreamPath, ourPath] of entries) {
    try {
      const resp = await fetch(foundry.utils.getRoute(ourPath));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const source = await resp.text();
      Handlebars.registerPartial(upstreamPath, Handlebars.compile(source, { preventIndent: true }));
      ok += 1;
    } catch (err) {
      console.error(`${MODULE_ID} | 抢注模板失败：${upstreamPath} <- ${ourPath}`, err);
    }
  }
  if (ok) console.log(`${MODULE_ID} | 已抢注 ${ok}/${entries.length} 份汉化模板`);
  return ok;
}

HOOKS.once('i18nInit', () => {
  if (!enabled() || !Object.keys(TEMPLATE_OVERRIDES).length) return;
  templatePromise = installTemplateOverrides();
});

// 不阻塞 i18nInit（core 不 await 钩子回调），但在 setup 这个天然的同步点等一次，
// 让「抢注失败」的错误日志一定出现在用户点开任何卡之前。
HOOKS.once('setup', async () => {
  if (templatePromise) await templatePromise;
});

/* ------------------------------------------------------------------ *
 * 通道 C —— DOM
 * ------------------------------------------------------------------ */

HOOKS.on('renderApplicationV2', (_app, element) => {
  if (!enabled()) return;
  applyDom(element);
});

// appv1（系统设置面板 AlienConfig 是 FormApplication；CBTracker 的换先攻框是 Dialog）。
//
// ⚠ 2026-08-29 对抗复核纠正：`html` **不恒等于窗体根元素**，原来的 `html?.[0] ?? html`
//   在一整类情形下取到的是残缺的子树。逐行推导（client/appv1/api/application-v1.mjs）：
//     :421  `const inner = await this._renderInner(data); let html = inner;`
//     :425  元素已在 DOM 里（**重渲染**）-> `this._replaceHTML(element, html)`，html 仍 = inner
//     :431-434 首次渲染且 popOut -> `html = await this._renderOuter()`，这时才是外层窗体
//     :459  `this._callHooks("render", html, data)`
//   而 `_renderInner` 返回 `$(templateHtml)` —— **模板有几个根元素，jQuery 就有几项**。
//   core 的 templates/hud/dialog.html 恰好是**两个**根（`.dialog-content` 与 `.dialog-buttons`），
//   所以任何 Dialog 一旦重渲染，`html[0]` 只是 `.dialog-content`，**按钮整块不在我们的 root 里**，
//   规则静默失效。取 `app.element`（同文件 :274-278，恒为外层窗体的 jQuery）才两种情形都对。
HOOKS.on('renderApplication', (app, html) => {
  if (!enabled()) return;
  applyDom(app?.element?.[0] ?? html?.[0] ?? html);
});

// 聊天卡里的 @DRAW / @TEXTDRAW 增强器元素。
HOOKS.on('renderChatMessageHTML', (_msg, element) => {
  if (!enabled()) return;
  applyAttrRule(element, DRAW_TOOLTIP_RULE);
});

function applyDom(root) {
  if (!root?.querySelectorAll) return;

  for (const rule of DOM_TEXT_REPLACEMENTS) {
    if (rule.panelOnly) continue;
    const scope = rule.scope === undefined ? '.alienrpg' : rule.scope;
    if (scope && !matchesScope(root, scope)) continue;
    if (rule.contains && !root.querySelector(rule.contains)) continue;
    const to = resolveTo(rule.to);
    if (to === null || to === rule.from) continue;
    for (const el of root.querySelectorAll(rule.selector)) replaceTextNode(el, rule.from, to);
  }

  for (const rule of DOM_ATTR_REPLACEMENTS) {
    const scope = rule.scope === undefined ? '.alienrpg' : rule.scope;
    if (scope && !matchesScope(root, scope)) continue;
    if (rule.contains && !root.querySelector(rule.contains)) continue;
    const to = resolveTo(rule.to);
    if (to === null || to === rule.from) continue;
    for (const el of root.querySelectorAll(rule.selector)) {
      if (el.getAttribute(rule.attr) === rule.from) el.setAttribute(rule.attr, to);
    }
  }

  applyAttrRule(root, DRAW_TOOLTIP_RULE);
  attachPanelObservers(root);
}

/** 宿主应用是不是我们的目标 —— 元素自身带类，或者祖先带类（appv1 的 html 是内层 form）。 */
function matchesScope(root, scope) {
  if (typeof root.matches === 'function' && root.matches(scope)) return true;
  return typeof root.closest === 'function' && !!root.closest(scope);
}

function replaceTextNode(el, from, to) {
  for (const node of el.childNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    if (node.nodeValue.trim() !== from) continue;
    // ⚠ 用函数替换体，不用字符串替换体：`to` 可能来自 lang 值（resolveTo 的 {key} 形式），
    //   而 String#replace 的字符串替换体会把 `$&` / `$'` / `` $` `` / `$1` 当成转义序列。
    //   将来某个译名里带一个 `$`，写字符串体就会在界面上凭空多出一段原文。
    node.nodeValue = node.nodeValue.replace(from, () => to);
  }
}

/** 带 ^…$ 锚点的属性正则规则（目前只有 @DRAW 的 tooltip 一条）。 */
function applyAttrRule(root, rule) {
  if (!root?.querySelectorAll) return;
  for (const el of root.querySelectorAll(rule.selector)) {
    const current = el.getAttribute(rule.attr);
    if (typeof current !== 'string') continue;
    const m = current.match(rule.pattern);
    if (!m) continue;
    el.setAttribute(rule.attr, rule.replace(m));
  }
}

/**
 * 炫技面板（#panel）的内容是**点击之后**才写进去的，render 钩子抓不到。
 * 给每个 #panel 挂一个只看 childList 的 MutationObserver，元素被换掉时
 * observer 随元素一起被回收（WeakSet 只做防重复挂载）。
 * 观察面 = 单个 #panel 的直接子节点，这已经是能做到的最小面。
 */
const observedPanels = new WeakSet();
const PANEL_RULES = DOM_TEXT_REPLACEMENTS.filter((r) => r.panelOnly);

function attachPanelObservers(root) {
  if (!PANEL_RULES.length || !root?.querySelectorAll) return;
  if (!matchesScope(root, '.alienrpg')) return;
  for (const panel of root.querySelectorAll('#panel')) {
    if (observedPanels.has(panel)) continue;
    observedPanels.add(panel);
    const observer = new MutationObserver(() => {
      for (const rule of PANEL_RULES) {
        const to = resolveTo(rule.to);
        if (to === null || to === rule.from) continue;
        for (const el of panel.querySelectorAll(rule.selector)) replaceTextNode(el, rule.from, to);
      }
    });
    observer.observe(panel, { childList: true });
  }
}

/* ------------------------------------------------------------------ *
 * 暂停横幅
 * ------------------------------------------------------------------ */

/**
 * systems/alienrpg/module/alienrpg.mjs:361-364
 *   Hooks.on("renderGamePause", …) { document.getElementById("pause").innerHTML =
 *     `<img …><figcaption>GAME PAUSED</figcaption>`; }
 * 它把 core 已经译好的暂停横幅整块覆盖掉（core 的键是 GAME.Paused，
 * foundry_chn 里译作「游戏暂停」）。
 *
 * 不去赌钩子顺序：`queueMicrotask` 排在整轮 Hooks.callAll **之后**执行，
 * 无论系统的监听器注册在我们前面还是后面，我们都最后落笔。
 * 只改 figcaption 的文本，img 与 class 一个字不碰。
 */
HOOKS.on('renderGamePause', () => {
  if (!enabled()) return;
  queueMicrotask(() => {
    const caption = document.getElementById('pause')?.querySelector('figcaption');
    if (!caption || caption.textContent.trim() !== 'GAME PAUSED') return;
    const translated = game.i18n.localize('GAME.Paused');
    if (translated === 'GAME.Paused') return; // core 侧没有译文就别动
    caption.textContent = translated;
  });
});

/* ------------------------------------------------------------------ *
 * 通道 D —— ui.notifications 垫片
 * ------------------------------------------------------------------ */

HOOKS.once('ready', () => {
  if (!enabled() || !NOTIFICATION_PATTERNS.length) return;
  patchNotifications();
});

/**
 * 包一层 ui.notifications.notify —— info / warn / error / success 四个便捷方法
 * 在 Foundry 内部都转调 notify，所以只需包这一个入口。已核对：
 *   client/applications/ui/notifications.mjs:151-152 info    -> this.notify(m,"info",o)
 *                                            :164-165 warn    -> this.notify(m,"warning",o)
 *                                            :177-178 error   -> this.notify(m,"error",o)
 *                                            :190-191 success -> this.notify(m,"success",o)
 * 非字符串（Error 对象）原样透传；一条都匹配不上也原样透传，绝不吞消息。
 * 包过一次就不再包（热重载 / 双重加载防呆）。
 */
// ⚠ 2026-08-29 对抗复核修正：本文件与 plugins-hardcoded-cn.mjs 原来用的是**同一个**
//   哨兵属性名 `__alienCnPatched`。两份垫片都挂在 `ready`，而 module.json 的 esmodules
//   顺序把本文件排在插件那份**之前** —— 于是本文件先包上并盖章，插件那份看见图章就
//   `return`，**一条插件译文都不生效，且完全静默**。今天之所以没暴露，只是因为插件那份
//   的 NOTIFICATION_TEXT 还是空表（空表时它自己就不调 patchNotifications）。
//   改法：哨兵按文件区分，且**允许链式叠加** —— 后一层包在前一层外面，两层都生效。
const NOTIFY_FLAG = '__alienrpgCnNotifyPatched';

function patchNotifications() {
  const bus = ui?.notifications;
  if (!bus || typeof bus.notify !== 'function' || bus.notify[NOTIFY_FLAG]) return;

  const original = bus.notify.bind(bus);
  const wrapped = function alienrpgCnNotify(message, ...rest) {
    return original(translateNotification(message), ...rest);
  };
  wrapped[NOTIFY_FLAG] = true;
  // 继承下层已有的图章，这样两份文件互不遮蔽、也各自防重复包装。
  for (const k of Object.getOwnPropertyNames(bus.notify)) {
    if (k.startsWith('__') && k.endsWith('Patched')) wrapped[k] = true;
  }
  bus.notify = wrapped;
  console.log(`${MODULE_ID} | 已装载通知垫片（${NOTIFICATION_PATTERNS.length} 条整串锚定规则）`);
}

/** 导出给 QA 用：4-常用脚本/qa/test_hardcoded_patch.mjs 直接跑这个函数。 */
export function translateNotification(message) {
  if (typeof message !== 'string') return message;
  for (const { pattern, replace } of NOTIFICATION_PATTERNS) {
    const m = message.match(pattern);
    if (m) return replace(m);
  }
  return message;
}

/* ------------------------------------------------------------------ *
 * 通道 E —— preCreate 拦截
 * ------------------------------------------------------------------ */

HOOKS.on('preCreateChatMessage', (doc, data) => {
  if (!enabled()) return;
  const update = applyDocRules(CHAT_RULES, data);
  if (update) doc.updateSource(update);
});

HOOKS.on('preCreateItem', (doc, data) => {
  if (!enabled()) return;
  const update = applyDocRules(ITEM_RULES, data);
  if (update) doc.updateSource(update);
});

/** 导出给 QA 用。返回 null 表示一条都没命中（调用方就什么都不做）。 */
export function applyDocRules(rules, data) {
  const update = {};
  for (const rule of rules) {
    let hit = false;
    try {
      hit = rule.match(data);
    } catch {
      hit = false;
    }
    if (hit) rule.apply(data, update);
  }
  return Object.keys(update).length ? update : null;
}

/* ------------------------------------------------------------------ *
 * 通道 F —— 世界集合 getName 的**译名回退垫片**
 *
 * 解冻 `"MU/TH/ER Instructions."`。
 *
 * 为什么它本来是 T-FROZEN：alienrpg 4.1.13 有 6 处 `game.journal.getName(...)`
 * 拿这一串去查世界里的日志文档，其中 **4 处不做空检查**就解引用：
 *   systems/alienrpg/module/apps/init.mjs:81   FirstTimeSetup()                     .show()
 *   systems/alienrpg/module/apps/init.mjs:107  ModuleImport() 的 importAdventure 钩子  .show()
 *   systems/alienrpg/module/alienrpg.mjs:592   showReleaseNotes()                   .id
 *   systems/alienrpg/module/apps/migratefolders.js:120  allDone()                    .show()
 *     （migratefolders.js 整份是死文件 —— init.mjs:2 的 import 被注释掉了。
 *       但它随时可能被上游接回来，所以照样算进爆炸半径。）
 * 另外 2 处：alienrpg.mjs:574 有显式 `!== null && !== undefined` 守卫；
 * alienrpg.mjs:613 的结果紧接着在 :614 被 `.setFlag()`，其实也是裸解引用。
 * 把包里的日志名译成中文 -> 这些 getName 全部返回 undefined -> 首次开世界就抛，
 * 而且 showReleaseNotes 的 catch 是**空的**（alienrpg.mjs:618），静默到底。
 *
 * 为什么现在可以解冻：冻结的根因不是「名字不能变」，是「查找按英文名走」。
 * 我们自己就拿着运行时补丁通道，把查找补上一条**译名回退**即可 ——
 *   原查找命中  -> 原样返回，垫片**完全不介入**（英文世界、旧世界都不受影响）；
 *   原查找落空且参数**逐字节等于**那一串 -> 用译名再查一次。
 * 于是上游那几处裸解引用拿到的仍是一个真文档，一行上游代码都不用改。
 *
 * ⚠ 依赖关系是**双向**的：这个垫片一旦被删，
 *   `1-系统汉化插件/compendium/cn/alienrpg.alien-rpg-system.json` 里的
 *   `entries["Alien RPG System"].journals[…].name` 必须同时改回英文原串，
 *   否则首次开世界就炸。7-其他内容/DO-NOT-TRANSLATE.json 的
 *   `system.welcomeJournalEntry` / `system.releaseNoteName` 两条把这条依赖写死了。
 *
 * 装在哪：**只装在 `game.journal` 这一个实例上**，不动
 * `foundry.utils.Collection.prototype.getName`（common/utils/collection.mjs:134）——
 * 那是全局的，`game.actors` / `game.items` / 每一个 CompendiumCollection 都会跟着被包，
 * 爆炸半径大到没法论证。实例上挂一个**不可枚举**的自有属性即可遮蔽原型方法。
 *
 * 装在什么时候：`setup`。逐行核对过 client/game.mjs：
 *   :730  this.initializeDocuments();   <- `game.journal` 在这里才被造出来
 *   :740  Hooks.callAll("setup");       <- 所以 setup 是最早能拿到集合的钩子
 *   :779  Hooks.callAll("ready");       <- 系统那几处活的调用全在 ready 里
 * `i18nInit`（:663）太早，那时 `game.journal` 还是 undefined；而 `ready` 太晚 ——
 * esmodule 的装载顺序是 system 先于 module，系统的 `Hooks.once("ready")` 注册在
 * 我们之前，同一轮里会**先**跑到 FirstTimeSetup()。setup 早于整个 ready 轮，稳。
 *
 * ⚠ 哨兵名必须**唯一**：本文件与 plugins-hardcoded-cn.mjs 曾共用 `__alienCnPatched`，
 *   后装的那份看见图章就静默 return，一条译文都不生效。这里用专属名。
 * ------------------------------------------------------------------ */

/**
 * 被解冻的那一串，以及它的译名。
 *
 * ⚑ LOCKSTEP：`cn` 必须与 compendium/cn/alienrpg.alien-rpg-system.json 里
 *   `journals["MU/TH/ER Instructions."].name` 及其唯一一页的 `name` **逐字节相等**。
 *   adversarial_hardcoded_patch.mjs 的 S 组机械比对这一条。
 * ⚠ `MU/TH/ER` 这个词元保持 ASCII：它是船载电脑的名字，MU-TH-UR 插件里也这么写。
 */
const NAME_FALLBACKS = {
  journal: [
    { en: 'MU/TH/ER Instructions.', cn: 'MU/TH/ER 使用说明' },
    // ── alien-evolved-starterset 的欢迎日志 ──
    // init.js:121 与 :152 做 game.journal.getName(...).show()，**无守卫**。
    // 译了名字而没有这条回退，startImport() 会在 createThumbs() 与写设置**之后**抛，
    // 于是模块看着像导入成功了、但「如何使用」日志永远不弹，
    // 且 Hooks.off('importAdventure') 永不执行 —— 那个钩子会在本次会话余下时间里
    // 对任何后续 Adventure 导入重复触发。
    // ⚑ LOCKSTEP：`cn` 必须与 2-新手包汉化插件/compendium/cn 里该日志的 `name` 逐字节相等。
    { en: 'STARTER SET - HOW TO USE THIS MODULE', cn: '新手包 - 如何使用本模块' },
  ],
};

/** 专属哨兵，与 NOTIFY_FLAG 及 plugins-hardcoded-cn.mjs 的任何图章都不同名。 */
const GETNAME_FLAG = '__alienrpgCnGetNamePatched';

/**
 * 给一个 DocumentCollection 装上译名回退。
 *
 * @param {object} collection  通常是 `game.journal`
 * @param {Array<{en:string,cn:string}>} pairs
 * @returns {boolean} 真的装上了才返回 true（没门 / 没集合 / 已装过都返回 false）
 */
export function installNameFallback(collection, pairs) {
  if (!enabled()) return false;
  if (!collection || typeof collection.getName !== 'function') return false;
  if (!Array.isArray(pairs) || !pairs.length) return false;
  if (collection.getName[GETNAME_FLAG]) return false; // 已经装过（热重载 / 双重加载）

  // 原方法住在原型链上（common/utils/collection.mjs:134）。如果**别人**已经在实例上
  // 挂了自有属性，就调他那一层；否则每次都从原型上现取 —— 这样别人之后再补原型，
  // 我们也照样调得到他的新实现，不会把他挤掉。
  const ownGetName = Object.getOwnPropertyDescriptor(collection, 'getName')?.value ?? null;
  const proto = Object.getPrototypeOf(collection);
  const callOriginal = (self, name, options) =>
    (ownGetName ?? proto.getName).call(self, name, options);

  const wrapped = function alienrpgCnGetName(name, options) {
    // `strict: true` 会让原方法在查不到时**抛异常**（collection.mjs:135-138）。
    // 先按 strict:false 查一遍，回退也失败了再把原 options 交回去，让上游抛它自己的错。
    const strict = options?.strict === true;
    const soft = strict ? { ...options, strict: false } : options;

    const found = callOriginal(this, name, soft);
    if (found !== undefined && found !== null) return found; // 原查找命中 -> 绝不介入

    if (typeof name === 'string') {
      for (const { en, cn } of pairs) {
        if (name !== en) continue; // 逐字节相等才动，别的名字一律透传
        const alt = callOriginal(this, cn, soft);
        if (alt !== undefined && alt !== null) return alt;
        break;
      }
    }

    if (strict) return callOriginal(this, name, options); // 让上游抛它自己那条错
    return found;
  };
  wrapped[GETNAME_FLAG] = true;

  Object.defineProperty(collection, 'getName', {
    value: wrapped,
    writable: true,
    configurable: true,
    enumerable: false, // 集合会被遍历/序列化，别在自有可枚举键里多出一个方法
  });
  console.log(`${MODULE_ID} | 已装载 getName 译名回退（${pairs.length} 条）`);
  return true;
}

HOOKS.once('setup', () => {
  installNameFallback(globalThis.game?.journal, NAME_FALLBACKS.journal);
});

/* ------------------------------------------------------------------ *
 * QA 导出面
 * ------------------------------------------------------------------ */

export const __TEST__ = {
  NOTIFY_FLAG,
  GETNAME_FLAG,
  NAME_FALLBACKS,
  LITERAL_LABELS,
  SETTINGS_MENU_RETARGET,
  TEMPLATE_OVERRIDES,
  DOM_TEXT_REPLACEMENTS,
  DOM_ATTR_REPLACEMENTS,
  DRAW_TOOLTIP_RULE,
  NOTIFICATION_PATTERNS,
  CHAT_RULES,
  ITEM_RULES,
  rewriteCritGlue,
  translateNotification,
  applyDocRules,
  installNameFallback,
};
