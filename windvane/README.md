# 风信标 · Wind Vane

> 骑手安全监测 + 工作条件记录 + 申诉辅助
>
> "不依赖压迫者的工具。看见自己，比被看见更重要。"

---

## 项目简介

一款面向 1300 万外卖骑手的移动 APP，实时监测骑行安全（急刹、超速、逆行、蛇形、摔倒检测），自动记录工作条件（时薪、安全代价、超时），并在需要时生成**申诉证据包**和**超时理由说明**。

**不接平台 API。不做排行榜。不与平台分享数据。不插广告。**

---

## 目录结构

```
windvane/
├── README.md                   ← 你正在看
├── index.html                  ← 骑手仪表盘主页（Web 原型）
├── css/
│   └── app.css                 ← 大字体·高对比度·骑行友好
├── js/
│   ├── app.js                  ← 主控制器 + 状态管理
│   ├── ride-monitor.js         ← 骑行安全监测引擎
│   ├── trip-recorder.js        ← 行程数据记录器
│   ├── analytics.js            ← 数据分析与可视化
│   └── appeal-helper.js        ← 申诉证据包生成器
├── data/
│   └── risk-zones.json         ← 城市高风险路段数据
└── assets/
    └── icon.svg                ← 项目图标
```

---

## 阅读路线图 · How to Read This Code

### 第一层：骑手主界面（5 分钟）

打开 **`index.html`**，它被设计为**骑行中的仪表盘**，包含：
- `#dashboard` — 当前骑行状态卡片（速度、安全评分、今日行程数）
- `#trip-history` — 历史行程列表
- `#appeal-panel` — 申诉材料生成面板

关键设计决策：大字体（40px+）、大按钮（最小 48×48px）、高对比度配色。骑手在电动车上看屏幕，眼睛不能花。

### 第二层：核心模块阅读顺序（15 分钟）

1. **`js/ride-monitor.js`**（安全引擎） — 最重要的模块。`RideMonitor` 类：
   - `detectHardBrake()` — 急刹检测（加速度阈值）
   - `detectOverspeed()` — 超速检测（25km/h 非机动车道限速）
   - `detectSwerving()` — 蛇形/逆向检测（航向突变）
   - `detectFall()` — 摔倒检测（加速度 + 陀螺仪突变 + 静止判断）
   - 每个事件触发后，记录到 trip-recorder，并在仪表盘显示警告

2. **`js/trip-recorder.js`**（记录器） — `TripRecorder` 类：
   - `startTrip()` / `endTrip()` — 行程边界
   - `recordEvent(type, data)` — 事件记录（急刹、超速等）
   - `computeMetrics()` — 计算本次行程：距离、时长、安全评分、时薪
   - 数据存储在 localStorage，不上传

3. **`js/analytics.js`**（分析器） — `Analytics` 类：
   - `weeklyReport()` — 周度安全报告
   - `earningBreakdown()` — 时薪分解（扣掉安全代价）
   - `riskHeatmap()` — 个人风险路段识别

4. **`js/appeal-helper.js`**（申诉器） — `AppealHelper` 类：
   - `generateDelayReason(rideData)` — 超时理由自动生成（基于行程记录）
   - `generateDeductionEvidence(rideData)` — 误扣款证据包（GPS + 时间 + 安全事件）
   - 输出一段结构化的申诉文本，可直接提交

5. **`js/app.js`**（主控） — `WindVane` 类：
   - 初始化各模块
   - 管理页面状态切换（骑行中 / 休息中 / 查看历史）
   - 协调 monitor → recorder → analytics 的数据流

### 第三层：数据文件（3 分钟）

- **`data/risk-zones.json`** — 城市高风险路段预置数据。结构：`[{lat, lng, radius, riskType, level}]`。骑行接近风险区域时提前语音提醒。

---

## 运行方式

### Web 原型
```bash
python -m http.server 8000
# 浏览器打开：http://localhost:8000/windvane/
```

### 模拟骑行数据
- 桌面浏览器：用 DevTools → Sensors → 模拟 GPS 位置
- 移动端：Chrome Android 支持真实 GPS + 加速度计
- 点"开始骑行"按钮开始记录

---

## 技术选型

| 层 | 技术 | 原因 |
|----|------|------|
| 传感器 | DeviceOrientation + Geolocation API | 不依赖原生，Web 即可访问 |
| 地图 | Leaflet（开源） | 不依赖高德/百度 SDK |
| 数据存储 | localStorage + IndexedDB | 离线可用，数据归用户 |
| 加密 | SubtleCrypto API | 导出数据前加密，保护隐私 |
| 前端 | 原生 HTML/CSS/JS | 轻量，不拖慢骑手手机 |

---

## 扩展路线

- [ ] 天气风险评分（API 集成）
- [ ] 充电站地图
- [ ] 匿名区域安全数据共享（差分隐私）
- [ ] 语音日记（骑行后口述感受）
- [ ] React Native / Flutter 原生版
- [ ] 国际化（印度 Swiggy/Zomato、东南亚 Grab 骑手）

---

## 设计哲学

- **不依赖压迫者的工具** — 不接平台 API，数据不上传平台
- **"看见自己"比"被看见"更重要** — 让骑手看到自己的安全数据和真实时薪
- **不替用户做决定** — 我们展示数据，不评价"好骑手"或"坏骑手"
- **隐私第一** — 所有数据本地存储，导出前加密
- **大字体，少操作** — 骑行中看一眼就够，不需要点来点去
