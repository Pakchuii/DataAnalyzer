<script setup>
import { store } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'
</script>

<template>
  <transition name="drawer-fade">
    <div v-if="store.showAppDesktop" class="app-drawer-overlay" @click.self="store.showAppDesktop = false">
      <div class="app-drawer-content">
        <div class="drawer-handle-premium" @click="store.showAppDesktop = false"></div>
        <h2 class="drawer-title-premium">🌌 系统应用桌面</h2>
        
        <div class="drawer-grid-premium">
          <div v-for="sys in systemsManifests" :key="sys.id" 
               class="drawer-app-premium" 
               @click="store.currentModule = sys.id; store.showAppDesktop = false">
            <div class="app-icon-inner-premium" :style="{ background: sys.drawer.iconBackground }">{{ sys.drawer.icon }}</div>
            <div class="app-name-premium">{{ sys.drawer.name }}</div>
          </div>
          <!-- 未来可扩展更多应用 -->
          <div class="drawer-app-premium locked-premium">
            <div class="app-icon-inner-premium locked-slot-premium">🔒</div>
            <div class="app-name-premium muted-text-premium">更多系统开发中</div>
          </div>
        </div>

        <div class="drawer-footer-premium">
          滑出抽屉任意空白处关闭
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.app-drawer-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(calc(var(--glass-blur) * 1.67));
  z-index: 10001; display: flex; justify-content: center; align-items: center;
}
.app-drawer-content {
  width: 90%; max-width: 1000px; height: 90%; padding: 40px;
  display: flex; flex-direction: column;
  animation: drawerSlideUp 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}
.drawer-handle-premium {
  width: 60px; height: 5px; background: rgba(255,255,255,0.3);
  border-radius: 10px; margin: 0 auto 40px; cursor: pointer; transition: background 0.3s;
}
.drawer-handle-premium:hover { background: rgba(255,255,255,0.6); }

.drawer-title-premium {
  color: white; font-size: 2.2rem; text-align: center; margin-bottom: 60px;
  text-shadow: 0 4px 15px rgba(0,0,0,0.5); font-weight: 800;
  background: linear-gradient(90deg, #fff, #409eff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

.drawer-grid-premium {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 40px; padding: 20px;
}
.drawer-app-premium {
  display: flex; flex-direction: column; align-items: center; cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.drawer-app-premium:hover { transform: scale(1.1) translateY(-10px); }

.app-icon-inner-premium {
  width: 100px; height: 100px; border-radius: 24px; font-size: 3.5rem;
  display: flex; justify-content: center; align-items: center;
  margin-bottom: 15px; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.app-name-premium {
  color: white; font-weight: 600; font-size: 1.1rem; text-align: center;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

.locked-premium { cursor: not-allowed; opacity: 0.5; }
.locked-premium:hover { transform: none; }
.locked-slot-premium { background: rgba(255,255,255,0.05) !important; color: rgba(255,255,255,0.2) !important; border: 2px dashed rgba(255,255,255,0.2) !important; box-shadow: none !important; }
.muted-text-premium { opacity: 0.4; font-weight: normal; }

.drawer-footer-premium {
  margin-top: auto; text-align: center; color: rgba(255,255,255,0.3); font-size: 0.9rem;
}

@keyframes drawerSlideUp {
  from { transform: translateY(100vh); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.4s; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
</style>
