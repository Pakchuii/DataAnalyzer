<script setup>
/**
 * 【音乐系统：沉浸式播放屏幕】
 * 专辑封面旋转黑胶唱片 + 实时歌词滚动 + 进度条控制
 */
import { store } from '@/core/store.js'
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const currentSong = computed(() => store.musicPlaylist[store.musicCurrentIndex] || null)
const isPlaying = computed(() => store.musicIsPlaying)
const audioRef = computed(() => store.musicAudioRef)
const visualizerCanvas = ref(null)
const barVisualizerCanvas = ref(null)

let audioCtx = null
let analyser = null
let dataArray = null

// 进度条
const currentTime = computed(() => store.musicCurrentTime)
const duration = computed(() => store.musicDuration)
const progressPercent = computed(() => duration.value ? (currentTime.value / duration.value) * 100 : 0)

// 歌词
const lyrics = computed(() => store.musicLyrics)
const activeLyricIndex = computed(() => store.musicActiveLyricIndex)
const lyricsContainer = ref(null)

// 切换迷你播放器
function toggleMiniPlayer() {
  store.showMiniPlayer = !store.showMiniPlayer
}

function drawWaveVisualizer() {
  if (!analyser || !visualizerCanvas.value) return
  const canvas = visualizerCanvas.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  analyser.getByteFrequencyData(dataArray)
  ctx.clearRect(0, 0, width, height)
  const barWidth = 3
  const gap = 2
  const barCount = Math.min(dataArray.length, Math.floor(width / (barWidth + gap)))
  for (let i = 0; i < barCount; i++) {
    const value = dataArray[i]
    const barHeight = (value / 255) * height * 0.8
    const x = i * (barWidth + gap)
    const y = (height - barHeight) / 2
    ctx.fillStyle = i % 2 === 0 ? '#eb2f96' : '#722ed1'
    ctx.fillRect(x, y, barWidth, Math.max(2, barHeight))
  }
}

function drawBarVisualizer() {
  if (!analyser || !barVisualizerCanvas.value) return
  const canvas = barVisualizerCanvas.value
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  analyser.getByteFrequencyData(dataArray)
  ctx.clearRect(0, 0, width, height)
  const barWidth = (width / dataArray.length) * 2.5
  let x = 0
  for (let i = 0; i < dataArray.length; i++) {
    const barHeight = (dataArray[i] / 255) * height
    const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight)
    gradient.addColorStop(0, '#722ed1')
    gradient.addColorStop(1, '#eb2f96')
    ctx.fillStyle = gradient
    ctx.fillRect(x, height - barHeight, barWidth, barHeight)
    x += barWidth + 1
  }
}

// 视觉更新循环（仅用于 Canvas 重绘）
let visualAnimFrameId = null
function updateVisuals() {
  if (analyser) {
    drawWaveVisualizer()
    drawBarVisualizer()
  }
  visualAnimFrameId = requestAnimationFrame(updateVisuals)
}

function setupVisualizer() {
  if (!audioRef.value) return
  try {
    if (!window._audioSourceMap) window._audioSourceMap = new Map()
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (!window._audioSourceMap.has(audioRef.value)) {
      const source = audioCtx.createMediaElementSource(audioRef.value)
      analyser = audioCtx.createAnalyser()
      source.connect(analyser)
      analyser.connect(audioCtx.destination)
      window._audioSourceMap.set(audioRef.value, analyser)
    } else {
      analyser = window._audioSourceMap.get(audioRef.value)
    }
    analyser.fftSize = 256
    dataArray = new Uint8Array(analyser.frequencyBinCount)
  } catch (e) {
    console.error('Visualizer setup failed:', e)
  }
}

onMounted(() => {
  setupVisualizer()
  visualAnimFrameId = requestAnimationFrame(updateVisuals)
})

onUnmounted(() => { if (visualAnimFrameId) cancelAnimationFrame(visualAnimFrameId) })

// 监听音频对象变化
watch(audioRef, (newRef) => {
  if (newRef) setupVisualizer()
})

// 监听歌词自动滚动
watch(activeLyricIndex, () => {
  nextTick(() => {
    if (lyricsContainer.value) {
      const container = lyricsContainer.value
      const activeEl = container.querySelector('.lyric-line.active')
      if (activeEl) {
        const targetScrollTop = activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2
        container.scrollTo({ top: targetScrollTop, behavior: 'smooth' })
      }
    }
  })
})

