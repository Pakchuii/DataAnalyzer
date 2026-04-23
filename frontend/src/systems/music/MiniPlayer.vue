<script setup>
/**
 * 【音乐系统：全局迷你悬浮播放器】
 * 悬浮在屏幕左下角，支持跨系统显示
 * 默认显示实时歌词，鼠标聚焦时显示歌曲名并呼出控制键
 */
import { store } from '@/core/store.js'
import { computed, ref } from 'vue'

const currentSong = computed(() => store.musicPlaylist[store.musicCurrentIndex] || null)
const isPlaying = computed(() => store.musicIsPlaying)
const currentLyric = computed(() => {
  if (store.musicActiveLyricIndex >= 0 && store.musicLyrics[store.musicActiveLyricIndex]) {
    return store.musicLyrics[store.musicActiveLyricIndex].text
  }
  return '🎶 正在播放...'
})

const isHovered = ref(false)
const showPlaylist = ref(false)

// 播放控制
function togglePlay() {
  store.musicIsPlaying = !isPlaying.value
}

function nextSong() {
  if (store.musicPlaylist.length === 0) return
  store.musicCurrentIndex = (store.musicCurrentIndex + 1) % store.musicPlaylist.length
  store.musicIsPlaying = true
}

function prevSong() {
  if (store.musicPlaylist.length === 0) return
  store.musicCurrentIndex = (store.musicCurrentIndex - 1 + store.musicPlaylist.length) % store.musicPlaylist.length
  store.musicIsPlaying = true
}

function playSong(idx) {
  store.musicCurrentIndex = idx
  store.musicIsPlaying = true
}

function closeMiniPlayer() {
  store.showMiniPlayer = false
}

function handleVolumeChange(e) {
  store.musicVolume = parseFloat(e.target.value)
}
</script>

<template>
  <div class="mini-player-outer" @mouseleave="isHovered = false; showPlaylist = false">
    
    <!-- 弹出式歌单 -->
    <Transition name="slide-up">
      <div v-if="showPlaylist" class="mini-playlist-pop glass-card">
        <div class="pop-header">📋 播放列表 ({{ store.musicPlaylist.length }})</div>
        <div class="pop-list">
          <div v-for="(s, idx) in store.musicPlaylist" 
               :key="idx" 
               class="pop-item"
               :class="{ active: idx === store.musicCurrentIndex }"
               @click="playSong(idx)"
          >
            <span class="pop-idx">{{ idx + 1 }}</span>
            <span class="pop-title">{{ s.title }}</span>
          </div>
        </div>
      </div>
    </Transition>

    <div class="mini-player-widget glass-card" 
         :class="{ 'hovered': isHovered || showPlaylist }"
         @mouseenter="isHovered = true"
         @click="showPlaylist = !showPlaylist"
    >
      <!-- 左侧：封面图 -->
      <div class="mini-cover-box">
        <img v-if="currentSong" :src="currentSong.cover" class="mini-cover-img" :class="{ spinning: isPlaying }" />
        <div v-else class="mini-cover-placeholder">🎵</div>
      </div>

      <!-- 中间：信息显示区 -->
      <div class="mini-content">
        <div class="display-area">
          <Transition name="fade-slide" mode="out-in">
            <div v-if="isHovered || showPlaylist" class="info-text title-text" key="title">
              {{ currentSong ? currentSong.title : '未在播放' }}
            </div>
            <div v-else class="info-text lyric-text" key="lyric">
              {{ currentLyric }}
            </div>
          </Transition>
        </div>

        <!-- 聚焦时显示的控制层 -->
        <Transition name="fade">
          <div v-if="isHovered || showPlaylist" class="mini-controls" @click.stop>
            <button class="mini-ctrl-btn" @click.stop="prevSong">⏮️</button>
            <button class="mini-ctrl-btn play-pause" @click.stop="togglePlay">
              {{ isPlaying ? '⏸️' : '▶️' }}
            </button>
            <button class="mini-ctrl-btn" @click.stop="nextSong">⏭️</button>
            
            <!-- 音量滑块 -->
            <div class="mini-volume-box">
              <span class="vol-icon">🔊</span>
              <input type="range" min="0" max="1" step="0.01" 
                     :value="store.musicVolume" 
                     @input="handleVolumeChange"
                     class="mini-vol-slider" />
            </div>

            <button class="mini-ctrl-btn close-btn" @click.stop="closeMiniPlayer" title="关闭悬浮窗">✖️</button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-player-outer {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 9999;
}

.mini-player-widget {
  width: 280px;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 32px;
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.mini-player-widget.hovered {
  width: 360px;
  height: 80px;
  background: rgba(255, 255, 255, 0.15);
}

.mini-cover-box {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid rgba(235, 47, 150, 0.3);
  margin-right: 12px;
}

.mini-player-widget.hovered .mini-cover-box {
  width: 52px;
  height: 52px;
}

.mini-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mini-cover-img.spinning {
  animation: spin 6s linear infinite;
}

.mini-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-text {
  font-size: 0.85rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-text { color: #eb2f96; font-weight: 700; font-size: 0.95rem; }
.lyric-text { font-style: italic; opacity: 0.85; }

.mini-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.mini-ctrl-btn {
  background: none; border: none; cursor: pointer;
  font-size: 1.1rem; transition: transform 0.2s;
}
.mini-ctrl-btn:hover { transform: scale(1.2); }

.mini-volume-box {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 5px;
}
.vol-icon { font-size: 0.8rem; }
.mini-vol-slider {
  width: 50px;
  height: 3px;
  cursor: pointer;
}

.close-btn { font-size: 0.8rem; opacity: 0.4; margin-left: auto; }

/* 歌单弹出层 */
.mini-playlist-pop {
  position: absolute;
  bottom: 85px;
  left: 0;
  width: 280px;
  max-height: 300px;
  border-radius: 18px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 30px rgba(0,0,0,0.2);
}

.pop-header {
  font-size: 0.8rem; font-weight: 700; color: #eb2f96;
  padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 8px;
}

.pop-list {
  overflow-y: auto;
  flex: 1;
}

.pop-item {
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  gap: 8px;
}
.pop-item:hover { background: rgba(235, 47, 150, 0.1); }
.pop-item.active { color: #eb2f96; background: rgba(235, 47, 150, 0.15); font-weight: 700; }
.pop-idx { opacity: 0.5; width: 15px; }

/* 动画 */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.4s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(20px) scale(0.9); }

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
