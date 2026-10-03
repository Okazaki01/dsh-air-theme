#!/usr/bin/env node
/**
 * ============================================================================
 * dsh-air-theme — 发布前自检
 *
 * 用法:
 *   node tools/check-release.mjs             # 全量（默认）
 *   node tools/check-release.mjs --syntax-only
 *
 * 它不看安装结果，只看这个包本身是否**确实包含**全部修复与商店合规要件，
 * 任何一条不满足就退出码 1。改代码后、打包前必须跑。
 *
 * 覆盖四类：
 *   [A] 三轮历史故障的修复是否在位（品牌行 / hero 标题行 / 输入框固定 / 悬停提示 …）
 *   [B] 抗漂移加固（令牌不得漏进 JS、不得硬编码 CSS Modules 哈希 …）
 *   [C] 环境无关（纯网页版 / 其它桌面端也能用）
 *   [D] DSH Store 自动准入合规（权限信号、chunk 契约、体积预算、manifest 声明）
 *
 * 注：[D] 组是**近似复现**商店侧的判定（在注释/字符串被剥离后的源码上匹配）。
 * 权威判定仍在 DSH Store 的 src/automation-source-policy.mjs，这里只求改代码时
 * 第一时间发现回归。
 * ============================================================================
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = join(ROOT, 'lib', 'client.js');
const INDEX = join(ROOT, 'lib', 'index.js');
const SYNTAX_ONLY = process.argv.includes('--syntax-only');

if (!existsSync(CLIENT)) {
  console.error('找不到 lib/client.js —— 请在包根目录运行');
  process.exit(2);
}
const src = readFileSync(CLIENT, 'utf8');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

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

// --- 源码清洗 -----------------------------------------------------------------
// 商店判定是在「注释与字符串都被抹掉」的源码上做的，所以自检也要这样，否则
// 注释里留的历史说明（例如「v0.2.5 用过 node:fs」）会被误判成真的还在读文件。
/** 抹掉注释与字符串内容（长度保持不变，便于定位）。 */
function stripCommentsAndStrings(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const c2 = text[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && text[i] !== '\n') { out += ' '; i++; } continue; }
    if (c === '/' && c2 === '*') {
      out += '  '; i += 2;
      while (i < n && !(text[i] === '*' && text[i + 1] === '/')) { out += text[i] === '\n' ? '\n' : ' '; i++; }
      out += '  '; i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      out += ' '; i++;
      while (i < n && text[i] !== c) {
        if (text[i] === '\\') { out += '  '; i += 2; continue; }
        out += text[i] === '\n' ? '\n' : ' '; i++;
      }
      out += ' '; i++; continue;
    }
    out += c; i++;
  }
  return out;
}
/** 只去掉整行注释（保留字符串），用于形如 `from 'node:fs'` 的导入检测。 */
function stripLineComments(text) {
  return text.split('\n').filter((line) => !/^\s*(?:\/\/|\*|\/\*)/.test(line)).join('\n');
}

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
const bubbleRules = [...src.matchAll(/"(body\[data-dsh-air\][^"]*data-chat-flow-kind[^"]*)"/g)].map((m) => m[1]);
const trapped = bubbleRules.filter((r) => /backdrop-filter/.test(r));
ok(HARD, '消息气泡 / 工具行没有 backdrop-filter（否则悬停提示会被关进气泡的 stacking context）',
  trapped.length === 0,
  trapped.length ? `发现 ${trapped.length} 条：${trapped[0].slice(0, 60)}…` : '');
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

// 宿主半侧：v0.2.6 起必须零 I/O（这是商店自动准入的硬条件）
const indexSrc = existsSync(INDEX) ? readFileSync(INDEX, 'utf8') : '';
const indexCode = stripCommentsAndStrings(indexSrc);
ok(HARD, '宿主半侧不再注册 /air-assets 路由、不再 import node:fs（v0.2.6 起改为纯空壳）',
  !/\/air-assets/.test(indexCode) && !/node:fs/.test(indexCode) && !/webServer/.test(indexCode),
  '宿主半侧的 fs / 路由能力会让商店自动准入命中 files 权限信号');
ok(HARD, '客户端资源改为 chunk 异步拉取（loadArt + require.async）',
  has('function loadArt()') && has('require.async(spec)') && has('grab("./client.art.js")'));

// ----------------------------------------------------- 环境无关（不假定 EAC）
const ENV = '环境无关（纯网页版 / 其它桌面端也能用）';
const titlebarTokenOk =
  /var TITLEBAR_STABLE = "#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__"/.test(src) &&
  /split\("__AIRTITLEBAR__"\)\.join\("\[class\*=titlebar\]," \+ TITLEBAR_STABLE\)/.test(src);
