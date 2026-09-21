@echo off
rem ============================================================
rem  dsh-air-theme lazy install - double-click me (no Node needed)
rem ============================================================
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  [dsh-air-theme] 正在安装 AIR·夏日青空 主题皮肤，请稍候...
echo  [dsh-air-theme] Installing AIR Summer Sky skin, please wait...
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\install.ps1" %*
echo.
echo  [dsh-air-theme] 完成后: 完全退出 EAC 再打开(或 Ctrl+R 刷新)，
echo  [dsh-air-theme] 看屏幕右下角出现"主题已生效 ✓"且背景变为夏日青空即成功。
echo  [dsh-air-theme] After done: fully quit EAC and reopen (or Ctrl+R),
echo  [dsh-air-theme] success = bottom-right badge "activated OK" + summer-sky background.
echo.
pause
