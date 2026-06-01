#!/data/data/com.termux/files/usr/bin/bash
# ============================================================================
# Termux 手机端一键配置 — Claude Code 远程访问
# 在 Termux 中运行: bash termux-手机端-setup.sh
# ============================================================================

echo "════════════════════════════════════════"
echo "  📱 Termux Claude Code 远程访问配置"
echo "════════════════════════════════════════"
echo ""

# ── Step 1: 更新包管理器 ──
echo "[1/6] 更新包管理器..."
pkg update -y && pkg upgrade -y
echo "  ✅ 完成"
echo ""

# ── Step 2: 安装必要工具 ──
echo "[2/6] 安装 OpenSSH + Mosh + TMUX + Git..."
pkg install -y openssh mosh tmux git curl
echo "  ✅ 完成"
echo ""

# ── Step 3: 安装 Tailscale ──
echo "[3/6] 安装 Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
tailscaled --tun=userspace-networking &
sleep 3
echo "  ✅ Tailscale 已安装"
echo "  ⚠️  运行 tailscale up 登录（会打开浏览器）"
echo ""

# ── Step 4: 生成SSH密钥 ──
echo "[4/6] 生成SSH密钥..."
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -q
    echo "  ✅ 密钥已生成"
else
    echo "  ✅ 密钥已存在"
fi
echo ""

# ── Step 5: 创建快捷命令 ──
echo "[5/6] 创建快捷命令..."
cat > ~/.bashrc << 'EOF'
# ── Claude Code 手机快捷命令 ──

# 连接到你的电脑（替换为你的实际Tailscale IP和用户名）
# 用法: ccon
alias ccon='mosh 18612@【安装Tailscale后替换为实际IP】'

# SSH到电脑（更稳定但不如mosh流畅）
alias cssh='ssh 18612@【安装Tailscale后替换为实际IP】'

# 快速查看电脑状态
alias cstat='ssh 18612@【安装Tailscale后替换为实际IP】 "tasklist | grep -i claude; echo ---; netstat -an | grep 22"'

# 在电脑上启动 Claude Code
alias cstart='ssh -t 18612@【安装Tailscale后替换为实际IP】 "cd /c/Users/18612/Desktop/万子轩的项目 && bash"'

# Termux 内快捷操作
alias cls='clear'
alias ll='ls -la'
alias tnew='tmux new -s claude'
alias tatt='tmux attach -t claude'
alias tls='tmux ls'

echo "📱 快捷命令: ccon(连接) cstat(状态) cstart(启动Claude)"
EOF
echo "  ✅ 快捷命令已写入 ~/.bashrc"
echo ""

# ── Step 6: 打印完成信息 ──
echo "════════════════════════════════════════"
echo "  ✅ Termux 配置完成！"
echo "════════════════════════════════════════"
echo ""
echo "📋 必须手动完成的步骤："
echo ""
echo "  1. 启动 Tailscale:"
echo "     tailscale up"
echo "     （会打开浏览器登录你的Tailscale账号）"
echo ""
echo "  2. 把SSH公钥复制到电脑:"
echo "     cat ~/.ssh/id_rsa.pub"
echo "     （复制输出内容）"
echo ""
echo "  3. 在电脑上，把公钥添加到信任列表:"
echo "     打开 Git Bash，运行:"
echo "     mkdir -p ~/.ssh"
echo "     echo '粘贴公钥内容' >> ~/.ssh/authorized_keys"
echo ""
echo "  4. 编辑 ~/.bashrc 替换实际信息:"
echo "     nano ~/.bashrc"
echo "     （把'18612'和'【安装Tailscale后替换为实际IP】'换成实际值）"
echo ""
echo "  5. 重新加载配置:"
echo "     source ~/.bashrc"
echo ""
echo "  6. 测试连接:"
echo "     ccon"
echo ""
echo "════════════════════════════════════════"
EOF
