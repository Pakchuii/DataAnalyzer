<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <div v-if="!store.fileInfo">
    <div class="upload-area" :class="{ 'is-dragging': store.isDragging }" @dragover.prevent="store.isDragging=true" @dragleave.prevent="store.isDragging=false" @drop.prevent="actions.handleDrop">
      <div class="upload-icon">📁</div>
      <p>拖拽文件至此</p>
      <input type="file" id="file-upload" accept=".csv, .xls, .xlsx" @change="actions.handleFileSelect" style="display: none;">
      <label for="file-upload" class="upload-btn">选择本地文件</label>
    </div>
    <div style="text-align: center; margin-top: 15px;">
      <div style="display: flex; align-items: center; justify-content: center; color: #888; font-size: 0.8rem; margin-bottom: 15px;">
        <span style="flex:1; height:1px; background:rgba(0,0,0,0.1);"></span>
        <span style="padding: 0 10px;">或</span>
        <span style="flex:1; height:1px; background:rgba(0,0,0,0.1);"></span>
      </div>
      <button @click="actions.openManualEditor" class="glass-btn secondary-btn" style="width: 100%; border: 1px dashed #409eff; color: #409eff; background: rgba(64,158,255,0.05);">✏️ 在线创建表格数据</button>
    </div>
  </div>

  <div v-else class="upload-area success-area">
    <div class="upload-icon" style="color:#67c23a;">📄</div>
    <p style="font-weight:bold; color:#67c23a; margin:5px 0;">数据已就绪</p>
    <p class="file-name-text">{{ store.uploadedFileName }}</p>
    <button @click="actions.resetSystemState()" class="reupload-btn">重新载入数据</button>
  </div>
</template>
