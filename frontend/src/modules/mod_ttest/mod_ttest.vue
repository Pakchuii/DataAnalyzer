<script setup>
import { store, actions } from '@/core/store.js'
import { ref } from 'vue'

const ttestDropdownOpen = ref(false)
</script>

<template>
  <h4 class="mt-3">t 检验分组变量：</h4>
  <div class="custom-dropdown-container" @mouseleave="ttestDropdownOpen = false">
    <div class="custom-select-box" @click="store.fileInfo.binary_columns.length ? ttestDropdownOpen = !ttestDropdownOpen : null" :class="{ 'disabled': !store.fileInfo.binary_columns.length }">
      <span>{{ store.selectedGroupVar || (store.fileInfo.binary_columns.length ? '请选择分组变量' : '无二分类变量') }}</span>
      <span class="arrow" :style="{ transform: ttestDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
    </div>
    <transition name="dropdown-slide">
      <ul v-show="ttestDropdownOpen" class="custom-options-list glass-card" style="z-index: 104;">
        <li class="custom-option" v-for="col in store.fileInfo.binary_columns" :key="col" @click="store.selectedGroupVar = col; ttestDropdownOpen = false" :class="{ 'selected': store.selectedGroupVar === col }">
          {{ col }}
        </li>
      </ul>
    </transition>
  </div>
</template>
