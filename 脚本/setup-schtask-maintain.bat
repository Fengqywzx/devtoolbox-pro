@echo off
chcp 65001 >nul
title 镜观自动维护 — 安装Windows定时任务

echo ============================================
echo  镜观作品集 — 自动维护定时任务安装
echo ============================================
echo.
echo 正在创建计划任务: 每15分钟自动维护
echo.

:: 获取当前路径
set "SCRIPT_DIR=%~dp0"
set "REPO_DIR=%SCRIPT_DIR%.."
set "NODE_BIN=node"

:: 安装任务: 每15分钟运行 auto-maintain
schtasks /create /tn "Jingguan-AutoMaintain" /sc minute /mo 15 ^
  /tr "'%NODE_BIN%' '%REPO_DIR%\脚本\auto-maintain.mjs'" ^
  /ru "%USERNAME%" /f

if %errorlevel% equ 0 (
  echo ✅ 定时任务创建成功！
  echo    每15分钟自动维护运行中
) else (
  echo ❌ 定时任务创建失败 (可能需要管理员权限)
  echo    以管理员身份重新运行此脚本
)

echo.
echo 验证任务:
schtasks /query /tn "Jingguan-AutoMaintain" /fo LIST /v 2>nul | findstr /i "任务名:"

echo.
echo ============================================
echo  安装完成！
echo  建议: 将此脚本加入开机启动
echo ============================================
pause
