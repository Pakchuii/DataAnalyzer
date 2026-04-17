# 🧪 DataAnalyzer Pro 

![Vue 3](https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-6.0-AA0000?style=for-the-badge&logo=apache-echarts&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**DataAnalyzer Pro** 是一款专为科研与工程设计的**全栈模块化数据分析平台**。它将极致的 **Glassmorphism（毛玻璃）** 视觉美学与严谨的科学统计算法完美融合，提供从数据清洗、探索性分析到机器学习推理的一站式工作流。

> Developed with ❤️ by **Pakchuii**

---

## ✨ 核心特性

### 🎨 极致 UI/UX 体验
- **Glassmorphism 2.0**: 全深度毛玻璃视觉体系，支持夜间模式。
- **动态组件排版**: 基于 Flex-Column 的自适应分析看板，自动处理面板堆叠与挤压。
- **实时控制台**: 完整的系统日志流追踪，实时反馈后端计算状态。

### 🧼 智慧数据治理 (Smart Cleaning)
- **三阶自适应引擎**: 根据样本量自动选择最优判定准则（Dixon's Q / 3σ / IQR）。
- **形态探针**: 自动识别数据偏度 (Skewness)，动态切换参数化与非参数化清洗模型。

### 📈 科学统计与 AI 预测
- **不等方差纠偏**: 采用 **Welch's t-test** 配合 1000 次 **Bootstrap** 重采样。
- **多维特征工程**: 随机森林回归模型与特征重要性 (Gini Importance) 直观展示。
- **AI 智能解读**: 自动生成叙述性数据摘要，将复杂的指标转化为业务洞察。

### 🖥️ Native Desktop 支持
- **原生壳封装**: 基于 **PyWebView** 打造的桌面客户端，完美融合 Web 的灵活性与本地性能。
- **OS 层级注入**: 深度 Windows API 注入（WM_SETICON），支持自定义任务栏图标与系统原生交互。

---

## 🛠️ 技术栈

- **Frontend**: Vue 3.5 (Composition API), Vite, Axiom, ECharts 6.0, HTML2Canvas.
- **Backend**: Flask 3.0, Pandas, Scikit-learn, Scipy, SQLAlchemy.
- **Desktop**: PyWebView (Native Bridge).
- **Style**: Custom Vanilla CSS (Design Tokens Based).

---

## 🚀 快速启动

### 🌐 Web 环境
```bash
# 后端启动
cd backend
pip install -r requirements.txt
python app.py

# 前端启动
cd frontend
npm install
npm run dev
```

### 💻 桌面端环境
```bash
# 直接运行主入口
python desktop_app.py
```

---

## 📦 便携化部署 (Portable Mode)
为了保持仓库轻量，本项目默认不上传庞大的运行环境。如需使用“开箱即用”的便携功能，请手动下载并在根目录下解压以下组件：

1. **Python 微端**: [下载 Python 3.12 嵌入式版](https://www.python.org/ftp/python/3.12.3/python-3.12.3-embed-amd64.zip) (解压至 `python/`)
2. **Node 微端**: [下载 Node.js 22 LTS 绿色版](https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip) (解压至 `node/`)

解压完成后，直接运行 **`一键启动系统.bat`** 即可。

---

## 🏗️ 模块化架构
本系统采用高度解耦的插件化架构：
- **前端**: `Action Injection` 模式，业务逻辑动态混入全局 Store。
- **后端**: 自动扫描式 `Blueprint` 路由挂载，支持算法模块秒级热插拔。

详细技术细节请参阅 [ARCHITECTURE.md](./ARCHITECTURE.md) 与 [TECHNICAL_SPEC.md](./TECHNICAL_SPEC.md)。

---

## 📄 开源协议
本项目采用 [MIT License](./LICENSE) 协议。
