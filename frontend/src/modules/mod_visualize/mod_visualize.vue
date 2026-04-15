<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.generateCharts" class="glass-btn action-btn" :class="{'active-btn': store.showCharts}">📈 可视化</button>
</template>
