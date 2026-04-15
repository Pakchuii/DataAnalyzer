<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.runTTest" class="glass-btn action-btn danger-btn" :class="{'active-btn': store.showTTest}" :disabled="!store.selectedGroupVar">⚖️ t 检验</button>
</template>
