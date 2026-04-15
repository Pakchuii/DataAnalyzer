<script setup>
import { store, actions } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'

const setPinnedSystem = (id) => {
    store.pinnedSystemId = id;
    localStorage.setItem('pinnedSystemId', id);
    store.showSlotSwitcher = false;
    actions.addLog(`🔁 系统槽位已更新：当前挂载为【${systemsManifests.find(s => s.id === id).portal.title}】`, 'success');
};

const closeSwitcher = () => {
    store.showSlotSwitcher = false;
};
</script>

<template>
  <transition name="desktop-slide">
    <div v-if="store.showSlotSwitcher" class="app-desktop-overlay" @click.self="closeSwitcher">
      <div class="glass-card app-desktop-content selector-desktop">
        <div class="desktop-header">
          <h2 class="desktop-title">🎯 跨维系统调度台</h2>
          <div class="desktop-subtitle">V4.0 NEXT GENERATION DISPATCHER</div>
        </div>
        
        <div class="app-grid">
          <div v-for="sys in systemsManifests" :key="sys.id" class="app-icon-item" :class="{ active: store.pinnedSystemId === sys.id }" @click="setPinnedSystem(sys.id)">
            <div class="app-icon-inner glass-inner" :style="{ background: sys.drawer.iconBackground }">{{ sys.drawer.icon }}</div>
            <span class="app-label">{{ sys.drawer.name }}</span>
            <div v-if="store.pinnedSystemId === sys.id" class="active-dot"></div>
          </div>
          
          <!-- 敬请期待占位符 -->
          <div class="app-icon-item placeholder">
            <div class="app-icon-inner glass-inner locked-slot">🔒</div>
            <span class="app-label opacity-40">敬请期待</span>
          </div>
          <div class="app-icon-item placeholder">
            <div class="app-icon-inner glass-inner locked-slot">🏗️</div>
            <span class="app-label opacity-40">开发中...</span>
          </div>
        </div>

        <div class="desktop-footer" @click="closeSwitcher">
          <div class="swipe-handle"></div>
          <p>点击空白处或向上滑动返回工作空间</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.app-desktop-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px); z-index: 10001;
  display: flex; justify-content: center; align-items: flex-end;
}
.app-desktop-content {
  width: 100%; max-width: 900px; height: 85vh; border-radius: 40px 40px 0 0; padding: 60px 40px;
  display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.4);
}

.desktop-header { text-align: center; margin-bottom: 60px; }
.desktop-title {
  font-size: 2.2rem; margin: 0; background: linear-gradient(90deg, #fff, #409eff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;
}
.desktop-subtitle { font-size: 0.8rem; letter-spacing: 4px; color: rgba(255, 255, 255, 0.4); margin-top: 10px; }

.app-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 40px; justify-items: center; padding: 20px; }
.app-icon-item { display: flex; flex-direction: column; align-items: center; gap: 15px; cursor: pointer; transition: transform 0.3s; position: relative; }
.app-icon-item:hover { transform: translateY(-10px); }
.app-icon-inner {
  width: 100px; height: 100px; border-radius: 24px; display: flex; justify-content: center; align-items: center; font-size: 3.5rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.3);
}
.app-label { color: white; font-weight: 600; font-size: 1.1rem; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5); }

.active-dot { position: absolute; bottom: -15px; width: 8px; height: 8px; background: #409eff; border-radius: 50%; box-shadow: 0 0 10px #409eff; }

.locked-slot { background: rgba(255, 255, 255, 0.05) !important; border: 2px dashed rgba(255, 255, 255, 0.2) !important; color: rgba(255, 255, 255, 0.2) !important; }
.opacity-40 { opacity: 0.4; }

.desktop-footer { margin-top: auto; text-align: center; color: rgba(255, 255, 255, 0.4); cursor: pointer; }
.swipe-handle { width: 60px; height: 5px; background: rgba(255, 255, 255, 0.2); border-radius: 10px; margin: 0 auto 15px; }

/* 桌面切换动画 */
.desktop-slide-enter-active, .desktop-slide-leave-active { transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1); }
.desktop-slide-enter-from, .desktop-slide-leave-to { opacity: 0; }
.desktop-slide-enter-from .app-desktop-content, .desktop-slide-leave-to .app-desktop-content { transform: translateY(100%) scale(0.9); }

:global(.dark-mode) .app-desktop-content { background: rgba(20, 20, 30, 0.6); }
</style>
