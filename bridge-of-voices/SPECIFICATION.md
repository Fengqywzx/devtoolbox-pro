# 声音的桥 v2.0 — 完整功能规格说明书

> 语音 → 对话式访谈 → AI 事实提取 → 法律文书生成 + 行动指引
> "法律语言是权力的语言，翻译它就是赋权。"

---

## 一、产品哲学与设计原则

### 核心原则
1. **不做法律建议，只做翻译** — 不告诉用户"你应该怎么做"，只把遭遇翻译成法律语言
2. **口语追问，不填表** — 像朋友聊天一样引导，不让用户面对复杂的法律术语
3. **一次只处理一件事** — 欠薪就是欠薪，工伤就是工伤，不混合
4. **劳动者的遭遇够格写成正式法律文件** — 每一份申请书都有尊严
5. **离线优先** — 不是每个人都有稳定网络，核心功能必须离线可用
6. **语音优先** — 考虑到低识字率用户，所有交互必须有语音引导

### 用户体验指标
| 指标 | 目标 |
|------|------|
| 从开始到拿到文书 | < 10 分钟 |
| 语音识别准确率 | > 90%（安静环境） |
| 事实提取完整率 | > 85%（覆盖5W1H） |
| 离线可用性 | 100% 核心功能 |
| 移动端适配 | iOS Safari + Android Chrome |

---

## 二、完整用户旅程

### 阶段 0：欢迎与入口
```
用户打开页面
  ├── 首次使用 → 欢迎引导（3 屏滑动）
  │   ├── 屏1: "说出你的遭遇，我们帮你写成法律文件"
  │   ├── 屏2: "像和朋友聊天一样，不用懂法律术语"
  │   └── 屏3: "你的隐私安全，数据只存在你手机里"
  └── 回访用户 → 直接进入主页
       ├── 开始新案例
       └── 继续上次（如有草稿）
```

### 阶段 1：问题类型识别
```
AI 发起第一句："你好，我是小桥。你最近工作中遇到了什么困难？"
  ├── 用户自由描述（语音/文字）
  └── AI 识别问题类型 → 确认："听起来是拖欠工资的问题，对吗？"
        ├── 是 → 进入专项访谈
        └── 否 → 让用户重新描述或手动选择类型
```

### 阶段 2：对话式访谈（核心差异化）
```
AI 逐轮追问，每次只问一个问题：

第1轮：身份信息
  "先告诉我你的名字和身份证号？"（身份证号可选，提醒信息安全）

第2轮：对方信息
  "你在哪家公司/给哪个老板干活？有地址吗？"

第3轮：时间线
  "什么时候开始在那干的？什么时候出的事/开始欠薪的？"

第4轮：金额（如适用）
  "一共欠了你多少钱？是怎么算出来的？"

第5轮：证据
  "你手头有什么能证明的材料吗？比如微信聊天记录、转账截图、工牌..."

第6轮：诉求
  "你希望怎么解决？是要回工资，还是也要赔偿？"

每轮支持：
  - 语音回答（按住说话）
  - 文字回答（打字输入）
  - "不知道" / "跳过" 按钮
  - 追问澄清（"能再说具体一点吗？"）
```

### 阶段 3：事实确认
```
结构化展示所有提取的事实（5W1H + 证据 + 诉求）
  ├── 每个字段可编辑
  ├── 缺失项标红提示
  ├── "完整性评分" 进度条
  └── 确认 → 进入文书生成
```

### 阶段 4：文书生成 + 行动指引
```
生成 3 类文档：
  ├── 标签1: 仲裁申请书（正式法律文书格式）
  ├── 标签2: 证据清单（带获取建议）
  ├── 标签3: 维权流程图（可视化步骤）
  └── 标签4: 行动指引（去哪个仲裁委、带什么材料、打什么电话）

操作：
  ├── 复制全文
  ├── 下载 TXT
  ├── 打印（适配打印样式）
  ├── 分享（生成分享链接/截图）
  └── 保存到案例历史
```

### 阶段 5：后续跟踪
```
案例历史列表：
  ├── 查看已生成的文书
  ├── 添加进展备注
  ├── 设置关键日期提醒（仲裁开庭、诉讼时效等）
  └── 删除案例
```

---

## 三、技术架构

### 整体架构图
```
┌─────────────────────────────────────────────────┐
│                  UI Layer                         │
│  index.html + app.css + interview.css + print.css │
│  SPA: Welcome → Interview → Review → Document     │
├─────────────────────────────────────────────────┤
│              Controller Layer                     │
│  app.js — 主控制器（路由、状态管理）              │
│  interview-engine.js — 对话访谈引擎               │
├─────────────────────────────────────────────────┤
│               Service Layer                       │
│  speech.js — 语音识别 (Web Speech API)            │
│  speech-tts.js — 语音合成 (TTS)                   │
│  extractor.js — 事实提取 (regex + LLM)            │
│  llm-client.js — LLM API 抽象层                   │
│  document-gen.js — 文书生成                       │
│  document-renderer.js — HTML 文档渲染             │
│  validator.js — 事实完整性校验                    │
├─────────────────────────────────────────────────┤
│                Data Layer                         │
│  storage.js — localStorage 草稿持久化             │
│  case-manager.js — IndexedDB 案例管理             │
├─────────────────────────────────────────────────┤
│              Static Data                          │
│  legal-knowledge.json — 法律知识库                │
│  interview-questions.json — 访谈问题树            │
│  city-venues.json — 城市仲裁委信息                │
│  templates.js — 文书模板                          │
├─────────────────────────────────────────────────┤
│            Infrastructure                         │
│  manifest.json — PWA 清单                         │
│  sw.js — Service Worker（离线缓存）               │
└─────────────────────────────────────────────────┘
```

