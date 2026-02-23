<script setup>
import { store, actions } from '../store.js'
import { ref } from 'vue'

const ttestDropdownOpen = ref(false);       // t检验分组
const mlDropdownOpen = ref(false);          // 机器学习目标
const radarIdDropdownOpen = ref(false);     // 雷达图身份
const radarTargetDropdownOpen = ref(false); // 雷达图具体个体
</script>

<template>
  <aside class="sidebar glass-card">
    <h2 class="sidebar-title">⚙️ 控制台</h2>

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
      <button @click="store.fileInfo=null" class="reupload-btn">重新载入数据</button>
    </div>

    <div v-if="store.fileInfo" class="config-panel">

      <div class="action-grid mt-3">
        <button @click="actions.togglePreview" class="glass-btn secondary-btn">{{ store.showPreview ? '收起预览' : '👁️ 预览数据' }}</button>
        <button v-if="!store.cleanResult" @click="actions.triggerDataCleaning" class="glass-btn primary-btn">✨ 智能清洗</button>
        <div v-else class="success-text" style="display:flex; align-items:center; justify-content:center;">✅ 已清洗</div>
      </div>

      <div v-if="store.cleanResult" class="steps-container mt-3">

        <div class="std-section" v-if="!store.isMasked" style="margin-bottom: 10px;">
          <button @click="actions.triggerMasking" class="glass-btn secondary-btn" style="border-color: #faad14; color: #faad14; background: rgba(250, 173, 20, 0.05);">
            🔏 启动隐私数据脱敏
          </button>
        </div>
        <div class="std-section" v-else style="margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: rgba(250, 173, 20, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(250, 173, 20, 0.5);">
          <span class="success-text" style="color: #faad14; font-size: 0.9rem;">🔒 已开启隐私脱敏</span>
          <button @click="actions.undoMasking" class="glass-btn danger-btn" style="width: auto; padding: 4px 10px; font-size: 0.8rem; border: none; background: rgba(255, 77, 79, 0.1); color: #ff4d4f;">
            🔓 解除
          </button>
        </div>

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
        <div class="custom-dropdown-container" @mouseleave="ttestDropdownOpen = false">
            <div class="custom-select-box" @click="store.fileInfo.binary_columns.length ? ttestDropdownOpen = !ttestDropdownOpen : null" :class="{ 'disabled': !store.fileInfo.binary_columns.length }">
                <span>{{ store.selectedGroupVar || (store.fileInfo.binary_columns.length ? '请选择分组变量' : '无二分类变量') }}</span>
                <span class="arrow" :style="{ transform: ttestDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
            </div>
            <transition name="dropdown-slide">
                <ul v-show="ttestDropdownOpen" class="custom-options-list glass-card" style="z-index: 104;">
                    <li class="custom-option"
                        v-for="col in store.fileInfo.binary_columns"
                        :key="col"
                        @click="store.selectedGroupVar = col; ttestDropdownOpen = false"
                        :class="{ 'selected': store.selectedGroupVar === col }">
                        {{ col }}
                    </li>
                </ul>
            </transition>
        </div>

        <div class="divider"></div>
        <div class="action-grid">
          <button @click="actions.runDescriptiveStats" class="glass-btn action-btn" :class="{'active-btn': store.showStats}">🧮 描述统计</button>
          <button @click="actions.generateCharts" class="glass-btn action-btn" :class="{'active-btn': store.showCharts}">📈 可视化</button>
          <button @click="actions.runAdvancedAnalysis" class="glass-btn action-btn" :class="{'active-btn': store.showAdvanced}">🔬 关联分析</button>
          <button @click="actions.runTTest" class="glass-btn action-btn danger-btn" :class="{'active-btn': store.showTTest}" :disabled="!store.selectedGroupVar">⚖️ t 检验</button>
        </div>

        <div class="divider" style="margin-top: 25px;"></div>
        <h4 style="color: #722ed1; display: flex; align-items: center; gap: 5px;">
          <span style="font-size: 1.2rem;">🤖</span> 机器学习预测引擎：
        </h4>
        <div style="margin-bottom: 10px;">
            <label style="font-size: 0.85rem; color: #888;">目标变量 (预测谁)：</label>
            <div class="custom-dropdown-container" style="margin-top: 5px;" @mouseleave="mlDropdownOpen = false">
            <div class="custom-select-box" @click="mlDropdownOpen = !mlDropdownOpen">
                <span>{{ store.mlTargetVar || '请选择目标(Y)' }}</span>
                <span class="arrow" :style="{ transform: mlDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
            </div>
            <transition name="dropdown-slide">
                <ul v-show="mlDropdownOpen" class="custom-options-list glass-card" style="z-index: 103;">
                    <li class="custom-option"
                        v-for="col in store.fileInfo.numeric_columns"
                        :key="col"
                        @click="store.mlTargetVar = col; mlDropdownOpen = false"
                        :class="{ 'selected': store.mlTargetVar === col }">
                        {{ col }}
                    </li>
                </ul>
            </transition>
        </div>
        </div>
        <div style="margin-bottom: 10px;">
            <label style="font-size: 0.85rem; color: #888;">特征变量 (影响因素)：</label>
            <div class="checkbox-group" style="margin-top: 5px; max-height: 100px; overflow-y: auto;">
              <label v-for="col in store.fileInfo.numeric_columns" :key="'ml-'+col" class="checkbox-label">
                <input type="checkbox" :value="col" v-model="store.mlFeatureVars" :disabled="col === store.mlTargetVar">
                <span :style="{ color: col === store.mlTargetVar ? '#ccc' : 'inherit' }">{{ col }}</span>
              </label>
            </div>
        </div>
        <button @click="actions.runMachineLearning" class="glass-btn action-btn" style="background: #722ed1; color: white;" :class="{'active-btn': store.showML}">
          {{ store.showML ? '⚡ 收起预测面板' : '⚡ 训练随机森林模型' }}
        </button>

        <div class="divider" style="margin-top: 25px;"></div>
        <h4 style="color: #b37feb; display: flex; align-items: center; gap: 5px;">
          <span style="font-size: 1.2rem;">✨</span> 高阶智能画像：
        </h4>
    <button @click="actions.runAiSummary" class="glass-btn ai-magic-btn" :class="{'active-btn': store.showAiSummary}">
  {{ store.showAiSummary ? '🤖 隐藏智能数据解读' : '🤖 智能数据解读' }}
