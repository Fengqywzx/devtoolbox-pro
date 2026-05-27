# 万子轩的项目空间

## 自定义命令

### |历史 — 查看所有历史对话记录
当用户输入以 `|历史` 开头的消息时，立即执行以下步骤：
1. 读取 `C:\Users\18612\.claude\conversations\` 目录下所有 `.md` 文件
2. 从每个文件中提取：**日期时间**、**主题概要**、**对话关键节点**
3. 按时间倒序排列（最新在最前）
4. 以如下格式呈现：

```
📜 万子轩的历史对话档案（共 X 次会话）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 YYYY-MM-DD HH:MM | 主题标题
   ├ 讨论了：...
   ├ 关键决策/产出：...
   └ 涉及领域：[计算机/哲学/物理/...]

📅 YYYY-MM-DD HH:MM | 主题标题
   ...
```

若用户输入 `|历史 搜索词`，则只显示标题或内容匹配搜索词的会话。
若用户输入 `|历史 最近N`，则只显示最近 N 次会话。

### |笔记 — 创建学习笔记
当用户输入 `|笔记 主题`，根据对话内容生成一份结构化学习笔记，保存到 `C:\Users\18612\Desktop\万子轩的项目\notes\` 目录。

### |回顾 — 回顾本次会话要点
当用户输入 `|回顾`，总结当前会话的关键讨论、决策和产出。

### /buddy — 电子宠物系统
当用户输入以 `/buddy` 开头的消息时，执行对应子命令：

**`/buddy` 或 `/buddy show`** — 显示宠物状态
1. 读取 `C:\Users\18612\Desktop\万子轩的项目\.buddy\pet-state.json` 获取宠物数据
2. 以彩色终端卡片形式展示宠物信息（名字、物种、稀有度、等级、经验条、五维属性）
3. 最后提示用户：`打开 buddy-pet.html 可以看到会动的像素宠物！`

**`/buddy hatch`** — 重新孵化宠物
1. 随机生成新宠物（8种物种 × 5档稀有度 × 是否闪光）
2. 写入 `pet-state.json`
3. 展示孵化结果（含稀有度颜色和闪光特效标记）

**`/buddy pet`** — 抚摸宠物
1. 读取 pet-state.json，增加 petCount 和 xp
2. 检查是否升级/进化，更新 state
3. 显示抚摸反馈

**`/buddy card`** — 查看宠物属性卡
1. 读取并展示完整属性面板（稀有度、星级、五维雷达、经验进度、成就列表）

**`/buddy train`** — 训练宠物
1. 增加较多 XP，随机提升一项属性
2. 显示训练结果

**`/buddy name <名字>`** — 给宠物命名
1. 更新 pet-state.json 中的 name 字段

**`/buddy open`** — 在浏览器中打开宠物互动页面
1. 提示用户在浏览器中打开 `buddy-pet.html` 以体验完整动画互动

### /serve — 启动本地预览服务器
当用户输入 `/serve` 或 `/serve 8080`：
1. 提示用户运行命令：`python -m http.server [端口，默认8000]`（在项目根目录）
2. 用 Glob 列出项目根目录所有 `.html` 文件
3. 为每个 HTML 生成访问链接：`http://localhost:[端口]/[文件名]`
4. 提示浏览器打开对应地址即可预览

### /run-buddy — 运行宠物自动化测试
当用户输入 `/run-buddy` 或 `/run-buddy --screenshot-only` 或 `/run-buddy --interact`：
1. 运行 `node scripts/buddy-driver.mjs [用户提供的参数]`
2. 等待命令完成，收集 stdout
3. 如果生成了截图（`screenshots/01-initial.png` 和 `02-after-interact.png`），用 Read 工具读取图片展示给用户
4. 汇总输出结果：浏览器类型、宠物前后状态、持久化验证 PASS/WARN

### /screenshot-buddy — 快速宠物截图
当用户输入 `/screenshot-buddy`：
1. 运行 `node scripts/buddy-driver.mjs --screenshot-only`
2. 读取 `screenshots/01-initial.png` 展示给用户
3. 报告截图文件路径

### /backup — 项目备份
当用户输入 `/backup` 或 `/backup 备注文字`：
1. 运行 `node scripts/backup.mjs [备注文字]`
2. 命令执行后，报告生成的 zip 文件路径（位于 `backups/backup-YYYYMMDD-HHmm-备注.zip`）
3. 列出备份目录下最近 3 个备份文件

### /status — 项目全景状态
当用户输入 `/status`：
1. 用 Glob 获取根目录所有 `.html`、`.md`、`.json`、`.txt` 文件，分类统计数量
2. 用 Glob 获取 `notes/` 目录下 `.md` 文件数量
3. 读取 `.buddy/pet-state.json`，展示宠物名字、物种、等级、稀有度
4. 读取 `.claude/skills/run-buddy-pet/SKILL.md`（如存在），报告 skill 状态
5. 汇总为一张状态卡片输出

### /new-tool — 创建新 HTML 工具
当用户输入 `/new-tool <工具名>`，如 `/new-tool 密码生成器`：
1. 运行 `node scripts/new-tool.mjs "<工具名>"`
2. 读取生成的 HTML 文件，展示代码结构概要
3. 提示用户：`用浏览器打开 [文件名].html 即可使用`

### /web-search — 快捷网页搜索
当用户输入 `/web-search <关键词>`，如 `/web-search Rust 所有权机制`：
1. 调用 `mcp__web-search__search_web` 工具，传入关键词
2. 整理前 10 条结果，按 `标题 → 链接 → 摘要` 格式呈现
3. 若用户问题明显属于某学习领域（计算机/电学/数学物理/哲学），在结果后附加一句关联思考

