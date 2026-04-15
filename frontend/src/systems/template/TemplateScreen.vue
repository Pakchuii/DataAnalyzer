<script setup>
/**
 * 【积木编排层：演示系统屏幕】
 * 演示如何拼装各个显示面板积木，并支持列表动画。
 */
import { store, actions } from '@/core/store.js'
import ModTemplatePanel from '@/modules/mod_template/mod_template_panel.vue'

// 简单的顺序管理（演示用）
const getOrder = (key) => key === 'demo' ? 1 : 100;
</script>

<template>
  <main class="content-area">
    
    <!-- 欢迎缺省页 -->
    <div v-if="!store.showTemplatePanel" class="empty-state">
      <div style="font-size: 6rem; margin-bottom: 20px; filter: grayscale(1) opacity(0.3);">🏛️</div>
      <h2>演示系统：核心展示空位</h2>
      <p>目前所有的显示积木均已卸载，请开启侧边栏控制面板进行挂载演示。</p>
    </div>

    <!-- 面板渲染列表容器 -->
    <transition-group name="panel-list" tag="div" class="panel-container">
       <ModTemplatePanel key="demo" :style="{ order: getOrder('demo') }" />
    </transition-group>


  </main>
</template>

<style scoped>
@import '@/systems/analysis/analysis.css';

.panel-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 列表动画复用 */
.panel-list-move,
.panel-list-enter-active,
.panel-list-leave-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-list-enter-from { opacity: 0; transform: translateY(-30px); }
.panel-list-leave-to { opacity: 0; transform: scale(0.95); }
.panel-list-leave-active { position: absolute; width: 100%; }
</style>
