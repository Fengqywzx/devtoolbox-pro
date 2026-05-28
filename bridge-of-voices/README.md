# 声音的桥 · Bridge of Voices v2.0

> 语音 → 对话式访谈 → AI 提取关键事实 → 劳动仲裁申请书 + 证据清单 + 维权流程图 + 行动指引
>
> "法律语言是权力的语言，翻译它就是赋权。"

---

## 项目简介

一款移动优先的 Web 应用，让劳动者用**口语诉说自己的遭遇**，AI 以对话方式逐步追问，自动提取关键事实，生成结构化的**劳动仲裁申请书**、**证据清单**、**维权流程图**和**行动指引**。

**核心原则：不做法律建议，只做翻译。用口语追问而非填表。一次只处理一件事。**

---

## 目录结构（v2.0 完整版）

```
bridge-of-voices/
├── SPECIFICATION.md              ← 完整功能规格说明书
├── README.md                     ← 项目说明 + 阅读路线图
├── index.html                    ← SPA 入口（6阶段多页面）
├── manifest.json                 ← PWA 清单
├── sw.js                         ← Service Worker（离线缓存）
├── generate-icons.html           ← PWA 图标生成器（浏览器中打开）
├── css/
│   ├── app.css                   ← 全局样式 + 设计系统
│   ├── interview.css             ← 聊天访谈界面样式
│   └── print.css                 ← 打印样式（A4 优化）
├── js/
│   ├── app.js                    ← 主控制器 + 路由（VoiceBridge 类）
│   ├── interview-engine.js       ← 对话式访谈引擎（核心差异化）
│   ├── speech.js                 ← 语音识别（Web Speech API）
│   ├── speech-tts.js             ← 语音合成 / 播报引导
│   ├── extractor.js              ← 事实提取（regex + LLM 双引擎）
│   ├── llm-client.js             ← LLM API 抽象层（OpenAI/Anthropic/降级）
│   ├── document-gen.js           ← 文书生成器
│   ├── document-renderer.js      ← HTML 文档渲染器（4 种文档类型）
│   ├── templates.js              ← 文书模板 + 法律引用
│   ├── validator.js              ← 事实完整性校验
│   ├── storage.js                ← localStorage 草稿持久化
│   ├── case-manager.js           ← IndexedDB 案例历史管理
│   └── utils.js                  ← 通用工具函数
├── data/
│   ├── legal-knowledge.json      ← 法律知识库（5种问题类型）
│   ├── interview-questions.json  ← 结构化访谈问题树
│   └── city-venues.json          ← 10城仲裁委信息 + 全国热线
└── assets/
    ├── icon.svg                  ← SVG 矢量图标
    └── icons/                    ← PWA 图标（需用生成器生成）
```

---

## 阅读路线图 · How to Read This Code

### 第一层：理解产品（10 分钟）

1. **`SPECIFICATION.md`** — 完整功能规格书。读产品哲学、用户旅程、技术架构图。这是理解"为什么这样设计"的关键。
2. **`index.html`** — SPA 页面结构。关注 6 个 `<section class="stage">`：欢迎引导 → 恢复草稿 → 类型选择 → 对话访谈 → 事实确认 → 文档展示 → 案例历史。
3. **`data/interview-questions.json`** — 看看针对每种问题类型（欠薪/无合同/工伤/加班/辞退）分别设计了哪些追问。

### 第二层：理解核心引擎（20 分钟）

按数据流顺序读：

1. **`js/app.js`**（总控） — `VoiceBridge` 类。`navigate(stage)` 方法是路由核心，串联 6 个阶段。看 `_startInterview()` 如何初始化访谈引擎。

2. **`js/interview-engine.js`**（核心差异化） — `InterviewEngine` 类。这是 v2 最重要的新增模块。理解：
   - `start(problemType)` — 加载问题树，发出第一个问题
   - `processAnswer(answer)` — 处理回答，更新事实对象，进入下一问
   - 每个问题是一个节点（id/text/field/type/nextQuestion），组成有向图

3. **`js/extractor.js`**（事实提取） — `FactExtractor` 类。双引擎架构：
   - `extract(text)` — 纯 regex 引擎（离线、快速、零成本）
   - `extractWithLLM(text)` — LLM 深度提取（准确、理解上下文）
   - LLM 失败时自动降级到 regex

4. **`js/llm-client.js`**（LLM 抽象） — `LLMClient` 类。支持 OpenAI 兼容 API / Anthropic API / 规则引擎降级。配置保存在 localStorage。

