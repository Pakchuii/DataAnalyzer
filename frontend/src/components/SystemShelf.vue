<template>
  <div>
    <!-- 底部 Home Pillar (智能导航条) -->
    <div v-if="store.isEntered" class="home-pillar-container" @click="store.showSystemShelf = !store.showSystemShelf">
      <div class="home-pillar"></div>
    </div>

    <!-- 系统抽屉 (App Switcher) -->
    <transition name="shelf-slide">
      <div v-if="store.showSystemShelf" class="system-shelf-overlay" @click.self="store.showSystemShelf = false">
        <div class="glass-card system-shelf">
          <h2 class="shelf-title">🌌 跨维系统调度台</h2>
          <div class="shelf-grid">
            <div v-for="sys in systemsManifests" :key="sys.id" 
                 class="shelf-item" :class="{ active: store.currentModule === sys.id }" 
                 @click="actions.requestSystemSwitch(sys.id)">
              <div class="shelf-icon">{{ sys.shelf.icon }}</div>
              <div class="shelf-name">{{ sys.shelf.name }}</div>
            </div>
          </div>
          <p class="shelf-tip">提示：切换系统将触发核心同步与工作流重组</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { store, actions } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'
</script>

<style scoped>
.home-pillar-container {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10000;
}
.home-pillar {
  width: 140px;
  height: 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);
  transition: all 0.3s;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}
.home-pillar:hover {
  width: 180px;
  height: 8px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
}

/* 系统抽屉样式 */
.system-shelf-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}
.system-shelf {
  width: 100%;
  max-width: 600px;
  padding: 40px;
  border-radius: 30px 30px 0 0;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.2);
}
.dark-mode .system-shelf {
  background: rgba(30, 30, 45, 0.85);
}
.shelf-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 30px;
  font-size: 1.5rem;
}
.shelf-grid {
  display: flex;
  justify-content: space-around;
  gap: 20px;
}
.shelf-item {
  width: 120px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 20px;
  border: 1px solid transparent;
}
.shelf-item:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-5px);
}
.shelf-item.active {
  background: rgba(64, 158, 255, 0.2);
  border-color: #409eff;
}
.shelf-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}
.shelf-name {
  font-weight: bold;
}
.shelf-tip {
  text-align: center;
  margin-top: 30px;
  font-size: 0.8rem;
  opacity: 0.6;
}

/* 抽屉动画 */
.shelf-slide-enter-active,
.shelf-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.32, 1, 0.23, 1);
}
.shelf-slide-enter-from,
.shelf-slide-leave-to {
  opacity: 0;
}
.shelf-slide-enter-from .system-shelf,
.shelf-slide-leave-to .system-shelf {
  transform: translateY(100%);
}
</style>
