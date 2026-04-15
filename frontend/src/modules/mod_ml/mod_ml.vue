<script setup>
import { store, actions } from '@/core/store.js'
import { ref } from 'vue'

const mlDropdownOpen = ref(false)
</script>

<template>
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
          <li class="custom-option" v-for="col in store.fileInfo.numeric_columns" :key="col" @click="store.mlTargetVar = col; mlDropdownOpen = false" :class="{ 'selected': store.mlTargetVar === col }">
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

  <button v-if="store.showML" @click="store.predictData ? store.predictData = null : actions.runNewPrediction()" class="glass-btn action-btn" style="background: linear-gradient(135deg, #9254de, #409eff); color: white; margin-top: 10px; border: none; animation: fadeIn 0.4s ease;">
    {{ store.predictData ? '⬆️ 收起预测结果' : '✨ 进行未知数据预测' }}
  </button>
</template>