### 模块职责

| 模块 | 职责 | 关键方法 |
|------|------|----------|
| `app.js` | SPA 路由、全局状态、模块初始化 | `init()`, `navigate(stage)`, `saveDraft()` |
| `interview-engine.js` | 对话流程控制、问题队列、回答收集 | `start(type)`, `askNext()`, `processAnswer()` |
| `speech.js` | 语音识别封装、方言切换、降噪 | `start()`, `stop()`, `setDialect()` |
| `speech-tts.js` | 语音合成播报、语速控制 | `speak(text)`, `stop()`, `setVoice()` |
| `extractor.js` | 正则预提取 + LLM 深度提取 | `extract(text, context)`, `extractWithLLM()` |
| `llm-client.js` | LLM API 抽象，支持多后端 | `complete(prompt)`, `chat(messages)` |
| `document-gen.js` | 模板填充、文书格式化 | `generate(facts, type)` |
| `document-renderer.js` | HTML 文档渲染、打印适配 | `render(doc)`, `print()` |
| `validator.js` | 事实完整性检查、缺失字段提示 | `validate(facts)`, `completenessScore()` |
| `storage.js` | localStorage 草稿自动保存/恢复 | `saveDraft()`, `loadDraft()`, `clearDraft()` |
| `case-manager.js` | IndexedDB CRUD、案例搜索 | `save()`, `list()`, `get()`, `delete()` |

---

## 四、数据结构设计

### Fact 对象（核心数据模型）
```javascript
{
  // 5W1H
  who: string,           // 当事人姓名 + 身份证号
  whom: string,          // 被申请人（公司/雇主名称 + 地址）
  what: string,          // 事情经过（完整描述）
  when: string,          // 时间线（入职时间 + 侵权发生时间）
  where: string,         // 工作地点
  howMuch: string,       // 涉及金额（欠薪数额 + 计算方式）

  // 分类
  problemType: string[], // 问题类型（可多个）
  jobType: string,       // 工作岗位

  // 证据与诉求
  evidence: string,      // 已有证据描述
  demand: string,        // 用户诉求

  // 元数据
  legalRefs: object[],   // 匹配的法条
  completeness: number,  // 完整性评分 0-100
  createdAt: string,     // ISO 时间戳
  updatedAt: string
}
```

### Case 对象（案例历史）
```javascript
{
  id: string,            // UUID
  facts: Fact,
  documents: {
    arbitration: string, // 仲裁申请书
    evidence: string,    // 证据清单
    flowchart: string,   // 维权流程图
    actionPlan: string   // 行动指引
  },
  status: 'draft' | 'completed' | 'submitted' | 'resolved',
  notes: string[],       // 用户备注
  deadlines: [           // 关键日期
    { label: string, date: string, reminded: boolean }
  ],
  createdAt: string,
  updatedAt: string
}
```

### 访谈问题节点
```javascript
{
  id: string,            // 问题 ID
  text: string,          // 问题文本（口语化）
  ttsText: string,       // TTS 播报文本（可能更简短）
  field: string,         // 对应 Fact 字段
  type: 'open' | 'choice' | 'confirm',  // 问题类型
  choices: string[],     // 选项（choice 类型）
  required: boolean,     // 是否必填
  followUp: string,      // 追问问题 ID（如答案不清晰）
  nextQuestion: string,  // 下一个问题 ID
  condition: string      // 条件表达式（基于问题类型决定是否问）
}
```

---

## 五、UI/UX 设计规范

### 视觉设计系统
```
颜色系统：
  --primary: #1e40af      深蓝（信任、正式）
  --primary-light: #3b82f6
  --warm: #f59e0b         暖黄（友好、提醒）
  --danger: #dc2626       红色（警示）
  --success: #16a34a      绿色（完成）
  --bg: #fafbfc           页面背景
  --card: #ffffff         卡片背景
  --text: #1e293b         主文字
  --text-secondary: #64748b 次要文字

排版：
  --font: "PingFang SC", "Microsoft YaHei", system-ui
  标题: 22px / 700
  正文: 16px / 1.6
  辅助: 14px / 1.5
  小字: 12px

间距：
  单位: 4px 递增 (4, 8, 12, 16, 20, 24, 32)

圆角：
  --radius-sm: 8px
  --radius: 12px
  --radius-lg: 16px
  --radius-full: 9999px
```

### 移动端适配
- 最大宽度 600px，居中
- 触摸目标最小 44×44px
- 底部安全区域适配 `env(safe-area-inset-bottom)`
- 大字体模式支持（系统字号放大时不过度破坏布局）

