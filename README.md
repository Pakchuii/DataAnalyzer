<p align="center">
  <img src="Icon.jpg" width="120" alt="DataAnalyzer Pro Logo" />
</p>

<h1 align="center">✦ DataAnalyzer Pro ✦</h1>

<p align="center">
  <em>「 数据之海的导航者 —— 全栈模块化数据分析平台 」</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=flat-square&logo=vue.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/ECharts-6.0-AA0000?style=flat-square&logo=apache-echarts&logoColor=white" />
  <img src="https://img.shields.io/badge/Scikit--learn-1.4-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" />
</p>

<p align="center">
  <a href="#-快速启动">快速启动</a> ·
  <a href="ARCHITECTURE.md">架构指南</a> ·
  <a href="TECHNICAL_SPEC.md">算法白皮书</a> ·
  <a href="CONTRIBUTING.md">贡献指南</a>
</p>

---

## 💫 关于本项目

**DataAnalyzer Pro** 是一款面向科研与工程场景的 **全栈模块化数据分析平台**。

它将极致的 **Glassmorphism（毛玻璃）** 视觉美学与严谨的科学统计算法相结合，提供从数据清洗、探索性分析到机器学习推理的一站式工作流。同时支持 **Web 浏览器** 和 **原生桌面端（PyWebView）** 双模式运行。

> ☕ Developed with ❤️ by **Pakchuii**

---

## ✨ 核心特性一览

<table>
  <tr>
    <td width="50%">

### 🎨 极致 UI/UX
- **Glassmorphism 2.0** 全深度毛玻璃视觉
- 动态组件自适应布局
- Blue Archive 风格自定义光标 + 点击特效 ✦
- 实时系统控制台日志流

</td>
    <td width="50%">

### 🧼 智慧数据治理
- **三阶自适应路由** 清洗引擎
- Dixon's Q / 3σ / IQR 自动切换
- 分布偏度探针自动识别
- 数据脱敏与标准化处理

</td>
  </tr>
  <tr>
    <td width="50%">

### 📈 科学统计推断
- **Welch's t-test** 不等方差纠偏
- 1000 次 **Bootstrap** 重采样
- 多维相关性分析矩阵
- 雷达图多指标综合评级

</td>
    <td width="50%">

### 🤖 AI 预测引擎
- 随机森林回归 + **Gini 特征重要性**
- 置信度惩罚评价机制
- AI 叙述性数据摘要
- 高保真 PDF/PNG 报表导出

</td>
  </tr>
</table>

---

## 🖥️ 双模式架构

```
┌─────────────────────────────────────────────────────┐
│                    DataAnalyzer Pro                  │
├──────────────────┬──────────────────────────────────┤
│   Browser Mode   │        Desktop Mode              │
│   (Vite + Vue)   │   (PyWebView Native Shell)       │
├──────────────────┴──────────────────────────────────┤
│              Flask RESTful Backend                   │
│       ┌────────────────────────────┐                │
│       │  Auto-Discovery Blueprint   │                │
│       │  Engine (14 Modules)        │                │
│       └────────────────────────────┘                │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 快速启动

### 📋 环境要求
- Python 3.10+
- Node.js 18+
- npm 9+

### 🌐 浏览器模式

```bash
# 克隆仓库
git clone https://github.com/Pakchuii/DataAnalyzer.git
cd DataAnalyzer

# 后端启动
cd backend
pip install -r requirements.txt
python app.py

# 前端启动 (新终端)
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173` 即可进入系统 ✦

### 💻 桌面端模式

```bash
# 安装桌面端依赖
pip install pywebview

# 直接运行
python desktop_app.py
```

系统将自动拉起一个带有启动闪屏动画的原生窗口。

---

## 📦 便携化部署 (Portable Mode)

为实现"解压即用"的便携体验，可手动配置本地微端：

1. **Python**: [下载 Python 3.12 嵌入版](https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip) → 解压至 `python/`
2. **Node.js**: [下载 Node 22 LTS 绿色版](https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip) → 解压至 `node/`

然后双击 `一键启动系统.bat` 即可。

---

## 🏗️ 项目结构

```
DataAnalyzer/
├── 一键启动系统.bat          # 便携版一键启动器
├── desktop_app.py            # 桌面端入口 (Splash + PyWebView)
│
├── backend/                  # Flask 后端
│   ├── app.py                # 微服务启动入口
│   ├── core/                 # 核心库
│   │   ├── __init__.py       # 工厂函数 + 蓝图自动扫描
│   │   ├── config.py         # 全局配置 (路径/安全)
│   │   └── utils.py          # 通用工具 (多编码读取引擎)
│   └── modules/              # 业务模块 (14个)
│       ├── mod_upload/       # 文件上传
│       ├── mod_preview/      # 数据预览
│       ├── mod_clean/        # 智慧清洗
│       ├── mod_stats/        # 描述性统计
│       ├── mod_ttest/        # T检验
│       ├── mod_correlation/  # 相关性分析
│       ├── mod_ml/           # 机器学习
│       ├── mod_visualize/    # 可视化引擎
│       ├── mod_radar/        # 雷达图评级
│       ├── mod_security/     # 数据脱敏
│       ├── mod_standardize/  # 数据标准化
│       ├── mod_summary/      # AI摘要
│       ├── mod_data_io/      # 数据导入导出
│       └── mod_test/         # 测试桩
│
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── core/             # 核心层
│   │   │   ├── store.js      # 全局状态树
│   │   │   ├── api.js        # HTTP 网关
│   │   │   ├── clickEffect.js # Blue Archive 点击特效
│   │   │   └── styles/       # 四层 CSS 设计令牌
│   │   ├── modules/          # 前端业务模块 (18个)
│   │   └── systems/          # 系统级视图 (4个)
│   └── public/
│       └── cursors/          # 自定义光标资源
│
└── docs/                     # 你正在看的文档们
    ├── ARCHITECTURE.md
    ├── TECHNICAL_SPEC.md
    └── CONTRIBUTING.md
```

---

## 🛠️ 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **Frontend** | Vue 3.5 (Composition API) | 响应式 UI 框架 |
| **Bundler** | Vite 5.4 | 极速 HMR 开发服务器 |
| **Charts** | ECharts 6.0 | 数据可视化引擎 |
| **Style** | Vanilla CSS (Token-Based) | 毛玻璃设计系统 |
| **Backend** | Flask 3.0 | RESTful 微服务 |
| **Science** | Pandas / Scipy / Scikit-learn | 统计与 ML 计算 |
| **Desktop** | PyWebView | 原生桌面壳封装 |
| **Export** | HTML2Canvas + jsPDF | 报表生成器 |

---

## 📄 文档导航

| 文档 | 内容 |
|------|------|
| [🏛️ ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构深度解析：插件机制、蓝图引擎、CSS 令牌体系 |
| [📑 TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) | 算法技术白皮书：清洗策略、统计推断、ML 推理流程 |
| [🤝 CONTRIBUTING.md](CONTRIBUTING.md) | 开发者贡献指南：如何添加新模块、代码规范 |

---

## 📜 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

<p align="center">
  <sub>✦ Built with Vue, Flask, and a touch of magic ✦</sub>
</p>
