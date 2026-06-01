# 手机上操作 Claude Code — 完全指南

> 2026年6月 · 万子轩专属 · 6种方法 + 5个可开发的新功能

---

## 一、6种手机操作方法

### 方法1：Claude Code Remote Control（官方·最简单）⭐

**原理：** 桌面Claude Code通过HTTPS中继到你手机的Claude App或浏览器

**步骤：**
1. 桌面终端运行：`claude remote-control` 或 `/rc`
2. 扫描弹出的二维码（用Claude iOS/Android App 或手机浏览器）
3. 手机即时连接——看到相同文件、MCP服务器、项目上下文
4. 会话断开后10分钟内自动重连

**要求：**
- Claude Code v2.1.51+
- Claude Pro（$20/月）或 Max（$100-200/月）订阅
- **不是API Key用户可用！** 你需要的是Claude订阅账号

**优点：** 最简单、官方支持、文件在本地、安全
**缺点：** 桌面必须保持开机+终端打开、不能从手机启动新会话、需付费订阅

---

### 方法2：SSH + Tailscale + tmux（免费·全功能）⭐

**原理：** 手机通过加密网络SSH到你的电脑，操作完整终端

**Android 步骤：**
1. 安装 Termux（F-Droid商店，不是Google Play版）
2. Termux内运行：`pkg install openssh mosh tmux`
3. 电脑和手机都安装 Tailscale（免费个人版）
4. 电脑开启SSH：`sudo systemctl start sshd`
5. 手机连接：`mosh 你的电脑名@100.x.x.x tmux attach`

**iOS 步骤：**
1. 安装 Blink Shell（$19.99一次）或 Termius（免费版可用）
2. 同上步骤3-5

**优点：** 免费、完整终端、可以启动新会话、tmux保持会话不丢
**缺点：** 需要一定技术操作、电脑需开机

---

### 方法3：云VM + Tailscale（无需电脑开机）

**原理：** 在便宜的云服务器上运行Claude Code，手机随时SSH连接

**步骤：**
1. 在 Vultr/阿里云 开一台最便宜的VM（~$0.29/小时 ≈ ¥2/小时）
2. 安装 Tailscale + Node.js + Claude Code
3. 在 tmux 会话中运行 Claude Code
4. 手机通过 Mosh + tmux attach 随时连接

**优点：** 不需要电脑、24/7运行、可以跑多个并行Agent
**缺点：** 有云服务器费用、需要初始配置

**费用估算：** 最低配VM ~¥15/天，如果每天只用4小时 ≈ ¥8/天

---

### 方法4：claude.ai/code（官方·纯浏览器）

**原理：** Claude在Anthropic云端环境中运行，你通过手机浏览器操作

**步骤：**
1. 手机浏览器打开 `https://claude.ai/code`
2. 登录Claude账号（Pro/Max）
3. 连接GitHub仓库
4. Claude在云端沙箱中工作

**优点：** 无需电脑、无需安装、纯浏览器
**缺点：** 代码在云端（不是本地文件）、MCP服务器不可用、沙箱限制

---

### 方法5：第三方Web终端（remotelab / clsh）

**原理：** 自部署的Web界面，把终端暴露为手机可访问的网页

**A. remotelab：**
```bash
npm install -g @trmquang93/remotelab
remotelab --port 3284
# 手机浏览器打开 http://你的IP:3284
```

**B. clsh（更推荐）：**
```bash
npm install -g clsh
clsh serve
# 提供真实PTY终端流 + 手机优化键盘 + 多会话支持
```

**优点：** 手机浏览器即可、不需要App、免费开源
**缺点：** 需要自己部署、需配置安全访问

---

### 方法6：GitHub Codespaces（浏览器中的VS Code）

**原理：** 手机浏览器打开VS Code Web版，终端中运行Claude Code

**步骤：**
1. 手机浏览器打开 `https://github.com/codespaces`
2. 创建新Codespace（免费额度60小时/月）
3. 终端中运行：`npm install -g @anthropic-ai/claude-code`
4. 在tmux中运行 `claude`，随时重连

**优点：** 免费额度、不需要自己电脑、VS Code完整功能
**缺点：** 手机屏幕小体验差、需要tmux保持会话

---

## 二、方法对比总表

| 方法 | 电脑需开机 | 启动新会话 | 费用 | 难度 | 推荐场景 |
|------|:---:|:---:|---|---|---|
| 1.Remote Control | ✅ | ❌ | Pro $20/月 | ⭐ | 快速查看/审核代码 |
| 2.SSH+Tailscale | ✅ | ✅ | 免费 | ⭐⭐ | 日常手机操作 |
| 3.Cloud VM | ❌ | ✅ | ~¥8/天 | ⭐⭐⭐ | 7×24随时可用 |
| 4.claude.ai/code | ❌ | ✅ | Pro $20/月 | ⭐ | 简单云端任务 |
| 5.remotelab/clsh | ✅ | ✅ | 免费 | ⭐⭐ | 喜欢浏览器操作 |
| 6.Codespaces | ❌ | ✅ | 60h/月免费 | ⭐⭐ | 需要完整IDE |

---

## 三、推荐组合方案

**最佳性价比：方法2（SSH+Tailscale+tmux）+ 方法4（claude.ai/code 做备份）**

- 日常：手机SSH到电脑，tmux attach 继续会话
- 电脑关机时：用 claude.ai/code 做轻量任务
- 需要长时间任务：开Cloud VM

---

## 四、可开发的新功能（逐个讨论）

### 功能A：手机专用Web仪表板
一个手机优化的网页，显示：
- Claude Code运行状态（是否在线/正在处理什么）
- 最近输出摘要
- 一键发送预设命令
- Token用量和成本实时图表

### 功能B：Telegram通知机器人
Claude Code完成任务时通过Telegram推送：
- "编年史已生成，共4111字"
- "宠物已喂食，XP+50"
- 可以在Telegram中回复快捷指令

### 功能C：语音→Claude Code桥接
手机录音 → 语音转文字 → 发送给Claude Code
适合走路/通勤时口述需求

### 功能D：手机快捷命令面板
一个PWA网页，预置你的常用命令为彩色大按钮：
- 🐱 宠物状态
- 📖 今日编年史
- 💰 成本报告
- 🔄 同步项目
- 📊 项目状态

### 功能E：会话漫游系统
在电脑和手机之间无缝切换：
- 电脑上开始任务 → 手机上继续 → 电脑上收尾
- 通过Git分支同步会话状态

---

## 五、下一步

需要你逐个确认：
1. 你有Claude Pro/Max订阅吗？（决定能否用方法1和4）
2. 你的手机是Android还是iPhone？（决定用什么终端App）
3. 可以安装Tailscale吗？（方法2需要）
4. 需要我帮你开发上面5个功能中的哪些？

*本文档保存在项目根目录：`手机操作ClaudeCode完全指南.md`*
