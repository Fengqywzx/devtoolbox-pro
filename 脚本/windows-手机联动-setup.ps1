# ============================================================================
# Windows端一键配置脚本 — Claude Code手机远程访问
# 需要管理员权限运行！右键 → 以管理员身份运行 PowerShell
# 执行: powershell -ExecutionPolicy Bypass -File windows-手机联动-setup.ps1
# ============================================================================

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Windows端 Claude Code 手机远程访问" -ForegroundColor Cyan
Write-Host "  SSH + Tailscale 免费方案" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: 启用 Windows OpenSSH Server ──
Write-Host "[1/4] 启用 OpenSSH Server..." -ForegroundColor Yellow
$sshInstalled = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
if ($sshInstalled.State -ne "Installed") {
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
    Write-Host "  ✅ OpenSSH Server 已安装" -ForegroundColor Green
} else {
    Write-Host "  ✅ OpenSSH Server 已存在" -ForegroundColor Green
}

# 配置SSH自动启动
Set-Service sshd -StartupType Automatic
Start-Service sshd
Write-Host "  ✅ sshd 已启动 + 设为自动启动" -ForegroundColor Green

# 配置防火墙规则
New-NetFirewallRule -Name "OpenSSH-Server" -DisplayName "OpenSSH Server (sshd)" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 2>$null
Write-Host "  ✅ 防火墙端口22已开放" -ForegroundColor Green

# ── Step 2: 安装 Tailscale ──
Write-Host "[2/4] 安装 Tailscale..." -ForegroundColor Yellow
$tailscaleInstalled = Get-Command tailscale.exe -ErrorAction SilentlyContinue
if (-not $tailscaleInstalled) {
    winget install Tailscale.Tailscale --accept-source-agreements --accept-package-agreements
    Write-Host "  ✅ Tailscale 已安装（可能需要重启）" -ForegroundColor Green
} else {
    Write-Host "  ✅ Tailscale 已存在" -ForegroundColor Green
}

# ── Step 3: 配置 Git Bash 为默认 SSH Shell ──
Write-Host "[3/4] 配置 SSH Shell..." -ForegroundColor Yellow
$gitBashPath = "C:\Program Files\Git\bin\bash.exe"
if (Test-Path $gitBashPath) {
    New-ItemProperty -Path "HKLM:\SOFTWARE\OpenSSH" -Name DefaultShell -Value $gitBashPath -PropertyType String -Force
    Write-Host "  ✅ SSH默认Shell → Git Bash" -ForegroundColor Green
}

# ── Step 4: 生成SSH密钥指南 ──
Write-Host "[4/4] 生成配置信息..." -ForegroundColor Yellow
$tailscaleIP = (tailscale ip -4 2>$null) -replace '\s',''
if (-not $tailscaleIP) {
    $tailscaleIP = "运行 tailscale ip -4 获取"
}

Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Windows端配置完成！" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 重要信息（截图保存！）：" -ForegroundColor Yellow
Write-Host "   你的Windows用户名: $env:USERNAME" -ForegroundColor White
Write-Host "   你的电脑名: $env:COMPUTERNAME" -ForegroundColor White
Write-Host "   Tailscale IP: $tailscaleIP" -ForegroundColor White
Write-Host ""
Write-Host "🔐 下一步 — 在电脑上："
Write-Host "   1. 启动 Tailscale 并登录（任务栏图标）" -ForegroundColor Cyan
Write-Host "   2. 手机也安装 Tailscale，登录同一账号" -ForegroundColor Cyan
Write-Host "   3. 手机安装 Termux（从 F-Droid，不是 Google Play）" -ForegroundColor Cyan
Write-Host "   4. 在电脑 Git Bash 中运行: ssh-keygen -t rsa" -ForegroundColor Cyan
Write-Host "   5. 在手机 Termux 中运行手机端配置脚本" -ForegroundColor Cyan
Write-Host ""

Read-Host "按 Enter 退出"
