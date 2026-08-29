/**
 * plugins-hardcoded-cn.mjs —— 周边插件侧写死字符串的运行时补丁。
 *
 * 与 alienrpg-hardcoded-cn.mjs 分开放，因为两者的失效条件完全不同：系统那份跟着
 * alienrpg 版本走，这份跟着**五个各自独立升级的插件**走。混在一个文件里，任何一个
 * 插件升级都要整体重读。
 *
 * ══════════════════════════════════════════════════════════════════════
 * 五个插件各走哪条通道（已逐个核对源码，勿凭印象改）
 * ══════════════════════════════════════════════════════════════════════
 * alien-mu-th-ur 2.0.0        lang 文件 + 本文件
 *     lang/en.json 有 275 个键（MUTHUR.* / MOTHER.*），声明了 9 种语言但**没有中文**。
 *     语言侧由本模块 module.json 的 lang/plugins/muthur-cn.json 承担（带
 *     "module": "alien-mu-th-ur" 门控）。本文件只补它写死在 main.js 里的叙事文本。
 *
 * motion_tracker 1.5.5        **只**走 lang 文件，本文件不管
 *     69 个键全部被静态引用，模板 100% 走 {{localize}}，没有写死串。
 *     lang/plugins/motiontracker-cn.json 一份就够。
 *
 * token-action-hud-alien 1.3.0  **什么都不用做**
 *     它的 languages/en.json 是 `{"tokenActionHud":{}}`，0 个键，是有意为之的空壳。
 *     它的所有标签都是 `ALIENRPG.*` 与 `tokenActionHud.*` 两个**外部命名空间**的键，
 *     翻译系统 lang/cn.json 就等于翻译了 HUD。
 *     lang/plugins/tah-alien-cn.json 保留为空文件，作为将来它自己长出键时的落点。
 *
 * terminal 4.0.11             **只**走本文件（通道 A + D + E）
 *     module.json 没有 languages 键，5 个 esmodule 里 `game.i18n` 命中 0，
 *     .hbs 里 `{{localize` 命中 0 —— 给它声明 lang 文件是**没有读者的写入**。
 *     ⚠ 但这**不等于**它够不到 i18n 表：core 自己在渲染设置面板与通知时会拿
 *       英文原文去 localize（见下面通道 A 的推导），所以它的 3 个 config:true
 *       设置项仍然可以用顶层键翻掉，不需要碰它的代码。
 *
 * motion-tracker-multideck 1.0.2  **只**走本文件（通道 A + B + C）
 *     同上：没有 languages 键，`game.i18n` 与 `{{localize` 命中均为 0。
 *
 * ── 所以 module.json 的 languages 是 5 条而不是 7 条 ──
 * 系统覆盖 1 条 + 有 i18n 通道的插件 3 条（muthur / motion_tracker /
 * token-action-hud-alien）+ babele 自身 1 条 = 5。terminal 与
 * motion-tracker-multideck 没有可声明的落点，多出来的两条无处安放。
 *
 * ══════════════════════════════════════════════════════════════════════
 * 2026-08-29 本轮（terminal / multideck 补齐）的实测更正
 * ══════════════════════════════════════════════════════════════════════
 * 交付单上的三处数字与源码不符，按源码为准：
 *   · multideck 的 ui.notifications 是 **8** 条（753/758/782/786/814/821/868/874），
 *     不是 9 条。
 *   · multideck 只有 **1** 个 game.settings.register（:841 LINKS_SETTING），
 *     而它是 **config: false** —— 不进设置面板，按姊妹文件 F5 的判据**不翻**，
 *     改由 QA 的保险丝盯住它有没有变成 config:true。另有 1 个 registerMenu（:849）。
 *   · terminal 的 28 个内置样式里 effectScramble **全部**为 true（28/28，不是 20/28），
 *     所以下面通道 E 的抖动问题是**默认开启**的，不是少数派。
 */

const MODULE_ID = 'alienrpg-cn';

