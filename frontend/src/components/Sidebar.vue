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
               <span style="flex:1; height:1px; background:rgba(0,0,0,0.1);"></span><span style="padding: 0 10px;">或</span><span style="flex:1; height:1px; background:rgba(0,0,0,0.1);"></span>
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
        <h4>通用数值分析变量：</h4>
        <div class="checkbox-group">
          <label v-for="(col, index) in store.fileInfo.numeric_columns" :key="index" class="checkbox-label">
            <input type="checkbox" :value="col" v-model="store.selectedVars"> {{ col }}
          </label>
        </div>

        <h4 class="mt-3">t 检验分组变量：</h4>
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

        <div class="divider" style="margin-top: 25px;"></div>
        <h4 style="color: #b37feb; display: flex; align-items: center; gap: 5px;">
          <span style="font-size: 1.2rem;">✨</span> 高阶智能画像：
        </h4>

        <button @click="actions.runAiSummary" class="glass-btn" style="background: linear-gradient(90deg, #b37feb, #ff85c0); color: white; margin-bottom: 15px;" :class="{'active-btn': store.showAiSummary}">
          {{ store.showAiSummary ? '🤖 隐藏 AI 解读' : '🤖 AI 智能数据解读' }}
        </button>

        <h4 class="mt-2">个体雷达图定位：</h4>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <select v-model="store.radarIdCol" @change="actions.fetchRadarOptions" class="custom-select" style="flex:1;">
                <option value="">1.选择身份</option>
                <option v-for="col in store.fileInfo.columns.filter(c => !store.fileInfo.numeric_columns.includes(c))" :key="col" :value="col">{{ col }}</option>
            </select>
            <select v-model="store.selectedRadarTarget" class="custom-select" style="flex:1;" :disabled="!store.radarIdCol">
                <option value="">2.选择个体</option>
                <option v-for="opt in store.radarOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
        </div>
        <button @click="actions.runRadarChart" class="glass-btn action-btn" style="background: #e6a23c; color: white;" :class="{'active-btn': store.showRadar}" :disabled="!store.selectedRadarTarget">
          {{ store.showRadar ? '🕸️ 收起雷达图' : '🕸️ 生成雷达图' }}
        </button>
        </div>
    </div>
    <div style="flex-grow: 1;"></div>
    <button @click="actions.triggerCleanup" class="glass-btn cleanup-btn mt-3">🧹 一键清理系统缓存</button>
  </aside>
</template>

<style scoped src="./Sidebar.css"></style>