### 聊天式访谈 UI
```
┌──────────────────────────────┐
│  ← 返回    声音的桥    菜单  │  Header
├──────────────────────────────┤
│                              │
│  ┌─────────────────────┐    │
│  │ 你好，我是小桥。     │    │  AI 消息（左对齐，蓝色背景）
│  │ 你工作中遇到了什么   │    │
│  │ 困难？               │    │
│  └─────────────────────┘    │
│                              │
│         ┌─────────────────┐ │
│         │ 老板欠我三个月   │ │  用户消息（右对齐，灰色背景）
│         │ 工资没发...      │ │
│         └─────────────────┘ │
│                              │
│  ┌─────────────────────┐    │
│  │ 听起来是拖欠工资的   │    │  AI 追问
│  │ 问题。能告诉我你在   │    │
│  │ 哪家公司工作吗？     │    │
│  └─────────────────────┘    │
│                              │
├──────────────────────────────┤
│  🎤按住说话    ⌨打字    ⏭跳过 │  输入栏（固定底部）
└──────────────────────────────┘
```

### 文档预览 UI
```
┌──────────────────────────────┐
│ [仲裁申请书] [证据清单] [流程图] [行动指引] │  标签栏（sticky）
├──────────────────────────────┤
│                              │
│  ═══════════════════════    │
│    劳动仲裁申请书            │  HTML 渲染的文档
│  ═══════════════════════    │  支持打印样式
│                              │
│  【申请人信息】              │
│  姓名：张XX                  │
│  ...                        │
│                              │
├──────────────────────────────┤
│  [📋 复制] [📥 下载] [🖨 打印] [💾 保存] │
└──────────────────────────────┘
```

---

## 六、交互细节规范

### 语音录制
- 按住说话（pointerdown 开始，pointerup 结束）
- 录音时按钮变红 + 脉冲动画
- 实时显示识别中间结果（灰色斜体）
- 松手后显示最终结果（黑色正体）
- 3 秒静音自动停止
- 识别错误时自动重试一次，再失败则提示打字

### 访谈流程
- AI 每次只问一个问题
- 用户回答后，AI 先确认理解（"你说的是...对吗？"）
- 关键的确认（金额、公司名）要额外再确认一次
- 用户可以随时说"换个问法"获得更简单的提问
- 进度指示器显示当前进度（X/6 轮）

### 事实确认
- 每个字段旁显示来源（"从你的回答中提取"）
- 不完整的字段红色边框高亮
- 完整性评分环形图
- 一键补充缺失信息（点击缺失项跳回对应访谈问题）

### 错误处理
- 语音识别失败 → 自动重试 + 提示打字备选
- 网络断开 → 切换到离线模式，数据存本地
- LLM 超时 → 回退到 regex 提取 + 提示"基础模式"
- 存储空间不足 → 提示清理旧案例

---

## 七、文件清单（v2.0 完整版）

```
bridge-of-voices/
├── SPECIFICATION.md              ← 本文件
├── README.md                     ← 项目说明 + 阅读路线图
├── index.html                    ← SPA 入口
├── manifest.json                 ← PWA 清单
├── sw.js                         ← Service Worker
├── css/
│   ├── app.css                   ← 全局样式 + 变量
│   ├── interview.css             ← 聊天访谈样式
│   └── print.css                 ← 打印样式
├── js/
│   ├── app.js                    ← 主控制器 + 路由
│   ├── speech.js                 ← 语音识别
│   ├── speech-tts.js             ← 语音合成
│   ├── extractor.js              ← 事实提取（regex + LLM）
│   ├── llm-client.js             ← LLM API 客户端
│   ├── interview-engine.js       ← 对话访谈引擎
│   ├── document-gen.js           ← 文书生成
│   ├── document-renderer.js      ← HTML 文档渲染
│   ├── templates.js              ← 文书模板
│   ├── validator.js              ← 事实校验
│   ├── storage.js                ← localStorage 持久化
│   ├── case-manager.js           ← 案例管理 (IndexedDB)
│   └── utils.js                  ← 工具函数
├── data/
│   ├── legal-knowledge.json      ← 法律知识库
│   ├── interview-questions.json  ← 访谈问题树
│   └── city-venues.json          ← 城市仲裁委信息
└── assets/
    ├── icon.svg
    └── icons/                    ← PWA 图标（152x152, 192x192, 512x512）
```

---

## 八、开发优先级

### P0 — 核心链路（必须完成）
1. 对话式访谈引擎替换单次输入
2. LLM 抽象层 + regex 双引擎提取
3. localStorage 草稿持久化
4. 重构 UI 为聊天式访谈界面
5. HTML 文档渲染（替代纯文本）

### P1 — 体验提升（强烈建议）
6. TTS 语音引导
7. 案例历史管理（IndexedDB）
8. 事实完整性校验
9. 访谈问题树数据文件
10. 打印样式

### P2 — 增强功能
11. PWA 离线支持
12. 城市仲裁委数据
13. PDF 导出
14. 案例进展跟踪
15. 关键日期提醒
