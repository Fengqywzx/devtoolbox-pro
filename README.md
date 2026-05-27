<p align="center">
  <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='20' fill='%236c5ce7'/><text x='40' y='54' text-anchor='middle' font-size='40' fill='white'>⬡</text></svg>" width="80" alt="AgentFlow"/>
</p>

<h1 align="center">AgentFlow</h1>
<h3 align="center">浏览器原生 · 多智能体AI协作平台</h3>
<p align="center"><em>打开浏览器，5个专业AI智能体为你协作解决复杂任务</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Active"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT"/>
  <img src="https://img.shields.io/badge/zero--backend-true-6c5ce7" alt="Zero Backend"/>
  <img src="https://img.shields.io/badge/local--first-true-00d2a0" alt="Local First"/>
  <img src="https://img.shields.io/badge/browser--native-true-ff9f43" alt="Browser Native"/>
</p>

---

## 为什么 AgentFlow 与众不同

2026年，AI技术正在经历三个根本性转变：

| 趋势 | 从 | 到 | 代表项目 |
|------|----|----|----------|
| **推理位置** | 云端服务器 | 你的浏览器 | n0x, WebLLM |
| **智能范式** | 单一模型 | 多智能体协作 | OpenClaw (152K⭐), AutoAgent |
| **数据主权** | 上传第三方 | 本地存储 | Local-First, CRDT |

**AgentFlow 是这三股浪潮交汇处的产物。** 它不是又一个AI聊天机器人——它是一个**智能体协作网络**，在你的浏览器中运行，由多个专业AI智能体组成，它们像一支真正的工程团队一样协作。

---

## 核心创新

### 🧠 多智能体协作架构（非单一Bot）

传统AI工具 = 一个人干活。AgentFlow = 一支团队。

```
你提出问题
    ↓
┌───────────────────────────────────────┐
│  🏗️ Architect    → 设计系统架构       │
│  💻 Coder         → 生成代码实现       │
│  🔍 Reviewer      → 审查安全与质量     │
│  🔬 Researcher    → 调研技术方案       │
│  🚀 DevOps        → 规划部署运维       │
└───────────────────────────────────────┘
    ↓
多智能体协作 → 综合产出
```

每个智能体有独立的**人格**、**专业知识域**和**响应风格**。它们之间可以互相通信，进行真正的"圆桌讨论"。

### 🌐 100% 浏览器原生

- **零后端** — 单个HTML文件，无服务器、无数据库、无Docker
- **本地优先** — 所有对话和配置存储在浏览器本地（localStorage）
- **离线可用** — 演示模式下无需网络连接
- **隐私保护** — 你的数据从未离开你的设备

### ⚡ API模式 vs 演示模式

| 特性 | 演示模式 | API模式 |
|------|----------|---------|
| 可否使用 | 打开即用 | 需配置API Key |
| 智能程度 | 规则匹配 + 知识库 | 真实LLM推理 |
| 网络需求 | 不需要 | 需要 |
| 适用场景 | 体验概念、教学演示 | 生产级任务 |

---

## 功能特性

- 🏗️ **5个专业智能体** — 系统架构师 / 高级工程师 / 代码审查专家 / 技术研究员 / DevOps工程师
- ◈ **圆桌讨论** — 智能体自动协作讨论，无需手动协调
- @ **智能体指定** — `@Architect 设计一个...` 直接与特定智能体对话
- 🔧 **工具箱系统** — 代码执行沙箱、数据分析、网页抓取
- 🌓 **暗色/亮色主题** — 一键切换，尊重你的眼睛
- 📥 **对话导出** — 保存完整对话记录
- ⌨️ **键盘快捷键** — `Ctrl+K` 聚焦输入、`Ctrl+R` 圆桌讨论
- 💾 **自动持久化** — 刷新页面不丢失对话
- ✨ **粒子背景** — 智能体协作时实时视觉反馈
- 📱 **响应式设计** — 桌面端和移动端均可使用

---

## 快速开始

### 方式一：直接打开（推荐）
```bash
# 克隆仓库
git clone https://github.com/Fengqywzx/devtoolbox-pro.git
cd devtoolbox-pro

# 用浏览器打开
open agentflow.html    # macOS
start agentflow.html   # Windows
```

### 方式二：本地服务器
```bash
python -m http.server 8000
# 访问 http://localhost:8000/agentflow.html
```

