@echo off
chcp 65001 >nul
title 云村音乐 - 启动中...
cd /d "%~dp0"
echo.
echo  ========================================
echo    云村音乐 · 仿真游戏
echo  ========================================
echo.
echo  正在用默认浏览器打开游戏...
echo.
start "" "%~dp0index.html"
echo  已启动！若浏览器未打开，请手动双击 index.html
echo.
pause
