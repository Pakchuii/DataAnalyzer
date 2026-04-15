<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button @click="actions.togglePreview" class="glass-btn secondary-btn">
    {{ store.showPreview ? '收起预览' : '👁️ 预览数据' }}
  </button>
</template>