5. **`js/document-renderer.js`**（文档渲染） — 4 种文档的 HTML 渲染：仲裁申请书（表格+段落）、证据清单（表格+提示）、流程图（步骤卡片）、行动指引（场馆+清单+热线）。

### 第三层：理解支撑模块（10 分钟）

- **`js/validator.js`** — 事实完整性校验。按问题类型定义必填字段，计算 0-100 评分。
- **`js/storage.js`** — localStorage 封装。自动保存/恢复草稿，7 天过期。
- **`js/case-manager.js`** — IndexedDB CRUD。案例历史持久化，支持搜索和导出。
- **`js/speech-tts.js`** — 语音合成播报。为低识字率用户提供语音引导。
- **`css/print.css`** — 打印样式。隐藏 UI 只留文档，A4 页面优化，避免断页。

---

## 运行方式

### 本地开发
```bash
cd bridge-of-voices
python -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

### PWA 图标生成
```
浏览器打开 generate-icons.html → 逐个下载图标 → 放入 assets/icons/
```

### 语音功能要求
- Chrome/Edge 支持 Web Speech API（语音识别 + 语音合成）
- 首次使用需授权麦克风
- iOS Safari 需 14.5+ 且需用户手势触发

### LLM 配置（可选，但不配也能用）
```javascript
// 在浏览器控制台中设置
const llm = new LLMClient();
llm.saveConfig({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o-mini'
});
// 或使用 Anthropic
llm.backend = 'anthropic';
llm.saveConfig({ apiKey: 'your-anthropic-key' });
```
LLM 未配置时自动使用 regex 规则引擎，核心流程不受影响。

---

## 技术选型

| 层 | 技术 | 原因 |
|----|------|------|
| 语音识别 | Web Speech API | 零成本启动，Chrome/Edge 原生支持 |
| 语音合成 | Speech Synthesis API | 为低识字率用户提供语音引导 |
| 事实提取 | Regex + LLM 双引擎 | Regex 离线快速；LLM 精准理解复杂叙述 |
| 文档渲染 | HTML → 纯文本导出 | HTML 视觉好 + 打印优化；纯文本兼容仲裁委要求 |
| 持久化 | localStorage + IndexedDB | 草稿自动保存 + 案例历史管理 |
| 离线 | Service Worker + PWA | Network First 策略，离线可查看历史案例 |
| 前端 | 原生 HTML/CSS/JS（SPA） | 零依赖，微信小程序移植成本最低 |

---

## v2.0 相比 v1.0 的改进

| 维度 | v1.0 | v2.0 |
|------|------|------|
| 用户输入 | 单次文本 dump | 多轮对话式访谈 |
| 问题引导 | 静态 hint | 按问题类型的结构化追问树 |
| 事实提取 | 纯 regex | Regex + LLM 双引擎 + 自动降级 |
| 语音 | 仅语音识别 | 语音识别 + TTS 语音播报引导 |
| 文档 | 纯文本 3 种 | HTML 渲染 4 种 + 打印优化 + 纯文本导出 |
| 持久化 | 无 | 草稿自动保存 + 案例历史 (IndexedDB) |
| 离线 | 不支持 | PWA + Service Worker |
| 完整性 | 无校验 | 完整性评分 + 缺失字段红色标注 |
| 城市信息 | 无 | 10 城仲裁委地址 + 全国热线 |
| 文档渲染 | 纯文本 | 表格、流程图、场馆卡片、清单 |

---

## 设计哲学

- **不做法律建议，只做翻译** — 我们不告诉劳动者"你应该怎么做"，我们把他们的遭遇翻译成法律语言
- **口语追问，不填表** — 像朋友聊天一样引导，不让用户面对复杂的法律术语
- **一次只处理一件事** — 欠薪就是欠薪，工伤就是工伤，不混合
- **劳动者的遭遇够格写成正式法律文件** — 每一份申请书都有尊严
- **离线优先** — 不是每个人都有稳定网络，核心功能离线可用
- **语音优先** — 考虑到低识字率用户，所有交互都有语音引导备选

---

## 扩展路线

- [ ] 方言支持（四川话/河南话/粤语/闽南语 → 语音识别方言模型）
- [ ] 合同拍照 OCR + 关键条款翻译（"天书变人话"）
- [ ] 微信小程序正式版
- [ ] 社区互助功能（工友证言模板分享）
- [ ] 社保计算器（五险一金补缴估算）
- [ ] 仲裁进度跟踪 + 关键日期提醒
