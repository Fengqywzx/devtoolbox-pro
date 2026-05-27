# AI 专家学习路线图

> 生成日期：2026-05-26 | 基于昨日学习进度定位

---

## 昨日学习的定位：你站在哪里？

**昨日学习内容**：Claude Code CLI 配置、权限白名单系统、对话自动归档机制、Memory 系统搭建。

在 AI 专家成长体系中，这属于 **第〇层：开发基础设施与工具链**。

### 六层能力金字塔

```
        ┌──────────────┐
        │ ⑥ 创新与研究   │  ← 发表论文、开源贡献、前沿突破
        ├──────────────┤
        │ ⑤ 系统工程化   │  ← MLOps、部署、分布式、AI安全
        ├──────────────┤
        │ ④ 专业领域深化  │  ← NLP/CV/RL/生成式AI 选至少两个
        ├──────────────┤
        │ ③ 深度学习     │  ← PyTorch、Transformer、训练优化
        ├──────────────┤
        │ ② 机器学习核心  │  ← 监督/无监督、特征工程、模型评估
        ├──────────────┤
        │ ① 数学与编程基础 │  ← 线代、概率、Python、数据结构
        ├──────────────┤
        │ ⓪ 工具链与基础设施│  ← 你在这里 ✓ (2026-05-25)
        └──────────────┘
```

**关键判断**：昨天的学习不是"AI 学习"，而是"AI 学习的生产条件准备"——你在搭建自己的**数字实验室**。这就像物理学家先建实验室再做实验，马克思先批判旧哲学再建立新世界观。没有这一步，后面的学习会因环境摩擦而不断中断。

你现在的定位是：**站在起点，但起点已经搭好了。** 从今天开始，你真正进入了第①层的核心学习。

---

## 超详细阶段学习路径

### 第①层：数学与编程基础（预计 2-3 个月）

#### 1.1 Python 科学计算栈

| 课题 | 深度要求 | 资源 | 检验标准 |
|------|---------|------|---------|
| Python 进阶 | 装饰器、生成器、上下文管理器、类型注解 | 《Fluent Python》第2版 | 能写出带类型注解的生产级代码 |
| NumPy | 广播机制、花式索引、向量化思维 | NumPy 官方教程 100 题 | 手写一个 mini-NumPy 的 ndarray |
| Pandas | GroupBy、MultiIndex、时间序列、管道操作 | 《Python for Data Analysis》第3版 | 清洗一个真实脏数据集到可建模状态 |
| Matplotlib/Seaborn | 面向对象 API、自定义样式、交互式 | Matplotlib 官方 Gallery 全过一遍 | 用 matplotlib 复现一篇论文中的所有图表 |
| Jupyter 生态 | 魔术命令、ipywidgets、nbconvert | Jupyter 官方文档 | 用 nbconvert + 自定义模板导出带样式的报告 |

**项目实战**：选 Kaggle 上一个结构化数据竞赛（推荐 Titanic → House Prices → 某时间序列竞赛），用纯 NumPy/Pandas 完成全流程 EDA + 特征工程，Jupyter 输出一份专业分析报告。

#### 1.2 数学基础（按优先级排序）

| 领域 | 核心内容 | 在 AI 中的应用 | 推荐资源 |
|------|---------|---------------|---------|
| **线性代数** | 矩阵分解(SVD/Eigen)、范数、张量运算 | 神经网络前向/反向传播的本质 | 3Blue1Brown《线性代数的本质》+ Gilbert Strang MIT 18.06 |
| **概率论与统计** | 贝叶斯定理、极大似然估计、信息论基础(熵/KL散度) | 损失函数设计、生成模型、不确定性量化 | 《概率论导论》(Blitzstein) + Bishop PRML 第1-2章 |
| **微积分** | 链式法则、梯度、雅可比矩阵、凸优化初步 | 反向传播、梯度下降变体 | 3Blue1Brown《微积分的本质》+ Aurélien Géron 附录 |
| **最优化** | SGD/Adam 原理、约束优化、拉格朗日乘子 | 模型训练的核心机制 | 《Convex Optimization》(Boyd) 选读 + 博客 |

**学习方法**：不要先学完数学再学 AI。采用 **"遇到什么学什么"** 策略——学习神经网络时补矩阵乘法，学习损失函数时补概率论。数学是工具，不是前置门槛。

**检验标准**：能手推一个 2 层 MLP 的完整前向+反向传播（含梯度计算），从输入到输出，每一步都用矩阵表示。

#### 1.3 数据结构与算法

