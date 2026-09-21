#!/usr/bin/env node
/**
 * ============================================================================
 * dsh-air-theme — 锚点死活检查（对着已安装的内核跑）
 *
 * 用法:
 *   node scripts/check-anchors.mjs
 *   node scripts/check-anchors.mjs --eac-root "A:\DSHapp\Deepseek Harness EAC"
 *   node scripts/check-anchors.mjs --kernel "<...>\dsh-desktop\node_modules\@deepseek-ai"
 *
 * 为什么需要它：DSH 的界面用 CSS Modules 构建，应用侧类名是 `<hash>_<key>`，
 * `<hash>` 由源码路径派生、随内核版本漂移（见 INSTALL.md 红线 7）。写死哈希的
 * 选择器不会报错，只会静默失效 —— v0.1.1 的侧栏 / 标题胶囊 / 标题栏选项卡 /
 * 输入框底部信息行就是这样整体失效的。
 *
 * 本脚本把 lib/client.js 里用到的每一类锚点拿去和真实内核比对：
 *   - [class*=key] 免前缀锚          必须命中至少一个真实类名
 *   - __AIRMOD(模块|key) 令牌        必须能在该模块自己的类名表里找到 key
 *   - data-* 契约锚                  内核必须真的在用
 *   - 桌面壳 id / 结构锚              必须在壳代码或内核里能找到
 *
 * 退出码：真实锚点全部存活 = 0；存在失效 = 1（可用于 CI / 升级内核后自检）。
 * ============================================================================
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = join(PACKAGE_ROOT, 'lib', 'client.js');

const argv = process.argv;
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
};

/** 只在令牌展开里作为「历史兼容备选」出现的锚点：失效无害，单独列为 INFO。 */
const BACKCOMPAT = new Set(['sidebarCol', 'sidebarRoot', 'titlebar']);
/** 已知的历史遗留 no-op 选择器（v0.1.1 起内核就没有对应类名）：装饰不生效但无害。 */
const KNOWN_NOOP = new Set(['Refresh', 'runState', 'stateDot']);

/** 定位内核客户端包目录 + EAC 桌面壳目录。 */
function locateTargets() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const roots = [];
  const eacRoot = argOf('--eac-root') || process.env.DSH_EAC_ROOT;
  if (eacRoot) roots.push(resolve(eacRoot));
  for (const c of [
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Deepseek Harness EAC'),
    join(home, 'AppData', 'Local', 'Programs', 'Deepseek Harness EAC'),
    'C:\\Program Files\\Deepseek Harness EAC',
    'A:\\DSHapp\\Deepseek Harness EAC',
  ]) if (c) roots.push(c);

  const explicit = argOf('--kernel');
  if (explicit) return { kernel: resolve(explicit), shellDirs: [] };

  for (const root of roots) {
    for (const appRoot of [join(root, 'dsh-desktop'), join(root, 'resources', 'app')]) {
      const kernel = join(appRoot, 'node_modules', '@deepseek-ai');
      if (existsSync(kernel)) return { kernel, shellDirs: [join(root, 'sidecar'), appRoot] };
    }
  }
  const shared = join(home, '.dsh', 'profiles', 'node_modules', '@deepseek-ai');
  if (existsSync(shared)) return { kernel: shared, shellDirs: [] };
  return undefined;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

const targets = locateTargets();
if (!targets) {
  console.error('未找到内核目录；请用 --eac-root 或 --kernel 指定。');
  process.exit(2);
}
const { kernel, shellDirs } = targets;
console.log(`内核目录 : ${kernel}`);
console.log(`壳目录   : ${shellDirs.length ? shellDirs.join(' ; ') : '（未探测到，跳过壳锚判定）'}`);
console.log(`皮肤文件 : ${CLIENT}\n`);

// —— 采集 ——
const classNames = new Set();            // 全部真实类名
const classOwner = new Map();            // 类名 -> 包名
const moduleClasses = new Map();         // 模块文件名 -> Set(类名)，精确按声明顺序配对
const dataAttrs = new Set();
const elementIds = new Set();

/** 精确配对：同一文件里 tagId 与紧随其后的 CSS Modules 类名表一一对应。 */
function indexFile(file, pkg) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return; }
  const tagIds = [...text.matchAll(/const tagId[^=]*= "([^"]+\.module\.css)"/g)];
  const maps = [];
  const mapRe = /module_css_default = \{([^}]*)\}/g;
  let m;
  while ((m = mapRe.exec(text))) {
    const classes = [...m[1].matchAll(/"([A-Za-z][A-Za-z0-9]*)":\s*"([A-Za-z_][A-Za-z0-9]*)_\1"/g)]
      .map((k) => `${k[2]}_${k[1]}`);
    maps.push({ index: m.index, classes });
  }
  for (const t of tagIds) {
    const moduleName = t[1].split('/').pop();
    // 该 tagId 之后最近的一个类名表就是它自己的
    const next = maps.find((x) => x.index > t.index);
    if (!next) continue;
    if (!moduleClasses.has(moduleName)) moduleClasses.set(moduleName, new Set());
    for (const c of next.classes) moduleClasses.get(moduleName).add(c);
  }
  for (const c of moduleClasses.get(tagIds.length ? '' : '') ?? []) void c;
  // 全局类名集合（用于 [class*=key] 判定）—— 取所有类名表
  for (const map of maps) for (const c of map.classes) {
    classNames.add(c);
    if (!classOwner.has(c)) classOwner.set(c, pkg);
  }
  for (const d of text.matchAll(/(data-[a-z0-9-]{3,})/g)) dataAttrs.add(d[1]);
}

