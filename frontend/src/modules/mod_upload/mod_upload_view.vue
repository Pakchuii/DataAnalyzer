<script setup>
import { store, actions } from '@/core/store.js'
import api from '@/core/api.js'
import { ref } from 'vue'

const isDragging = ref(false);
const fileInput = ref(null);

const handleDragOver = () => { isDragging.value = true; };
const handleDragLeave = () => { isDragging.value = false; };

const handleDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (!file) return;
  triggerUpload(file);
};

const handleFileSelect = (event) => {
  const inputTarget = event.target;
  const file = inputTarget.files[0];
  if (!file) return;
  triggerUpload(file, inputTarget);
};

const triggerUpload = (file, inputTarget = null) => {
  if (actions && actions.uploadFile) {
      actions.uploadFile(file);
  }
  if (inputTarget) inputTarget.value = '';
};
</script>

<template>
  <div
    class="glass-card module-upload-view"
    :class="{ 'drag-over': isDragging }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    style="width: 100%; display: flex; flex-direction: column; padding: 20px; border-radius: 16px; transition: all 0.3s; position: relative; margin-bottom: 25px;"
  >
    <!-- 拖拽覆盖层 -->
    <div v-if="isDragging" class="drag-overlay">
      <div style="font-size: 3rem; margin-bottom: 10px;">📥</div>
      <h3 style="color: #1890ff; margin: 0;">松开鼠标覆盖数据</h3>
    </div>

    <input type="file" ref="fileInput" @change="handleFileSelect" accept=".csv, .xlsx, .xls" style="display: none;" />

    <div style="display: flex; gap: 10px;">
      <button @click="fileInput.click()" class="glass-btn hover-scale" style="flex: 1; padding: 10px; border-radius: 12px; color: #1890ff; border: 1px solid rgba(24,144,255,0.4); background: rgba(24,144,255,0.05);">📁 导入表格</button>
    </div>
  </div>
</template>

<style scoped>
.drag-overlay {
  position: absolute; top: 0; left: 0; 
  width: 100%; height: 100%; 
  background: rgba(24,144,255,0.15); 
  border: 3px dashed #1890ff; 
  border-radius: 16px; 
  display: flex; flex-direction: column; justify-content: center; align-items: center; 
  z-index: 50; pointer-events: none;
}
.drag-over {
  box-shadow: 0 0 20px rgba(24,144,255,0.3);
  transform: scale(1.02);
}
</style>
