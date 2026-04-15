<script setup>
import { store, actions } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'
</script>

<template>
  <div>
    <!-- 底部 Home Pillar (智能导航条) -->
    <div v-if="store.isEntered" class="home-pillar-container" @click="store.showSystemShelf = !store.showSystemShelf">
      <div class="home-pillar-premium"></div>
    </div>

    <!-- 系统抽屉 (App Switcher) -->
    <transition name="shelf-slide">
      <div v-if="store.showSystemShelf" class="system-shelf-overlay" @click.self="store.showSystemShelf = false">
        <div class="glass-card-premium system-shelf">
          <h2 class="shelf-title-premium">🌌 跨维系统调度台</h2>
          <div class="shelf-grid">
            <div v-for="sys in systemsManifests" :key="sys.id" 
                 class="shelf-item-premium" :class="{ active: store.currentModule === sys.id }" 
                 @click="actions.requestSystemSwitch(sys.id)">
              <div class="shelf-icon-premium">{{ sys.shelf.icon }}</div>
              <div class="shelf-name-premium">{{ sys.shelf.name }}</div>
            </div>
          </div>
          <p class="shelf-tip-premium">提示：切换系统将触发核心同步与工作流重组</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.home-pillar-container {
  position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);
  width: 200px; height: 20px; display: flex; justify-content: center; align-items: center;
  cursor: pointer; z-index: 10000;
}
.home-pillar-premium {
  width: 140px; height: 6px; border-radius: 4px;
  background: var(--premium-glass-inner);
  backdrop-filter: blur(5px); transition: all 0.3s;
  box-shadow: var(--premium-card-shadow);
  border: 1px solid var(--premium-border-color);
}
.home-pillar-premium:hover {
  width: 180px; height: 8px; background: var(--premium-glass-bg);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
}

.system-shelf-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(10px);
  z-index: 9999; display: flex; justify-content: center; align-items: flex-end;
}

.glass-card-premium {
  background: var(--premium-glass-bg);
  backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
  border: 1px solid var(--premium-border-color);
  box-shadow: var(--premium-card-shadow);
  color: var(--premium-text-main);
}

.system-shelf {
  width: 100%; max-width: 600px; padding: 40px;
  border-radius: 30px 30px 0 0;
  text-align: center;
}

.shelf-title-premium {
  margin-top: 0; margin-bottom: 30px; font-size: 1.5rem;
  color: #409eff; font-weight: 800;
}

.shelf-grid { display: flex; justify-content: space-around; gap: 20px; }

.shelf-item-premium {
  width: 120px; padding: 20px; text-align: center; cursor: pointer;
  transition: all 0.3s; border-radius: 20px; border: 1px solid transparent;
}
.shelf-item-premium:hover {
  background: var(--premium-glass-inner);
  transform: translateY(-5px);
}
.shelf-item-premium.active {
  background: rgba(64, 158, 255, 0.15);
  border-color: #409eff;
}

.shelf-icon-premium { font-size: 3rem; margin-bottom: 10px; }
.shelf-name-premium { font-weight: bold; }

.shelf-tip-premium {
  margin-top: 30px; font-size: 0.8rem; color: var(--premium-text-muted); opacity: 0.7;
}

/* 抽屉动画 */
.shelf-slide-enter-active, .shelf-slide-leave-active { transition: all 0.5s cubic-bezier(0.32, 1, 0.23, 1); }
.shelf-slide-enter-from, .shelf-slide-leave-to { opacity: 0; }
.shelf-slide-enter-from .system-shelf, .shelf-slide-leave-to .system-shelf { transform: translateY(100%); }
</style>
