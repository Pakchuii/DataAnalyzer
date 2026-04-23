<script setup>
import { store, actions } from '@/core/store.js'
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import ModExit from '@/modules/mod_exit/ModExit.vue'

// 侧边栏折叠状态
const isSidebarCollapsed = ref(false)

// 歌单 ID
const playlistId = ref(' ')
const customId = ref('')
const isLoading = ref(false)

// 当前歌曲
const currentSong = computed(() => store.musicPlaylist[store.musicCurrentIndex] || null)

// 获取歌单
async function loadPlaylist(id) {
  isLoading.value = true
  try {
    const res = await fetch(`https://api.injahow.cn/meting/?type=playlist&id=${id}`)
    const data = await res.json()
    if (data && data.length > 0) {
      store.musicPlaylist = data.map((s, i) => ({
        id: i,
        title: s.title || s.name || '未知歌曲',
        artist: s.author || s.artist || '未知歌手',
        cover: s.pic || s.cover || '',
        url: s.url || '',
        lrc: s.lrc || ''
      }))
      store.musicCurrentIndex = 0
      if (actions?.addLog) actions.addLog(`🎵 歌单加载完成，共 ${data.length} 首歌曲`, "success")
    }
  } catch (e) {
    console.error('歌单加载失败:', e)
    if (actions?.addLog) actions.addLog(`歌单加载失败: ${e.message}`, "error")
  }
  isLoading.value = false
}

function playSong(index) {
  store.musicCurrentIndex = index
  store.musicIsPlaying = true
}

function togglePlay() {
  if (!store.musicPlaylist.length) return
  store.musicIsPlaying = !store.musicIsPlaying
}

function nextSong() {
  if (store.musicPlaylist.length === 0) return
  if (store.musicPlayMode === 'random') {
    store.musicCurrentIndex = Math.floor(Math.random() * store.musicPlaylist.length)
  } else {
    store.musicCurrentIndex = (store.musicCurrentIndex + 1) % store.musicPlaylist.length
  }
  store.musicIsPlaying = true
}

function prevSong() {
  if (store.musicPlaylist.length === 0) return
  store.musicCurrentIndex = (store.musicCurrentIndex - 1 + store.musicPlaylist.length) % store.musicPlaylist.length
  store.musicIsPlaying = true
}

function cyclePlayMode() {
  const modes = ['list', 'random', 'single']
  const idx = modes.indexOf(store.musicPlayMode)
  store.musicPlayMode = modes[(idx + 1) % modes.length]
}

const playModeIcon = computed(() => {
  return { list: '🔁', random: '🔀', single: '🔂' }[store.musicPlayMode]
})
const playModeText = computed(() => {
  return { list: '列表循环', random: '随机播放', single: '单曲循环' }[store.musicPlayMode]
})

function applyCustomPlaylist() {
  if (customId.value.trim()) {
    playlistId.value = customId.value.trim()
    loadPlaylist(playlistId.value)
  }
}

function handleVolumeChange(e) {
  store.musicVolume = parseFloat(e.target.value)
}

onMounted(() => {
  loadPlaylist(playlistId.value)
})
</script>

<template>
  <!-- 侧边栏整体容器区，添加 collapsed 类进行控制 -->
  <aside class="sidebar glass-card music-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">

    <!-- 边缘吸附的隐藏感应区 -->
    <div class="sidebar-collapse-trigger" @click="isSidebarCollapsed = !isSidebarCollapsed">
      <span class="trigger-arrow">{{ isSidebarCollapsed ? '▶' : '◀' }}</span>
    </div>

    <ModExit />

    <h2 class="sidebar-title">🎵 音乐空间</h2>

    <!-- 歌单 ID 输入 -->
    <div class="playlist-input-area">
      <label class="input-label">网易云歌单 ID</label>
      <div class="input-row">
        <input v-model="customId" :placeholder="playlistId" @keyup.enter="applyCustomPlaylist" class="playlist-input" />
        <button @click="applyCustomPlaylist" class="glass-btn load-btn">载入</button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 播放控制 -->
    <div class="playback-controls" v-if="currentSong">
      <div class="now-playing-mini">
        <img :src="currentSong.cover" class="mini-cover" :class="{ spinning: store.musicIsPlaying }" />
        <div class="mini-info">
          <div class="mini-title">{{ currentSong.title }}</div>
          <div class="mini-artist">{{ currentSong.artist }}</div>
        </div>
      </div>

      <!-- 音量控制 -->
      <div class="volume-control">
        <span class="volume-icon">{{ store.musicVolume === 0 ? '🔇' : (store.musicVolume < 0.5 ? '🔉' : '🔊') }}</span>
            <input type="range" class="volume-slider" min="0" max="1" step="0.01" :value="store.musicVolume"
              @input="handleVolumeChange" />
      </div>

      <div class="control-buttons">
        <button @click="prevSong" class="ctrl-btn">⏮</button>
        <button @click="togglePlay" class="ctrl-btn play-btn">{{ store.musicIsPlaying ? '⏸' : '▶' }}</button>
        <button @click="nextSong" class="ctrl-btn">⏭</button>
        <button @click="cyclePlayMode" class="ctrl-btn mode-btn" :title="playModeText">{{ playModeIcon }}</button>
      </div>
    </div>

    <div class="divider"></div>

    <!-- 歌单列表 -->
    <div class="playlist-header">
      <span>📋 歌单</span>
      <span class="song-count" v-if="store.musicPlaylist.length">{{ store.musicPlaylist.length }} 首</span>
      <span v-if="isLoading" class="loading-hint">加载中...</span>
    </div>

    <div class="playlist-scroll">
      <div v-for="(song, idx) in store.musicPlaylist" :key="idx" class="playlist-item"
        :class="{ active: idx === store.musicCurrentIndex }" @click="playSong(idx)">
        <span class="item-index">{{ idx + 1 }}</span>
        <div class="item-info">
          <div class="item-title">{{ song.title }}</div>
          <div class="item-artist">{{ song.artist }}</div>
        </div>
        <span v-if="idx === store.musicCurrentIndex && store.musicIsPlaying" class="playing-icon">🎶</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
