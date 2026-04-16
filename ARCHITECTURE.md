# 🏛️ DataAnalyzer Pro: 系统架构指南

本文档旨在深入解析 **DataAnalyzer Pro** 的工程设计哲学及其核心解耦模式。

---

## 1. 核心设计原则
系统遵循 **"核心稳固，业务动态"** 的设计理念：
- **核心层 (Core)**: 提供状态管理、基调样式、API 网关及底层工具函数。
- **业务层 (Modules)**: 以功能插件的形式存在，只需满足特定契约即可无缝挂载。

---

## 2. 前端架构：Actions 动态注入模式 (Action Injection)

这是系统最核心的创新点。传统的 Vuex/Pinia 结构往往会导致 Store 文件臃肿，而我们采用了 **“插槽式 Actions”** 模式。

### 核心机制 (`store.js`)
在 `store.js` 初始化时，它不包含任何业务逻辑，仅定义全局原子状态：
```javascript
// store.js
export const store = reactive({
    currentDataFile: null,
    // ... 原子状态
});

export const actions = {
    // 初始为空，由各模块在运行时动态填充
};
```

### 挂载流程
每个业务模块（如 `mod_clean.js`）都是一个独立的 Action 贡献者：
```javascript
// mod_clean.js
export const cleanActions = {
    async runSmartClean() {
        // 核心清洗业务代码
    }
};
// 系统初始化时进行合并
Object.assign(actions, cleanActions);
```
**优势**: 开发者可以在不修改主仓库代码的情况下，通过新增 JS 文件直接扩展系统的业务能力。

---

## 3. 后端架构：动态蓝图扫描引擎 (Auto-Discovery)

后端摆脱了手动注册路由的低效方式，采用 `importlib` 实现全自动蓝图注册。

### 自动化注册逻辑
在工厂函数启动时，系统会扫描 `modules/` 目录：
1. 遍历所有子文件夹。
2. 搜索各模块下定义的 `bp = Blueprint(...)`。
3. 自动根据模块名生成 API 路由前缀（如 `/api/stats`, `/api/ml`）。

**安全性**: 即使新增模块代码报错，注册引擎也会捕获异常并跳过该模块，确保主系统的高可用性。

---

## 4. UI 视觉引擎：Token 化 CSS 体系

系统放弃了 Ad-hoc 的内联样式，采用基于 CSS 变量的 **Glassmorphism 系统**。

- **Layer 1 (Base)**: 定义色彩、模糊度、间距等原子变量（`base.css`）。
- **Layer 2 (Tokens)**: 将原子变量组合为业务语义（如 `--premium-glass-bg`）。
- **Layer 3 (Components)**: 组件直接引用语义变量，支持一键切换全局视觉风格（如深色模式切换）。

---

## 5. 数据流闭环 (Data Flow)

1. **手柄触发**: Vue 组件通过向容器面板投递事件，触发 `actions`。
2. **网关透传**: `api.js` 统一处理请求头与拦截逻辑。
3. **计算下沉**: 后端 Python 承载所有高密集运算。
4. **单向反馈**: 计算结果直接更新 `store` 中的观测指标，触发 UI 响应式刷新。

---

## 🚀 扩展建议
如果您想增加一个新的分析功能（例如：时间序列预测）：
1. 在后端 `modules` 新建 `mod_ts` 文件夹并导出蓝图。
2. 在前端 `modules` 编写业务组件与接口连接器。
3. 系统将自动完成所有路由与状态的连接。
