<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.runDescriptiveStats" class="glass-btn action-btn" :class="{'active-btn': store.showStats}">🧮 描述统计</button>
</template>
