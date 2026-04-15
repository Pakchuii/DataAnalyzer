<script setup>
import { store, actions } from '@/core/store.js'

const closeModal = () => {
  store.showSettings = false;
};
</script>

<template>
  <div v-if="store.showSettings" class="modal-overlay" style="z-index: 3000;">
    <div class="glass-card settings-modal-container">
      <button @click="closeModal" class="close-btn modal-close-btn">✕</button>
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
              Version: 4.0 (Modular Architecture)<br>
              Core Engine: Flask V8 + Vue3 + ECharts
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-modal-container {
    width: 800px; max-width: 90vw; height: 500px;
    padding: 0; position: relative; overflow: hidden; display: flex;
}
.modal-close-btn {
    position: absolute; top: 15px; right: 15px; z-index: 50; width: 32px; height: 32px; border-radius: 50%;
    background: rgba(0, 0, 0, 0.08) !important; border: none !important; outline: none !important; box-shadow: none !important;
    display: flex; align-items: center; justify-content: center; color: #888; font-size: 1.1rem; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.modal-close-btn:hover {
    background: #f5222d !important; color: white !important;
    transform: rotate(90deg); box-shadow: 0 4px 12px rgba(245, 34, 45, 0.4) !important;
}

.settings-layout { display: flex; width: 100%; height: 100%; }

.author-profile-card {
    width: 300px; background: rgba(255, 255, 255, 0.4);
    border-right: 1px solid rgba(255,255,255,0.3); border-radius: 16px 0 0 16px;
    padding: 30px 20px; display: flex; flex-direction: column; align-items: center; text-align: center;
}
.avatar-container { width: 100px; height: 100px; border-radius: 50%; padding: 3px; background: linear-gradient(135deg, #ff8a00, #e52e71); margin-bottom: 15px; }
.author-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; background: white; }
.author-name { margin: 0; font-size: 1.6rem; color: #e53935; font-family: 'Times New Roman', serif; }
.author-bio { font-size: 0.85rem; color: #d32f2f; margin: 15px 0; line-height: 1.6; opacity: 0.9; }

.links-section { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 20px; }
.links-title { color: #e53935; font-weight: bold; font-size: 0.9rem; margin-bottom: 5px; }
.author-link { color: #e53935; text-decoration: none; font-size: 0.95rem; position: relative; padding-bottom: 3px; transition: all 0.3s; }
.author-link::after { content: ''; position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); width: 60%; height: 1px; background: rgba(229, 57, 53, 0.5); transition: width 0.3s; }
.author-link:hover::after { width: 100%; background: #e53935; }
.author-link:hover { transform: scale(1.05); }

.system-settings-panel { flex: 1; padding: 30px 40px; display: flex; flex-direction: column; text-align: left; }
.setting-block { margin-bottom: 25px; }
.setting-block h4 { margin-bottom: 10px; color: #555; }

.color-palette { display: flex; gap: 15px; }
.color-btn { width: 40px; height: 40px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.8); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.color-btn:hover { transform: scale(1.15); }
.default-color { background: conic-gradient(#f0f2f5, #1a1a2e); }
.version-info { font-size: 0.8rem; color: #888; line-height: 1.8; background: rgba(0,0,0,0.03); padding: 15px; border-radius: 8px; text-align: center; }

.custom-slider { flex: 1; -webkit-appearance: none; width: 100%; height: 6px; background: rgba(0, 0, 0, 0.1); border-radius: 5px; outline: none; transition: background 0.3s; }
.custom-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 2px solid #409eff; cursor: grab; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2); transition: transform 0.1s; }
.custom-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.2); background: #409eff; }

/* 暗色模式适配 */
:global(.dark-mode) .author-profile-card { background: rgba(0, 0, 0, 0.3); border-color: rgba(255,255,255,0.05); }
:global(.dark-mode) .setting-block h4 { color: #ccc; }
:global(.dark-mode) .custom-slider { background: rgba(255, 255, 255, 0.2); }
:global(.dark-mode) .modal-close-btn { background: rgba(255, 255, 255, 0.1) !important; color: #ccc; }
</style>
