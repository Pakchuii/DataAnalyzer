import { createApp } from 'vue'
import App from './App.vue'

// 【第1层：全局设计令牌引入】
// 按依赖关系顺序加载：基础重置 → 组件库 → 动画 → 布局
import '@/core/styles/base.css'
import '@/core/styles/glass.css'
import '@/core/styles/animations.css'
import '@/core/styles/layout.css'

// 【第2层：系统级主题引入】
import '@/systems/analysis/analysis.css'

createApp(App).mount('#app')
