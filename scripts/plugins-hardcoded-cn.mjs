/**
 * plugins-hardcoded-cn.mjs —— 周边插件侧写死字符串的运行时补丁。
 *
 * 与 alienrpg-hardcoded-cn.mjs 分开放，因为两者的失效条件完全不同：系统那份跟着
 * alienrpg 版本走，这份跟着**五个各自独立升级的插件**走。混在一个文件里，任何一个
 * 插件升级都要整体重读。
 *
 * ⚠ 骨架阶段：下面所有表都是**空的**，本文件不改变任何显示。
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
 * terminal 4.0.11             **只**走本文件（模板抢注 + 通知垫片）
 *     module.json 没有 languages 键，5 个 esmodule 里 `game.i18n` 命中 0，
 *     .hbs 里 `{{localize` 命中 0 —— 给它声明 lang 文件是**没有读者的写入**。
 *
 * motion-tracker-multideck 1.0.2  **只**走本文件（模板抢注）
 *     同上：没有 languages 键，`game.i18n` 与 `{{localize` 命中均为 0。
 *
 * ── 所以 module.json 的 languages 是 5 条而不是 6 条 ──
 * 系统覆盖 1 条 + 有 i18n 通道的插件 3 条（muthur / motion_tracker /
 * token-action-hud-alien）+ babele 自身 1 条 = 5。terminal 与
 * motion-tracker-multideck 没有可声明的落点，第 6 条无处安放。
 */

const MODULE_ID = 'alienrpg-cn';

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

/**
 * ══════════════════════════════════════════════════════════════════════
 * B —— 模板抢注（terminal / motion-tracker-multideck）
 * ══════════════════════════════════════════════════════════════════════
 * Foundry 的 getTemplate 第一行就短路：
 *     client/applications/handlebars.mjs:31
 *         if ( id in Handlebars.partials ) return Handlebars.partials[id];
 * 所以在 `init` 用**同名** partial 抢先注册一份已汉化的模板，之后每次渲染都命中我们
 * 这份，零 DOM 操作、零 fork。
 *
 * key   = 模板路径，必须与上游 `template:` 里写的字符串**逐字节相同**，例如
 *         'modules/motion-tracker-multideck/templates/link-manager.hbs'
 * value = 已汉化的模板全文
 *
 * ⚠ 抢注是整份替换。上游模板一改，我们这份静默过期且**不会报错**。每加一条都要在
 *   7-其他内容/english-baseline/ 留下对应版本的英文原件供跨版本 diff。
 */
const TEMPLATE_OVERRIDES = {};

/**
 * ══════════════════════════════════════════════════════════════════════
 * C —— ui.notifications 文案垫片
 * ══════════════════════════════════════════════════════════════════════
 * terminal / multideck 的通知是直接传英文字面量的。这里做一层查表转换：
 * 英文原文 -> 中文。查不到就原样放行，绝不吞消息。
 */
const NOTIFICATION_TEXT = {};

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

HOOKS.once('i18nInit', () => {
  if (!enabled()) return;
  const entries = Object.entries(TEMPLATE_OVERRIDES);
  if (!entries.length) return;

  for (const [path, source] of entries) {
    // 只在目标插件确实启用时抢注，避免在没装它的世界里往全局 partial 表里塞垃圾。
    const owner = path.split('/')[1];
    if (owner && !game.modules.get(owner)?.active) continue;
    try {
      // 与 core 的编译选项对齐：client/applications/handlebars.mjs:41 用的是
      // `Handlebars.compile(resp.html, {preventIndent: true})`。terminal 的
      // ASCII 边框最怕缩进重排，这个参数不能省。
      Handlebars.registerPartial(path, Handlebars.compile(source, { preventIndent: true }));
    } catch (err) {
      console.error(`${MODULE_ID} | 抢注插件模板失败：${path}`, err);
    }
  }
});

HOOKS.once('ready', () => {
  if (!enabled()) return;

  // MU-TH-UR 的全局叙事数组：它自己在 esmodule 顶层就赋好了值，ready 时替换稳妥。
  if (game.modules.get('alien-mu-th-ur')?.active) {
    for (const [name, value] of Object.entries(MUTHUR_GLOBAL_SEQUENCES)) {
      if (!Array.isArray(globalThis[name])) {
        console.warn(`${MODULE_ID} | window.${name} 不是数组，MU-TH-UR 结构已变，跳过`);
        continue;
      }
      globalThis[name] = value;
    }
  }

  if (Object.keys(NOTIFICATION_TEXT).length) patchNotifications();
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

function patchNotifications() {
  const bus = ui?.notifications;
  if (!bus || typeof bus.notify !== 'function' || bus.notify[NOTIFY_FLAG]) return;

  const original = bus.notify.bind(bus);
  const wrapped = function alienrpgCnPluginsNotify(message, ...rest) {
    if (typeof message === 'string') {
      const hit = NOTIFICATION_TEXT[message.trim()];
      if (hit) return original(hit, ...rest);
    }
    return original(message, ...rest);
  };
  wrapped[NOTIFY_FLAG] = true;
  for (const k of Object.getOwnPropertyNames(bus.notify)) {
    if (k.startsWith('__') && k.endsWith('Patched')) wrapped[k] = true;
  }
  bus.notify = wrapped;
}

/** QA 导出面（裸 node 下 import 本文件跑出货代码，而不是抄一份副本去测）。 */
export const __TEST__ = {
  MUTHUR_GLOBAL_SEQUENCES,
  TEMPLATE_OVERRIDES,
  NOTIFICATION_TEXT,
  NOTIFY_FLAG,
  enabled,
};