const titlebarScopedOk = /:is\(__AIRTITLEBAR__\)\{/.test(src);
const titlebarBareBinding = /(^|[^:is(,])#__dsh_desktop_chrome__[^",)]*\{(?![^}]*\})/m.test(src.replace(/var TITLEBAR_STABLE[^;]*;/g, ''));
ok(ENV, '桌面壳专属选择器带 class*=titlebar 兜底且经 :is() 限定作用域',
  titlebarTokenOk && titlebarScopedOk && !titlebarBareBinding,
  `token=${titlebarTokenOk} scoped=${titlebarScopedOk} bare=${titlebarBareBinding}`);
ok(ENV, '文档说明了非 EAC 的安装/生效方式',
  ['README.md', 'INSTALL.md', 'AGENTS.md', 'INSTALL-AI.md'].every((f) => {
    const p = join(ROOT, f);
    if (!existsSync(p)) return false;
    return /纯网页版|网页版|其它桌面端|不是 EAC/.test(readFileSync(p, 'utf8'));
  }));

// ============================================================================
// [6] DSH Store 自动准入合规
// ============================================================================
const STORE = '[6] DSH Store 自动准入合规';

// 与商店 src/package-source-surface.mjs 一致的文件面
const SCANNABLE_SOURCE = /\.(?:[cm]?[jt]sx?|json|ya?ml|sh|bash|zsh|fish|py|rb|php|go|rs|java|kt|kts|swift|cs|c|cc|cpp|h|hpp|ps1|psm1|cmd|bat|html?|vue|svelte)$/i;
const MAX_FILE_BYTES = 262144;
const MAX_TOTAL_BYTES = 2097152;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// 展开 manifest.files（商店只审这一面）。选择器必须全是字面路径/目录，
// 否则商店会退回「整包」并连带扫描 tools/。
const selectorUnsupported = (pkg.files ?? []).filter((sel) => /[!{}()[\]?]/.test(sel) || sel.includes('**'));
ok(STORE, 'manifest.files 显式声明且选择器全部可解析（无 !{}()[]? 与 **）',
  Array.isArray(pkg.files) && pkg.files.length > 0 && selectorUnsupported.length === 0,
  selectorUnsupported.length ? `不支持的选择器：${selectorUnsupported.join(', ')}` : '');

const selected = new Set();
for (const sel of pkg.files ?? []) {
  const clean = sel.replace(/^\.\//, '').replace(/\/$/, '');
  const full = join(ROOT, clean);
  if (!existsSync(full)) continue;
  if (statSync(full).isDirectory()) for (const f of walk(full)) selected.add(relative(ROOT, f).split(sep).join('/'));
  else selected.add(clean);
}
for (const f of walk(ROOT)) {
  const rel = relative(ROOT, f).split(sep).join('/');
  if (!rel.includes('/') && /^(?:package\.json|licen[cs]e(?:\..*)?|readme(?:\..*)?|copying(?:\..*)?)$/i.test(rel)) selected.add(rel);
}

ok(STORE, 'tools/ 不在分发面内（开发脚本含 fs/child_process，不能进商店扫描面）',
  ![...selected].some((f) => f.startsWith('tools/')),
  'tools/ 一旦进 files 就会命中 files/commands/credentials 权限信号');

// ---- 权限信号（近似复现商店 permissionSignals；清洗函数定义在文件开头）----

const SIGNAL_RULES = [
  ['files', [
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["'](?:node:)?(?:fs|fs\/promises)["']/i,
    /\b(?:readFile|writeFile|appendFile|rename|unlink|mkdir|rmdir|rm)\s*\(/i,
    /\bprocess\s*\.\s*env\s*\.\s*DSH_HOME\b/i,
  ]],
  ['network', [
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["'](?:node:)?(?:http|https|net|tls|dgram|axios|got|undici)["']/i,
    /\b(?:fetch|WebSocket|EventSource)\s*\(/i,
    /\b(?:axios|got|undici)\s*(?:\.|\()/i,
  ]],
  ['commands', [
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["'](?:node:)?child_process["']/i,
    /(?:^|[^\w$.'"`])(?:exec|execFile|spawn|fork)\s*\(/im,
    /shell\s*:\s*true|Bun\.spawn|new\s+Deno\.Command/i,
  ]],
  ['credentials', [
    /process\s*\.\s*env/i,
    /\b(?:keychain|credentials?|oauth)\b\s*(?:\.|\[|\()/i,
    /\b(?:api[_-]?key|apiKey|access[_-]?token|accessToken|client[_-]?secret|clientSecret|password)\b/i,
  ]],
  ['protectedDsh', [
    /\b(?:__ModuleLoader__|loader|fiber|Loader|Fiber)\s*(?:\?\.|\.)\s*(?:unload|insert|remove|patch|enable|disable|write|mutate|replace)\s*(?:\?\.)?\s*\(/i,
  ]],
];

let signalHits = [];
let runtimeFiles = 0;
let totalBytes = 0;
let oversize = [];
for (const rel of [...selected].sort()) {
  const abs = join(ROOT, rel.split('/').join(sep));
  const text = readFileSync(abs, 'utf8');
  if (!SCANNABLE_SOURCE.test(rel)) continue;
  runtimeFiles++;
  const bytes = Buffer.byteLength(text, 'utf8');
  totalBytes += bytes;
  if (bytes > MAX_FILE_BYTES) oversize.push(`${rel} (${bytes})`);
  // 导入类规则（`from 'node:fs'` 等）含字符串字面量，必须在保留字符串的版本上测；
  // 其余规则在抹掉注释与字符串的版本上测。两者合并 = 偏保守，宁可误报不放过。
  const code = `${stripCommentsAndStrings(text)}\n${stripLineComments(text)}`;
  for (const [signal, rules] of SIGNAL_RULES) {
    for (const rule of rules) {
      if (rule.test(code)) { signalHits.push(`${signal}@${rel}`); break; }
    }
  }
}
for (const [signal] of SIGNAL_RULES) {
  const hits = signalHits.filter((h) => h.startsWith(`${signal}@`));
  ok(STORE, `权限信号 ${signal} 零命中`,
    hits.length === 0,
    hits.length ? `命中：${hits.slice(0, 4).join(', ')} —— 商店会因此拒绝自动安装` : '');
}
ok(STORE, `runtime 单文件不超过 256 KiB（最大 ${MAX_FILE_BYTES} B）`,
  oversize.length === 0, oversize.length ? oversize.join(', ') : '');
ok(STORE, `runtime 总量不超过 2 MiB（当前 ${totalBytes} B = ${(totalBytes / MAX_TOTAL_BYTES * 100).toFixed(1)}%）`,
  totalBytes <= MAX_TOTAL_BYTES, `超限 ${totalBytes - MAX_TOTAL_BYTES} B`);
ok(STORE, `runtime 文件数不超过 240（当前 ${runtimeFiles}）`, runtimeFiles <= 240);

// ---- 资源 chunk 契约（内核 CLIENT_CHUNK / chunkId）----
const CLIENT_CHUNK = /^client\.[A-Za-z0-9][A-Za-z0-9._-]*\.js$/;
const libDir = join(ROOT, 'lib');
const chunkNames = readdirSync(libDir).filter((f) => f !== 'client.js' && CLIENT_CHUNK.test(f));
// client.js 里 grab("./client.x.js") 引用的 chunk 必须都在（从去注释的源码里取，
// 否则头部注释里的示例会被当成真引用）。
const referenced = [...stripLineComments(src).matchAll(/grab\("\.\/(client\.[^"]+)"\)/g)].map((m) => m[1]);
const missing = referenced.filter((f) => !existsSync(join(libDir, f)));
ok(STORE, 'client.js 引用的每个 chunk 都在 lib/ 里',
  referenced.length > 0 && missing.length === 0,
  missing.length ? `缺失：${missing.join(', ')}` : '没有 require.async 引用');
ok(STORE, '每个 chunk 都按 <包名>/<文件名> 注册（内核 chunkId 契约）',
  chunkNames.length > 0 && chunkNames.every((f) => {
    const text = readFileSync(join(libDir, f), 'utf8');
    return text.includes(`window.__ModuleLoader__.load(`) && text.includes(`id: "${pkg.name}/${f}"`);
  }),
  chunkNames.filter((f) => !readFileSync(join(libDir, f), 'utf8').includes(`id: "${pkg.name}/${f}"`)).join(', '));
ok(STORE, '每个 chunk 的文件名符合内核 CLIENT_CHUNK 白名单',
  chunkNames.length > 0 && chunkNames.every((f) => CLIENT_CHUNK.test(f)));

// ---- manifest 声明 ----
const manifestRepo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
const repoCanonical = String(manifestRepo ?? '').replace(/^git\+/, '').replace(/\.git\/?$/i, '').replace(/\/$/, '');
ok(STORE, 'manifest 声明了 canonical GitHub 仓库地址',
  /^https:\/\/github\.com\/[^/]+\/[^/]+$/.test(repoCanonical), `repository=${repoCanonical || '(缺失)'}`);
ok(STORE, 'manifest 声明了 DSH 兼容范围（dsh.compatibility.dsh）',
  typeof pkg.dsh?.compatibility?.dsh === 'string' && pkg.dsh.compatibility.dsh.trim() !== '');
ok(STORE, 'manifest 声明了 Node.js 兼容范围（engines.node）',
  typeof pkg.engines?.node === 'string' && pkg.engines.node.trim() !== '');
ok(STORE, 'manifest 声明了 Bundle Patch（dsh.bundle.patch）',
  pkg.dsh?.bundle?.patch === './cordis.patch.yml' && existsSync(join(ROOT, 'cordis.patch.yml')));
ok(STORE, 'manifest 没有运行时/可选依赖（dependencies / optionalDependencies 为空）',
  Object.keys(pkg.dependencies ?? {}).length === 0 && Object.keys(pkg.optionalDependencies ?? {}).length === 0);
const lifecycle = ['preinstall', 'install', 'postinstall', 'prepare'].filter((k) => typeof pkg.scripts?.[k] === 'string');
ok(STORE, 'manifest 没有安装生命周期脚本（preinstall/install/postinstall/prepare）',
  lifecycle.length === 0, lifecycle.join(', '));
const pluginRows = readFileSync(join(ROOT, 'cordis.patch.yml'), 'utf8');
ok(STORE, 'Bundle Patch 只 insert 自己的行，未禁用/替换 @deepseek-ai/*',
  /- id:\s*ui-skin-air/.test(pluginRows) && !/@deepseek-ai/.test(pluginRows.replace(/name:\s*'[^']*'/g, '')));

// ---- 许可证 ---------------------------
const LICENSE_FILE = join(ROOT, 'LICENSE');
const licenseText = existsSync(LICENSE_FILE) ? readFileSync(LICENSE_FILE, 'utf8') : '';
ok(STORE, 'LICENSE 是 CC-BY-SA-4.0 完整法律文本（GitHub licensee 才认得出 spdx-id）',
  /Attribution-ShareAlike 4.0 International/i.test(licenseText)
  && /Creative Commons Corporation/.test(licenseText)
  && licenseText.length > 15000,
  `LICENSE ${licenseText.length} 字符`);
ok(STORE, 'manifest.license 与 LICENSE 正文一致（CC-BY-SA-4.0）',
  pkg.license === 'CC-BY-SA-4.0' && /Attribution-ShareAlike 4.0 International/i.test(licenseText),
  `manifest=${pkg.license}`);

// ---- 不得残留旧架构 ---------------------------
ok(STORE, '客户端不再引用已废弃的 /air-assets 路由',
  !src.includes('/air-assets'), '仍存在 /air-assets 引用');

// --------------------------------------------------------------- 语法检查
const jsFiles = readdirSync(libDir).filter((f) => f.endsWith('.js')).map((f) => join(libDir, f));
let syntaxBad = [];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (error) {
    syntaxBad.push(`${relative(ROOT, file)}: ${String(error.stderr || error.message).slice(0, 120)}`);
  }
}
ok(HARD, `node --check 全部 lib/*.js 通过（${jsFiles.length} 个文件）`,
  syntaxBad.length === 0, syntaxBad.join(' | '));

// --------------------------------------------------------------- 版本一致性
const skinVer = (/var SKIN_VERSION = "([^"]+)"/.exec(src) || [])[1];
ok(HARD, 'package.json 与 client.js 版本一致', pkg.version === skinVer, `package=${pkg.version} client=${skinVer}`);

// ------------------------------------------------------------------- 输出
if (!SYNTAX_ONLY) {
  let group = '';
  for (const r of results) {
    if (r.group !== group) { group = r.group; console.log(`\n=== ${group} ===`); }
    console.log(`${r.pass ? 'OK  ' : 'FAIL'}  ${r.label}${r.detail && !r.pass ? '  ← ' + r.detail : ''}`);
  }
}

console.log(`\n包版本   : ${pkg.version}`);
console.log(`分发面   : ${selected.size} 个文件，其中 runtime 可扫描 ${runtimeFiles} 个 / ${totalBytes} B`);
console.log(`结果     : ${results.length - failed}/${results.length} 通过`);
if (failed) {
  console.log('结论     : 存在未修复/不合规项 ✗ —— 不要打包发出');
  process.exit(1);
}
console.log('结论     : 全部在位 ✓ 可以打包');