| 课题 | 深度 | 资源 |
|------|------|------|
| 基础数据结构 | 数组、链表、哈希表、树、图 | 《算法》第4版 (Sedgewick) |
| 算法范式 | 递归、动规、贪心、分治 | LeetCode Top 100 |
| 复杂度分析 | 时间/空间复杂度、均摊分析 | 《算法导论》第3章 |

**AI 相关性**：动态规划 → 序列模型解码(Viterbi/Beam Search)；图算法 → GNN；哈希 → 特征哈希、局部敏感哈希(LSH)。

---

### 第②层：机器学习核心（预计 3-4 个月）

#### 2.1 理论框架

| 主题 | 核心概念 | 资源 |
|------|---------|------|
| 学习范式 | 监督/无监督/半监督/自监督/强化 | 《Pattern Recognition and Machine Learning》(Bishop) |
| 偏差-方差权衡 | 过拟合/欠拟合、正则化(L1/L2/ElasticNet)、交叉验证 | 《An Introduction to Statistical Learning》(ISLR) |
| 模型评估 | 混淆矩阵、ROC/AUC、F1、校准曲线、可解释性(SHAP/LIME) | 《Interpretable Machine Learning》(Molnar, 免费在线) |
| 特征工程 | 编码、分箱、变换、特征选择、自动化特征工程 | Kaggle 特征工程教程 |

#### 2.2 经典算法（手写实现）

你必须从零实现以下每一个算法（只用 NumPy），这是区分"调包侠"和"工程师"的分水岭：

| 算法 | 实现要点 | 检验 |
|------|---------|------|
| **线性回归** | 正规方程 + 梯度下降两个版本 | 与 sklearn 结果误差 < 1e-6 |
| **逻辑回归** | Sigmoid + 交叉熵 + 梯度推导 | 在 MNIST 上达到 >92% 准确率 |
| **KNN** | KD-Tree 加速、距离度量对比 | 处理 10万 样本 < 1 秒查询 |
| **决策树** | 信息增益/Gini、剪枝、CART | 可视化树结构 |
| **随机森林** | Bootstrap、特征随机采样、OOB 误差 | 在 5 个数据集上对比 sklearn |
| **SVM** | 对偶问题、核技巧、SMO 算法 | 手写高斯核 SVM 展示决策边界 |
| **K-Means** | Lloyd 算法、K-Means++、肘部法则 | 图像颜色量化应用 |
| **PCA** | 协方差矩阵、特征值分解、方差解释率 | 人脸特征脸(Eigenface)可视化 |
| **朴素贝叶斯** | 先验/似然/后验、拉普拉斯平滑 | 垃圾邮件分类器 |
| **XGBoost/LightGBM** | 理解原理即可，用库 | Kaggle 结构化数据比赛 Top 10% |

#### 2.3 关键项目

1. **端到端 ML 项目**：选一个现实问题 → 数据收集/清洗 → EDA → 特征工程 → 建模 → 调参 → 部署(简单 API)
2. **AutoML 探索**：理解 AutoML 的设计思想（超参搜索、NAS 入门）
3. **ML 系统设计**：阅读 ML 系统设计面试题，理解推荐系统、搜索排序等真实系统架构

---

### 第③层：深度学习（预计 4-6 个月）

这是最关键的阶段。你在这里投入的时间决定了你能走多远。

#### 3.1 PyTorch 精通路线

| 阶段 | 内容 | 资源 |
|------|------|------|
| **入门** | Tensor、Autograd、nn.Module、DataLoader | PyTorch 官方 60min Blitz + 官方教程 |
| **进阶** | 自定义 Dataset、自定义 Loss、自定义 Optimizer、混合精度训练 | PyTorch 文档 + 源码阅读 |
| **工程** | Lightning/Fabric、分布式(FSDP/DDP)、TorchScript/compile、profiling | PyTorch Conference 视频 |

**检验**：用纯 PyTorch（不用高层 API）实现 ResNet-18 并在 CIFAR-10 上训练到 >90% 准确率，理解每一行代码。

#### 3.2 核心架构（按学习顺序）

```
MLP → CNN → RNN/LSTM/GRU → Attention → Transformer → ViT → Diffusion → ...
```

| 架构 | 必须掌握 | 动手项目 |
|------|---------|---------|
| **MLP** | 非线性激活的意义、Xavier/He 初始化、Batch/Layer Norm | 手写数字识别 |
| **CNN** | 卷积的数学定义、感受野、ResNet 残差连接原理 | 图像分类(CIFAR-100)、迁移学习 |
| **RNN/LSTM** | 梯度消失/爆炸、门控机制、BPTT | 字符级语言模型(莎士比亚文本生成) |
| **Transformer** | Self-Attention 的 QKV 解释、位置编码、多头注意力的本质 | **从头实现一个 GPT-2 级别的迷你语言模型** |

