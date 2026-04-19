import { createApp } from 'vue'
import App from './App.vue'

// 【第1层：全局设计令牌引入】
// 按依赖关系顺序加载：基础重置 → 组件库 → 动画 → 布局 → 光标
import '@/core/styles/base.css'
import '@/core/styles/glass.css'
import '@/core/styles/animations.css'
import '@/core/styles/layout.css'
import '@/core/styles/cursor.css'

// 【第2层：系统级主题引入】
import '@/systems/analysis/analysis.css'

// 【第3层：交互特效初始化】
import { initClickEffect } from '@/core/clickEffect.js'

const app = createApp(App)
app.mount('#app')

// 在 DOM 完全挂载后启动点击特效
initClickEffect()
