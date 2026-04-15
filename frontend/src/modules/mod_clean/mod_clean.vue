<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <button v-if="!store.cleanResult" @click="actions.triggerDataCleaning" class="glass-btn primary-btn">✨ 智能清洗</button>
  <div v-else class="success-text" style="display:flex; align-items:center; justify-content:center;">✅ 已清洗</div>
</template>
