<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <h4>通用数值分析变量：</h4>
  <div class="checkbox-group">
    <label v-for="(col, index) in store.fileInfo.numeric_columns" :key="index" class="checkbox-label">
      <input type="checkbox" :value="col" v-model="store.selectedVars"> {{ col }}
    </label>
  </div>
</template>
