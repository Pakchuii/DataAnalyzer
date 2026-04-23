<script setup>
/**
 * 【全局音乐管理器】
 * 挂载在 App.vue 顶层，确保音乐跨模块播放不断连
 */
import { store, actions } from '@/core/store.js'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const audioRef = ref(null)
const currentSong = computed(() => store.musicPlaylist[store.musicCurrentIndex] || null)

let animFrameId = null

// 绑定全局 ref
onMounted(() => {
  store.musicAudioRef = audioRef.value
  animFrameId = requestAnimationFrame(updateGlobalState)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})

function updateGlobalState() {
  if (audioRef.value && !audioRef.value.paused) {
    store.musicCurrentTime = audioRef.value.currentTime || 0
    store.musicDuration = audioRef.value.duration || 0
    updateActiveLyric()
  }
  animFrameId = requestAnimationFrame(updateGlobalState)
}

function updateActiveLyric() {
  const lyrics = store.musicLyrics
  if (!Array.isArray(lyrics) || lyrics.length === 0) {
    store.musicActiveLyricIndex = -1
    return
  }
  
  let idx = -1
  const time = store.musicCurrentTime
  // 使用简单的 for 循环并增加边界检查
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i] && time >= lyrics[i].time) {
      idx = i
    } else if (lyrics[i] && time < lyrics[i].time) {
      break
    }
  }
  
  if (idx !== store.musicActiveLyricIndex) {
    store.musicActiveLyricIndex = idx
  }
}

// 监听索引变化进行切歌
watch(() => store.musicCurrentIndex, (newIdx) => {
  if (store.musicIsPlaying) {
    playCurrent()
  }
})

// 监听播放状态开关
watch(() => store.musicIsPlaying, (val) => {
  if (!audioRef.value) return
  if (val) {
    audioRef.value.play().catch(() => {
      store.musicIsPlaying = false
    })
  } else {
    audioRef.value.pause()
  }
})

// 监听音量
watch(() => store.musicVolume, (val) => {
  if (audioRef.value) audioRef.value.volume = val
})

function playCurrent() {
  nextTick(() => {
    if (audioRef.value && currentSong.value) {
      audioRef.value.volume = store.musicVolume
      audioRef.value.load()
      audioRef.value.play().catch(() => {
        console.error('Playback failed')
      })
    }
  })
}

function onEnded() {
  if (store.musicPlayMode === 'single') {
    audioRef.value.currentTime = 0
    audioRef.value.play().catch(() => {})
  } else {
    // 下一首逻辑
    if (store.musicPlaylist.length === 0) return
    if (store.musicPlayMode === 'random') {
      store.musicCurrentIndex = Math.floor(Math.random() * store.musicPlaylist.length)
    } else {
      store.musicCurrentIndex = (store.musicCurrentIndex + 1) % store.musicPlaylist.length
    }
    store.musicIsPlaying = true
  }
}
</script>

<template>
  <audio ref="audioRef" @ended="onEnded" preload="auto" crossorigin="anonymous">
    <source v-if="currentSong" :src="currentSong.url" type="audio/mpeg" />
  </audio>
</template>
