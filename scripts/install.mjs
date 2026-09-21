#!/usr/bin/env node
/**
 * ============================================================================
 * dsh-air-theme — 懒人安装脚本（AI 或用户直接执行）
 *
 * 用法:
 *   node scripts/install.mjs                 # 自动探测 EAC 与默认 profile 并安装
 *   node scripts/install.mjs --eac-root "A:\DSHapp\Deepseek Harness EAC"
 *   node scripts/install.mjs --profile web-desktop
 *   node scripts/install.mjs --dry-run       # 只打印将要执行的动作，不写盘
 *   node scripts/install.mjs --skip-patch    # 不动 profile 的 cordis.patch.yml
 *
 * 职责（幂等，可反复执行）:
 *   1. 把本包整树同步到 <EAC>\resources\app\assets\skins\air
 *      （EAC 桌面壳启动时从此处增量同步皮肤到 profile）
 *   2. 把本包整树同步到 <profile>\node_modules\@dsh-external\dsh-client-ui-skin-air
 *      （web 端即时加载目录，重载即生效）
 *   3. 写入 .eac-copy-stamp.json（壳的增量同步标记，格式与 EAC 壳 pluginStampOf 一致）
 *   4. 确保 profile cordis.patch.yml 中存在 ui-skin-air 启用行（幂等追加）
 *
 * 安全: 全部用 node fs 写盘（不经 PowerShell），不存在 UTF-8 破坏问题。
 * ============================================================================
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOME = process.env.USERPROFILE || process.env.HOME || '';
// Respect DSH_HOME exactly like the harness does (it overrides ~/.dsh).
const DSH_HOME = process.env.DSH_HOME || join(HOME, '.dsh');
const PROFILE_ROOT = join(DSH_HOME, 'profiles');
const PACKAGE_NAME = '@dsh-external/dsh-client-ui-skin-air';
const ROW_ID = 'ui-skin-air';

// —— 与 EAC 壳 pluginStampOf 一致的目录枚举（仅在没有壳可借用时兜底）——
const ROOT_FILES = ['package.json', 'dsh-plugin.json', 'skin.json', 'LICENSE', 'LICENSE.md', 'NOTICE',
  'NOTICE.md', 'README.md', 'README.zh.md', 'README.zh-CN.md', 'THIRD-PARTY-NOTICES.md',
  'EAC-ADAPTATION.md', 'index.js', 'client.js', 'recall-inject.js', 'cordis.patch.yml',
  'DESIGN.md', 'FRAMING.md', 'EDITORIAL.md', 'BREATH.md'];
const DIRS = ['lib', 'docs', 'preview', 'vendor', 'node_modules', 'data', 'assets', 'runtime',
  'src', 'client', 'styles'];

function collectEntries(src) {
  const out = [];
  const addFile = (rel) => { const p = join(src, rel); if (existsSync(p) && statSync(p).isFile()) out.push(rel); };
  const addDir = (rel) => {
    const d = join(src, rel);
    if (!existsSync(d) || !statSync(d).isDirectory()) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const sub = rel + '/' + e.name;
      if (e.isDirectory()) addDir(sub); else addFile(sub);
    }
  };
  for (const f of ROOT_FILES) addFile(f);
  for (const d of DIRS) addDir(d);
  return out;
}

/** FNV-1a 32 位滚动哈希（与壳 plugin-copy.js 的 stampHash 同算法）。 */
function stampHash(files) {
  let h = 0x811c9dc5;
  for (const f of files) {
    const s = `${f.rel}|${f.size}|${Math.round(f.mtimeMs)};`;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return (h >>> 0).toString(16);
}

/**
 * 计算壳同步标记。
 *
 * 优先直接借用 EAC 壳自己的 lib/plugin-copy.js —— 戳记里含逐文件 mtime 的滚动
 * 哈希，且哈希顺序取决于 readdir 顺序，照着抄一遍迟早会产生「算出来不一样、
 * 每次启动全量重拷」的假阴性。借壳计算 = 与壳后续判定逐字节一致。
 * 借不到时退回本地等价实现（内容一致，仅哈希顺序可能与壳不同：后果只是下一次
 * 冷启动多拷贝一次，无功能影响）。
 */
function computeStamp(src, eacAppRoot) {
  const pkg = JSON.parse(readFileSync(join(src, 'package.json'), 'utf8'));
  if (eacAppRoot) {
    try {
      const copy = createRequire(join(eacAppRoot, 'package.json'))(join(eacAppRoot, 'lib', 'plugin-copy.js'));
      const viaShell = copy.pluginStampOf(src);
      if (typeof viaShell === 'string' && viaShell.length) return { text: viaShell, exact: true };
    } catch { /* 借壳失败 → 本地兜底 */ }
  }
  const list = collectEntries(src);
  let bytes = 0;
  const acc = [];
  for (const rel of list) {
    const st = statSync(join(src, rel));
    bytes += st.size;
    acc.push({ rel, size: st.size, mtimeMs: st.mtimeMs });
  }
  return { text: JSON.stringify({ v: String(pkg.version || ''), f: list.length, b: bytes, h: stampHash(acc) }), exact: false };
}

function copyTree(src, dest, dryRun) {
  if (dryRun) { console.log(`  [dry] sync ${src} -> ${dest}`); return; }
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
}

/**
 * Locate the EAC "app root" — the directory that owns assets/skins — from a
 * running process. Two install layouts exist in the wild:
 *   new (EAC 4.x):  <root>\dsh-desktop\assets\skins      (shell = dsh-eac-shell.exe)
 *   legacy:         <root>\resources\app\assets\skins    (shell = "Deepseek Harness EAC.exe")
 */
function probeEacAppRootFromProcess() {
  if (process.platform !== 'win32') return undefined;
  const names = ['dsh-eac-shell', 'Deepseek Harness EAC'];
  for (const name of names) {
    try {
      const ps = `Get-Process -Name '${name}' -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1 -ExpandProperty Path`;
      const exe = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 8000 }).trim();
      if (!exe) continue;
      const root = resolve(exe, '..');
      for (const appRoot of [join(root, 'dsh-desktop'), join(root, 'resources', 'app')]) {
        if (existsSync(join(appRoot, 'assets', 'skins'))) return appRoot;
      }
    } catch { /* try next */ }
  }
  return undefined;
}

