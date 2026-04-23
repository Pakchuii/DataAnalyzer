<script setup>
import { ref, onMounted } from 'vue'
import { store } from '@/core/store.js'

const progress = ref(0)
const isVisible = ref(true)

onMounted(() => {
  const interval = setInterval(() => {
    progress.value += Math.random() * 8
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
      setTimeout(() => {
        isVisible.value = false
      }, 800) 
    }
  }, 100)
})
</script>

<template>
  <transition name="ba-fade">
    <div v-if="isVisible" class="ba-loader" :class="{ 'night-mode': store.isDarkMode }">
      <!-- 背景装饰：极简斜纹 -->
      <div class="ba-pattern"></div>

      <div class="loader-content">
        <!-- 核心图标区域 -->
        <div class="icon-container">
          <!-- 旋转光环 (Halo) -->
          <div class="halo"></div>
          <!-- 标志性小鲸鱼图标 (SVG) -->
          <div class="main-symbol">
            <svg viewBox="0 0 100 100" class="whale-svg">
              <path d="M20,60 C20,40 40,30 60,30 C80,30 90,45 90,60 C90,75 75,85 50,85 C25,85 20,75 20,60 Z" fill="currentColor"/>
              <circle cx="70" cy="50" r="4" fill="white" />
              <path d="M85,55 L95,45 M85,65 L95,75" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <!-- 标题文字 -->
        <div class="brand-title">
          <span class="main">Pakchuii</span>
          <div class="sub">SYSTEM INITIALIZING</div>
        </div>

        <!-- 进度条区域 -->
        <div class="progress-wrapper">
          <div class="ba-bar-bg">
            <div class="ba-bar-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <div class="status-info">
            <span class="now-loading">Now Loading...</span>
            <span class="percent">{{ Math.floor(progress) }}%</span>
          </div>
        </div>
      </div>

      <!-- 底部装饰条 -->
      <div class="ba-footer">
        <div class="line"></div>
        <div class="version">VER 3.0.4 / SCHALE OS</div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
/* 蔚蓝档案配色方案 */
.ba-loader {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #ffffff; color: #00AEEF; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: all 0.5s ease;
}

.ba-loader.night-mode {
  background: #1a2332; color: #00d2ff;
}

/* 背景斜纹装饰 */
.ba-pattern {
  position: absolute; width: 100%; height: 100%;
  background-image: repeating-linear-gradient(45deg, rgba(0, 174, 239, 0.03) 0, rgba(0, 174, 239, 0.03) 1px, transparent 0, transparent 50%);
  background-size: 15px 15px;
}

.loader-content { position: relative; text-align: center; z-index: 10; }

/* 图标与光环 */
.icon-container {
  position: relative; width: 120px; height: 120px; margin: 0 auto 30px;
}
.halo {
  position: absolute; top: -10px; left: 10%; width: 80%; height: 20px;
  border: 2px solid currentColor; border-radius: 50%; opacity: 0.5;
  transform: rotateX(70deg); animation: halo-spin 4s linear infinite;
}
.main-symbol {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  filter: drop-shadow(0 5px 15px rgba(0, 174, 239, 0.2));
}
.whale-svg { width: 80px; height: 80px; }

/* 标题样式 */
.brand-title { margin-bottom: 40px; }
.brand-title .main { font-size: 1.8rem; font-weight: 900; letter-spacing: 5px; }
.brand-title .sub { font-size: 0.7rem; font-weight: bold; opacity: 0.6; margin-top: 5px; letter-spacing: 2px; }

/* 进度条 */
.progress-wrapper { width: 300px; margin: 0 auto; }
.ba-bar-bg { width: 100%; height: 6px; background: rgba(0, 174, 239, 0.1); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
.ba-bar-fill { height: 100%; background: currentColor; transition: width 0.2s ease-out; }
.status-info { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 800; font-style: italic; }

/* 底部 */
.ba-footer {
  position: absolute; bottom: 40px; width: 100%; text-align: center;
}
.ba-footer .line { width: 40px; height: 4px; background: currentColor; margin: 0 auto 10px; border-radius: 2px; }
.ba-footer .version { font-size: 0.65rem; font-weight: bold; opacity: 0.4; letter-spacing: 1px; }

@keyframes halo-spin { from { transform: rotateX(70deg) rotateZ(0deg); } to { transform: rotateX(70deg) rotateZ(360deg); } }

/* 出场动画 */
.ba-fade-leave-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.ba-fade-leave-to { opacity: 0; transform: scale(1.05); }

</style>
