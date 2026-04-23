<script setup>
import { store } from '@/core/store.js'
import { computed, ref, onMounted, onUnmounted } from 'vue'

const currentBg = computed(() => {
  const res = store.isDarkMode ? store.randomNightBg : store.randomDayBg
  const defaultUrl = store.isDarkMode ? '/bg-dark.mp4' : '/bg-light.mp4'
  return {
    url: res?.url || defaultUrl,
    type: res?.type || 'video'
  }
})

// --- 🖱️ 经典平移视差逻辑 ---
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e) => {
  const x = (e.clientX / window.innerWidth) - 0.5
  const y = (e.clientY / window.innerHeight) - 0.5
  mouseX.value = x * 25
  mouseY.value = y * 25
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <div class="video-background" :style="{ background: store.isDarkMode ? '#0a0a0f' : '#f0f9ff' }">
    <!-- 绑定的 key 改为 url，实现即时刷新 -->
    <div 
      :key="currentBg.url" 
      class="parallax-layer" 
      :style="{ 
        transform: `translate3d(${-mouseX}px, ${-mouseY}px, 0)` 
      }"
    >
      <video v-if="currentBg.type === 'video'" autoplay loop muted playsinline class="bg-media">
        <source :src="currentBg.url" />
      </video>
      <img v-else :src="currentBg.url" class="bg-media" />
    </div>
    
    <div class="bg-overlay" :style="{ background: store.isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.02)' }"></div>
  </div>
</template>

<style scoped>
.video-background {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; 
  overflow: hidden;
}

.parallax-layer {
  position: absolute; 
  top: -5%; left: -5%; width: 110%; height: 110%;
  will-change: transform;
  transition: transform 0.15s ease-out; 
}

.bg-media {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}

.bg-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; 
  pointer-events: none;
}
</style>