/** Resolve the EAC app root (owns assets/skins), or undefined when undetectable. */
function probeEacAppRoot() {
  const argv = process.argv;
  const explicit = (() => {
    const idx = argv.indexOf('--eac-root');
    if (idx >= 0 && argv[idx + 1]) return resolve(argv[idx + 1]);
    if (process.env.DSH_EAC_ROOT) return resolve(process.env.DSH_EAC_ROOT);
    return undefined;
  })();
  if (explicit) return normalizeAppRoot(explicit);
  const fromProc = probeEacAppRootFromProcess();
  if (fromProc) return fromProc;
  const candidates = [
    join(process.env.LOCALAPPDATA || '', 'Programs', 'Deepseek Harness EAC'),
    join(HOME, 'AppData', 'Local', 'Programs', 'Deepseek Harness EAC'),
    'C:\\Program Files\\Deepseek Harness EAC',
    'D:\\Deepseek Harness EAC',
    'A:\\DSHapp\\Deepseek Harness EAC',
  ];
  for (const c of candidates) {
    if (!c) continue;
    const found = normalizeAppRoot(c);
    if (found) return found;
  }
  return undefined;
}

/** Accept either an install root, an app root, or a skins dir; return the app root. */
function normalizeAppRoot(input) {
  const looksLikeAppRoot = (d) => existsSync(join(d, 'assets', 'skins')) || existsSync(join(d, 'lib', 'plugin-copy.js'));
  if (looksLikeAppRoot(input)) return input;
  for (const candidate of [join(input, 'dsh-desktop'), join(input, 'resources', 'app'), join(input, '..', '..')]) {
    if (looksLikeAppRoot(candidate)) return resolve(candidate);
  }
  return undefined;
}

/**
 * 找出「该装到哪个 profile」。
 *
 * profile 名不是固定的 —— EAC 桌面端用 `web-desktop`（壳通过 DSH_DESKTOP_PROFILE
 * 传给 dsh web 子进程），纯网页版 `dsh web` 通常是 `web`，别的桌面端/启动器又可能
 * 自定义。硬编码一个名字在别的环境里会把皮肤装进一个没人用的目录。按可信度依次探测：
 *   1. --profile <名>            （用户明确指定，最高优先）
 *   2. DSH_DESKTOP_PROFILE 环境变量（桌面壳注入）
 *   3. 正在运行的 dsh 进程命令行里的 --profile <名>  ← 最准：就是当前在跑的那个
 *   4. $DSH_HOME/profiles 下只有唯一一个 profile 目录
 *   5. 常见名兜底：web-desktop / web / default（存在才用）
 * 都不成立时返回 undefined，由调用方列出候选并提示用 --profile 指定。
 */
