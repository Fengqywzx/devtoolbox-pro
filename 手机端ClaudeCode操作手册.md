# 📱 手机端 Claude Code 操作手册

> Android + Termux + Tailscale + SSH · 免费方案 · 完整终端控制

---

## 一、手机端安装（一次性·10分钟）

### 1.1 安装 Termux（终端模拟器）

> ⚠️ **不要从 Google Play 安装！** 那个版本已停更2年。

**正确方式：**
1. 手机浏览器打开 `https://f-droid.org`
2. 下载 F-Droid APK，安装
3. 打开 F-Droid，搜索 `Termux`
4. 安装 Termux（来自 F-Droid 的最新版）

### 1.2 安装 Tailscale（内网穿透）

1. Google Play 搜索 `Tailscale` 并安装
2. 打开 Tailscale，用 GitHub 或 Google 账号登录
3. 保持 Tailscale 在后台运行

### 1.3 运行配置脚本

1. 打开 Termux
2. 下载配置脚本：
```bash
curl -o setup.sh https://你的电脑TailscaleIP:8000/脚本/termux-手机端-setup.sh
```
或者在 Termux 中直接粘贴运行：
```bash
# 更新包管理器
pkg update -y && pkg upgrade -y

# 安装工具（SSH + Mosh + TMUX）
pkg install -y openssh mosh tmux git curl

# 安装 Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 生成SSH密钥（一路回车）
ssh-keygen -t rsa -b 4096

# 启动 Tailscale
tailscaled --tun=userspace-networking &
tailscale up
```

---

## 二、配对电脑和手机（一次性·3分钟）

### 2.1 电脑端

在 Git Bash 中运行：
```bash
# 创建 .ssh 目录
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# 生成电脑的SSH密钥
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""

# 确认SSH服务器已启动
net start sshd
```

### 2.2 手机端 → 传公钥到电脑

在 Termux 中：
```bash
cat ~/.ssh/id_rsa.pub
```
复制输出的公钥内容（以 `ssh-rsa AAAA...` 开头）

### 2.3 电脑端 → 信任手机公钥

在 Git Bash 中：
```bash
echo '粘贴手机的公钥内容' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2.4 电脑端 → 查看 Tailscale IP

在 Git Bash 中：
```bash
tailscale ip -4
# 输出类似: 100.89.123.45
```
**✏️ 记下这个IP！手机连接时需要。**

---

## 三、日常手机操作

### 3.1 连接电脑

打开 Termux，输入：
```bash
# 方式A：Mosh（推荐·更流畅·不怕网络切换）
mosh 你的Windows用户名@100.89.123.45

# 方式B：SSH（更稳定）
ssh 你的Windows用户名@100.89.123.45
```

连接成功后，你就在手机的完整Linux终端里了——可以直接操作你电脑上的所有文件！

### 3.2 进入项目目录并启动 Claude Code

```bash
cd "/c/Users/18612/Desktop/万子轩的项目"
claude
```

### 3.3 创建 tmux 会话（保持不中断）

> tmux 是关键！即使手机关屏/断网，会话持续运行

```bash
# 创建新tmux会话
tmux new -s work

# 在tmux中启动Claude Code
claude

# 离开会话（Claude继续运行）：Ctrl+B 然后按 D
# 重新连接会话：
tmux attach -t work

# 查看所有会话：
tmux ls

# 杀掉会话：
tmux kill-session -t work
```

### 3.4 Termux 快捷操作

| 操作 | 按键 |
|------|------|
| Ctrl+C（中断） | 音量- + C |
| Ctrl+D（退出） | 音量- + D |
| Ctrl+B（tmux前缀） | 音量- + B |
| 粘贴 | 长按屏幕 |
| Tab补全 | 音量+ + T |
| 上一命令 | 音量+ + P |
| 清屏 | 输入 `clear` |
| 放大字体 | 双指捏合 |
| 缩小字体 | 双指张开 |

### 3.5 常用快捷键一览

| 快捷命令 | 作用 |
|----------|------|
| `ccon` | 用 Mosh 连接电脑 |
| `cssh` | 用 SSH 连接电脑 |
| `cstat` | 查看电脑状态（Claude是否在运行） |
| `tnew` | 创建新 tmux 会话 |
| `tatt` | 重新连接 tmux 会话 |
| `tls` | 查看所有 tmux 会话 |

---

## 四、实战场景

### 场景1：早上起床，检查编年史是否生成
```
打开 Termux → 输入 ccon → 输入 tatt → 看到昨晚Claude的输出
```

### 场景2：通勤路上，让Claude写代码
```
打开 Termux → ccon → tnew → cd 项目目录 → claude → "帮我写一个..."
```

### 场景3：上厕所，快速查看宠物状态
```
打开 Termux → cssh → cat .buddy/pet-state.json
```

### 场景4：睡觉前，启动长时间任务
```
打开 Termux → ccon → tmux new -s overnight → claude → 输入任务 → Ctrl+B D 离开
早上起来 → tatt overnight → 看到完整结果
```

---

## 五、故障排除

| 问题 | 解决 |
|------|------|
| 连不上SSH | 电脑防火墙打开端口22；确认电脑没关机；确认在同一Tailscale网络 |
| Termux字体太小 | 双指张开放大；或设置 → 外观 → 字体大小 |
| tmux不响应 | 按 Ctrl+B 然后按 Q（不是q） |
| 中文乱码 | Termux设置 → 终端 → 编码 → UTF-8 |
| 手机切WiFi断连 | 用 Mosh 而不是 SSH（Mosh支持网络切换） |
| 打不了Ctrl键 | 用音量键组合（见3.4表格） |

---

## 六、进阶技巧

### 屏幕常亮（防止Termux被系统杀掉）
```bash
termux-wake-lock acquire   # 保持后台运行
termux-wake-lock release   # 恢复正常
```

### 多窗口分屏
```bash
# tmux水平分屏: Ctrl+B 然后 "
# tmux垂直分屏: Ctrl+B 然后 %
# 切换窗格: Ctrl+B 然后方向键
```

### 快速文件传输
```bash
# 手机→电脑（在Termux中）
scp /sdcard/Download/文件.txt 用户名@100.x.x.x:/c/Users/18612/Desktop/

# 电脑→手机（在Termux中）
scp 用户名@100.x.x.x:/c/Users/18612/Desktop/文件.txt /sdcard/Download/
```

---

*配套脚本：`脚本/windows-手机联动-setup.ps1` + `脚本/termux-手机端-setup.sh`*
