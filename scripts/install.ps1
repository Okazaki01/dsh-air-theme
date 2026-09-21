<#
 ============================================================================
 dsh-air-theme — lazy install script (PowerShell, double-click friendly, no Node needed)

 Usage:
   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install.ps1
   .\scripts\install.ps1 -EacRoot "A:\DSHapp\Deepseek Harness EAC"
   .\scripts\install.ps1 -Profile web-desktop -DryRun

 Idempotent. Steps:
   1. sync tree to <EAC app root>\assets\skins\air
      (new layout: <install root>\dsh-desktop\assets\skins;
       legacy:     <install root>\resources\app\assets\skins)
   2. sync tree to <profile>\node_modules\@dsh-external\dsh-client-ui-skin-air
   3. write .eac-copy-stamp.json ({v,f,b,h}, the EAC shell's own stamp shape)
   4. ensure profile cordis.patch.yml contains the ui-skin-air enabled row

 Stamp caveat: the shell hashes files in Node readdir order, which PowerShell
 cannot reproduce exactly. A mismatch only costs ONE redundant re-copy on the
 next cold start (functionally harmless). On machines that have Node, prefer
 `node scripts/install.mjs` - it borrows the shell's own plugin-copy.js and
 therefore writes a byte-identical stamp.

 NOTE: all output is ASCII to stay parse-safe under Windows PowerShell 5.1
 (which reads .ps1 files without BOM as ANSI). Chinese guidance lives in
 INSTALL.md / README.md.
 ============================================================================
#>
[CmdletBinding()]
param(
  [string]$EacRoot = '',
  [string]$Profile = 'web-desktop',
  [switch]$DryRun,
  [switch]$SkipPatch
)

$ErrorActionPreference = 'Stop'
$PackageRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$HomeDir = $env:USERPROFILE
if (-not $HomeDir) { $HomeDir = $env:HOME }
$ProfileRoot = Join-Path $HomeDir '.dsh\profiles'
$PkgName = '@dsh-external\dsh-client-ui-skin-air'
$RowId = 'ui-skin-air'

# The EAC "app root" is the directory that owns assets\skins. Two layouts exist:
#   new (EAC 4.x): <root>\dsh-desktop\assets\skins      shell = dsh-eac-shell.exe
#   legacy:        <root>\resources\app\assets\skins    shell = "Deepseek Harness EAC.exe"
function Resolve-AppRoot {
  param([string]$Dir)
  if (-not $Dir) { return $null }
  foreach ($cand in @($Dir, (Join-Path $Dir 'dsh-desktop'), (Join-Path $Dir 'resources\app'))) {
    if ($cand -and (Test-Path (Join-Path $cand 'assets\skins'))) { return (Resolve-Path $cand).Path }
  }
  return $null
}

function Get-EacRoot {
  if ($EacRoot) { $r = Resolve-AppRoot $EacRoot; if ($r) { return $r } }
  if ($env:DSH_EAC_ROOT) { $r = Resolve-AppRoot $env:DSH_EAC_ROOT; if ($r) { return $r } }
  foreach ($name in @('dsh-eac-shell', 'Deepseek Harness EAC')) {
    try {
      $p = Get-Process -Name $name -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1
      if ($p -and $p.Path) {
        $r = Resolve-AppRoot (Split-Path $p.Path -Parent)
        if ($r) { return $r }
      }
    } catch { }
  }
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Programs\Deepseek Harness EAC'),
    (Join-Path $HomeDir 'AppData\Local\Programs\Deepseek Harness EAC'),
    'C:\Program Files\Deepseek Harness EAC',
    'D:\Deepseek Harness EAC',
    'A:\DSHapp\Deepseek Harness EAC'
  )
  foreach ($c in $candidates) {
    if ($c) { $r = Resolve-AppRoot $c; if ($r) { return $r } }
  }
  return $null
}

function Copy-Tree {
  param([string]$Src, [string]$Dest, [bool]$Dry)
  if ($Dry) { Write-Host "  [dry] sync $Src -> $Dest" -ForegroundColor DarkGray; return }
  if (Test-Path $Dest) { Remove-Item -Recurse -Force $Dest }
  New-Item -ItemType Directory -Force -Path $Dest | Out-Null
  Copy-Item -Recurse -Force (Join-Path $Src '*') $Dest
}

# Same file lists the EAC shell itself walks (lib/plugin-copy.js TOP_FILES/TOP_DIRS).
$RootFiles = @('package.json','dsh-plugin.json','skin.json','LICENSE','LICENSE.md','NOTICE','NOTICE.md',
  'README.md','README.zh.md','README.zh-CN.md','THIRD-PARTY-NOTICES.md','EAC-ADAPTATION.md',
  'index.js','client.js','recall-inject.js','cordis.patch.yml',
  'DESIGN.md','FRAMING.md','EDITORIAL.md','BREATH.md')
$Dirs = @('lib','docs','preview','vendor','node_modules','data','assets','runtime','src','client','styles')