</button>

        <h4 class="mt-2">个体雷达图定位：</h4>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">

            <div class="custom-dropdown-container" style="flex:1;" @mouseleave="radarIdDropdownOpen = false">
                <div class="custom-select-box" @click="radarIdDropdownOpen = !radarIdDropdownOpen">
                    <span>{{ store.radarIdCol || '1.选择身份' }}</span>
                    <span class="arrow" :style="{ transform: radarIdDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
                </div>
                <transition name="dropdown-slide">
                    <ul v-show="radarIdDropdownOpen" class="custom-options-list glass-card" style="z-index: 102;">
                        <li class="custom-option"
                            v-for="col in store.fileInfo.columns.filter(c => !store.fileInfo.numeric_columns.includes(c))"
                            :key="col"
                            @click="store.radarIdCol = col; radarIdDropdownOpen = false; actions.fetchRadarOptions()"
                            :class="{ 'selected': store.radarIdCol === col }">
                            {{ col }}
                        </li>
                    </ul>
                </transition>
            </div>

            <div class="custom-dropdown-container" style="flex:1;" @mouseleave="radarTargetDropdownOpen = false">
                <div class="custom-select-box" @click="store.radarIdCol ? radarTargetDropdownOpen = !radarTargetDropdownOpen : null" :class="{ 'disabled': !store.radarIdCol }">
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">
                        {{ store.selectedRadarTarget || '2.选择个体' }}
                    </span>
                    <span class="arrow" :style="{ transform: radarTargetDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
                </div>
                <transition name="dropdown-slide">
                    <ul v-show="radarTargetDropdownOpen" class="custom-options-list glass-card" style="z-index: 101;">
                        <li class="custom-option"
                            v-for="opt in store.radarOptions"
                            :key="opt"
                            @click="store.selectedRadarTarget = opt; radarTargetDropdownOpen = false"
                            :class="{ 'selected': store.selectedRadarTarget === opt }">
                            {{ opt }}
                        </li>
                    </ul>
                </transition>
            </div>

        </div>
        </div>
        <button @click="actions.runRadarChart" class="glass-btn action-btn" style="background: #e6a23c; color: white;" :class="{'active-btn': store.showRadar}" :disabled="!store.selectedRadarTarget">
          {{ store.showRadar ? '🕸️ 收起雷达图' : '🕸️ 生成雷达图' }}
        </button>

        <div class="divider" style="margin-top: 25px;"></div>
        <h4 style="color: #ff4d4f; display: flex; align-items: center; gap: 5px;">
          <span style="font-size: 1.2rem;">📸</span> PDF数据报截图：
        </h4>
<button @click="actions.exportPDF" class="glass-btn pdf-export-btn">
  ⬇️ 一键导出高清 PDF 数据报
</button>

      </div> </div> <div style="flex-grow: 1;"></div>
    <button @click="actions.triggerCleanup" class="glass-btn cleanup-btn mt-3">🧹 一键清理系统缓存</button>
<button @click="store.showLogs = !store.showLogs" class="glass-btn log-toggle-btn mt-3">
  {{ store.showLogs ? '📟 收起系统操作日志' : '📟 展开系统操作日志' }}
</button>
  </aside>
</template>

<style scoped src="./Sidebar.css"></style>