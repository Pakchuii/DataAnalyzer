<script setup>
/**
 * 【积木编排层：演示系统侧边栏】
 * 演示如何拼装各个独立积木
 */
import { store } from '@/core/store.js'
import ModExit from '@/modules/mod_exit/ModExit.vue'
import ModTemplate from '@/modules/mod_template/mod_template.vue'
</script>

<template>
  <aside class="sidebar glass-card">
    <h2 class="sidebar-title">🧩 积木实验室</h2>
    
    <ModExit />

    <div class="template-instructions glass-inner mb-4">
      <p>欢迎来到模块化系统模板！在这里，您可以练习如何通过简单的 <code>import</code> 将功能挂载到侧边栏。</p>
    </div>

    <!-- 挂载模板积木 -->
    <ModTemplate />

    <div style="flex-grow: 1;"></div>
    
    <button @click="store.showLogs = !store.showLogs" class="glass-btn log-toggle-btn">
      {{ store.showLogs ? '📟 收起操作日志' : '📟 展开操作日志' }}
    </button>
  </aside>
</template>

<style scoped>
@import '@/systems/analysis/analysis.css'; /* 复用一些基础布局样式 */
.portal-back-btn {
  width: 100%; padding: 12px; margin-bottom: 25px; border-radius: 30px; font-weight: bold; background: linear-gradient(135deg, #1890ff, #096dd9); color: white; border: none; box-shadow: 0 4px 15px rgba(24,144,255,0.3);
}
.template-instructions {
  padding: 15px; font-size: 0.9rem; color: #666; font-style: italic; line-height: 1.6;
}
</style>
