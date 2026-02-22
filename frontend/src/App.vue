<script setup>
import { store, actions } from './store.js'
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
        <h2 style="color: #67c23a; margin-top:0;">🎉 数据准备就绪</h2>
        <p>数据源 <strong>{{ store.uploadedFileName }}</strong> 已成功解析并接入系统！</p>
        <button @click="store.showUploadModal = false" class="enter-btn" style="padding: 10px 30px; margin-top: 15px;">开启可视化分析</button>
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
            <p class="version">Version: 3.0 | 在线编辑器特装版</p>
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
.blur-bg { filter: blur(10px); pointer-events: none; }
.video-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; background: linear-gradient(135deg, #74ebd5 0%, #9face6 100%); overflow: hidden; }
.bg-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.2); transition: background 0.3s; }

.theme-toggle-btn { position: fixed; bottom: 30px; right: 30px; z-index: 100; padding: 12px 20px; border-radius: 30px; border: none; font-weight: bold; cursor: pointer; background: rgba(255,255,255,0.8); color: #333; box-shadow: 0 4px 15px rgba(0,0,0,0.2); backdrop-filter: blur(10px); transition: transform 0.3s; }
.theme-toggle-btn:hover { transform: scale(1.05); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); animation: fadeIn 0.3s ease;}
.modal-content { padding: 40px; text-align: center; max-width: 450px; animation: slideUp 0.3s ease; }

.glass-btn { border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s; padding: 12px;}
.primary-btn { background: rgba(64, 158, 255, 0.9); color: white; }
.primary-btn:hover { background: rgba(64, 158, 255, 1); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(64,158,255,0.4);}
.secondary-btn { background: rgba(144, 147, 153, 0.8); color: white; }
.secondary-btn:hover { background: rgba(144, 147, 153, 1); transform: translateY(-2px); }

/* ======== 在线编辑器专用样式 ======== */
.edit-input { width: 100%; box-sizing: border-box; background: transparent; border: none; text-align: center; font-size: 1rem; color: inherit; padding: 12px 8px; outline: none; transition: background 0.2s;}
.edit-input:focus { background: rgba(255,255,255,0.5); }
.head-input { font-weight: bold; color: #333; }
.mini-del-btn { background: none; border: none; color: #888; font-weight: bold; cursor: pointer; padding: 0 5px; font-size: 1.1rem; }
.mini-del-btn:hover { color: #f56c6c; transform: scale(1.2); }
.dark-mode .head-input { color: #eee; }
.dark-mode .edit-input:focus { background: rgba(0,0,0,0.3); }

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