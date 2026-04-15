<script setup>
import ManagementSidebar from './ManagementSidebar.vue'
import ManagementEditor from './ManagementEditor.vue'
</script>

<template>
  <div class="unified-editor-container">
    <!-- 侧边栏系统 -->
    <ManagementSidebar />

    <!-- 主编辑系统 (Screen) -->
    <ManagementEditor />
  </div>
</template>

<style scoped>
@import '@/systems/management/management.css';

.unified-editor-container {
  display: flex;
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: rgba(0,0,0,0.3);
}
</style>
