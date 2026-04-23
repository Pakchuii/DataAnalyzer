<script setup>
import { ref, computed, onMounted } from 'vue'

// 1. 扫描相册图片
const rawImages = import.meta.glob('./assets/*.{png,jpg,jpeg,gif,webp}', { eager: true, import: 'default' })

// 响应式显示的列表
const displayedImages = ref([])

// 转换后的全量数据
const allImages = computed(() => {
  return Object.values(rawImages).map((url, idx) => {
    let title = `图片 ${idx + 1}`
    if (typeof url === 'string') {
      const parts = url.split('/')
      const filename = parts.pop() || ''
      title = filename.split('.')[0] || title
    }
    return { id: idx, src: url, title: title }
  })
})

onMounted(() => {
  setTimeout(() => {
    displayedImages.value = allImages.value
  }, 150)
})

// 2. Lightbox 逻辑
const isLightboxOpen = ref(false)
const currentIndex = ref(0)
const currentImage = computed(() => displayedImages.value[currentIndex.value] || null)

function openLightbox(index) {
  currentIndex.value = index
  isLightboxOpen.value = true
}

function closeLightbox() {
  isLightboxOpen.value = false
}

function nextImage(e) {
  if (e) e.stopPropagation()
  currentIndex.value = (currentIndex.value + 1) % displayedImages.value.length
}

function prevImage(e) {
  if (e) e.stopPropagation()
  currentIndex.value = (currentIndex.value - 1 + displayedImages.value.length) % displayedImages.value.length
}
</script>

<template>
  <div class="gallery-screen glass-card">
    <!-- 顶部标题 -->
    <div class="gallery-header glass-card">
      <h1 class="gallery-title">🖼️ 时光影集</h1>
      <p class="gallery-subtitle">共发现 {{ allImages.length }} 张本地系统相片</p>
    </div>

    <!-- 相片网格 -->
    <transition name="grid-fade">
      <div v-if="displayedImages.length > 0" class="photo-grid">
        <div 
          v-for="(img, idx) in displayedImages" 
          :key="img.id" 
          class="photo-card glass-card"
          @click="openLightbox(idx)"
        >
          <img :src="img.src" class="photo-img" loading="lazy" />
          <div class="photo-overlay">
            <span class="photo-title">{{ img.title }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 🚀 全屏 Lightbox (修复：使用 Teleport 传送到 body) -->
    <Teleport to="body">
      <transition name="fade">
        <div v-if="isLightboxOpen" class="lightbox-overlay" @click="closeLightbox">
          <button class="nav-btn prev-btn" @click.stop="prevImage">◀</button>
          
          <div class="lightbox-content" @click.stop>
            <img :src="currentImage.src" class="lightbox-img" />
            <div class="lightbox-caption">{{ currentImage.title }}</div>
          </div>

          <button class="nav-btn next-btn" @click.stop="nextImage">▶</button>
          <button class="close-btn" @click="closeLightbox">✕</button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import '@/systems/analysis/analysis.css';

.gallery-screen {
  flex: 1; width: 100%; height: 100%; overflow-y: auto; padding: 40px; padding-top: 100px; 
  background: var(--premium-glass-bg) !important;
  backdrop-filter: blur(var(--glass-blur)) !important;
  border-radius: 24px;
}

.gallery-header {
  text-align: center; padding: 25px; margin: 0 auto 40px; max-width: 600px;
  background: var(--premium-glass-inner); border-radius: 20px;
}

.photo-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px;
}

.photo-card {
  position: relative; border-radius: 20px; overflow: hidden; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); aspect-ratio: 4/3;
}
.photo-card:hover { transform: translateY(-10px); box-shadow: 0 25px 45px rgba(20, 194, 194, 0.3); }
.photo-img { width: 100%; height: 100%; object-fit: cover; }

.lightbox-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9); backdrop-filter: blur(20px);
  z-index: 10000; display: flex; align-items: center; justify-content: center;
}
.lightbox-content { max-width: 90vw; max-height: 90vh; text-align: center; }
.lightbox-img { max-width: 100%; max-height: 80vh; border-radius: 12px; }
.lightbox-caption { margin-top: 20px; color: #fff; font-size: 1.5rem; }

.nav-btn { position: absolute; top: 50%; background: none; border: none; color: #fff; font-size: 3rem; cursor: pointer; }
.prev-btn { left: 40px; } .next-btn { right: 40px; }
.close-btn { position: absolute; top: 40px; right: 40px; background: none; border: none; color: #fff; font-size: 3rem; cursor: pointer; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