for (const f of walk(kernel)) {
  const pkg = f.slice(kernel.length + 1).split(/[\\/]/)[0];
  indexFile(f, pkg);
}
// 壳侧（sidecar/bridge.js 等）：只收 id / className / data-*
for (const dir of shellDirs) {
  for (const f of walk(dir)) {
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    for (const m of text.matchAll(/\.id\s*=\s*(?:([A-Za-z_][\w]*)|'([^']+)'|"([^"]+)")/g)) elementIds.add(m[1] || m[2] || m[3]);
    for (const m of text.matchAll(/var [A-Z_]*ID = '([^']+)'/g)) elementIds.add(m[1]);
    for (const d of text.matchAll(/(data-[a-z0-9-]{3,})/g)) dataAttrs.add(d[1]);
  }
}

const skin = readFileSync(CLIENT, 'utf8');
let dead = 0;
const info = [];
const report = (kind, anchor, ok, detail) => {
  console.log(`${ok ? 'OK  ' : 'DEAD'}  ${kind.padEnd(9)} ${anchor.padEnd(44)} ${detail}`);
};

// —— 1. [class*=X]（排除只作兼容备选的）——
console.log('=== [class*=X] 免前缀锚 ===');
const classAnchors = [...new Set([...skin.matchAll(/\[class\*=([A-Za-z_][A-Za-z0-9_]*)\]/g)].map((m) => m[1]))].sort();
for (const a of classAnchors) {
  if (BACKCOMPAT.has(a)) { info.push(`[class*=${a}] 历史兼容备选（令牌内并列，失效无害）`); continue; }
  // CSS 的 [class*=X] 是子串匹配，所以这里也必须用子串：写死 endsWith 会把
  // [class*=Badge] 判死（真实类名是 <hash>_previewBadge）。
  const hits = [...classNames].filter((c) => c.includes(a));
  if (KNOWN_NOOP.has(a)) { info.push(`[class*=${a}] 遗留 no-op（当前内核无此类名，装饰不生效但无害）`); continue; }
  if (!hits.length) dead++;
  report('[class*=]', a, hits.length > 0, hits.length ? `${hits.length} 个（如 ${hits[0]}）` : '内核中不存在');
}

// —— 2. __AIRMOD 令牌 ——
console.log('\n=== __AIRMOD(模块|key) 令牌 ===');
const modTokens = [...new Set([...skin.matchAll(/__AIRMOD\(([^)]*)\)__/g)].map((m) => m[1]))].filter((t) => !t.includes('<'));
for (const t of modTokens) {
  const [sheet, key] = t.split('|');
  const owned = [...(moduleClasses.get(sheet) ?? [])].filter((c) => c.endsWith('_' + key));
  if (!owned.length) dead++;
  report('__AIRMOD', `${sheet}|${key}`, owned.length > 0,
    owned.length ? `-> .${owned[0]}` : `模块 ${sheet} 的类名表里没有 key "${key}"`);
}

// —— 3. 具名令牌 ——
console.log('\n=== 具名令牌 ===');
const sidebarOk = [...classNames].some((c) => c.endsWith('_logoRow')) || [...classNames].some((c) => c.endsWith('_root'));
if (!sidebarOk) dead++;
report('token', '__AIRSIDEBAR__', sidebarOk, sidebarOk ? '结构锚 :has(> [class*=logoRow]) 恒定可用' : '既无 logoRow 也无 root 类名');
const titleOk = elementIds.has('__dsh_desktop_chrome__') || !shellDirs.length;
if (!titleOk) dead++;
report('token', '__AIRTITLEBAR__', titleOk, titleOk ? (elementIds.has('__dsh_desktop_chrome__') ? '已核 #__dsh_desktop_chrome__' : '壳目录不可用，跳过') : '壳中未找到标题栏 id');

// —— 4. 稳定契约 ——
console.log('\n=== data-* 稳定契约 ===');
for (const a of ['data-composer-placeholder', 'data-composer-card', 'data-composer-seat', 'data-phase',
  'data-chat-flow-kind', 'data-conversation-composer-overlay', 'data-slot', 'data-ds-dark-theme']) {
  if (!skin.includes(a)) continue;
  const ok = dataAttrs.has(a);
  if (!ok) dead++;
  report('data-*', a, ok, ok ? '内核已核' : '内核未使用该属性');
}

if (info.length) {
  console.log('\n=== 提示（不计入失败）===');
  for (const line of info) console.log('INFO  ' + line);
}

console.log(`\n扫描：${classNames.size} 个 CSS Modules 类名，${moduleClasses.size} 个模块，${dataAttrs.size} 个 data-* 属性`);
console.log(dead === 0 ? '结论：全部真实锚点存活 ✓' : `结论：${dead} 个锚点已失效 ✗ —— 按 INSTALL.md 红线 7 改用免前缀锚或 __AIRMOD 令牌`);
process.exit(dead === 0 ? 0 : 1);
