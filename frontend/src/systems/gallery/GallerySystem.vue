<script setup>
import GalleryScreen from './GalleryScreen.vue'
import ModExit from '@/modules/mod_exit/ModExit.vue'
</script>

<template>
  <div class="main-dashboard gallery-system-layout">
    <!-- 悬浮的退出按钮，独立于内容流 -->
    <div class="floating-exit">
      <ModExit />
    </div>

    <!-- 铺满全屏的主要内容 -->
    <GalleryScreen />
  </div>
</template>

<style scoped>
.gallery-system-layout {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* 让退出按钮悬浮在左上角，保留阴影但不占用布局空间 */
.floating-exit {
  position: absolute;
  top: 30px;
  left: 30px;
  z-index: 100;
  width: 250px;
}
</style>
