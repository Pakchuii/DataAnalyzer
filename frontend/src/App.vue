<script setup>
import { store } from './store.js'
import Sidebar from './components/Sidebar.vue'
import DataScreen from './components/DataScreen.vue'
</script>

<template>
  <div :class="{ 'dark-mode': store.isDarkMode }" class="app-global-wrapper">
    <div class="video-background">
      <video :key="store.isDarkMode ? 'dark' : 'light'" autoplay loop muted playsinline class="bg-video">
        <source :src="store.isDarkMode ? '/bg-dark.mp4' : '/bg-light.mp4'" type="video/mp4" />
      </video>
      <div class="bg-overlay"></div>
    </div>

    <button class="theme-toggle-btn" @click="store.isDarkMode = !store.isDarkMode">
      {{ store.isDarkMode ? '☀️ 切换日间' : '🌙 切换夜间' }}
    </button>

    <div v-if="store.showUploadModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h2 style="color: #67c23a; margin-top:0;">🎉 上传成功</h2>
        <p>文件 <strong>{{ store.uploadedFileName }}</strong> 已成功解析并载入系统！</p>
        <button @click="store.showUploadModal = false" class="enter-btn" style="padding: 10px 30px; margin-top: 15px;">开始分析</button>
      </div>
    </div>

    <div v-if="store.dialog.show" class="modal-overlay" style="z-index: 9999;">
      <div class="modal-content glass-card" style="padding: 30px 40px; min-width: 350px;">
        <h2 style="margin-top:0; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 10px;"
            :style="{ color: store.dialog.type === 'confirm' ? '#e6a23c' : '#409eff' }">
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
    <div class="app-wrapper">
      <transition name="fade">
        <div v-if="!store.isEntered" class="welcome-screen">
          <div class="glass-card welcome-card">
            <h1 class="glow-title">DataAnalyzer Pro</h1>
            <p class="subtitle">集成统计分析与可视化表单数据处理系统</p>
            <p class="version">Version: 2.2.0 | 极致体验版</p>
            <button @click="store.isEntered = true" class="enter-btn">🚀 点击进入系统</button>
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
</template>

<style scoped>
.app-global-wrapper { position: relative; width: 100vw; height: 100vh; overflow: hidden; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2c3e50; transition: color 0.3s; }
.app-wrapper { position: relative; z-index: 10; width: 100%; height: 100%; transition: filter 0.3s; }
.video-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%); overflow: hidden; }
.bg-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.2); transition: background 0.3s; }

.theme-toggle-btn { position: fixed; bottom: 30px; right: 30px; z-index: 100; padding: 12px 20px; border-radius: 30px; border: none; font-weight: bold; cursor: pointer; background: rgba(255,255,255,0.8); color: #333; box-shadow: 0 4px 15px rgba(0,0,0,0.2); backdrop-filter: blur(10px); transition: transform 0.3s; }
.theme-toggle-btn:hover { transform: scale(1.05); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: fadeIn 0.3s ease;}
.modal-content { padding: 40px; text-align: center; max-width: 450px; animation: slideUp 0.3s ease; }

/* 按钮通用复用 */
.glass-btn { border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s; padding: 12px;}
.primary-btn { background: rgba(64, 158, 255, 0.9); color: white; }
.primary-btn:hover { background: rgba(64, 158, 255, 1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(64,158,255,0.4);}
.secondary-btn { background: rgba(144, 147, 153, 0.8); color: white; }
.secondary-btn:hover { background: rgba(144, 147, 153, 1); transform: translateY(-2px); }

.welcome-screen { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.welcome-card { padding: 60px 80px; text-align: center; max-width: 700px; animation: slideUp 0.8s ease; }
.glow-title { font-size: 2.8rem; font-weight: 800; margin-bottom: 10px; letter-spacing: 2px;}
.subtitle { font-size: 1.2rem; margin-bottom: 30px; }
.version { font-size: 0.9rem; margin-bottom: 40px; opacity: 0.7;}
.enter-btn { padding: 15px 40px; font-size: 1.2rem; font-weight: bold; color: #fff; background: linear-gradient(90deg, #9b4dca, #409eff); border: none; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(155, 77, 202, 0.4); transition: transform 0.2s, box-shadow 0.2s; }
.enter-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 25px rgba(155, 77, 202, 0.6); }

.main-dashboard { display: flex; width: 100%; height: 100%; padding: 20px; gap: 20px; animation: fadeIn 0.8s ease;}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>