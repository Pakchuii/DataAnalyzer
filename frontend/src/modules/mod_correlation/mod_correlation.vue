<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.runAdvancedAnalysis" class="glass-btn action-btn" :class="{'active-btn': store.showAdvanced}">🔬 关联分析</button>
</template>
