@echo off
setlocal
cd /d "%~dp0"
set "WEBGL=%~dp0Builds\WebGL"
if not exist "%WEBGL%\index.html" (
  echo 还没有 WebGL 包：%WEBGL%\index.html
  echo 请先在 Unity 菜单选：大闹西游路 - 构建 WebGL（浏览器 5173）
  pause
  exit /b 1
)
echo 打开浏览器访问  http://127.0.0.1:5173/
cd /d "%WEBGL%"
where python >nul 2>&1
if %ERRORLEVEL%==0 (
  python -m http.server 5173 --bind 127.0.0.1
  goto :eof
)
where py >nul 2>&1
if %ERRORLEVEL%==0 (
  py -3 -m http.server 5173 --bind 127.0.0.1
  goto :eof
)
where npx >nul 2>&1
if %ERRORLEVEL%==0 (
  npx --yes serve -l 5173 .
  goto :eof
)
echo 需要安装 Python 或 Node.js 才能在 5173 端口提供网页。
pause
exit /b 1
