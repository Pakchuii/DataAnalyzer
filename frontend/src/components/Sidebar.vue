<script setup>
import { store, actions } from '../store.js'
</script>

<template>
  <aside class="sidebar glass-card">
    <h2 class="sidebar-title">⚙️ 控制台</h2>

    <div v-if="!store.fileInfo">
        <div class="upload-area" :class="{ 'is-dragging': store.isDragging }" @dragover.prevent="store.isDragging=true" @dragleave.prevent="store.isDragging=false" @drop.prevent="actions.handleDrop">
          <div class="upload-icon">📁</div><p>拖拽文件至此</p>
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
      <button @click="store.fileInfo=null" class="reupload-btn">重新载入数据</button>
    </div>

    <div v-if="store.fileInfo" class="config-panel">
      <div class="action-grid mt-3">
        <button @click="actions.togglePreview" class="glass-btn secondary-btn">{{ store.showPreview ? '收起预览' : '👁️ 预览数据' }}</button>
        <button v-if="!store.cleanResult" @click="actions.triggerDataCleaning" class="glass-btn primary-btn">✨ 智能清洗</button>
        <div v-else class="success-text" style="display:flex; align-items:center; justify-content:center;">✅ 已清洗</div>
      </div>

      <div v-if="store.cleanResult" class="steps-container mt-3">
        <div class="std-section" v-if="!store.isStandardized">
          <button @click="actions.triggerStandardization" class="glass-btn secondary-btn">⚙️ Z-score 标准化</button>
        </div>
        <div class="std-section" v-else style="display: flex; justify-content: space-between; align-items: center; background: rgba(82, 196, 26, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(82, 196, 26, 0.5);">
          <span class="success-text" style="font-size: 0.9rem;">✅ 已标准化</span>
          <button @click="actions.undoStandardization" class="glass-btn danger-btn" style="width: auto; padding: 4px 10px; font-size: 0.8rem; border: none;">↩️ 撤回</button>
        </div>

        <div class="divider"></div>
        <h4>1. 勾选数值变量：</h4>
        <div class="checkbox-group">
          <label v-for="(col, index) in store.fileInfo.numeric_columns" :key="index" class="checkbox-label">
            <input type="checkbox" :value="col" v-model="store.selectedVars"> {{ col }}
          </label>
        </div>

        <h4 class="mt-3">2. t 检验分组：</h4>
        <select v-model="store.selectedGroupVar" class="custom-select" :disabled="!store.fileInfo.binary_columns.length">
          <option v-for="col in store.fileInfo.binary_columns" :key="col" :value="col">{{ col }}</option>
          <option v-if="!store.fileInfo.binary_columns.length" value="">无二分类变量</option>
        </select>

        <div class="divider"></div>
        <div class="action-grid">
          <button @click="actions.runDescriptiveStats" class="glass-btn action-btn" :class="{'active-btn': store.showStats}">🧮 描述统计</button>
          <button @click="actions.generateCharts" class="glass-btn action-btn" :class="{'active-btn': store.showCharts}">📈 可视化</button>
          <button @click="actions.runAdvancedAnalysis" class="glass-btn action-btn" :class="{'active-btn': store.showAdvanced}">🔬 关联分析</button>
          <button @click="actions.runTTest" class="glass-btn action-btn danger-btn" :class="{'active-btn': store.showTTest}" :disabled="!store.selectedGroupVar">⚖️ t 检验</button>
        </div>
      </div>
    </div>
    <div style="flex-grow: 1;"></div>
    <button @click="actions.triggerCleanup" class="glass-btn cleanup-btn mt-3">🧹 一键清理系统缓存</button>
  </aside>
</template>

<style scoped>
.sidebar { width: 380px; flex-shrink: 0; padding: 25px; display: flex; flex-direction: column; overflow-y: auto; }
.sidebar::-webkit-scrollbar { width: 6px; }
.sidebar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 10px; }
.sidebar-title { font-size: 1.5rem; margin-top: 0; margin-bottom: 20px; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 10px;}
.upload-area { border: 2px dashed rgba(0,0,0,0.2); border-radius: 12px; padding: 30px 10px; text-align: center; background: rgba(255,255,255,0.3); transition: all 0.3s; }
.upload-area.is-dragging { border-color: #409eff; background: rgba(64,158,255,0.1); }
.success-area { border-style: solid; border-color: #67c23a; background: rgba(103,194,58,0.1); }
.upload-icon { font-size: 40px; margin-bottom: 10px; }
.upload-btn { display: inline-block; padding: 8px 20px; background: #409eff; color: white; border-radius: 20px; cursor: pointer; font-size: 0.9rem; margin-top: 5px;}
.reupload-btn { background: transparent; color: #909399; border: 1px solid #909399; padding: 4px 12px; border-radius: 12px; cursor: pointer; font-size: 0.8rem; margin-top:10px;}
.file-name-text { font-size: 0.85rem; word-break: break-all; opacity: 0.8; margin-top: 5px;}
.mt-2 { margin-top: 10px; } .mt-3 { margin-top: 15px; }
.success-text { color: #52c41a; font-weight: bold; }
.glass-btn { width: 100%; padding: 10px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(4px); }
.primary-btn { background: rgba(230, 162, 60, 0.9); color: white; }
.primary-btn:hover { background: rgba(230, 162, 60, 1); transform: translateY(-2px); }
.secondary-btn { background: rgba(144, 147, 153, 0.8); color: white; }
.secondary-btn:hover { background: rgba(144, 147, 153, 1); }
.cleanup-btn { background: rgba(245, 108, 108, 0.2); color: #f56c6c; border: 1px dashed #f56c6c; }
.cleanup-btn:hover { background: #f56c6c; color: white; }
.divider { height: 1px; background: rgba(0,0,0,0.1); margin: 15px 0; }
h4 { margin: 0 0 10px 0; font-size: 1rem; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 8px; }
.checkbox-label { padding: 6px 12px; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.1); border-radius: 20px; font-size: 0.85rem; cursor: pointer; transition: border-color 0.2s;}
.checkbox-label:hover { border-color: #409eff; }
.custom-select { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.6); outline: none; }
.action-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action-btn { background: rgba(64, 158, 255, 0.85); color: white; border: 2px solid transparent;}
.action-btn:hover { background: rgba(64, 158, 255, 1); transform: translateY(-2px); }
.danger-btn { background: rgba(245, 108, 108, 0.85); }
.danger-btn:hover { background: rgba(245, 108, 108, 1); }
.danger-btn:disabled { background: rgba(245, 108, 108, 0.4); cursor: not-allowed; transform: none;}
.active-btn { border-color: #fff; box-shadow: 0 0 10px rgba(255,255,255,0.5); transform: translateY(-2px); }
</style>