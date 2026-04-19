# 🏛️ DataAnalyzer Pro: 系统架构指南

> 「 核心稳固，业务动态 —— 一份写给开发者的解耦圣典 」

本文档深入解析 DataAnalyzer Pro 的工程设计哲学及核心解耦模式。

---

## 🔭 架构总览

```
                    ┌─────────────────────────────┐
                    │      Desktop Shell          │
                    │   (PyWebView + Splash)      │
                    └──────────┬──────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │           Frontend (Vue 3)          │
            │  ┌──────┐  ┌────────┐  ┌─────────┐ │
            │  │ Core │  │Modules │  │ Systems │ │
            │  │Store │←→│Actions │  │ Views   │ │
            │  └──┬───┘  └───┬────┘  └────┬────┘ │
            │     └──────────┴─────────────┘      │
            └──────────────────┬──────────────────┘
                               │ HTTP (Axios)
            ┌──────────────────┴──────────────────┐
            │          Backend (Flask 3)           │
            │  ┌──────┐  ┌────────────────────┐   │
            │  │ Core │  │ Auto-Discovery      │   │
            │  │Config│  │ Blueprint Engine     │   │
            │  │Utils │  │ (14 Modules)         │   │
            │  └──────┘  └────────────────────┘   │
            └─────────────────────────────────────┘
```

---

## ✦ 前端三层架构

### Layer 1: Core（核心层）

| 文件 | 职责 |
|------|------|
| `store.js` | 全局响应式状态树，采用 `reactive()` 构建 |
| `api.js` | Axios HTTP 网关，统一 baseURL 与超时配置 |
| `base.js` | 通用业务逻辑混入 |
| `settings.js` | 用户偏好设置（背景、主题、透明度） |
| `systemRegistry.js` | 系统注册表，管理多系统视图的动态切换 |
| `clickEffect.js` | Blue Archive 风格点击特效控制器 |

### Layer 2: Modules（业务插件层）

每个模块遵循统一的"三件套"契约：

```
mod_xxx/
├── mod_xxx.js          # Actions 贡献者 → Object.assign(actions, xxxActions)
├── mod_xxx_panel.vue   # UI 面板组件
└── (可选) mod_xxx.css  # 模块私有样式
```

**Action Injection 模式**：模块在初始化时将自己的业务方法注入到全局 `actions` 对象中，实现零耦合的功能扩展。

### Layer 3: Systems（系统视图层）

系统是模块的容器，负责布局编排：

```
systems/
├── analysis/     # 智能分析系统 (主系统)
├── management/   # 数据管理引擎
├── template/     # 演示模板系统
└── tester/       # 🧪 实验室测试系统
```

每个系统通过 `manifest.json` 声明元数据，由 `systemRegistry.js` 统一管理。

---

## ✦ 后端蓝图引擎

### 自动发现机制 (`core/__init__.py`)

```python
# 工厂函数启动时自动扫描 modules/ 目录
for name in sorted(os.listdir(modules_dir)):
    if name.startswith('mod_'):
        module = importlib.import_module(f'modules.{name}')
        if hasattr(module, 'bp'):
            app.register_blueprint(module.bp)  # 自动注册！
```

**容错性**：即使某个模块代码报错，引擎会捕获异常并跳过，确保主系统始终可用。

### 后端模块清单

| 模块 | API 前缀 | 功能 |
|------|----------|------|
| `mod_upload` | `/api/upload` | 文件上传与格式校验 |
| `mod_preview` | `/api/preview` | 数据预览与基础信息 |
| `mod_clean` | `/api/clean` | 三阶自适应清洗 |
| `mod_stats` | `/api/stats` | 描述性统计分析 |
| `mod_ttest` | `/api/ttest` | Welch's t-test |
| `mod_correlation` | `/api/correlation` | 相关性矩阵 |
| `mod_ml` | `/api/ml` | 随机森林回归 |
| `mod_visualize` | `/api/visualize` | 图表可视化 |
| `mod_radar` | `/api/radar` | 雷达图多维评级 |
| `mod_security` | `/api/security` | 数据脱敏处理 |
| `mod_standardize` | `/api/standardize` | 数据标准化 |
| `mod_summary` | `/api/summary` | AI 叙述性摘要 |
| `mod_data_io` | `/api/data` | 数据导入导出 |
| `mod_test` | `/api/test` | 系统健康检查 |

---

## ✦ CSS 设计令牌体系

系统采用四层 CSS 架构，拒绝 Ad-hoc 内联样式：

```
styles/
├── base.css        # L1: 原子变量 (色彩/字体/间距)
├── glass.css       # L2: 毛玻璃语义令牌 (--premium-glass-bg)
├── animations.css  # L3: 关键帧动画库
├── layout.css      # L4: 响应式布局网格
└── cursor.css      # L5: Blue Archive 光标系统
```

**暗色模式**通过切换 CSS 变量实现一键全局换肤，无需修改任何组件代码。

---

## ✦ 桌面端生命周期

```
launch_window()
    │
    ├── register_app_id()           # 声明 Windows 软件身份
    │
    ├── create splash_window        # 无边框毛玻璃闪屏
    │   (frameless, transparent)
    │
    ├── boot_sequence()             # 异步线程
    │   ├── start_services()        # 启动 Flask + Vite
    │   ├── poll port 5173          # 轮询前端就绪
    │   ├── create main_window      # 创建主窗口
    │   └── splash.destroy()        # 销毁闪屏
    │
    └── cleanup()                   # 窗口关闭时杀掉所有子进程
```

---

<p align="center">
  <sub>✦ 架构即信仰，代码即诗篇 ✦</sub>
</p>