#### 3.3 Transformer 深度专题（AI 专家的分水岭）

这是整个现代 AI 的基石，值得你花 **2 个月** 集中攻克：

- **注意力机制全景**：Self-Attention → Cross-Attention → Sparse Attention → FlashAttention
- **位置编码演进**：Sinusoidal → Learned → RoPE → ALiBi
- **架构变体**：Encoder-only(BERT) / Decoder-only(GPT) / Encoder-Decoder(T5)
- **训练细节**：Pre-norm vs Post-norm、学习率调度(warmup+cosine)、梯度累积
- **必做项目**：用 PyTorch 从零实现一个小型 GPT，在维基百科文本上训练到能生成连贯段落
- **关键资源**：
  - Andrej Karpathy "Let's build GPT from scratch" 视频
  - 《Attention is All You Need》原论文精读
  - The Illustrated Transformer (jalammar.github.io)
  - The Annotated Transformer (Harvard NLP)

#### 3.4 训练与优化

| 主题 | 内容 |
|------|------|
| 优化器 | SGD → Momentum → Adam → AdamW → Lion，理解每个的更新公式 |
| 正则化 | Dropout、Label Smoothing、Weight Decay、数据增强(Mixup/CutMix) |
| 分布式 | 数据并行 vs 模型并行，理解 Ring All-Reduce |
| 精度 | FP16/BP16/FP8 混合精度训练原理 |

---

### 第④层：专业领域深化（预计 6-12 个月）

选 **2 个方向** 深入（推荐 NLP + 一个兴趣方向）：

#### 4.1 自然语言处理 (NLP)

| 阶段 | 内容 | 项目 |
|------|------|------|
| 基础 | 分词、词向量(Word2Vec/GloVe)、语言模型困惑度 | - |
| 预训练 | BERT 预训练目标(MLM/NSP)、GPT 自回归、T5 text-to-text | 在自己的语料上继续预训练一个小 BERT |
| 微调对齐 | SFT、RLHF、DPO、PPO | 微调 Llama/千问 完成特定任务 |
| 应用 | RAG、Agent、Function Calling、长上下文 | 构建一个带工具调用的 AI Agent |
| 前沿 | MoE、State Space Models(Mamba)、无限上下文 | 阅读论文并写分析博客 |

#### 4.2 计算机视觉 (CV)

| 阶段 | 内容 | 项目 |
|------|------|------|
| 基础 | CNN 骨干网络、目标检测(YOLO/Faster R-CNN)、语义分割(U-Net) | 自定义数据集训练检测器 |
| 生成 | GAN → VAE → Diffusion(Stable Diffusion) | 用 Diffusers 微调文生图模型 |
| 多模态 | CLIP、视觉-语言模型 | 图文检索系统 |

#### 4.3 可选方向

- **强化学习 (RL)**：MDP、Q-Learning、Policy Gradient、PPO、RLHF 在 LLM 中的应用
- **图神经网络 (GNN)**：GCN、GAT、Message Passing、分子性质预测
- **语音/音频**：Whisper、TTS、音频理解
- **AI for Science**：蛋白质结构预测(AlphaFold)、分子动力学

---

### 第⑤层：系统工程化（预计 6 个月）

这是从"能做模型"到"能交付系统"的飞跃：

| 领域 | 技术栈 | 学习要点 |
|------|--------|---------|
| **MLOps** | Weights & Biases / MLflow / DVC | 实验追踪、模型版本管理、数据版本控制 |
| **模型部署** | FastAPI + Docker + Triton Inference Server | 模型优化(ONNX/TensorRT/量化)、服务化、Batching |
| **向量数据库** | Chroma/Pinecone/Milvus | 语义搜索、RAG 系统的存储层 |
| **编排与调度** | Airflow/Prefect/Kubeflow | 训练流水线、特征流水线 |
| **监控** | Prometheus + Grafana | 模型漂移检测、数据漂移检测 |
| **AI 安全** | 对抗攻击防御、模型水印、差分隐私 | AI 系统安全评估 |

**关键项目**：把你之前训练的模型部署成一个生产级 API 服务，含 Docker、CI/CD、监控、日志。

---

### 第⑥层：创新与研究（持续进行）

