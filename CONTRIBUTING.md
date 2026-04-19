# 🤝 Contributing Guide / 贡献指南

> 「 欢迎来到 DataAnalyzer Pro 的开发世界！」

感谢您有兴趣为本项目做出贡献。无论是修复 Bug、改进文档还是添加全新的分析模块，我们都非常欢迎。

---

## 📋 开发环境搭建

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/DataAnalyzer.git
cd DataAnalyzer

# 2. 后端环境
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# 3. 前端环境
cd ../frontend
npm install
npm run dev
```

---

## 🧩 如何添加一个新的分析模块

DataAnalyzer Pro 的插件化架构让添加新功能变得极其简单。以添加一个"时间序列预测"模块为例：

### Step 1：后端蓝图

在 `backend/modules/` 下新建文件夹：

```
backend/modules/mod_timeseries/
├── __init__.py          # 导出蓝图
└── mod_timeseries.py    # 业务逻辑
```

```python
# __init__.py
from .mod_timeseries import bp

# mod_timeseries.py
from flask import Blueprint, request, jsonify

bp = Blueprint('timeseries', __name__, url_prefix='/api/timeseries')

@bp.route('/forecast', methods=['POST'])
def forecast():
    # 你的算法逻辑
    return jsonify({'status': 'ok', 'result': ...})
```

> ✦ 蓝图会被 `core/__init__.py` 的自动扫描引擎发现并注册，**无需手动修改任何其他文件**。

### Step 2：前端面板

在 `frontend/src/modules/` 下新建文件夹：

```
frontend/src/modules/mod_timeseries/
├── mod_timeseries.js            # Actions 贡献者
└── mod_timeseries_panel.vue     # UI 面板
```

```javascript
// mod_timeseries.js
import api from '@/core/api'
import { store, actions } from '@/core/store'

const timeseriesActions = {
    async runForecast() {
        const res = await api.post('/api/timeseries/forecast', { ... })
        store.forecastResult = res.data.result
    }
}

Object.assign(actions, timeseriesActions)
```

### Step 3：注册到侧边栏

在对应系统的 `Sidebar.vue` 中添加一个菜单项即可。

---

## 📐 代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 后端模块目录 | `mod_` 前缀 | `mod_timeseries/` |
| Blueprint 变量 | 固定命名 `bp` | `bp = Blueprint(...)` |
| 前端 Actions | `xxxActions` 对象 | `timeseriesActions` |
| CSS 变量 | `--` 前缀，语义化 | `--glass-blur-radius` |

### Git Commit 规范

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 样式调整 (不影响逻辑)
refactor: 代码重构
chore: 工程化配置
```

---

## 🏗️ 架构约束

1. **绝对禁止**在模块代码中直接修改 `store.js` 的结构定义。
2. **所有 API 请求**必须通过 `core/api.js` 的统一网关实例。
3. **CSS 样式**应优先使用 `base.css` 和 `glass.css` 中定义的设计令牌。

---

## 🐛 提交 Issue

如果您发现了 Bug 或有功能建议，请通过 [GitHub Issues](https://github.com/Pakchuii/DataAnalyzer/issues) 提交，并尽量包含：
- 操作步骤
- 预期行为 vs 实际行为
- 浏览器/系统版本
- 控制台报错截图

---

<p align="center">
  <sub>✦ 感谢每一位贡献者，让数据分析变得更美好 ✦</sub>
</p>
