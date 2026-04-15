<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <div class="video-background">
    <video v-if="store.bgType === 'default'" :key="store.isDarkMode ? 'dark' : 'light'" autoplay loop muted playsinline class="bg-video">
      <source :src="store.isDarkMode ? '/bg-dark.mp4' : '/bg-light.mp4'" type="video/mp4" />
    </video>
    <video v-else-if="store.bgType === 'video'" :key="store.bgUrl" autoplay loop muted playsinline class="bg-video">
      <source :src="store.bgUrl" />
    </video>
    <!-- 🖼️ 修复：增加唯一 Key 以强制触发图片重载，并确保样式层级正确 -->
    <img v-else-if="store.bgType === 'image'" 
         :key="store.bgUrl"
         :src="store.bgUrl" 
         class="bg-video" 
         alt="Custom Background" />
    <div class="bg-overlay" :style="{ background: store.isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)' }"></div>
  </div>
</template>

<style scoped>
.video-background {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
    background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%);
    overflow: hidden;
}

.bg-video {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
}

.bg-overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.2);
    transition: background 0.3s;
}
</style>