@import '@/systems/analysis/analysis.css';

.music-sidebar {
  position: relative;
  overflow: visible;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 100;
}

/* 折叠状态的样式：向左移动自身宽度并折叠空间 */
.music-sidebar.collapsed {
  transform: translateX(calc(-100% - 25px));
  margin-right: -345px;
}

/* 侧边栏边缘收缩触发区 */
.sidebar-collapse-trigger {
  position: absolute;
  top: 0;
  right: -24px;
  /* 悬浮在侧边栏右边缘外侧 */
  width: 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  transition: all 0.3s;
  z-index: 200;
  border-radius: 0 10px 10px 0;
}

/* 鼠标滑过时的高光效果 */
.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--premium-glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}

.sidebar-collapse-trigger:hover {
  background: rgba(235, 47, 150, 0.1);
  backdrop-filter: blur(4px);
  box-shadow: 2px 0 10px rgba(235, 47, 150, 0.2);
}

.trigger-arrow {
  color: transparent;
  font-size: 1rem;
  transition: all 0.3s;
  transform: translateY(-20px);
}

.sidebar-collapse-trigger:hover .trigger-arrow {
  color: #eb2f96;
  text-shadow: 0 0 10px rgba(235, 47, 150, 0.8);
}

.music-sidebar.collapsed {
  /* 折叠时，感应区依然固定在屏幕最左缘（跟随 sidebar 的 transform 移动了）*/
  /* 但是由于 sidebar opacity 是 0，我们需要让触发区可见 */
  opacity: 1;
}

/* 重新调整：我们要彻底隐藏面板边框和玻璃质感 */
.music-sidebar.collapsed {
  opacity: 1;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  backdrop-filter: none !important;
}

.music-sidebar.collapsed> :not(.sidebar-collapse-trigger) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

.sidebar-title {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  color: #eb2f96;
  transition: opacity 0.3s;
}

/* 歌单输入 */
.playlist-input-area {
  margin-bottom: 5px;
}

.input-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted, #888);
  display: block;
  margin-bottom: 6px;
}

.input-row {
  display: flex;
  gap: 8px;
}

.playlist-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--premium-border-color);
  background: var(--premium-glass-inner);
  color: var(--text-color, #333);
  font-size: 0.85rem;
  outline: none;
}

.playlist-input:focus {
  border-color: #eb2f96;
}

.load-btn {
  padding: 8px 14px;
  font-size: 0.82rem;
  background: rgba(235, 47, 150, 0.1);
  color: #eb2f96;
  border: 1px solid rgba(235, 47, 150, 0.3);
  font-weight: 700;
}

.load-btn:hover {
  background: rgba(235, 47, 150, 0.2);
}

/* 当前播放 */
.now-playing-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.mini-cover {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(235, 47, 150, 0.3);
  flex-shrink: 0;
}

.mini-cover.spinning {
  animation: spin 8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.mini-info {
  overflow: hidden;
}

.mini-title {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-artist {
  font-size: 0.78rem;
  color: var(--text-muted, #888);
}

/* 音量控制 */
.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding: 0 5px;
}

.volume-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  color: #eb2f96;
}

.volume-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  background: rgba(235, 47, 150, 0.2);
  border-radius: 2px;
  outline: none;
  transition: 0.2s;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #eb2f96;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 1px 4px rgba(235, 47, 150, 0.5);
}

.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.3);
}

/* 控制按钮 */
.control-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--premium-border-color);
  background: var(--premium-glass-inner);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  border-color: #eb2f96;
  transform: scale(1.1);
}

.play-btn {
  width: 48px;
  height: 48px;
  font-size: 1.2rem;
  background: rgba(235, 47, 150, 0.05);
  border: 1px solid rgba(235, 47, 150, 0.2);
  backdrop-filter: blur(calc(var(--glass-blur) * 0.26));
}

.play-btn:hover {
  background: rgba(235, 47, 150, 0.2);
}

.mode-btn {
  font-size: 0.9rem;
}

/* 歌单列表 */
.playlist-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 10px;
  color: var(--text-color, #333);
}

.song-count {
  font-size: 0.75rem;
  color: var(--text-muted, #888);
  background: var(--premium-glass-inner);
  padding: 2px 8px;
  border-radius: 10px;
}

.loading-hint {
  font-size: 0.75rem;
  color: #eb2f96;
  animation: pulse 1s infinite;
  margin-left: auto;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.playlist-scroll {
  flex: 1;
  overflow-y: auto;
  margin: 0 -10px;
  padding: 0 10px;
}

.playlist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 2px;
}

.playlist-item:hover {
  background: rgba(235, 47, 150, 0.06);
}

.playlist-item.active {
  background: rgba(235, 47, 150, 0.12);
  border-left: 3px solid #eb2f96;
}

.item-index {
  font-size: 0.78rem;
  color: var(--text-muted, #aaa);
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.playlist-item.active .item-index {
  color: #eb2f96;
  font-weight: 700;
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-artist {
  font-size: 0.72rem;
  color: var(--text-muted, #888);
}

.playing-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
  animation: pulse 1s infinite;
}
</style>