/**
 * ══════════════════════════════════════════════════════════════════════
 * A —— 扁平顶层 i18n 键（LITERAL_LABELS）
 * ══════════════════════════════════════════════════════════════════════
 * 与 alienrpg-hardcoded-cn.mjs 的通道 A 同一个机制，逐条复核过落点：
 *
 * ① FormApplication 的窗口标题
 *      client/appv1/api/application-v1.mjs:327  get title() { return _loc(this.options.title); }
 *    multideck 的 SceneLinkManager（scripts/multideck.js:606）正是
 *    `extends foundry.appv1.api.FormApplication`，:623 的 title 是英文字面量。
 *
 * ② registerMenu 的 name / label / hint
 *      client/helpers/client-settings.mjs:185-194 registerMenu **不做任何本地化**，
 *      原样塞进 game.settings.menus；
 *      client/applications/settings/config.mjs:59-66 摘成 entry.label/hint/buttonText；
 *      templates/settings/config-category.hbs:4/10/14 三处 {{localize …}}。
 *    ⇒ 渲染时才查表，i18nInit 写入完全来得及。
 *
 * ③ game.settings.register 的 name / hint（**仅限 config: true**）
 *      client/applications/settings/config.mjs:126-127
 *        data.field.label ||= _loc(setting.name ?? "");
 *        data.field.hint  ||= _loc(setting.hint ?? "");
 *
 * ④ ui.notifications 的**静态**英文字面量
 *      client/applications/ui/notifications.mjs:121 `message = _loc(message, format);`
 *      是**无条件**执行的，与 localize 选项无关。
 *    ⇒ 静态字面量走这条通道；只有带 ${} 的模板串才需要下面的通道 C。
 *
 * 顶层键能命中的根据：common/utils/helpers.mjs getProperty 第一分支就是
 *   `if ( key in object ) return object[key];`
 * 所以带空格、带句点、带 emoji 的整句作为顶层键**可以**命中（不会被 split(".")拆开）。
 * 也正因为如此，这些键**不能**写进 lang/cn.json —— #loadTranslationFile 会对每份
 * lang JSON 跑 expandObject，带句点的整句会被拆成嵌套键而永远查不到。
 *
 * ⚠ 顶层键是**全局**的。写入一律「别人已定义就让给别人」。
 *   2026-08-29 实测（判据固化进 qa/adversarial_hardcoded_patch.mjs 的 N6/N7）：
 *   本机 4238 份代码/模板 + 222 份 lang JSON 里，下面 12 条键的**解析点**各自
 *   只有一个包（multideck 或 terminal 自己），冲突面 = 0。
 */

