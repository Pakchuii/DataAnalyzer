<script setup>
import { store, actions } from '@/core/store.js'

// 该组件负责侧边栏的交互控制
const toggleFeature = () => {
  store.showTemplatePanel = !store.showTemplatePanel;
  actions.addLog(`[Template] 用户点击了功能开关，当前状态: ${store.showTemplatePanel}`, 'info');
};
</script>

<template>
  <div class="glass-card module-sidebar-item">
    <h4 class="module-item-title">🧩 演示积木控制</h4>
    <p class="module-item-desc">点击下方按钮可动态挂载/卸载右侧演示面板</p>
    <button 
      @click="toggleFeature" 
      class="glass-btn hover-scale"
      :class="{ 'active-btn': store.showTemplatePanel }"
      style="width: 100%; padding: 10px; border-radius: 12px;"
    >
      {{ store.showTemplatePanel ? '📦 卸载演示面板' : '🚀 挂载演示面板' }}
    </button>
  </div>
</template>

<style scoped>
.module-sidebar-item {
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.module-item-title {
  margin: 0 0 10px 0;
  color: #1890ff;
}
.module-item-desc {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 15px;
}
.active-btn {
  background: rgba(24, 144, 255, 0.2);
  border-color: #1890ff;
}
</style>
