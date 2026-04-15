<template>
  <transition name="drawer-fade">
    <div v-if="store.showAppDrawer" class="app-drawer-overlay" @click.self="store.showAppDrawer = false">
      <div class="app-drawer-content">
        <div class="drawer-handle" @click="store.showAppDrawer = false"></div>
        <h2 class="drawer-title">🌌 系统应用桌面</h2>
        
        <div class="drawer-grid">
          <div v-for="sys in systemsManifests" :key="sys.id" 
               class="drawer-app" 
               @click="store.currentModule = sys.id; store.showAppDrawer = false">
            <div class="app-icon" :style="{ background: sys.drawer.iconBackground }">{{ sys.drawer.icon }}</div>
            <div class="app-name">{{ sys.drawer.name }}</div>
          </div>
          <!-- 未来可扩展更多应用 -->
          <div class="drawer-app locked">
            <div class="app-icon" style="background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3);">🔒</div>
            <div class="app-name" style="color: rgba(255,255,255,0.3);">更多系统开发中</div>
          </div>
        </div>

        <div class="drawer-footer">
          滑出抽屉任意空白处关闭
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { store } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'
</script>

<style scoped>
/* 应用抽屉样式 */
.app-drawer-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(25px);
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: center;
}
.app-drawer-content {
  width: 90%;
  max-width: 1000px;
  height: 90%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  animation: drawerSlideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}
.drawer-handle {
  width: 60px; height: 5px;
  background: rgba(255,255,255,0.3);
  border-radius: 10px;
  margin: 0 auto 40px;
  cursor: pointer;
  transition: background 0.3s;
}
.drawer-handle:hover { background: rgba(255,255,255,0.6); }
.drawer-title {
  color: white;
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 60px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.drawer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 40px;
  padding: 20px;
}
.drawer-app {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.drawer-app:hover { transform: scale(1.15) translateY(-5px); }
.drawer-app.locked {
  cursor: not-allowed;
}
.drawer-app.locked:hover {
  transform: none;
}
.app-icon {
  width: 90px; height: 90px;
  border-radius: 22px;
  font-size: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}
.app-name {
  color: white;
  font-weight: 500;
  text-align: center;
}
.drawer-footer {
  margin-top: auto;
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 0.9rem;
}

/* 抽屉动画 */
@keyframes drawerSlideUp {
  from { transform: translateY(100vh); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.4s; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
</style>
