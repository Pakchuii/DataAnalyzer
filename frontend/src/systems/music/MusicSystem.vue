<script setup>
import MusicSidebar from './MusicSidebar.vue'
import MusicScreen from './MusicScreen.vue'
</script>

<template>
  <div class="main-dashboard music-system-layout">
    <MusicSidebar />
    <MusicScreen />
  </div>
</template>

<style scoped>
.music-system-layout {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
