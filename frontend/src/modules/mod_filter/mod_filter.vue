<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.toggleFilterPanel" class="glass-btn action-btn" :class="{'active-btn': store.showFilterPanel}">
    🎯 数据筛选
  </button>
</template>
