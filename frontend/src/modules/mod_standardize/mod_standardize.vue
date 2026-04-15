<script setup>
import { store, actions } from '@/core/store.js'
</script>

<template>
  <div class="std-section" v-if="!store.isStandardized">
    <button @click="actions.triggerStandardization" class="glass-btn secondary-btn">⚙️ Z-score 标准化</button>
  </div>
  <div class="std-section" v-else style="display: flex; justify-content: space-between; align-items: center; background: rgba(82, 196, 26, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(82, 196, 26, 0.5);">
    <span class="success-text" style="font-size: 0.9rem;">✅ 已标准化</span>
    <button @click="actions.undoStandardization" class="glass-btn danger-btn" style="width: auto; padding: 4px 10px; font-size: 0.8rem; border: none;">↩️ 撤回</button>
  </div>
</template>
