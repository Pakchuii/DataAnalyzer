<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <h4 style="color: #b37feb; display: flex; align-items: center; gap: 5px;">
    <span style="font-size: 1.2rem;">✨</span> 高阶智能画像：
  </h4>
  <button @click="actions.runAiSummary" class="glass-btn ai-magic-btn" :class="{'active-btn': store.showAiSummary}">
    {{ store.showAiSummary ? '🤖 隐藏智能数据解读' : '🤖 智能数据解读' }}
  </button>
</template>