| 活动 | 频率 | 说明 |
|------|------|------|
| **论文阅读** | 每周至少 2 篇 | 来源：arXiv(cs.LG/cs.CL)、Papers With Code、AK 每日论文推荐 |
| **代码复现** | 每月 1 篇重要论文 | 彻底理解一篇论文就是实现它 |
| **技术博客** | 每月 1-2 篇 | 输出倒逼输入，写清楚才是真理解 |
| **开源贡献** | 持续 | 从小 PR 开始(Doc fix → Bug fix → Feature) |
| **竞赛** | 季度参加 | Kaggle / 天池，检验水平，积累作品 |

---

## 推荐学习节奏

```
每天时间分配（建议 3-4 小时）：
  ├─ 40% 核心学习（按阶段进行）
  ├─ 30% 动手实践（写代码、做项目）
  ├─ 20% 论文/博客阅读（保持前沿感知）
  └─ 10% 回顾与笔记整理

每周节奏：
  ├─ 周一至周五：按计划推进核心学习
  ├─ 周六：深度学习（读论文 + 做大项目）
  └─ 周日：回顾整理 + 输出博客/笔记 + 探索新技术

每月里程碑：
  ├─ 至少完成 1 个完整项目（含代码 + 文档）
  ├─ 至少产出 1 篇技术博客/笔记
  └─ 自我考核：能用白板讲清楚本月学到的核心概念
```

---

## 资源汇总

### 必读书单（按阅读顺序）

| 序号 | 书名 | 阶段 | 说明 |
|------|------|------|------|
| 1 | 《Fluent Python》第2版 | ① | Python 进阶圣经 |
| 2 | 《An Introduction to Statistical Learning》(ISLR) | ② | ML 入门最佳，有免费 PDF |
| 3 | 《Pattern Recognition and Machine Learning》(Bishop) | ② | ML 理论经典，精读前4章 |
| 4 | 《Deep Learning》(Goodfellow/Bengio/Courville) | ③ | 深度学习"圣经"，当工具书 |
| 5 | 《Dive into Deep Learning》(动手学深度学习) | ③ | 代码驱动的深度学习教材，免费 |
| 6 | 《Designing Machine Learning Systems》(Chip Huyen) | ⑤ | ML 系统设计，实战导向 |
| 7 | 《Building LLMs for Production》 | ④⑤ | LLM 工程化实战 |

### 在线课程

| 课程 | 提供方 | 阶段 |
|------|--------|------|
| CS229: Machine Learning | Stanford (Andrew Ng) | ② |
| CS231n: CNNs for Visual Recognition | Stanford | ③④ |
| CS224n: NLP with Deep Learning | Stanford | ④ |
| CS25: Transformers United | Stanford | ③④ |
| Practical Deep Learning for Coders | fast.ai | ②③ |
| Full Stack Deep Learning | UC Berkeley | ⑤ |
| MIT 6.S191: Introduction to Deep Learning | MIT | ③ |

### 每天必刷网站

| 网站 | 用途 |
|------|------|
| [paperswithcode.com](https://paperswithcode.com) | 跟踪 SOTA + 带代码的论文 |
| [arxiv.org](https://arxiv.org) (cs.LG, cs.CL, cs.AI) | 最新论文 |
| [huggingface.co/papers](https://huggingface.co/papers) | 每日精选论文 + 社区讨论 |
| [github.com/trending/python](https://github.com/trending/python) | Python AI 项目趋势 |
| [kaggle.com](https://kaggle.com) | 竞赛 + 数据集 + Notebooks |
| [nlpprogress.com](https://nlpprogress.com) | NLP 各任务 SOTA 追踪 |

---

## 进度追踪器

```
第〇层 [██████████] 100% — 工具链与基础设施     ← 2026-05-25 完成 ✓
第①层 [░░░░░░░░░░]   0% — 数学与编程基础        ← 你今天从这里开始
第②层 [░░░░░░░░░░]   0% — 机器学习核心
第③层 [░░░░░░░░░░]   0% — 深度学习
第④层 [░░░░░░░░░░]   0% — 专业领域深化
第⑤层 [░░░░░░░░░░]   0% — 系统工程化
第⑥层 [░░░░░░░░░░]   0% — 创新与研究
```

---

## 今日行动清单（2026-05-26）

1. ~~读完这个路线图~~
2. 打开 [paperswithcode.com](https://paperswithcode.com)，浏览今日热点，收藏 2 篇感兴趣的论文
3. 打开 Python/Jupyter，用一个你感兴趣的数据集跑一遍 EDA（Pandas + Matplotlib）
4. 安装 PyTorch：`pip install torch torchvision torchaudio`
5. 新建一个 `notes/` 下的 Markdown 文件，记录今天学到的 3 个新概念
6. 用 |历史 命令确认昨天的对话已完整归档