### /today — 今日概览
当用户输入 `/today`：
1. 报告当前日期和星期
2. 调用 `mcp__news-china__get_news` 获取热点新闻（分类 hot，10 条）
3. 调用 `mcp__wikipedia__onThisDay` 获取历史上的今天事件（5 条）
4. 分栏呈现：今日热点 + 历史上的今天

### /math — 数学计算与推演
当用户输入 `/math <表达式>`，如 `/math 积分 x^2 dx` 或 `/math 2^10 + 3^5`：
1. 调用 `mcp__sequential-thinking` 进行结构化推理，或直接用 Node.js `node -e "console.log(...)"` 计算数值结果
2. 展示计算过程和最终结果
3. 若涉及微积分、线性代数等高等数学，尝试用 Python（如可用）或 Symbolic 思路给出步骤

### /commit — Git 提交
当用户输入 `/commit` 或 `/commit <提交信息>`：
1. 检查当前目录是否为 git 仓库（看是否有 `.git` 文件夹）
2. 若不是，提示用户：`git init` 初始化仓库
3. 若是，执行 `git add -A` 和 `git commit -m "<信息>"`（用户未提供信息时，用 AI 根据当前会话内容生成简洁的提交信息）
4. 报告提交结果和最新 commit hash

### /pr — 创建 Pull Request（需 GitHub 配置）
当用户输入 `/pr <标题>`：
1. 检查是否有 GitHub MCP 工具可用（`mcp__github`）
2. 检查当前分支是否已 push 到 remote
3. 若条件满足，调用 `mcp__github__create_pull_request` 创建 PR
4. 若条件不满足，给出明确的缺失项清单（未 push / 无 token / 不是 git repo）

## 项目文件
- `像素小故事.html` — 像素艺术小故事
- `快捷键参考卡.html` — 快捷键参考
- `意义收集罐.html` — 意义收集工具
- `buddy-pet.html` — 电子宠物互动页面（大海+森林+雪山背景，8种宠物，训练/进化/成就系统）
- `.buddy/pet-state.json` — 宠物存档数据
- `notes/` — 学习笔记目录
- `scripts/` — 自动化脚本目录（buddy-driver.mjs、backup.mjs、new-tool.mjs）
- `screenshots/` — 宠物截图输出目录
- `backups/` — 项目备份输出目录

## ASCII 宠物动画（对话结束标记）
每次对话（或任务）结束时，在回复最底部输出 ASCII 宠物动画的当前帧，取代原有的静态像素图。

**操作步骤：**
1. 读取 `.claude/ascii-pet-index.txt` 获取当前帧索引（整数）
2. 读取 `.claude/ascii-pet-frames.json` 获取帧数据数组
3. 按索引取出对应帧，输出格式：
   ```
   [帧的 ASCII 艺术]
   
   [动作名] — [可爱话语]
   ```
4. 将索引加 1，对帧数组长度取模，写回 `.claude/ascii-pet-index.txt`
5. 确保这是整个回复的最后一段内容

**帧序列（循环播放）：** 端坐 → 抬爪 → 舔毛 → 眯眼笑 → 摇尾巴 → 伸懒腰 → 歪头杀 → 踩奶 → 端坐...

### /ascii-pet — 手动查看宠物动画
当用户输入 `/ascii-pet`：
1. 读取当前帧索引和帧数据
2. 输出当前帧，但不递增索引（让用户可以重复欣赏同一帧）
3. 附带一句：「下次对话我会展示下一帧～」

## 记忆系统
用户已配置自动记忆系统，位于 `C:\Users\18612\.claude\projects\C--Users-18612-Desktop-------\memory\`：
- 每次会话自动归档到 `.claude/conversations/`
- 新会话启动时复习历史并给出专家建议

## 己安装的 MCP 工具（共15个）

### 原有
- **filesystem** — 文件系统操作（桌面、文档、对话记录）
- **sequential-thinking** — 结构化思维链推理
- **sqlite** — SQLite 数据库学习与操作
- **fetch** — 网页内容抓取（Markdown/HTML/文本）
- **arxiv** — 学术论文检索（数学、物理、计算机科学）

### 新增（2026-05-26）
- **web-search** — DuckDuckGo 免费网页搜索，无需 API Key
- **wikipedia** — 维基百科搜索、页面获取、历史上的今天
- **youtube-transcript** — YouTube 视频字幕/转录提取
- **memory-graph** — 本地知识图谱记忆系统（shelbymcp）
- **news-china** — 70+ 中文平台热点新闻聚合（微博/知乎/百度/36氪等）
- **brave-search** — Brave 搜索引擎（需免费 API Key，2000次/月）
- **context7** — 最新版本文档查询（防 AI 幻觉，支持 46000+ 库）
- **github** — GitHub 仓库/Issue/PR 操作（需 GitHub Token）
- **pubmed** — PubMed 生物医学论文检索（需免费 NCBI Key）
- **firecrawl** — 专业网页抓取/爬虫（免费500页，无需信用卡）

## 用户学习方向
用户致力于以下领域的深度学习：
1. **计算机科学** — 算法、系统设计、编程语言、AI/ML
2. **电学** — 电路理论、电子技术、嵌入式系统
3. **数学与物理学** — 高等数学、理论物理、科学计算
4. **马克思主义哲学** — 辩证唯物主义、历史唯物主义、政治经济学
5. **黑格尔哲学** — 精神现象学、逻辑学、法哲学

在回答问题时，应优先从以上领域视角进行关联和延伸。