function Get-Entries {
  param([string]$Root)
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($f in $RootFiles) {
    $p = Join-Path $Root $f
    if (Test-Path $p -PathType Leaf) { $out.Add($f) }
  }
  foreach ($d in $Dirs) {
    $dir = Join-Path $Root $d
    if (-not (Test-Path $dir -PathType Container)) { continue }
    Get-ChildItem -Recurse -File $dir | ForEach-Object {
      $rel = $_.FullName.Substring($Root.Length + 1).Replace('\', '/')
      $out.Add($rel)
    }
  }
  return $out
}

$eacRoot = Get-EacRoot
$eacSkin = if ($eacRoot) { Join-Path $eacRoot 'assets\skins\air' } else { $null }
$profileDir = Join-Path $ProfileRoot $Profile
$profilePkg = Join-Path $profileDir ('node_modules\' + $PkgName)

Write-Host '=== dsh-air-theme lazy install (PowerShell) ===' -ForegroundColor Cyan
Write-Host ("Package root : " + $PackageRoot)
Write-Host ("Target profile: " + $Profile)
Write-Host ("EAC root     : " + $(if ($eacRoot) { $eacRoot } else { 'NOT FOUND (use -EacRoot)' }))
Write-Host ("EAC skin dir : " + $(if ($eacSkin) { $eacSkin } else { '(skipped)' }))
Write-Host ("Profile dest : " + $profilePkg)
Write-Host ("Dry run      : " + $(if ($DryRun) { 'yes (no write)' } else { 'no' }))
Write-Host ''

$installed = $false

if ($eacSkin) {
  Copy-Tree $PackageRoot $eacSkin $DryRun
  Write-Host '[1/4] EAC skin dir synced' -ForegroundColor Green
  $installed = $true
} else {
  Write-Host '[1/4] skipped (EAC not found; profile-only install still works)' -ForegroundColor Yellow
}

Copy-Tree $PackageRoot $profilePkg $DryRun
Write-Host '[2/4] profile plugin dir synced' -ForegroundColor Green
$installed = $true

$entries = Get-Entries $PackageRoot
$bytes = 0
$acc = New-Object System.Collections.Generic.List[string]
foreach ($rel in $entries) {
  $fi = Get-Item (Join-Path $PackageRoot ($rel.Replace('/', '\')))
  $bytes += $fi.Length
  # FNV-1a over "<rel>|<size>|<mtimeMs>;" exactly like the shell's stampHash.
  $acc.Add(("{0}|{1}|{2};" -f $rel, $fi.Length, [long][Math]::Round($fi.LastWriteTimeUtc.Subtract([datetime]'1970-01-01').TotalMilliseconds)))
}
# FNV-1a (32-bit) done in uint64 then masked: PowerShell's * on uint32 widens to
# double and overflows, so the modulo has to be explicit.
$h = [uint64]2166136261
foreach ($s in $acc) {
  foreach ($ch in [System.Text.Encoding]::UTF8.GetBytes($s)) {
    $h = [uint64]$h -bxor [uint64]$ch
    # 4294967295, not 0xFFFFFFFF: PowerShell parses an 8-digit hex literal as a
    # SIGNED Int32, so 0xFFFFFFFF becomes -1 and the band fails.
    $h = ([uint64]$h * [uint64]16777619) -band [uint64]4294967295
  }
}
$pkg = Get-Content -Raw -Encoding UTF8 (Join-Path $PackageRoot 'package.json') | ConvertFrom-Json
$stamp = ('{{"v":"{0}","f":{1},"b":{2},"h":"{3}"}}' -f [string]$pkg.version, $entries.Count, $bytes, ([uint32]$h).ToString('x'))
if ($DryRun) {
  Write-Host "[3/4] [dry] would write .eac-copy-stamp.json: $stamp" -ForegroundColor DarkGray
} else {
  [System.IO.File]::WriteAllText((Join-Path $profilePkg '.eac-copy-stamp.json'), $stamp, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "[3/4] wrote .eac-copy-stamp.json: $stamp" -ForegroundColor Green
}

if (-not $SkipPatch) {
  $patchFile = Join-Path $profileDir 'cordis.patch.yml'
  $block = "`n# AIR summer-sky skin (dsh-air-theme)`n- insert:`n    - id: $RowId`n      name: '$PkgName'`n"
  $has = $false
  if (Test-Path $patchFile) {
    $txt = [System.IO.File]::ReadAllText($patchFile)
    if ($txt.Contains("id: $RowId")) { $has = $true }
  }
  if ($DryRun) {
    Write-Host ("[4/4] " + $(if ($has) { 'already present, no change' } else { '[dry] would append ui-skin-air row' }) + " -> $patchFile") -ForegroundColor DarkGray
  } elseif ($has) {
    Write-Host '[4/4] cordis.patch.yml already contains ui-skin-air (skipped)' -ForegroundColor Green
  } else {
    New-Item -ItemType Directory -Force -Path (Split-Path $patchFile) | Out-Null
    $existing = if (Test-Path $patchFile) { [System.IO.File]::ReadAllText($patchFile) } else { '' }
    [System.IO.File]::WriteAllText($patchFile, $existing + $block, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host '[4/4] appended ui-skin-air enabled row' -ForegroundColor Green
  }
}

Write-Host ''
if (-not $installed) { Write-Host '!! Nothing installed. Check args.' -ForegroundColor Red; exit 1 }
if ($DryRun) { Write-Host '(dry run finished - nothing was written)' -ForegroundColor Yellow; exit 0 }
Write-Host 'Install complete! Next 3 steps:' -ForegroundColor Cyan
Write-Host '  1) Fully quit EAC desktop and reopen it (or just press Ctrl+R to reload the page).'
Write-Host '  2) Look at the bottom-right corner of the screen: a short badge "AIR Summer Sky theme activated OK" should appear; the background becomes the summer-sky artwork.'
Write-Host '  3) If it did not activate: open Settings > Skins, pick "AIR Summer Sky", then restart once more.'
Write-Host '  Full guidance: INSTALL.md / README.md in this package.'
