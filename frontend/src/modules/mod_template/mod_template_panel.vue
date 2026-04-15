<script setup>
import { store, actions } from '@/core/store.js'

// 该组件负责右侧主屏幕展示
const runDemo = () => {
  actions.demoAction('这是一次来自按钮点击的积木动作触发！');
};
</script>

<template>
  <div v-if="store.showTemplatePanel" class="glass-card result-panel template-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#1890ff;">🌌 积木化显示面板模板</h3>
      <button @click="store.showTemplatePanel = false" class="close-btn">✕</button>
    </div>
    
    <div class="template-content">
      <div class="welcome-box">
        <h4>✨ 欢迎来到开发者实验室</h4>
        <p>这是一个演示如何快速构建新功能的【显示面板】积木。它通过监听 `store.showTemplatePanel` 来决定是否挂载并将自身渲染到 `AnalysisScreen` 等容器中。</p>
      </div>

      <div class="action-demo-box mt-4">
        <button @click="runDemo" class="glass-btn primary-btn" style="padding: 12px 25px;">⚡ 执行演示 Actions</button>
        <button @click="actions.triggerTemplateDialog" class="glass-btn secondary-btn" style="padding: 12px 25px;">📢 唤醒系统对话框</button>
      </div>

      <div v-if="store.templateData" class="data-display mt-4">
        <p><strong>底层同步状态：</strong></p>
        <pre>{{ JSON.stringify(store.templateData, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.template-panel {
  border-left: 4px solid #1890ff;
  animation: slideInRight 0.5s ease;
}
.welcome-box {
  padding: 20px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 12px;
  border: 1px dashed rgba(24, 144, 255, 0.3);
}
.action-demo-box {
  display: flex;
  gap: 15px;
}
.data-display {
  padding: 15px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-family: monospace;
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