// 格式化时间
function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const min = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

// 拖拽进度条
function seekTo(e) {
  if (!audioRef.value || !duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  audioRef.value.currentTime = ratio * duration.value
}

// 解析 LRC 歌词
function parseLRC(lrcText) {
  if (!lrcText) return []
  const lines = lrcText.split('\n')
  const result = []
  for (const line of lines) {
    const match = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/)
    if (match) {
      const time = parseInt(match[1]) * 60 + parseFloat(match[2])
      const text = match[3].trim()
      if (text) result.push({ time, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

// 加载歌词
watch(currentSong, async (song) => {
  if (!song || !song.lrc) { store.musicLyrics = []; return; }
  try {
    const res = await fetch(song.lrc)
    const text = await res.text()
    store.musicLyrics = parseLRC(text)
    store.musicActiveLyricIndex = -1
  } catch {
    store.musicLyrics = []
  }
}, { immediate: true })
</script>

<template>
  <main class="music-screen">

    <!-- 空状态 -->
    <div v-if="!currentSong" class="empty-music">
      <div class="empty-vinyl">
        <div class="vinyl-disc">
          <div class="vinyl-center">🎵</div>
        </div>
      </div>
      <h2 style="margin: 20px 0 8px; color: var(--text-color, #333);">等待音乐接入</h2>
      <p style="color: var(--text-muted, #888); font-size: 0.9rem;">在左侧载入歌单后，点击任意歌曲开始播放</p>
    </div>

    <!-- 播放界面 -->
    <div v-else class="player-layout">

      <!-- 左半部分 -->
      <div class="player-left">
        <!-- 播放主卡片 (唱片 + 信息) -->
        <div class="player-main-card glass-card">
          <div class="vinyl-area">
            <!-- 唱臂 -->
            <div class="tone-arm" :class="{ playing: isPlaying }">
              <div class="arm-base"></div>
              <div class="arm-bar"></div>
              <div class="arm-head"></div>
            </div>
            <!-- 唱片 -->
            <div class="vinyl-disc-large" :class="{ spinning: isPlaying }">
              <div class="vinyl-groove groove-1"></div>
              <div class="vinyl-groove groove-2"></div>
              <div class="vinyl-groove groove-3"></div>
              <img :src="currentSong.cover" class="vinyl-cover-img" />
              <div class="vinyl-center-dot"></div>
            </div>
          </div>

          <!-- 歌曲信息 -->
          <div class="song-info-area">
            <div class="title-row">
              <h2 class="song-title">{{ currentSong.title }}</h2>
              <button class="mini-player-toggle" @click="toggleMiniPlayer" title="开启挂随身听模式">
                {{ store.showMiniPlayer ? '⏹️' : '📻' }}
              </button>
            </div>
            <p class="song-artist">{{ currentSong.artist }}</p>
          </div>

          <!-- 进度条 -->
          <div class="progress-area">
            <span class="time-label">{{ formatTime(currentTime) }}</span>
            <div class="progress-bar" @click="seekTo">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
              <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
            </div>
            <span class="time-label">{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 独立律动卡片 (波形) -->
        <div class="visualizer-card glass-card">
          <div class="visualizer-container">
            <canvas ref="visualizerCanvas" width="350" height="60"></canvas>
          </div>
        </div>

        <!-- 独立律动卡片 (条形图) -->
        <div class="visualizer-card glass-card">
          <div class="visualizer-container">
            <canvas ref="barVisualizerCanvas" width="350" height="60"></canvas>
          </div>
        </div>
      </div>

      <!-- 右半部分：歌词 -->
      <div class="player-right glass-card">
        <h3 class="lyrics-title">📝 歌词</h3>
        <div class="lyrics-scroll" ref="lyricsContainer">
          <div v-if="lyrics.length === 0" class="no-lyrics">
            <p>🎶 纯音乐，无歌词</p>
          </div>
          <div v-else class="lyrics-list">
            <p v-for="(line, idx) in lyrics" :key="idx" class="lyric-line" :class="{ active: idx === activeLyricIndex }"
              @click="audioRef.currentTime = line.time">{{ line.text }}</p>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>

<style scoped>
.music-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  overflow: hidden;
  /* 防止页面整体滚动 */
  height: 100%;
}

/* 空状态 */
.empty-music {
  text-align: center;
}

.empty-vinyl {
  margin: 0 auto;
}

.vinyl-disc {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, #333 30%, #111 50%, #222 70%, #111 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
  animation: spin 4s linear infinite;
}

.vinyl-center {
  font-size: 2rem;
}

/* 播放布局 */
.player-layout {
  display: flex;
  gap: 40px;
  width: 100%;
  height: 100%;
  align-items: center;
  transition: all 0.4s;
}

.player-left {
  flex: 0 0 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 播放主卡片 */
.player-main-card {
  width: 100%;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-radius: 24px;
}

/* 唱片区域 */
.vinyl-area {
  position: relative;
  width: 320px;
  height: 320px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 独立律动卡片 */
.visualizer-card {
  width: 100%;
  padding: 15px 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.visualizer-container {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.player-right {
  flex: 1;
  height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 30px;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 24px;
}

/* 唱臂 */
.tone-arm {
  position: absolute;
  top: -15px;
  right: 30px;
  z-index: 10;
  transform-origin: top right;
  transform: rotate(-25deg);
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tone-arm.playing {
  transform: rotate(-5deg);
}

.arm-base {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #888;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
}

.arm-bar {
  width: 4px;
  height: 140px;
  background: linear-gradient(to bottom, #aaa, #666);
  position: absolute;
  top: 10px;
  right: 6px;
  border-radius: 2px;
}

.arm-head {
  width: 10px;
  height: 20px;
  background: #999;
  position: absolute;
  top: 148px;
  right: 3px;
  border-radius: 0 0 3px 3px;
}

/* 唱片 */
.vinyl-disc-large {
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, transparent 38%, #2a2a2a 39%, #1a1a1a 45%, #222 50%, #1a1a1a 55%, #222 60%, #1a1a1a 65%, #222 70%, #1a1a1a 75%, #222 80%, #1a1a1a 85%, #222 90%, #111 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(0, 0, 0, 0.3);
}

.vinyl-disc-large.spinning {
  animation: spin 8s linear infinite;
}

.vinyl-groove {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.groove-1 {
  width: 82%;
  height: 82%;
}

.groove-2 {
  width: 68%;
  height: 68%;
}

.groove-3 {
  width: 90%;
  height: 90%;
}

.vinyl-cover-img {
  width: 42%;
  height: 42%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #333;
  z-index: 1;
}

.vinyl-center-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle, #ddd 40%, #888 100%);
  z-index: 2;
}

/* 歌曲信息 */
.song-info-area {
  text-align: center;
  margin-bottom: 20px;
  width: 100%;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 6px;
}

.mini-player-toggle {
  background: rgba(235, 47, 150, 0.1);
  border: 1px solid rgba(235, 47, 150, 0.3);
  border-radius: 8px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.mini-player-toggle:hover {
  background: rgba(235, 47, 150, 0.2);
  transform: scale(1.1);
}

.song-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 6px;
  color: var(--text-color, #333);
}

.song-artist {
  font-size: 0.95rem;
  color: var(--text-muted, #888);
  margin: 0;
}

/* 进度条 */
.progress-area {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.time-label {
  font-size: 0.78rem;
  color: var(--text-muted, #888);
  font-family: monospace;
  min-width: 38px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(235, 47, 150, 0.15);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #eb2f96, #722ed1);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: -5px;
  width: 16px;
  height: 16px;
  background: #eb2f96;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(235, 47, 150, 0.4);
  opacity: 0;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

/* 歌词区 */
.lyrics-title {
  margin: 0 0 15px;
  color: var(--text-color, #333);
  font-size: 1rem;
  flex-shrink: 0;
}

.lyrics-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.no-lyrics {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted, #888);
}

.lyrics-list {
  padding: 40px 0;
}

.lyric-line {
  padding: 8px 0;
  font-size: 0.92rem;
  color: var(--text-muted, #999);
  transition: all 0.3s;
  text-align: center;
  line-height: 1.8;
  cursor: pointer;
}

.lyric-line.active {
  color: #eb2f96;
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(235, 47, 150, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
