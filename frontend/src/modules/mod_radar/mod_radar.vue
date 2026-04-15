<script setup>
import { store, actions } from '@/core/store.js'
import { ref } from 'vue'

const radarIdDropdownOpen = ref(false)
const radarTargetDropdownOpen = ref(false)
</script>

<template>
  <h4 class="mt-2">个体雷达图定位：</h4>
  <div style="display: flex; gap: 10px; margin-bottom: 10px;">
    <div class="custom-dropdown-container" style="flex:1;" @mouseleave="radarIdDropdownOpen = false">
      <div class="custom-select-box" @click="radarIdDropdownOpen = !radarIdDropdownOpen">
        <span>{{ store.radarIdCol || '1.选择身份' }}</span>
        <span class="arrow" :style="{ transform: radarIdDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
      </div>
      <transition name="dropdown-slide">
        <ul v-show="radarIdDropdownOpen" class="custom-options-list glass-card" style="z-index: 102;">
          <li class="custom-option" v-for="col in store.fileInfo.columns.filter(c => !store.fileInfo.numeric_columns.includes(c))" :key="col" @click="store.radarIdCol = col; radarIdDropdownOpen = false; actions.fetchRadarOptions()" :class="{ 'selected': store.radarIdCol === col }">
            {{ col }}
          </li>
        </ul>
      </transition>
    </div>
    <div class="custom-dropdown-container" style="flex:1;" @mouseleave="radarTargetDropdownOpen = false">
      <div class="custom-select-box" @click="store.radarIdCol ? radarTargetDropdownOpen = !radarTargetDropdownOpen : null" :class="{ 'disabled': !store.radarIdCol }">
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">{{ store.selectedRadarTarget || '2.选择个体' }}</span>
        <span class="arrow" :style="{ transform: radarTargetDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }">▼</span>
      </div>
      <transition name="dropdown-slide">
        <ul v-show="radarTargetDropdownOpen" class="custom-options-list glass-card" style="z-index: 101;">
          <li class="custom-option" v-for="opt in store.radarOptions" :key="opt" @click="store.selectedRadarTarget = opt; radarTargetDropdownOpen = false" :class="{ 'selected': store.selectedRadarTarget === opt }">
            {{ opt }}
          </li>
        </ul>
      </transition>
    </div>
  </div>
  <button @click="actions.runRadarChart" class="glass-btn action-btn" style="background: #e6a23c; color: white;" :class="{'active-btn': store.showRadar}" :disabled="!store.selectedRadarTarget">
    {{ store.showRadar ? '🕸️ 收起雷达图' : '🕸️ 生成雷达图' }}
  </button>
</template>
