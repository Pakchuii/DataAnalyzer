<script setup>
import { store, actions } from '@/core/store.js'
import ModExit from '@/modules/mod_exit/ModExit.vue'
import ModUploadView from '@/modules/mod_upload/mod_upload_view.vue'
import ModDataIoView from '@/modules/mod_data_io/mod_data_io_view.vue'
</script>

<template>
  <div class="management-sidebar glass-card"
       :class="{ 'sidebar-dragging-active': store.isDragging }" 
       @dragover.prevent="store.isDragging = true" 
       @dragleave.prevent="store.isDragging = false" 
       @drop.prevent="store.isDragging = false">
    
    <!-- 全局一致性拖拽提示层 -->
    <transition name="fade">
      <div v-if="store.isDragging" class="sidebar-drop-overlay">
        <div class="drop-hint-content">
          <div class="drop-main-icon">📥</div>
          <p class="drop-main-text">松开鼠标载入数据集</p>
        </div>
      </div>
    </transition>

    <!-- 统一退出模块 -->
    <ModExit />

    <!-- 积木组件：上传与导入 -->
    <ModUploadView />

    <!-- 积木组件：数据管理与状态 -->
    <ModDataIoView />

  </div>
</template>

<style scoped>
.management-sidebar {
  width: 300px; display: flex; flex-direction: column; padding: 20px;
  margin-right: 20px; border-radius: 16px; transition: all 0.3s;
  position: relative; height: 100%; box-sizing: border-box; overflow: hidden;
}
.sidebar-dragging-active { border-color: #409eff !important; box-shadow: 0 0 35px rgba(64, 158, 255, 0.4) !important; }
</style>
