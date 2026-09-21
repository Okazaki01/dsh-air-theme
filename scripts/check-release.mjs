#!/usr/bin/env node
/**
 * ============================================================================
 * dsh-air-theme — 发布前自检（asserts the three shipped bug fixes + hardening）
 *
 * 用法:
 *   node scripts/check-release.mjs
 *
 * 这是给「要发给别人」准备的：它不看安装结果，只看这个包本身是否**确实包含**
 * 三轮修复，任何一条不满足就退出码 1。改代码后、打包前必须跑。
 *
 * 覆盖的三类历史故障：
 *   [1] 左上角 deepseek / HARNESS 标识消失
 *       —— 因 JS 里误用 CSS 模板令牌 + 内核自带 brandIdentity 与自绘 wordmark 抢位
 *   [2] 新会话标题「将未完的夏天，寄往天空的尽头」不出现 / 小鲸鱼与标题错位
 *       —— 因 apply() 被异常中断（观察器没装上）+ headlineText 多叠了 translateY
 *   [3] 滚轮滚动带走输入框、到顶弹回
 *       —— 因 composer seat 在滚动容器内且其下方还排着别的内容，sticky 会脱钩
 * ============================================================================
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = join(ROOT, 'lib', 'client.js');
const INDEX = join(ROOT, 'lib', 'index.js');

if (!existsSync(CLIENT)) {
  console.error('找不到 lib/client.js —— 请在包根目录运行');
  process.exit(2);
}
const src = readFileSync(CLIENT, 'utf8');

// CSS 数组的结束位置：用它区分「令牌在 CSS 模板里」和「令牌漏进 JS 里」
const cssEnd = src.indexOf('].join("")');
if (cssEnd < 0) {
  console.error('无法定位 CSS 规则数组（].join("")）');
  process.exit(2);
}

let failed = 0;
const results = [];
const ok = (group, label, pass, detail = '') => {
  if (!pass) failed++;
  results.push({ group, label, pass, detail });
};

const has = (s) => src.includes(s);
const count = (re) => (src.match(re) || []).length;

// ---------------------------------------------------------------- [1] 品牌行
const BRAND = '[1] 品牌行 deepseek / HARNESS';
ok(BRAND, '自绘 wordmark 的两段样式都在',
  has('.air-brand-deepseek{') && has('.air-brand-harness{'));
ok(BRAND, '内核自带 brandIdentity 已让位（否则 .brand 的 overflow:hidden 会把 HARNESS 裁成方块）',
  has('[class*=brandIdentity]{display:none!important}'));
ok(BRAND, 'decorateBrand 用 sidebarSelector() 取侧栏（不是 CSS 令牌）',
  has('querySelector(sidebarSelector() + " [class*=logoRow] [class*=brand]")'));
ok(BRAND, 'decorateBrand / decorateLogoRow 被 safe() 隔离',
  has('safe(decorateBrand,') && has('safe(decorateLogoRow,'));

// ------------------------------------------------------------ [2] hero 标题行
const HERO = '[2] hero 标题行';
ok(HERO, '自定义标题文案在',
  has('将未完的夏天，寄往天空的尽头'));
ok(HERO, 'enforceHeadline 被 safe() 隔离（异常不得中断 apply）',
  has('safe(enforceHeadline,'));
ok(HERO, 'headlineText 不得再叠 translateY（内核 grid 已对齐 小鲸鱼|标题|预览版）',
  !/\[class\*=headlineText\][^"]*translateY/.test(src),
  '检测到 headlineText 规则里含 translateY');
ok(HERO, 'headline 的 -70px 上移通过 __AIRMOD 令牌定位',
  has('__AIRMOD(HeroShell.module.css|headline)__'));
ok(HERO, 'headline 的 -70px 上移另有免前缀锚兜底（冷启动 HeroShell 未加载时令牌退化成 :not(*)，整条会失效）',
  has('[data-phase=hero] [class*=headline]:not([class*=headlineText]):not([class*=previewBadge]){margin-top:-70px'),
  '缺少免前缀兜底规则：冷启动（恢复的是会话界面）时 hero 整行会少 70px 上移，看起来就是「小鲸鱼/横幅/预览版错位」');
ok(HERO, '令牌解析必须在模块迟到时重新解析（不能只赌一次重试）',
  has('function watchModules()') && has('moduleWatcher.observe(document.head') && has('stopWatching()'),
  '缺少 watchModules()：HeroShell 等模块晚于 apply() 加载时，令牌永远解析不了');
ok(HERO, '全局 MutationObserver 必须装在 apply() 内（否则 React 重渲染后不再自愈）',
  has('new MutationObserver(') && has('observer.observe(body'));

// ------------------------------------------- [4b] 天空图不被内核不透明底盖住
const SKYBASE = '[4b] 深色底不让天空图消失';
const darkBodyIdx = src.indexOf('[data-ds-dark-theme]{');
const darkBodyChunk = darkBodyIdx >= 0 ? src.slice(darkBodyIdx, darkBodyIdx + 2600) : '';
ok(SKYBASE, '深色配色块必须自己再声明 --dsw-alias-bg-base:transparent!important',
  darkBodyChunk.indexOf('--dsw-alias-bg-base:transparent!important') >= 0,
  '深色块缺少这条：它只写在浅色块(权重 0-1-1)时，会被内核的 body[data-ds-dark-theme](同为 0-1-1) 按样式表顺序压掉 → 冷启动后天空图被不透明 #151517 盖满（热重载又好，因为皮肤表被重新追加到末尾）');
ok(SKYBASE, '浅色配色块的那条也必须带 !important（两处都要，与顺序无关）',
  (src.match(/--dsw-alias-bg-base:transparent!important/g) || []).length >= 2,
  '缺少 !important：冷启动时样式表顺序会让内核的深色底规则胜出');

// ------------------------------------------------------- [3] 输入框不随滚动移动
const SCROLL = '[3] 输入框固定';
ok(SCROLL, 'pinComposerSeat 存在且用 position:fixed（sticky 在此结构下会脱钩）',
  has('function pinComposerSeat()') && /seat\.style\.position = "fixed"/.test(src));
ok(SCROLL, '固定后用 padding-bottom 给最后一条消息让位',
  has('sc.style.paddingBottom = pad'));
ok(SCROLL, '视口 resize 时重新同步几何',
  has('addEventListener("resize", onResize)'));
ok(SCROLL, '拆除时复原内联样式',
  has('unpinComposerSeat,') && has('function unpinComposerSeat()'));
ok(SCROLL, '滚动链在会话滚动口被切断',
  has('[data-conversation-scroll]{overscroll-behavior:contain}'));
ok(SCROLL, '页面本体被钉成非滚动容器（inline !important，样式表会被内核规则压掉）',
  has('body.style.setProperty("overflow", "clip", "important")'));

// ------------------------------------------------------- [4] 悬停提示不被裁/被压
const TIP = '[4] 消息动作按钮的悬停提示';
ok(TIP, '消息视图的 inline clip-path 被解除（否则提示框会被整块裁掉）',
  /\[class\*=viewArea\]\{clip-path:none!important\}/.test(src));
ok(TIP, '输入框层级保持最低（z-index:1，不抢浮层层级）',
  /seat\.style\.zIndex = "1"/.test(src) && /\[data-composer-seat\]\{position:sticky;bottom:0;z-index:1\}/.test(src));
ok(TIP, '提示层被抬到输入框之上（[role=tooltip] / radix popper）',
  /\[role=tooltip\]\{z-index:9000!important\}/.test(src) &&
  /\[data-radix-popper-content-wrapper\]\{z-index:9000!important\}/.test(src));

// --------------------------------------------------------- [5] hero 输入框位置
const HEROBOX = '[5] 新会话（hero）输入框位置';
ok(HEROBOX, 'hero 态按「整体中线 + HERO_CENTER_SHIFT」摆位（居中偏下），不是钉底',
  /var HERO_CENTER_SHIFT = \d+/.test(src) &&
  /r\.top \+ r\.height \/ 2 \+ HERO_CENTER_SHIFT/.test(src) &&
  /isHero && r\.height > h \+ 120/.test(src));
ok(HEROBOX, 'hero 态不给滚动容器补 padding-bottom（否则凭空多出滚动条）',
  /isHero \? 0 : \(h > 0 \? h \+ 12 : 0\)/.test(src));
ok(HEROBOX, '预览版贴标与 小鲸鱼 / 文字横幅 同一水平中线（align-self:center）',
  /\[class\*=previewBadge\]\{align-self:center!important/.test(src));

// ------------------------------------------------------------- 抗漂移 / 加固
const HARD = '加固';
// 消息气泡/工具行绝不能再出现 backdrop-filter —— 它会创建 stacking context 并成为
// position:fixed 后代的包含块，把消息动作按钮的悬停提示(fixed + z-index:100)关进
// 气泡里，于是被固定输入框整层压住（「黑框被输入框挡住」就是这么来的）。
const bubbleRules = [...src.matchAll(/"(body\[data-dsh-air\][^"]*data-chat-flow-kind[^"]*)"/g)].map((m) => m[1]);
const trapped = bubbleRules.filter((r) => /backdrop-filter/.test(r));
ok(HARD, '消息气泡 / 工具行没有 backdrop-filter（否则悬停提示会被关进气泡的 stacking context）',
  trapped.length === 0,
  trapped.length ? `发现 ${trapped.length} 条：${trapped[0].slice(0, 60)}…` : '');
ok(HARD, '输入框层级保持最低（z-index:1，不压任何浮层）',
  /seat\.style\.zIndex = "1"/.test(src) && /\[data-composer-seat\]\{position:sticky;bottom:0;z-index:1\}/.test(src));
ok(HARD, '提示层被抬到输入框之上（[role=tooltip] / radix popper）',
  /\[role=tooltip\]\{z-index:9000!important\}/.test(src) &&
  /\[data-radix-popper-content-wrapper\]\{z-index:9000!important\}/.test(src));
const outside = src.slice(cssEnd);
const tokenLeaks = [...outside.matchAll(/__AIRMOD\(|__AIRSIDEBAR__|__AIRTITLEBAR__/g)];
const realLeaks = tokenLeaks.filter((m) => {
  const lineStart = outside.lastIndexOf('\n', m.index) + 1;
  const line = outside.slice(lineStart, outside.indexOf('\n', m.index));
  return !/^\s*(\*|\/\/)/.test(line) && !/out = out\.split/.test(line);
});
ok(HARD, 'CSS 模板令牌没有漏进 JavaScript（漏进去会抛 SyntaxError 并中断整个 apply）',
  realLeaks.length === 0,
  realLeaks.length ? `发现 ${realLeaks.length} 处：${realLeaks.slice(0, 3).map((m) => m[0]).join(', ')}` : '');
ok(HARD, '没有任何硬编码的 CSS Modules 哈希前缀',
  !/\[class\*=(pXSMma|wSkVaW|FJxK0a|SVAs4q)_/.test(src),
  '发现 v0.1.1 的旧哈希锚，内核升级后会静默全失效');
ok(HARD, '抗漂移：__AIRMOD 令牌 + sidebarSelector() 都在',
  has('function resolveCssTokens(') && has('function sidebarSelector()'));
ok(HARD, 'injectCss 每次 apply 都重写 stylesheet（热重载不会沿用旧 CSS）',
  /tag\.textContent = resolveCssTokens\(css\);/.test(src));
ok(HARD, '宿主半侧仍注册 /air-assets 静态路由',
  existsSync(INDEX) && readFileSync(INDEX, 'utf8').includes('/air-assets'));

// ----------------------------------------------------- 环境无关（不假定 EAC）
const ENV = '环境无关（纯网页版 / 其它桌面端也能用）';
const install = existsSync(join(ROOT, 'scripts', 'install.mjs'))
  ? readFileSync(join(ROOT, 'scripts', 'install.mjs'), 'utf8') : '';
ok(ENV, '安装脚本会自动判定 profile（不是硬编码）',
  install.includes('function detectProfile(') && install.includes('detectRunningProfile('));
ok(ENV, '--profile 没有硬编码成 web-desktop 兜底',
  !/: *'web-desktop'\s*;/.test(install) && !/\?\s*process\.argv\[idx \+ 1\]\s*:\s*'web-desktop'/.test(install));
ok(ENV, '指定非桌面壳 profile 时会跳过桌面壳的 assets/skins（防串台）',
  install.includes('targetIsShellProfile'));
ok(ENV, '提供环境体检脚本 scripts/doctor.mjs',
  existsSync(join(ROOT, 'scripts', 'doctor.mjs')));
// 桌面壳专属的 id 必须留在带兜底的 :is() 列表里（令牌 __AIRTITLEBAR__ 展开为
// `[class*=titlebar],#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__`），
// 不能变成无兜底的硬绑定 —— 否则在纯网页版上就是一条永不匹配的死规则。
const titlebarTokenOk =
  /var TITLEBAR_STABLE = "#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__"/.test(src) &&
  /split\("__AIRTITLEBAR__"\)\.join\("\[class\*=titlebar\]," \+ TITLEBAR_STABLE\)/.test(src);
const titlebarScopedOk = /:is\(__AIRTITLEBAR__\)\{/.test(src);
const titlebarBareBinding = /(^|[^:is(,])#__dsh_desktop_chrome__[^",)]*\{(?![^}]*\})/m.test(src.replace(/var TITLEBAR_STABLE[^;]*;/g, ''));
ok(ENV, '桌面壳专属选择器带 class*=titlebar 兜底且经 :is() 限定作用域',
  titlebarTokenOk && titlebarScopedOk && !titlebarBareBinding,
  `token=${titlebarTokenOk} scoped=${titlebarScopedOk} bare=${titlebarBareBinding}`);
ok(ENV, '文档说明了非 EAC 的安装/生效方式',
  ['README.md', 'INSTALL.md', 'AGENTS.md', 'INSTALL-MANUAL.md'].every((f) => {
    const p = join(ROOT, f);
    if (!existsSync(p)) return false;
    const t = readFileSync(p, 'utf8');
    return /纯网页版|网页版|其它桌面端|不是 EAC/.test(t);
  }));

// --------------------------------------------------------------- 语法检查
try {
  execFileSync(process.execPath, ['--check', CLIENT], { stdio: 'pipe' });
  execFileSync(process.execPath, ['--check', INDEX], { stdio: 'pipe' });
  ok(HARD, 'node --check 两个 JS 通过', true);
} catch (error) {
  ok(HARD, 'node --check 两个 JS 通过', false, String(error.stderr || error.message).slice(0, 200));
}

// --------------------------------------------------------------- 版本一致性
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const skinVer = (/var SKIN_VERSION = "([^"]+)"/.exec(src) || [])[1];
ok(HARD, 'package.json 与 client.js 版本一致', pkg.version === skinVer, `package=${pkg.version} client=${skinVer}`);

// ------------------------------------------------------------------- 输出
let group = '';
for (const r of results) {
  if (r.group !== group) { group = r.group; console.log(`\n=== ${group} ===`); }
  console.log(`${r.pass ? 'OK  ' : 'FAIL'}  ${r.label}${r.detail && !r.pass ? '  ← ' + r.detail : ''}`);
}

const version = pkg.version;
console.log(`\n包版本 : ${version}`);
console.log(`结果   : ${results.length - failed}/${results.length} 通过`);
if (failed) {
  console.log('结论   : 存在未修复/未加固项 ✗ —— 不要打包发出');
  process.exit(1);
}
console.log('结论   : 三类历史故障的修复全部在位 ✓ 可以打包');