function listProfileNames() {
  if (!existsSync(PROFILE_ROOT)) return [];
  try {
    return readdirSync(PROFILE_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'))
      .map((e) => e.name);
  } catch { return []; }
}

function detectRunningProfile() {
  if (process.platform !== 'win32') return undefined;
  try {
    const ps = `Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ` +
      `Where-Object { $_.CommandLine -match 'dsh' -and $_.CommandLine -match '--profile' } | ` +
      `Select-Object -First 1 -ExpandProperty CommandLine`;
    const cmd = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 8000 }).trim();
    if (!cmd) return undefined;
    const m = /--profile\s+("[^"]+"|'[^']+'|\S+)/.exec(cmd);
    if (!m) return undefined;
    return m[1].replace(/^["']|["']$/g, '');
  } catch { return undefined; }
}

function detectProfile() {
  const fromArgv = (() => {
    const idx = process.argv.indexOf('--profile');
    return idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
  })();
  const running = detectRunningProfile();
  const fromShell = process.env.DSH_DESKTOP_PROFILE;
  // The desktop shell's own profile, whatever the target ends up being — used to
  // decide whether touching the shell's assets/skins is safe.
  const shell = fromShell || running;
  if (fromArgv) return { name: fromArgv, how: '--profile 参数指定', explicit: true, shell };
  if (fromShell) return { name: fromShell, how: 'DSH_DESKTOP_PROFILE 环境变量（桌面壳注入）', shell };
  if (running) return { name: running, how: '正在运行的 dsh 进程命令行（--profile）', shell };
  const all = listProfileNames();
  if (all.length === 1) return { name: all[0], how: 'profiles 目录下唯一的 profile' };
  for (const guess of ['web-desktop', 'web', 'default']) {
    if (all.includes(guess)) return { name: guess, how: `常见名兜底（profiles 下存在 ${guess}）` };
  }
  return { name: undefined, how: '无法判定', candidates: all };
}

const hasFlag = (name) => process.argv.includes(name);
const dryRun = hasFlag('--dry-run');
const skipPatch = hasFlag('--skip-patch');
const skipEac = hasFlag('--no-eac');
const detected = detectProfile();
const profile = detected.name;

if (!profile) {
  console.error('无法判定要装到哪个 profile。');
  console.error(`候选（${PROFILE_ROOT} 下）：${detected.candidates.length ? detected.candidates.join(', ') : '（一个都没有）'}`);
  console.error('');
  console.error('请显式指定，例如：');
  console.error('  node scripts/install.mjs --profile web          # 纯网页版 dsh web');
  console.error('  node scripts/install.mjs --profile web-desktop  # EAC 桌面端');
  console.error('');
  console.error('不确定叫什么？跑 `node scripts/doctor.mjs` 会告诉你当前正在跑的是哪个 profile。');
  process.exit(2);
}

// —— 定位目标 ——
// 只有当目标 profile 就是桌面壳自己管理的那个时，才去同步壳的 assets/skins。
// 否则（例如 --profile web 装纯网页版，而机器上恰好也装了 EAC）绝不能碰壳的
// 皮肤目录 —— 壳下次冷启动会把那里的皮肤推进它自己的 profile，造成串台。
const shellProfile = detected.shell;
const targetIsShellProfile = !detected.explicit || shellProfile === undefined || profile === shellProfile;
const eacAppRoot = (skipEac || !targetIsShellProfile) ? undefined : probeEacAppRoot();
const eacSkinDir = eacAppRoot ? join(eacAppRoot, 'assets', 'skins', 'air') : undefined;
const eacSkipReason = skipEac ? '跳过了桌面壳同步（--no-eac）'
  : !targetIsShellProfile ? `跳过了桌面壳同步（目标 profile "${profile}" ≠ 桌面壳管理的 "${shellProfile}"）`
  : undefined;
const profileDir = join(PROFILE_ROOT, profile);
const profilePkgDir = join(profileDir, 'node_modules', ...PACKAGE_NAME.split('/'));

console.log('=== dsh-air-theme 懒人安装 ===');
console.log(`包目录      : ${PACKAGE_ROOT}`);
console.log(`DSH home    : ${DSH_HOME}`);
console.log(`目标 profile : ${profile}   ← ${detected.how}`);
console.log(`环境判定     : ${eacSkinDir ? 'EAC 桌面端（会把整树同步到壳的 assets/skins）'
  : eacSkipReason ?? '未探测到 EAC 桌面壳 —— 只装 profile（纯网页版 / 其它桌面端走这条就够了）'}`);
console.log(`EAC 皮肤目录 : ${eacSkinDir ?? '（跳过）'}`);
console.log(`profile 安装 : ${profilePkgDir}`);
console.log(`干跑模式     : ${dryRun ? '是（不写盘）' : '否'}`);
console.log('');

let installed = false;

// 1) EAC assets 同步（壳重启后自动同步进 profile；也是皮肤选择器素材来源）
if (eacSkinDir) {
  copyTree(PACKAGE_ROOT, eacSkinDir, dryRun);
  console.log(`[1/4] EAC 皮肤目录已同步: ${eacSkinDir}`);
  installed = true;
} else {
  console.log(`[1/4] ${eacSkipReason ?? '跳过（未找到 EAC 桌面壳；仅安装 profile 目录即可生效）'}`);
}

// 2) profile 目录同步（web 端即时加载）
copyTree(PACKAGE_ROOT, profilePkgDir, dryRun);
console.log(`[2/4] profile 插件目录已同步: ${profilePkgDir}`);
installed = true;

// 3) 写入壳同步标记（戳记必须与壳逐字节一致，否则每次冷启动全量重拷）
if (!dryRun) {
  const stamp = computeStamp(PACKAGE_ROOT, eacAppRoot);
  writeFileSync(join(profilePkgDir, '.eac-copy-stamp.json'), stamp.text);
  console.log(`[3/4] 已写入 .eac-copy-stamp.json (${stamp.exact ? '借壳计算，与壳一致' : '本地兜底计算'}): ${stamp.text}`);
} else {
  const stamp = computeStamp(PACKAGE_ROOT, eacAppRoot);
  console.log(`[3/4] [dry] 将写入 .eac-copy-stamp.json: ${stamp.text}`);
}

// 4) 确保 profile 的 cordis.patch.yml 含启用行（幂等）
if (!skipPatch) {
  const patchFile = join(profileDir, 'cordis.patch.yml');
  const block = `\n# 《AIR》夏日青空 主题皮肤（dsh-air-theme）\n- insert:\n    - id: ${ROW_ID}\n      name: '${PACKAGE_NAME}'\n`;
  let needsAppend = true;
  if (existsSync(patchFile)) {
    const text = readFileSync(patchFile, 'utf8');
    if (text.includes(`id: ${ROW_ID}`)) needsAppend = false;
  }
  if (dryRun) {
    console.log(`[4/4] ${needsAppend ? '[dry] 将追加' : '已存在，无需追加'} ui-skin-air 行到 ${patchFile}`);
  } else if (needsAppend) {
    mkdirSync(dirname(patchFile), { recursive: true });
    writeFileSync(patchFile, (existsSync(patchFile) ? readFileSync(patchFile, 'utf8') : '') + block, 'utf8');
    console.log(`[4/4] 已追加 ui-skin-air 启用行: ${patchFile}`);
  } else {
    console.log(`[4/4] cordis.patch.yml 已包含 ui-skin-air（跳过）`);
  }
}

console.log('');
if (!installed) {
  console.log('!! 未执行任何安装。请检查参数后重试。');
  process.exit(1);
}
if (dryRun) {
  console.log('（干跑结束：以上为将要执行的动作，未写盘）');
  process.exit(0);
}
console.log('安装完成。接下来：');
console.log('  1) 若 EAC 桌面端在运行：先完全退出再启动（壳同步 assets/skins 需要重启）；');
console.log('     或仅需 web 端生效：Ctrl+R 重载页面即可（profile 目录已是最新）。');
console.log('  2) 打开 设置 → 皮肤，确认「AIR·夏日青空」已启用（若其它皮肤启用会互斥，请切换）。');
console.log('  3) 验证：页面 body 应出现 data-dsh-air 属性；背景为观铃夏日青空；');
console.log('     输入框卡片上边外侧左角有两个芯片按钮(DSHapp / Router Standard)，不与标题重叠；');
console.log('     打开技能/模型等折叠菜单不被芯片遮挡。');
console.log('  4) 安装说明与 AI 引导详见包内 INSTALL.md。');
