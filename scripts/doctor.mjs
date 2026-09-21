#!/usr/bin/env node
/**
 * ============================================================================
 * dsh-air-theme — 环境体检 / 排障（`node scripts/doctor.mjs`）
 *
 * 这个包本来是按 EAC 桌面端写的，但用的人可能：
 *   - 用纯网页版（自己跑 `dsh web`，浏览器打开）
 *   - 用别的桌面端 / 启动器
 *   - 用 EAC，但版本不同、目录布局不同、profile 名不同
 * 皮肤能不能生效只取决于三件事：**装进了哪个 profile、那个 profile 有没有启用行、
 * 运行中的宿主有没有重启**。本脚本把这三件事查清楚，并给出这个环境**专属**的下一步。
 *
 * 只读，不写任何文件。
 * ============================================================================
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOME = process.env.USERPROFILE || process.env.HOME || '';
const DSH_HOME = process.env.DSH_HOME || join(HOME, '.dsh');
const PROFILE_ROOT = join(DSH_HOME, 'profiles');
const PACKAGE_NAME = '@dsh-external/dsh-client-ui-skin-air';
const ROW_ID = 'ui-skin-air';

const line = (s = '') => console.log(s);
const section = (t) => { line(); line(`=== ${t} ===`); };

const readJson = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return undefined; } };
const readText = (p) => { try { return readFileSync(p, 'utf8'); } catch { return undefined; } };

line('========================================================================');
line(' dsh-air-theme 环境体检（只读，不改任何文件）');
line('========================================================================');
line(`包目录   : ${PACKAGE_ROOT}`);
line(`DSH home : ${DSH_HOME}${process.env.DSH_HOME ? '  (来自 DSH_HOME 环境变量)' : ''}`);

// ---------------------------------------------------------------- 1) 运行中的 dsh
section('1. 正在运行的 DSH 进程');
const procs = [];
if (process.platform === 'win32') {
  try {
    // NB: Windows PowerShell 5.1's ConvertTo-Json has no -AsArray; force an array
    // by wrapping with @() and normalize on the JS side.
    const ps = `@(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | ` +
      `Where-Object { $_.CommandLine -match 'dsh' } | ` +
      `Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress`;
    const raw = execFileSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 9000 }).trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const p of Array.isArray(parsed) ? parsed : [parsed]) procs.push({ pid: p.ProcessId, cmd: p.CommandLine || '' });
    }
  } catch { /* 探测失败不致命 */ }
}
let runningProfile;
for (const p of procs) {
  const m = /--profile\s+("[^"]+"|'[^']+'|\S+)/.exec(p.cmd);
  const prof = m ? m[1].replace(/^["']|["']$/g, '') : undefined;
  const port = (/--port\s+(\d+)/.exec(p.cmd) || [])[1];
  const isWeb = /\bdsh[\\/].*bin\.js|dsh\s+web|lib[\\/]bin\.js/.test(p.cmd) || /--port/.test(p.cmd);
  if (prof && !runningProfile && isWeb) runningProfile = prof;
  line(`  PID ${String(p.pid).padEnd(7)} profile=${prof ?? '(未指定 → 默认)'}${port ? '  port=' + port : ''}`);
}
if (!procs.length) {
  line('  没有探测到正在运行的 dsh 进程（纯网页版可能手动启动、或当前没开）。');
  line('  → 这不影响安装，但「装完必须重启宿主」这一步得由你自己来完成。');
}
line();
line(`  DSH_DESKTOP_PROFILE 环境变量 : ${process.env.DSH_DESKTOP_PROFILE ?? '(未设置)'}`);
line(`  据此判断的「桌面壳 profile」  : ${process.env.DSH_DESKTOP_PROFILE || runningProfile || '(判定不出)'}`);

// ---------------------------------------------------------------- 2) profiles
section('2. 本机所有 profile 及皮肤安装状态');
const profiles = existsSync(PROFILE_ROOT)
  ? readdirSync(PROFILE_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'))
    .map((e) => e.name)
  : [];
if (!profiles.length) {
  line(`  ${PROFILE_ROOT} 下没有任何 profile —— DSH 可能还没跑过，或 DSH_HOME 不是这里。`);
}

const state = [];
for (const name of profiles) {
  const dir = join(PROFILE_ROOT, name);
  const pkgDir = join(dir, 'node_modules', ...PACKAGE_NAME.split('/'));
  const patchFile = join(dir, 'cordis.patch.yml');
  const patch = readText(patchFile);

  const hasPkg = existsSync(join(pkgDir, 'package.json'));
  const installedVersion = hasPkg ? readJson(join(pkgDir, 'package.json'))?.version : undefined;
  const hasRow = !!patch && new RegExp(`id:\\s*${ROW_ID}(?![A-Za-z0-9_.-])`).test(patch);
  // an enabled row = the id line NOT followed by "disabled: true"
  let enabled;
  if (patch) {
    const m = new RegExp(`-\\s*id:\\s*${ROW_ID}\\s*\\n([\\s\\S]{0,200}?)(?=\\n\\s*-\\s*id:|$)`).exec(patch);
    enabled = hasRow ? !/disabled:\s*true/.test(m ? m[1] : '') : false;
  }
  // does the client bundle resolve from that profile?
  let resolvable = false;
  if (hasPkg) {
    try {
      const idx = readJson(join(pkgDir, 'package.json'));
      const rel = idx?.exports?.['./client'] ?? './lib/client.js';
      resolvable = existsSync(join(pkgDir, typeof rel === 'string' ? rel : './lib/client.js'));
    } catch { resolvable = false; }
  }
  const isRunning = runningProfile === name;
  state.push({ name, hasPkg, installedVersion, hasRow, enabled, resolvable, isRunning, dir });

  line();
  line(`  [${name}]${isRunning ? '   ← 正在运行的就是这个' : ''}`);
  line(`     插件包      : ${hasPkg ? '✔ 已安装 v' + (installedVersion ?? '?') : '✘ 未安装'}`);
  line(`     启用行      : ${hasRow ? (enabled ? '✔ 存在且已启用' : '⚠ 存在但被 disabled: true 禁用') : '✘ 不存在'}`);
  line(`     客户端入口  : ${resolvable ? '✔ 可解析' : (hasPkg ? '✘ 解析不到 lib/client.js' : '－')}`);
  line(`     目录        : ${dir}`);
}

// ---------------------------------------------------------------- 3) 桌面壳
section('3. 桌面壳（EAC / 其它桌面端）');
const shellRoots = [];
for (const c of [
  process.env.DSH_EAC_ROOT,
  join(process.env.LOCALAPPDATA || '', 'Programs', 'Deepseek Harness EAC'),
  join(HOME, 'AppData', 'Local', 'Programs', 'Deepseek Harness EAC'),
  'C:\\Program Files\\Deepseek Harness EAC',
  'D:\\Deepseek Harness EAC',
  'A:\\DSHapp\\Deepseek Harness EAC',
]) if (c) shellRoots.push(c);

let shellFound;
for (const root of shellRoots) {
  for (const appRoot of [join(root, 'dsh-desktop'), join(root, 'resources', 'app'), root]) {
    if (existsSync(join(appRoot, 'assets', 'skins'))) { shellFound = { root, appRoot }; break; }
  }
  if (shellFound) break;
}
if (shellFound) {
  line(`  ✔ 探测到桌面壳，app 根 : ${shellFound.appRoot}`);
  line(`    皮肤目录             : ${join(shellFound.appRoot, 'assets', 'skins')}`);
  const mine = join(shellFound.appRoot, 'assets', 'skins', 'air');
  line(`    本皮肤是否已同步进去 : ${existsSync(join(mine, 'package.json')) ? '✔ 是' : '✘ 否'}`);
  line('    说明：桌面壳会在冷启动时把 assets/skins 里的皮肤同步进它自己的 profile。');
} else {
  line('  － 没有探测到桌面壳。');
  line('    如果你是纯网页版（自己跑 `dsh web`），这是正常的 —— 只要 profile 装好就行。');
  line('    如果你确实在用桌面端，可以用 --eac-root 告诉安装脚本它在哪：');
  line('      node scripts/install.mjs --eac-root "D:\\你的桌面端目录"');
}

// ---------------------------------------------------------------- 4) 内核
section('4. 内核（决定皮肤选择器锚点是否有效）');
let kernel;
for (const root of shellRoots) {
  for (const appRoot of [join(root, 'dsh-desktop'), join(root, 'resources', 'app')]) {
    if (existsSync(join(appRoot, 'node_modules', '@deepseek-ai'))) { kernel = join(appRoot, 'node_modules', '@deepseek-ai'); break; }
  }
  if (kernel) break;
}
if (!kernel) {
  const shared = join(PROFILE_ROOT, 'node_modules', '@deepseek-ai');
  if (existsSync(shared)) kernel = shared;
}
line(kernel ? `  ✔ 内核目录 : ${kernel}` : '  － 找不到内核目录；`check-anchors.mjs` 需要它（可用 --kernel 指定）。');

// ---------------------------------------------------------------- 结论
const target = state.find((s) => s.isRunning) ?? (state.length === 1 ? state[0] : undefined);
section('结论与下一步');

if (!state.length) {
  line('  没有找到任何 profile。可能 DSH 还没启动过，或 DSH_HOME 不是这里。');
  line('  → 先启动一次 DSH（EAC 双击打开 / 或 `dsh web`），再回来跑本脚本。');
} else if (!target) {
  line(`  本机有多个 profile：${state.map((s) => s.name).join(', ')}，但判定不出「当前在跑的是哪个」。`);
  line('  → 用 `dsh --help` / 你的启动器确认 profile 名，然后：');
  line('      node scripts/install.mjs --profile <名>');
} else {
  const t = target;
  line(`  目标 profile : ${t.name}${t.isRunning ? '（正在运行）' : ''}`);
  if (!t.hasPkg) {
    line('  → 皮肤还没装到这个 profile。执行：');
    line(`      node scripts/install.mjs${t.isRunning ? '' : ' --profile ' + t.name}`);
  } else if (!t.hasRow) {
    line(`  → 包已就位（v${t.installedVersion}）但没有启用行。执行：`);
    line(`      node scripts/install.mjs${t.isRunning ? '' : ' --profile ' + t.name}`);
  } else if (!t.enabled) {
    line('  → 启用行存在但被 `disabled: true` 禁用了。两种办法：');
    line('      ① 打开「设置 → 皮肤」点一下「AIR·夏日青空」（推荐，走皮肤切换器）');
    line('      ② 或把 cordis.patch.yml 里该行下面的 `disabled: true` 删掉');
    line('      然后重启宿主。');
  } else if (!t.resolvable) {
    line('  → 启用行正常，但客户端入口解析不到 —— 包可能被拷坏了。重跑安装脚本。');
  } else {
    line('  ✔ 三件事都齐了：包已就位、启用行开启、入口可解析。');
    line('  → 如果界面还是没生效，**九成是宿主没重启**：');
    line('      · 桌面端：完全退出（含托盘）再打开');
    line('      · 纯网页版：结束并重新执行 `dsh web`，然后刷新浏览器页面');
    line('      （首次安装新增插件行时，只按 Ctrl+R 刷新是不够的）');
    line('  → 重启后若还不对：');
    line('      node scripts/check-release.mjs   # 包本身是不是好的');
    line('      node scripts/check-anchors.mjs   # 选择器锚点有没有被内核升级打死');
  }
}

line();
line('提示：皮肤生效与否只取决于「装进哪个 profile / 那个 profile 有没有启用行 / 宿主有没有重启」');
line('      这三件事，与是桌面端还是纯网页版无关。本脚本只读，随便跑。');
