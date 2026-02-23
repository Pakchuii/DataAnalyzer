<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
import { store, actions } from './store.js'
import Sidebar from './components/Sidebar.vue'
import DataScreen from './components/DataScreen.vue'

const logContainer = ref(null);

// ==========================================
// 生命周期与监听器 (Lifecycle & Watchers)
// ==========================================

// 初始化：自动深浅色模式与本地设置
onMounted(() => {
  actions.initTheme();
  actions.initSettings();
});

// 监听：日志自动滚动到底部
watch(() => store.logs.length, async () => {
  if (store.showLogs) {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
});

// ================= 监听：全局深色模式切换 =================
watch(() => store.isDarkMode, (newVal) => {
  if (newVal) {
    document.body.classList.add('dark-mode');
    actions.addLog("👉 界面已切换至【夜间模式】", "info");
  } else {
    document.body.classList.remove('dark-mode');
    actions.addLog("👉 界面已切换至【白天模式】", "info");
  }

  // 【核心修复】：无论切到白天还是黑夜，强制唤醒色彩引擎重新渲染玻璃底色！
  actions.applyThemeColor();
});
</script>

<template>
  <div :class="{ 'dark-mode': store.isDarkMode }"
       class="app-global-wrapper">

    <div class="video-background">
      <video v-if="store.bgType === 'default'" :key="store.isDarkMode ? 'dark' : 'light'" autoplay loop muted playsinline class="bg-video">
        <source :src="store.isDarkMode ? '/bg-dark.mp4' : '/bg-light.mp4'" type="video/mp4" />
      </video>
      <video v-else-if="store.bgType === 'video'" :key="store.bgUrl" autoplay loop muted playsinline class="bg-video">
        <source :src="store.bgUrl" />
      </video>
      <img v-else-if="store.bgType === 'image'" :src="store.bgUrl" class="bg-video" style="object-fit: cover; width: 100%; height: 100%;" />
      <div class="bg-overlay" :style="{ background: store.isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)' }"></div>
    </div>

    <button class="theme-toggle-btn" @click="store.isDarkMode = !store.isDarkMode">
      {{ store.isDarkMode ? '☀️ 切换日间' : '🌙 切换夜间' }}
    </button>

    <div v-if="store.showUploadModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h2 style="color: #67c23a; margin-top:0;">🎉 数据准备就绪</h2>
        <p>数据源 <strong>{{ store.uploadedFileName }}</strong> 已成功解析并接入系统！</p>
        <button @click="store.showUploadModal = false" class="enter-btn" style="padding: 10px 30px; margin-top: 15px;">开启可视化分析</button>
      </div>
    </div>

    <div v-if="store.dialog.show" class="modal-overlay" style="z-index: 9999;">
      <div class="modal-content glass-card" style="padding: 30px 40px; min-width: 350px;">
        <h2 :style="{ color: store.dialog.type === 'confirm' ? '#e6a23c' : '#409eff', marginTop: 0, borderBottom: '1px dashed rgba(0,0,0,0.1)', paddingBottom: '10px' }">
          {{ store.dialog.title }}
        </h2>
        <p style="white-space: pre-wrap; line-height: 1.6; margin: 25px 0; font-size: 1.05rem;">
          {{ store.dialog.message }}
        </p>
        <div style="display:flex; justify-content: center; gap: 20px;">
          <button v-if="store.dialog.type === 'confirm'" @click="store.dialog.show = false" class="glass-btn secondary-btn" style="width: 120px;">取消</button>
          <button @click="store.dialog.onConfirm" class="glass-btn primary-btn" style="width: 120px;">确定</button>
        </div>
      </div>
    </div>

    <div v-if="store.showSettings" class="modal-overlay" style="z-index: 3000;">
      <div class="glass-card settings-modal-container">
        <button @click="store.showSettings = false" class="close-btn modal-close-btn">✕</button>
        <div class="settings-layout">
          <div class="author-profile-card glass-inner">
            <div class="avatar-container">
              <img src="http://pakchuii.xyz/wp-content/uploads/2025/10/cropped-91b3d00cbab31470cf578925de3e9685.jpg" alt="Avatar" class="author-avatar" />
            </div>
            <h2 class="author-name">Pakchuii</h2>
            <p class="author-bio">不管是被别人粗暴的砍下还是自然枯萎，我和我的花儿总要告别</p>
            <div class="links-section">
              <div class="links-title">🔗 Links</div>
              <a href="#" class="author-link">Github个人链接</a>
              <a href="#" class="author-link">Gitee个人链接</a>
              <a href="#" class="author-link">bilibili主页</a>
            </div>
          </div>
          <div class="system-settings-panel">
            <h3 style="margin-top:0; color: #409eff; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 10px;">🎨 外观与个性化</h3>
            <div class="setting-block">
              <h4>更换系统壁纸 (图片/视频)</h4>
              <div style="display: flex; gap: 10px;">
                <input type="file" id="bg-upload" accept="image/*, video/*" @change="actions.handleBgUpload" style="display: none;">
                <label for="bg-upload" class="glass-btn primary-btn" style="flex:1; text-align:center; padding: 8px;">📂 本地上传</label>
                <button @click="actions.resetBackground" class="glass-btn secondary-btn" style="flex:1; padding: 8px;">🔄 恢复默认</button>
              </div>
            </div>
            <div class="setting-block">
              <h4>窗口氛围色滤镜</h4>
              <div class="color-palette">
                <button @click="actions.setWindowTint('')" class="color-btn default-color" title="系统默认"></button>
                <button @click="actions.setWindowTint('rgba(64, 158, 255, 0.65)')" class="color-btn" style="background: #409eff;" title="科技蓝"></button>
                <button @click="actions.setWindowTint('rgba(179, 127, 235, 0.65)')" class="color-btn" style="background: #b37feb;" title="暗夜紫"></button>
                <button @click="actions.setWindowTint('rgba(250, 140, 22, 0.65)')" class="color-btn" style="background: #fa8c16;" title="活力橙"></button>
                <button @click="actions.setWindowTint('rgba(255, 105, 180, 0.65)')" class="color-btn" style="background: #ff69b4;" title="猛男粉"></button>
                <label class="color-btn custom-color-picker" title="自定义取色" style="background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                  <span style="font-size: 1.2rem; font-weight: bold; color: white; text-shadow: 0 0 5px rgba(0,0,0,0.8); z-index: 2; pointer-events: none;">+</span>
                  <input type="color" @input="actions.handleCustomTint" style="opacity: 0; position: absolute; top: -10px; left: -10px; width: 200%; height: 200%; cursor: pointer; z-index: 1;">
                </label>
              </div>
            </div>
            <div class="setting-block">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <h4 style="margin: 0;">面板通透度 (Opacity)</h4>
                <span style="font-weight: bold; color: #409eff;">{{ Math.round(store.glassOpacity * 100) }}%</span>
              </div>
              <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-size: 0.8rem; color: #888;">全透</span>
                <input type="range" min="0.1" max="0.95" step="0.01" :value="store.glassOpacity" @input="actions.handleOpacityChange" class="custom-slider">
                <span style="font-size: 0.8rem; color: #888;">厚重</span>
              </div>
            </div>
            <div class="setting-block" style="margin-top: auto;">
              <div class="version-info">
                <strong>DataAnalyzer Pro</strong><br>
                Version: 3.0 (Standalone Edition)<br>
                Core Engine: Flask V8 + Vue3 + ECharts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.showManualModal" class="modal-overlay" style="z-index: 2500;">
      <div class="glass-card" style="width: 80vw; max-width: 900px; height: 80vh; display: flex; flex-direction: column; padding: 25px; position: relative;">
        <div style="display:flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 15px; margin-bottom: 15px;">
          <h2 style="margin:0; color:#409eff; display: flex; align-items: center; gap: 10px;">
            📝 在线表格编辑器 <span style="font-size: 0.9rem; color: #888; font-weight: normal;">(直接输入数据，支持行列增删)</span>
          </h2>
          <button @click="store.showManualModal = false" class="close-btn" style="font-size: 1.5rem; background:none; border:none; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 15px;">
          <button @click="actions.addGridCol" class="glass-btn secondary-btn" style="width:auto; padding: 6px 15px; background: rgba(144, 147, 153, 0.4);">➕ 添加一列</button>
          <button @click="actions.addGridRow" class="glass-btn secondary-btn" style="width:auto; padding: 6px 15px; background: rgba(144, 147, 153, 0.4);">➕ 添加一行</button>
        </div>
        <div style="flex: 1; overflow: auto; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: rgba(255,255,255,0.3);">
          <table class="glass-table manual-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th v-for="(col, cIdx) in store.manualGrid[0]" :key="'h'+cIdx" style="position: sticky; top: 0; background: rgba(64,158,255,0.2); z-index: 10;">
                  <div style="display: flex; align-items: center;">
                    <input v-model="store.manualGrid[0][cIdx]" class="edit-input head-input" placeholder="输入表头" />
                    <button @click="actions.removeGridCol(cIdx)" class="mini-del-btn" v-if="store.manualGrid[0].length > 1" title="删除该列">✕</button>
                  </div>
                </th>
                <th style="width: 40px; position: sticky; top: 0; background: rgba(64,158,255,0.2); z-index: 10;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIdx) in store.manualGrid.slice(1)" :key="'r'+rIdx">
                <td v-for="(val, cIdx) in row" :key="'c'+cIdx" style="padding: 0; border: 1px solid rgba(0,0,0,0.1);">
                  <input v-model="store.manualGrid[rIdx + 1][cIdx]" class="edit-input" placeholder="..." />
                </td>
                <td style="width: 40px; border:none; text-align: center; vertical-align: middle;">
                  <button @click="actions.removeGridRow(rIdx + 1)" class="mini-del-btn" style="color: #f56c6c;" title="删除该行">➖</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <button @click="actions.submitManualGrid" class="glass-btn primary-btn" style="width: 250px; font-size: 1.2rem; padding: 12px; box-shadow: 0 4px 15px rgba(64,158,255,0.4);">🚀 提交并生成分析</button>
        </div>
      </div>
    </div>

    <div class="app-wrapper" :class="{ 'blur-bg': store.showUploadModal || store.dialog.show || store.showManualModal }">
      <transition name="fade">
        <div v-if="!store.isEntered" class="welcome-screen">
          <div class="glass-card welcome-card">
            <h1 class="glow-title">DataAnalyzer Pro</h1>
            <p class="subtitle">集成统计分析与可视化表单数据处理系统</p>
            <p class="version">Version: 3.0 | 稳定版</p>
            <button @click="store.isEntered = true" class="enter-btn">🚀 点击进入系统</button>
            <div style="margin-top: 20px;">
              <button @click="store.showSettings = true" class="glass-btn secondary-btn" style="border-radius: 20px; font-weight: normal; font-size: 0.9rem;">
                ⚙️ 系统设置 & 作者名片
              </button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered" class="main-dashboard">
          <Sidebar />
          <DataScreen />
        </div>
      </transition>
    </div>
  </div>

  <div v-if="store.showLogs" class="log-console-panel">
    <div class="log-header">
      <span>📟 终端监控台 (Terminal)</span>
      <button @click="store.showLogs = false" class="close-log-btn">✕</button>
    </div>
    <div class="log-body" ref="logContainer">
      <div v-if="store.logs.length === 0" style="color: #666; font-style: italic;">系统就绪，等待指令...</div>
      <div v-for="(log, idx) in store.logs" :key="idx" class="log-line">
        <span v-if="log.includes('[ERROR]')" style="color: #ff4d4f;">{{ log }}</span>
        <span v-else-if="log.includes('[SUCCESS]')" style="color: #52c41a;">{{ log }}</span>
        <span v-else>{{ log }}</span>
      </div>
      <div class="blinking-cursor">_</div>
    </div>
  </div>
</template>

<style scoped src="./App.css"></style>