/** 值形如 { cn, requires }：requires 指的模块没启用就整条跳过。 */
const LITERAL_LABELS = {
  // ── motion-tracker-multideck 1.0.2 ────────────────────────────────
  // scripts/multideck.js:623  SceneLinkManager.defaultOptions.title
  // ⚠ 中间那个是 U+2014 EM DASH，不是连字符；整串相等才命中，改一个字节就失效。
  'Alien RPG - Motion Tracker Multideck Companion — Scene Links':
    { cn: '异形 RPG - 运动追踪器多层甲板配套模块 — 场景链接', requires: 'motion-tracker-multideck' },
  // :850 name 与 :851 label 是**同一个字符串**，一条键同时盖住设置项标签与按钮文字
  'Configure Scene Links': { cn: '配置场景链接', requires: 'motion-tracker-multideck' },
  // :852 hint
  'Choose which Scenes belong to the same location so the Motion Tracker can detect contacts across them.':
    { cn: '选择哪些场景属于同一个地点，运动追踪器就能跨场景侦测信号。', requires: 'motion-tracker-multideck' },
  // ── multideck 的 4 条**静态**通知（另外 4 条带 ${}，见通道 C）──────
  // :786
  'That point could not be saved. You can type the X and Y coordinates manually instead.':
    { cn: '这个点没能保存。你可以改为手动输入 X 与 Y 坐标。', requires: 'motion-tracker-multideck' },
  // :821
  'Motion Tracker Multideck Companion Scene links saved.':
    { cn: '运动追踪器多层甲板配套模块：场景链接已保存。', requires: 'motion-tracker-multideck' },
  // :868
  'Alien RPG - Motion Tracker Multideck Companion requires Alien RPG - Motion Tracker to be active.':
    { cn: '异形 RPG - 运动追踪器多层甲板配套模块需要启用 异形 RPG - 运动追踪器。', requires: 'motion-tracker-multideck' },
  // :874
  'The Multideck Companion could not connect to the Motion Tracker. Check the browser console for details.':
    { cn: '多层甲板配套模块无法连接到运动追踪器。详情请查看浏览器控制台。', requires: 'motion-tracker-multideck' },

  // ── terminal 4.0.11 的 3 个 config:true 设置项（scripts/hooks.js）──
  // :120-127 screensaver
  '🔆 Screensaver': { cn: '🔆 屏幕保护', requires: 'terminal' },
  'Skill check required Terminals display an interactive visual. This might not aesthetically mesh well with some game systems.':
    { cn: '需要技能检定的终端会显示一段可交互的视觉动画。它在某些游戏系统里可能不太搭调。', requires: 'terminal' },
  // :129-136 notice
  '🔔 Extra Notifications': { cn: '🔔 额外通知', requires: 'terminal' },
  'The GM gets notifications about even minor actions within Terminal (e.g. when someone is given observer permission to a Journal, or a macro script is ran)':
    { cn: '即使是终端内的细微操作，GM 也会收到通知（例如有人拿到了某个日志的观察者权限，或某个宏脚本被执行）', requires: 'terminal' },
  // :138-152 warmCache（上游把 server 拼成了 sever，这里按语义译）
  '⚡ Keep Cache Warm': { cn: '⚡ 保持缓存预热', requires: 'terminal' },
  '(Designed for Forge but could be used for any sever behind CloudFlare DNS): This will keep a cache warm in an edge network. This significantly improves Terminal load times. At the cost of more overall network calls.':
    { cn: '（为 The Forge 设计，但任何位于 CloudFlare DNS 之后的服务器都能用）：在边缘网络里保持缓存预热，可显著缩短终端的加载时间，代价是整体网络请求变多。', requires: 'terminal' },
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * B —— 模板抢注（motion-tracker-multideck）
 * ══════════════════════════════════════════════════════════════════════
 * Foundry 的 getTemplate 第一行就短路：
 *     client/applications/handlebars.mjs:31
 *         if ( id in Handlebars.partials ) return Handlebars.partials[id];
 * 而 appv1 的 _renderInner（client/appv1/api/application-v1.mjs:592）走的正是
 *     foundry.applications.handlebars.renderTemplate(this.template, data)
 * → :103 `const template = await getTemplate(path);`
 * 所以在 `i18nInit` 用**同名** partial 抢先注册一份已汉化的模板，之后每次渲染都命中
 * 我们这份，零 DOM 操作、零 fork。
 *
 * key   = 上游模板路径，必须与上游 `template:` 里写的字符串**逐字节相同**
 *         （multideck.js:624 是 `modules/${MODULE_ID}/templates/link-manager.hbs`）。
 * value = **我们这份译文模板的路径**（不是内联字符串）。
 *
 * ⚠ 2026-08-29 结构性改动：骨架阶段这里的 value 是内联模板全文。改成文件路径，
 *   与姊妹文件 alienrpg-hardcoded-cn.mjs 的通道 B 对齐，理由有三：
 *   ① 译文模板必须能被 QA 的 D 组拿去和英文基线做**标签骨架逐标签比对**，
 *      内联字符串没法被独立比对；
 *   ② .hbs 放在真实文件里才能被编辑器按模板高亮、被 diff 工具按行对齐；
 *   ③ 两份补丁用同一种形状，升级时不必记两套规矩。
 *
 * ⚠ 抢注是整份替换。上游模板一改，我们这份静默过期且**不会报错**。每加一条都要在
 *   7-其他内容/english-baseline/ 留下对应版本的英文原件供跨版本 diff，并在
 *   同目录的 UPSTREAM-TEMPLATE-PINS.json 里钉住 sha256。
 */
const TEMPLATE_OVERRIDES = {
  'modules/motion-tracker-multideck/templates/link-manager.hbs':
    'modules/alienrpg-cn/templates/multideck/link-manager.hbs',
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * C —— ui.notifications 文案垫片
 * ══════════════════════════════════════════════════════════════════════
 * 静态英文字面量已经走通道 A 了（notify 无条件 _loc），这里**只**留给带 ${} 的
 * 模板串 —— 那种每次内容都不同，做不成 i18n 键。
 *
 * NOTIFICATION_TEXT：整串查表。目前是空的，保留是因为它是「某条静态串的顶层键被
 * 别的包占了，只能退回本地垫片」时的落点；一旦用到，它比通道 A 更窄（不写全局表）。
 *
 * NOTIFICATION_PATTERNS：整串锚定的正则。每条都 ^…$ 锚定，插值位用最紧的字符类
 * （side 只可能是 A/B，index 只可能是数字，坐标只可能是数字），不做子串匹配 ——
 * 这是与「Mirror Image -> 镜子 Image」那类子串事故的根本分野。
 */
const NOTIFICATION_TEXT = {};

const NOTIFICATION_PATTERNS = [
  {
    // scripts/multideck.js:753
    //   `Select Scene ${side.toUpperCase()} before marking a matching point.`
    //   side 由 :747 的 button.dataset.side 来，:749 已用 ["a","b"].includes(side) 收窄，
    //   再 toUpperCase ⇒ 只可能是 A 或 B。
    pattern: /^Select Scene ([AB]) before marking a matching point\.$/,
    replace: (m) => `请先选择场景 ${m[1]}，再标记对位点。`,
    site: 'modules/motion-tracker-multideck/scripts/multideck.js:753',
  },
  {
    // :758 `Opening ${scene.name}. Click matching point ${ai + 1} for Scene ${side.toUpperCase()}.`
    // scene.name 是世界数据，可能含任意字符（含中文），所以用 [\s\S]+；
    // 但它被夹在两个固定长句之间，且序号与 A/B 两处都被收窄，整串仍然是唯一形状。
    pattern: /^Opening ([\s\S]+)\. Click matching point (\d+) for Scene ([AB])\.$/,
    replace: (m) => `正在打开 ${m[1]}。请为场景 ${m[3]} 点击第 ${m[2]} 个对位点。`,
    site: 'modules/motion-tracker-multideck/scripts/multideck.js:758',
  },
  {
    // :782 `Saved matching point on ${scene.name}: (${x}, ${y}).`
    // x/y 由 :775-776 的 Math.round(p.x * 100) / 100 产出 ⇒ 十进制数，可能带负号与小数点。
    pattern: /^Saved matching point on ([\s\S]+): \((-?\d+(?:\.\d+)?), (-?\d+(?:\.\d+)?)\)\.$/,
    replace: (m) => `已在 ${m[1]} 上保存对位点：(${m[2]}, ${m[3]})。`,
    site: 'modules/motion-tracker-multideck/scripts/multideck.js:782',
  },
  {
    // :814 `Scene link "${link.name || link.id}" uses the same Scene for both Scene A and Scene B.`
    // link.name 是 GM 自己输入的，可以是空串（此时退到 link.id），所以用 [\s\S]*。
    pattern: /^Scene link "([\s\S]*)" uses the same Scene for both Scene A and Scene B\.$/,
    replace: (m) => `场景链接“${m[1]}”把同一个场景同时用作场景 A 和场景 B。`,
    site: 'modules/motion-tracker-multideck/scripts/multideck.js:814',
  },
];

/**
 * ══════════════════════════════════════════════════════════════════════
 * D —— terminal 的 4 个固定按钮标签（DOM）
 * ══════════════════════════════════════════════════════════════════════
 * scripts/terminal.js 用 document.createElement 现造按钮并 `div.textContent = "…"`：
 *     :508 Charge battery to full   （.terminal-charge-btn）
 *     :561 Detect Motion            （.terminal-ping-btn）
 *     :612 Toggle Power             （.terminal-lights-btn）
 *     :701 Download map data        （.terminal-explore-btn）
 * 没有模板、没有 i18n，只能改 DOM。
 *
 * 为什么改 textContent 是安全的、而且**连带把内容页也翻了**：
 *   四个按钮的 onclick 都是在**点击那一刻**再读 `div.textContent`
 *   （例如 :565 `data.content = div.textContent`、:571 `showContent(…, div.textContent)`），
 *   不是在创建时把英文闭包捕获走。所以我们改完 DOM，标题栏与内容页跟着一起中文。
 *
 * ── 爆炸半径 ──────────────────────────────────────────────────────────
 * 三道锚点，缺一不可：
 *   ① 钩子名 `renderTerminal`（AppV2 按 constructor.name 派发，
 *      client/applications/api/application.mjs:1728）。本机 4238 份代码里
 *      `class Terminal` 只有 modules/terminal 一处。
 *   ② 容器类 `.terminal-folders` —— 本机唯一持有者是 modules/terminal。
 *      ⚠ **不能**用 `.terminal-window` 收窄：实测 alien-mu-th-ur 也用这个类名。
 *   ③ 按钮自有类名 + 英文原文**整串相等**才改（改一个字节就放行）。
 *
 * ── 为什么必须挂观察器而不是渲染时扫一遍 ────────────────────────────
 * 带密码的终端走 :150 `static password()` 那条路：验密成功后才 :159 `a.createHTML()`，
 * 那已经在 renderTerminal 之后了。只在渲染时扫一次 ⇒ 带密码的终端一条都翻不到。
 * 观察器只盯 `.terminal-folders` 的 childList（**不 subtree**）：按钮全是它的直接子节点
 * （:327 `const sibling = lain.querySelector('.terminal-folders')` + :502/:557/:608/:707
 * 的 sibling.appendChild），而 CLI 打字动画的高频 DOM 变动全部发生在
 * `.terminal-history` / `.terminal-textbox`，碰不到这里。
 */
const TERMINAL_BUTTON_LABELS = {
  'terminal-charge-btn': { en: 'Charge battery to full', cn: '将电池充满' },
  'terminal-ping-btn': { en: 'Detect Motion', cn: '侦测运动' },
  // Power = 电力：lang/cn.json 的 ALIENRPG.Power / ALIENRPG.Pwr 与
  // glossary_alien.json 的 Power 三处一致，不另起译名。
  'terminal-lights-btn': { en: 'Toggle Power', cn: '切换电力' },
  'terminal-explore-btn': { en: 'Download map data', cn: '下载地图数据' },
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * E —— terminal 的 9 个 ASCII 大标题（改上游导出的对象）
 * ══════════════════════════════════════════════════════════════════════
 * scripts/presets.js 的 `export const ASCII = {…}`，每个条目形如
 *     ATLAS: `<h1 style="font-family: inherit">Map Downloaded</h1><pre> …点阵艺术… </pre>`
 * 我们**只**替换那段 `<h1>…</h1>` 里的文字，<pre> 里的 ASCII/盲文点阵一个字节都不碰
 * （全 ASCII 组成的图形，翻译等于毁掉）。
 *
 * 通道：动态 import 同一个 URL。ES 模块按**绝对 URL** 缓存，terminal.js:21
 * `import { ASCII } from "./presets.js"` 解析出的绝对 URL 与
 * `foundry.utils.getRoute('modules/terminal/scripts/presets.js')` 逐字节相同
 * （core 的 templates/views/layouts/main.hbs:28 把 esmodule 的 src 原样写成相对路径，
 * 相对 `{prefix}/game` 解析的结果就是 `{prefix}/modules/…`；getRoute 拼的是同一个串），
 * 所以拿到的是**同一个模块实例**，`ASCII` 是同一个对象引用。改它的属性，terminal.js
 * 在点击那一刻读到的就是改后的值。ASCII 是普通对象、没有冻结，可写。
 *
 * ── 为什么外面还包了一层 <span> ──────────────────────────────────────
 * 这是本轮两个 CJK 缺陷之一的处理（另一个见文件末尾的 padEnd 说明）。
 * terminal.js:877 的 gsap scrambleText 用的是**纯拉丁**字符池：
 *     scrambleText: { text: original, chars: "abcdefghijklmnopqrstuvwxyz ", ease: "none" }
 * 而它只作用在 :852-856 被打上 `.terminal-typewriter` 的元素上，加类的判据是：
 *     if ((tag === "H1" || tag === "H2" || tag === "H3") && node.children.length === 0)
 * 于是中文标题会先被打散成一串小写拉丁字母再逐字归位 —— 一个汉字≈两个拉丁字符宽，
 * 整行宽度在动画中途来回跳。实测本机 presets.js 的 28 个内置样式
 * **全部** effectScramble: true，所以这不是少数派场景。
 *
 * 三条路里只有第三条走得通：
 *   ✗ 给它一个中文字符池 —— chars 是写死在 terminal.js 函数内部的字面量，
 *     够不到；改 gsap 的 ScrambleTextPlugin 是全局手术（dice-so-nice 等也在用 gsap），
 *     爆炸半径不可接受。
 *   ✗ 让这 9 句保持英文 —— 触发它们的 4 个按钮已经是中文了，点中文按钮弹英文大标题
 *     比抖动更糟。
 *   ✓ 用上游**自己的判据**退出：给 h1 加一个元素子节点，`node.children.length === 0`
 *     不再成立 ⇒ 这 9 个标题不被打 `.terminal-typewriter` ⇒ 不进 scramble 时间线。
 *     作用面精确等于我们改的这 9 个字符串，terminal 其余地方的 scramble 一动不动。
 * 代价：这 9 个标题不再有打散动画（直接显示）。判据写进 QA 的 F 组盯着 ——
 * 上游哪天改掉 `children.length === 0` 这个判据，或者换掉字符池，就熔断重新裁定。
 */
const TERMINAL_ASCII_HEADINGS = {
  // key 是 presets.js 里 ASCII 对象的属性名；en 必须与上游 <h1> 里的文字整串相等。
  ATLAS: { en: 'Map Downloaded', cn: '地图已下载' },
  EYE: { en: 'Control Granted', cn: '已获得控制权' },
  MOTION: { en: 'Detecting Motion', cn: '正在侦测运动' },
  DOOR_OPEN: { en: 'Door Opened', cn: '舱门已打开' },
  DOOR_LOCK: { en: 'Door Locked', cn: '舱门已锁定' },
  POWER_ON: { en: 'Power is now On', cn: '电力已接通' },
  POWER_OFF: { en: 'Power is now Off', cn: '电力已切断' },
  SSH: { en: 'Connection Established', cn: '连接已建立' },
  BATTERY: { en: 'Equipment Charged', cn: '装备已充能' },
};

const TERMINAL_PRESETS_PATH = 'modules/terminal/scripts/presets.js';

/**
 * ══════════════════════════════════════════════════════════════════════
 * A —— MU-TH-UR：可直接改写的全局叙事数组
 * ══════════════════════════════════════════════════════════════════════
 * main.js:512 与 :518 把两组叙事文本挂在 **window** 上：
 *     window.hackingSequences = [ … ]        （读取点 :3721-3730）
 *     window.postPasswordSequences = [ … ]   （读取点 :3760-3774）
 * 它们在渲染时才被遍历，所以在 `ready` 之后整份替换即可，无需 DOM 操作。
 *
 * ⚠ 只替换**内容**，长度可以不同（读取点用的是 `.length`，没有硬编码下标）。
 * ⚠ 其余四组（bootMessages :164-176、hackingSequences 之外的 systemMessages
 *   :5550-5568、errorSnippets :5571-5584、buildPostHackHelpList :4163-4177）
 *   是**函数内 const**，够不到，只能走下面的 DOM 观察器或放弃。
 */
const MUTHUR_GLOBAL_SEQUENCES = {
  // hackingSequences: [ … ],
  // postPasswordSequences: [ … ],
};

/* ------------------------------------------------------------------ *
 * 装配
 * ------------------------------------------------------------------ */

/**
 * ⚠ 2026-08-29 对抗复核补入的两处结构性修正。原来这两条都不成立，只是因为三张表
 *   目前全空才没有外显 —— 表一填就是缺陷，而且是**静默**的。
 *
 * ① 本文件原来**一道语言门都没有**。
 *   姊妹文件 alienrpg-hardcoded-cn.mjs 的文件头把「全局门」写成铁律：
 *   `game.i18n.lang !== 'cn'` 时必须是完全的空操作。本文件干的事（抢注已汉化的
 *   partial、替换 MU-TH-UR 的全局叙事数组、装通知垫片）**每一件都是全局副作用**，
 *   在英文世界里执行就是把别人的英文界面改成中文。同一个模块里两份补丁一份有门
 *   一份没门，是设计事故，不是取舍。
 *
 * ② 原来挂在 `init`，而 `init` 阶段**读不到真语言**。
 *   client/helpers/localization.mjs:10-19 构造器里 `this.lang` 只是**服务器默认语言**；
 *   :226-237 `setLanguage()` 的 :231 才写入真值，而它由 :79-87 `initialize()` 调用，
 *   `initialize()` 又在 client/game.mjs:663 —— 在 :652 `callAll("init")` **之后**。
 *   ⇒ 在 `init` 里判语言两个方向都会错（中文世界漏做、英文世界误做）。
 *   `i18nInit`（localization.mjs:104）是 `setLanguage()` 之后最早的钩子，且仍然
 *   远早于任何插件模板被首次渲染 —— getTemplate 的短路查表发生在**首次渲染那一刻**
 *   （client/applications/handlebars.mjs:30），不是加载时。
 *
 * 另：`HOOKS` 这一层与姊妹文件对齐，让 QA 能在裸 node 子进程里 import 本文件跑出货代码。
 */
const HOOKS = globalThis.Hooks ?? { on() {}, once() {} };
const SYSTEM_ID = 'alienrpg';
const TARGET_LANG = 'cn';

/** 与 alienrpg-hardcoded-cn.mjs 的 enabled() 逐字等价。 */
function enabled() {
  return globalThis.game?.system?.id === SYSTEM_ID && globalThis.game?.i18n?.lang === TARGET_LANG;
}

/** 目标插件没启用就整条跳过（避免往全局 i18n 表里塞没有读者的键）。 */
function moduleActive(id) {
  return !!globalThis.game?.modules?.get(id)?.active;
}

/* ------------------------------------------------------------------ *
 * 通道 A —— i18nInit：写顶层键
 * ------------------------------------------------------------------ */

HOOKS.once('i18nInit', () => {
  if (!enabled()) return;
  const translations = globalThis.game?.i18n?.translations;
  if (!translations) return;

  let added = 0;
  const skipped = [];
  for (const [key, raw] of Object.entries(LITERAL_LABELS)) {
    if (raw.requires && !moduleActive(raw.requires)) continue;
    // 顶层键是全局的：别人已经定义过就让给别人，宁可露英文也不顶掉别的包。
    if (typeof translations[key] === 'string') {
      skipped.push(key);
      continue;
    }
    translations[key] = raw.cn;
    added += 1;
  }
  if (added) console.log(`${MODULE_ID} | 已注入 ${added} 条插件写死串的顶层 i18n 键`);
  if (skipped.length) {
    console.warn(`${MODULE_ID} | 以下顶层键已被别的包定义，已让出：${skipped.join(', ')}`);
  }
});

/* ------------------------------------------------------------------ *
 * 通道 B —— i18nInit：抢注模板
 * ------------------------------------------------------------------ */

let templatePromise = null;

async function installTemplateOverrides() {
  const entries = Object.entries(TEMPLATE_OVERRIDES);
  let ok = 0;
  for (const [upstreamPath, ourPath] of entries) {
    // 只在目标插件确实启用时抢注，避免在没装它的世界里往全局 partial 表里塞垃圾。
    const owner = upstreamPath.split('/')[1];
    if (owner && !moduleActive(owner)) continue;
    try {
      const resp = await fetch(foundry.utils.getRoute(ourPath));
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const source = await resp.text();
      // 与 core 的编译选项对齐：client/applications/handlebars.mjs:41 用的是
      // `Handlebars.compile(resp.html, {preventIndent: true})`。少了它，我们这份
      // partial 被 `{{> …}}` 内联时会按缩进重排。
      Handlebars.registerPartial(upstreamPath, Handlebars.compile(source, { preventIndent: true }));
      ok += 1;
    } catch (err) {
      console.error(`${MODULE_ID} | 抢注插件模板失败：${upstreamPath} <- ${ourPath}`, err);
    }
  }
  if (ok) console.log(`${MODULE_ID} | 已抢注 ${ok} 份插件汉化模板`);
  return ok;
}

HOOKS.once('i18nInit', () => {
  if (!enabled() || !Object.keys(TEMPLATE_OVERRIDES).length) return;
  templatePromise = installTemplateOverrides();
});

// 不阻塞 i18nInit（core 不 await 钩子回调），但在 setup 这个天然的同步点等一次，
// 让「抢注失败」的错误日志一定出现在 GM 点开设置窗口之前。
HOOKS.once('setup', async () => {
  if (templatePromise) await templatePromise;
});

/* ------------------------------------------------------------------ *
 * 通道 C / E —— ready
 * ------------------------------------------------------------------ */

HOOKS.once('ready', () => {
  if (!enabled()) return;

  // MU-TH-UR 的全局叙事数组：它自己在 esmodule 顶层就赋好了值，ready 时替换稳妥。
  if (moduleActive('alien-mu-th-ur')) {
    for (const [name, value] of Object.entries(MUTHUR_GLOBAL_SEQUENCES)) {
      if (!Array.isArray(globalThis[name])) {
        console.warn(`${MODULE_ID} | window.${name} 不是数组，MU-TH-UR 结构已变，跳过`);
        continue;
      }
      globalThis[name] = value;
    }
  }

  if (Object.keys(NOTIFICATION_TEXT).length || NOTIFICATION_PATTERNS.length) patchNotifications();

  if (moduleActive('terminal')) translateTerminalAscii();
});

/**
 * 包一层 ui.notifications.notify —— **四个**便捷方法 info / warn / error / success
 * 在 Foundry 内部都转调 notify，所以只需包这一个入口。已核对：
 *   client/applications/ui/notifications.mjs:151-152 info  -> this.notify(m,"info",o)
 *                                            :164-165 warn  -> this.notify(m,"warning",o)
 *                                            :177-178 error -> this.notify(m,"error",o)
 *                                            :190-191 success -> this.notify(m,"success",o)
 * （原注释写「三个」，漏了 success；垫片本来就覆盖它，只是数目记错。）
 *
 * 同文件 :108-110 `notify()` 第一件事是 `message instanceof Error ? message : null`
 * 再 `String(message)` —— 传 Error 对象时下面的 `typeof message === 'string'` 为假，
 * 原样透传，不会把错误对象拍平成字符串。
 *
 * 查不到译文就原样透传；包过一次就不再包（热重载 / 双重加载防呆）。
 */
// ⚠ 2026-08-29 对抗复核修正：哨兵原本与 alienrpg-hardcoded-cn.mjs **同名**
//   （两边都叫 `__alienCnPatched`）。module.json 的 esmodules 把系统那份排在前面，
//   它先包上并盖章，本文件随后看见图章就 `return` —— **插件译文一条都不生效，且静默**。
//   现在两边各用各的哨兵，并互相继承对方的图章，两层可以叠加、又各自防重复包装。
const NOTIFY_FLAG = '__alienrpgCnPluginsNotifyPatched';

/** 整串查表 -> 整串锚定的正则；都不命中就返回原文（绝不吞消息）。 */
export function translatePluginNotification(message) {
  if (typeof message !== 'string') return message;
  const exact = NOTIFICATION_TEXT[message.trim()];
  if (exact) return exact;
  for (const { pattern, replace } of NOTIFICATION_PATTERNS) {
    const m = pattern.exec(message);
    if (m) return replace(m);
  }
  return message;
}

function patchNotifications() {
  const bus = globalThis.ui?.notifications;
  if (!bus || typeof bus.notify !== 'function' || bus.notify[NOTIFY_FLAG]) return;

  const original = bus.notify.bind(bus);
  const wrapped = function alienrpgCnPluginsNotify(message, ...rest) {
    if (typeof message === 'string') {
      const hit = translatePluginNotification(message);
      if (hit !== message) return original(hit, ...rest);
    }
    return original(message, ...rest);
  };
  wrapped[NOTIFY_FLAG] = true;
  for (const k of Object.getOwnPropertyNames(bus.notify)) {
    if (k.startsWith('__') && k.endsWith('Patched')) wrapped[k] = true;
  }
  bus.notify = wrapped;
}

/**
 * 通道 E 的**纯函数**核心：把一条 ASCII 条目里的 `<h1>` 文字换成中文，其余字节不动。
 * 抽出来是为了让 QA 能直接拿出货代码跑近失语料（而不是在测试里抄一份等价实现）。
 *
 * 判据（四道）缺一就返回 null（调用方保持英文并点名）：
 *   ① src 是字符串且以 `<h1` 开头；
 *   ② 里面有 `>${en}</h1>` 这个**整串**；
 *   ③ 它出现在第一个 `<pre` 之前 —— 保证我们动的是标题而不是点阵艺术里的巧合子串；
 *   ④ 只替换**第一处**。
 * 已经是中文的返回 null（幂等由调用方另外判定）。
 *
 * @returns {string|null}
 */
export function translateAsciiHeading(src, en, cn) {
  if (typeof src !== 'string' || !src.startsWith('<h1')) return null;
  const needle = `>${en}</h1>`;
  const at = src.indexOf(needle);
  if (at < 0) return null;
  const pre = src.indexOf('<pre');
  if (pre >= 0 && at > pre) return null;
  return `${src.slice(0, at)}><span>${cn}</span></h1>${src.slice(at + needle.length)}`;
}

/**
 * 通道 E 的执行体。每一步都可失败并原样退回英文，绝不抛。
 */
async function translateTerminalAscii() {
  let mod;
  try {
    mod = await import(foundry.utils.getRoute(TERMINAL_PRESETS_PATH));
  } catch (err) {
    console.error(`${MODULE_ID} | 无法载入 terminal 的 presets.js，9 个大标题保持英文`, err);
    return 0;
  }
  const ascii = mod?.ASCII;
  if (!ascii || typeof ascii !== 'object') {
    console.warn(`${MODULE_ID} | terminal 的 presets.js 不再导出 ASCII 对象，跳过`);
    return 0;
  }
  let done = 0;
  const missed = [];
  for (const [key, { en, cn }] of Object.entries(TERMINAL_ASCII_HEADINGS)) {
    const src = ascii[key];
    // 幂等：热重载 / 双重加载时不再动第二次。
    if (typeof src === 'string' && src.includes(`><span>${cn}</span></h1>`)) { done += 1; continue; }
    const next = translateAsciiHeading(src, en, cn);
    if (next === null) { missed.push(key); continue; }
    ascii[key] = next;
    done += 1;
  }
  if (done) console.log(`${MODULE_ID} | 已汉化 terminal 的 ${done} 个 ASCII 大标题`);
  if (missed.length) {
    console.warn(`${MODULE_ID} | terminal 的以下大标题与预期英文原文不符，已保持英文：${missed.join(', ')}`);
  }
  return done;
}

/* ------------------------------------------------------------------ *
 * 通道 D —— renderTerminal：按钮标签
 * ------------------------------------------------------------------ */

const TERMINAL_OBSERVER_FLAG = '__alienrpgCnTerminalButtonObserver';

/** 只在 root 内部改；整串相等才改。返回改了几个。 */
function relabelTerminalButtons(root) {
  if (!root?.querySelectorAll) return 0;
  let n = 0;
  for (const [cls, { en, cn }] of Object.entries(TERMINAL_BUTTON_LABELS)) {
    for (const el of root.querySelectorAll(`.${cls}`)) {
      if (el.textContent === en) {
        el.textContent = cn;
        n += 1;
      }
    }
  }
  return n;
}

HOOKS.on('renderTerminal', (_app, element) => {
  if (!enabled() || !moduleActive('terminal')) return;
  const root = element?.querySelector ? element : element?.[0];
  // 第二道锚点：`.terminal-folders` 本机唯一持有者是 modules/terminal。
  // （`.terminal-window` 不能用作锚点 —— alien-mu-th-ur 也用这个类名。）
  const folders = root?.querySelector?.('.terminal-folders');
  if (!folders) return;

  relabelTerminalButtons(folders);
  if (folders[TERMINAL_OBSERVER_FLAG]) return;
  try {
    const mo = new MutationObserver(() => relabelTerminalButtons(folders));
    mo.observe(folders, { childList: true });
    folders[TERMINAL_OBSERVER_FLAG] = mo;
  } catch (err) {
    console.error(`${MODULE_ID} | terminal 按钮观察器安装失败（已翻的按钮不受影响）`, err);
  }
});

HOOKS.on('closeTerminal', (app) => {
  const root = app?.element?.querySelector ? app.element : app?.element?.[0];
  const folders = root?.querySelector?.('.terminal-folders');
  const mo = folders?.[TERMINAL_OBSERVER_FLAG];
  if (mo) {
    mo.disconnect();
    delete folders[TERMINAL_OBSERVER_FLAG];
  }
});

/**
 * ══════════════════════════════════════════════════════════════════════
 * 本轮**明确不做**的两件事（都是决定，不是遗漏）
 * ══════════════════════════════════════════════════════════════════════
 * ① terminal.js:1147 `generateTable()` 的 padEnd 对 CJK 是错的。
 *    它用 `String.length` 算列宽、用 `padEnd` 补空格，而等宽字体下一个汉字占两格
 *    ⇒ 任何中文单元格都会把 `|` 边框顶歪。
 *    我们**不**给它打补丁，理由是两条硬的：
 *      · 够不到：generateTable 是 initCLI 函数体内的**局部函数声明**，既不导出也不挂
 *        在任何对象上；唯一"能"改的写法是包 String.prototype.padEnd —— 全局手术，
 *        爆炸半径不可接受。
 *      · 不必要：本轮翻译的 16 个字符串**没有任何一个**流向 generateTable。
 *        它的 6 个调用点吃的是 help 命令表（英文命令名 + 英文说明，本轮不在范围内）
 *        与世界数据（actor/journal/文件名）。
 *    ⇒ 判据固化为 QA 的 F 组：generateTable 仍是局部函数、且我们的译文串一个都不在
 *      它的调用点里。哪天要翻 help 表，先解决取址问题再谈。
 *    ⚠ 已知遗留：`ls` / `ssh` / `sh` 的表格吃的是**世界数据**，而本项目会把日志页名
 *      译成中文 —— 那时边框会歪。这是上游缺陷被本项目的译文放大，不是本补丁引入的，
 *      记在 open_issues 里。
 *
 * ② config.hbs（9287 字符的 GM 配置说明）不翻。本轮范围只到玩家可见面。
 *
 * ── 一条**已知且不可避免**的跨客户端外溢（记录在案，不是缺陷）────────
 * terminal 的 showContent（terminal.js:246-262）会把 injectObj **通过 socket 广播**
 * 给影子视图/GM 审批流，而 injectObj.text.content 就是 ASCII.X、name 就是
 * div.textContent —— 两样都被我们翻过。所以「中文客户端点了按钮，英文 GM 的影子
 * 视图里出现中文」是必然的：语言门是**每客户端**的，而这个模块把**已渲染的内容**
 * 而不是键广播出去。除非 fork 它改成广播键，否则无解；本项目不 fork 插件。
 * 通道 D 的按钮文本同理。
 */

/** QA 导出面（裸 node 下 import 本文件跑出货代码，而不是抄一份副本去测）。 */
export const __TEST__ = {
  LITERAL_LABELS,
  MUTHUR_GLOBAL_SEQUENCES,
  TEMPLATE_OVERRIDES,
  NOTIFICATION_TEXT,
  NOTIFICATION_PATTERNS,
  TERMINAL_BUTTON_LABELS,
  TERMINAL_ASCII_HEADINGS,
  TERMINAL_PRESETS_PATH,
  NOTIFY_FLAG,
  TERMINAL_OBSERVER_FLAG,
  enabled,
  relabelTerminalButtons,
  translateAsciiHeading,
};