### 方式三：启用真实AI（可选）
1. 打开 `agentflow.html`
2. 在浏览器控制台执行：
```javascript
localStorage.setItem('af_api_key', 'your-api-key');
localStorage.setItem('af_model', 'gpt-4o');
location.reload();
```
3. 支持任何 OpenAI-compatible API（Claude API、本地Ollama等）

---

## 技术架构

```
┌──────────────────────────────────────────────────┐
│                  AgentFlow                        │
├──────────────────────────────────────────────────┤
│  UI Layer                                        │
│  ├── Agent Cards (visual status indicators)      │
│  ├── Chat Interface (multi-thread, markdown)     │
│  ├── Tools Panel (code sandbox, analysis)        │
│  └── Particle System (WebGL-free, canvas)        │
├──────────────────────────────────────────────────┤
│  Agent Engine                                    │
│  ├── Agent Manager (CRUD, status, selection)     │
│  ├── Conversation Engine (routing, threading)    │
│  ├── Response Generator (demo mode / API mode)   │
│  └── Relevance Scorer (agent-task matching)      │
├──────────────────────────────────────────────────┤
│  Persistence Layer                               │
│  ├── localStorage  → conversations & agents      │
│  └── Export/Import → plain text export           │
├──────────────────────────────────────────────────┤
│  API Adapter (optional)                          │
│  └── OpenAI-compatible REST API                  │
└──────────────────────────────────────────────────┘
```

**设计原则：**
- **零依赖** — 无npm包、无CDN、无框架。纯HTML/CSS/JS
- **渐进增强** — 演示模式立即可用，API模式解锁更强能力
- **关注点分离** — 引擎层、UI层、持久化层独立

---

## 与其他项目的对比

| 特性 | AgentFlow | ChatGPT | OpenClaw | n0x |
|------|-----------|---------|----------|-----|
| 多智能体协作 | ✅ 原生支持 | ❌ | ✅ | ✅ |
| 浏览器原生 | ✅ 零依赖 | ❌ 需服务器 | ❌ 需安装 | ✅ |
| 本地存储 | ✅ | ❌ | ✅ | ✅ |
| 离线可用 | ✅ 演示模式 | ❌ | ❌ | ❌ |
| API可选 | ✅ | N/A | ✅ | ✅ |
| 单个HTML文件 | ✅ | ❌ | ❌ | ❌ |
| 开源 | ✅ MIT | ❌ | ✅ | ✅ |

---

## 灵感来源

AgentFlow的设计受到2026年最前沿开源项目的启发：

- [**OpenClaw**](https://github.com/Fengqywzx) (152K⭐) — 本地优先个人AI智能体
- [**n0x**](https://github.com/ZababurinSergei/n0x) — 完整AI技术栈，一个浏览器标签
- [**AutoAgent**](https://github.com) (120K⭐) — 递归技能进化的智能体
- [**Mano-P**](https://github.com/MININGLAMP-AI/MANO-P) — 纯视觉GUI智能体
- [**MolmoWeb**](https://github.com) — AI2开源视觉浏览器智能体

AgentFlow的愿景是**将这些前沿理念打包成一个普通人都能使用的工具**——不需要安装Docker，不需要配置Python环境，不需要GPU。一个浏览器标签就够了。

---

## 路线图

- [x] 5个专业智能体 + 圆桌讨论
- [x] 演示模式（零依赖，打开即用）
- [x] OpenAI API适配器
- [x] 对话导出
- [x] 暗色/亮色主题
- [ ] WebLLM集成（浏览器本地LLM推理，完全离线AI）
- [ ] 智能体技能市场（社区贡献专业智能体模板）
- [ ] CRDT多设备同步
- [ ] 视觉智能体（截图→分析，像Mano-P/MolmoWeb）
- [ ] 多语言支持（i18n）

---

## 作者

**万子轩** · 北京工业大学 · 计算机专业

独立开发者，致力于将前沿AI技术民主化。关注多智能体系统、浏览器原生AI、本地优先架构。

- GitHub: [@Fengqywzx](https://github.com/Fengqywzx)
- Gitee: [@wanzixuan945](https://gitee.com/wanzixuan945)

---

## 许可证

MIT License — 自由使用、修改、分发。

---

<p align="center">
  <sub>Built with ❤️ by a college student who believes AI belongs to everyone, not just big tech.</sub>
</p>
