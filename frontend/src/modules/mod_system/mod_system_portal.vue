<script setup>
import { computed } from 'vue'
import { store, actions } from '@/core/store.js'
import { systemsManifests } from '@/core/systemRegistry.js'

const fixedSystems = computed(() => systemsManifests.slice(0, 2));
const pinnedSystem = computed(() => systemsManifests.find(s => s.id === store.pinnedSystemId) || systemsManifests[2]);

const enterSystem = () => {
    store.isEntered = true;
    store.currentModule = 'portal';
};

const openSettings = () => {
    store.showSettings = true;
};
</script>

<template>
  <div class="portal-orchestrator">
    <transition name="fade">
      <div v-if="!store.isEntered" class="welcome-screen">
        <div class="glass-card welcome-card">
          <h1 class="glow-title">DataAnalyzer Pro</h1>
          <p class="subtitle">集成统计分析与可视化表单数据处理系统</p>
          <p class="version">Version: 4.0 | 模块化架构</p>
          <button @click="enterSystem" class="enter-btn">🚀 点击进入系统</button>
          <div style="margin-top: 20px;">
            <button @click="openSettings" class="enter-btn settings-entry-btn">
              ⚙️ 系统设置 & 作者名片
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="store.isEntered && store.currentModule === 'portal'" class="workspace-portal-wrapper">
        <div class="glass-card workspace-portal-container">
          <h2 class="portal-main-title">🌌 请选择您的工作空间</h2>
          <p class="description-text">DataAnalyzer 模块化微服务架构 V4.0</p>

          <div class="portal-card-grid">
            <!-- 核心固定系统 (前两个) -->
            <div v-for="sys in fixedSystems" :key="sys.id" class="glass-inner module-card" @click="store.currentModule = sys.id">
              <div class="module-icon">{{ sys.portal.icon }}</div>
              <h3 class="module-title" :style="{ color: sys.portal.titleColor }">{{ sys.portal.title }}</h3>
              <p class="module-desc">{{ sys.portal.description }}</p>
              <div class="status-box">
                <span class="status-badge" :style="{ background: sys.portal.statusBg, color: sys.portal.statusColor, border: sys.portal.statusBorder }">
                  {{ sys.portal.statusText }}
                </span>
              </div>
            </div>

            <!-- 动态挂载系统 (第三个) -->
            <div class="glass-inner module-card" @click="store.currentModule = pinnedSystem.id">
              <div class="card-gear-icon" @click.stop="store.showSlotSwitcher = true" title="更换此位置挂载的业务系统">⚙️</div>
              <div class="module-icon">{{ pinnedSystem.portal.icon }}</div>
              <h3 class="module-title" :style="{ color: pinnedSystem.portal.titleColor }">{{ pinnedSystem.portal.title }}</h3>
              <p class="module-desc">{{ pinnedSystem.portal.description }}</p>
              <div class="status-box">
                <span class="status-badge" :style="{ background: pinnedSystem.portal.statusBg, color: pinnedSystem.portal.statusColor, border: pinnedSystem.portal.statusBorder }">
                  {{ pinnedSystem.portal.statusText }}
                </span>
              </div>
            </div>
          </div>

          <div class="portal-footer">
            <button @click="store.isEntered = false" class="glass-btn secondary-btn hub-return-btn">⬅️ 返回系统主页</button>
            
            <div class="app-drawer-btn-wrapper" @click="store.showAppDesktop = true" title="打开全维应用桌面">
              <div class="app-drawer-icon">
                <span v-for="i in 9" :key="i"></span>
              </div>
              <div class="drawer-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.portal-orchestrator { 
  position: absolute; top:0; left:0; width:100%; height:100%; z-index: 20; 
  pointer-events: none; /* Allow clicks to pass through when portal is not active */
}
.portal-orchestrator > * { pointer-events: auto; /* Re-enable clicks for portal content when present */ }

.welcome-screen {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
}
.welcome-card {
  padding: 60px 80px; text-align: center; max-width: 700px; animation: slideUp 0.8s ease;
}
.glow-title { font-size: 2.8rem; font-weight: 800; margin-bottom: 10px; letter-spacing: 2px; }
.subtitle { font-size: 1.2rem; margin-bottom: 30px; }
.version { font-size: 0.9rem; margin-bottom: 40px; opacity: 0.7; }

.enter-btn {
  padding: 15px 40px; font-size: 1.2rem; font-weight: bold; color: #fff;
  background: linear-gradient(90deg, #9b4dca, #409eff);
  border: none; border-radius: 30px; cursor: pointer;
  box-shadow: 0 4px 15px rgba(155, 77, 202, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}
.enter-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 25px rgba(155, 77, 202, 0.6); }

.settings-entry-btn {
  padding: 10px 25px; font-weight: normal; font-size: 0.9rem; 
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); 
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);
}

.workspace-portal-wrapper {
  position: absolute; top:0; left:0; width:100%; height:100%; 
  display:flex; justify-content:center; align-items:center;
}
.workspace-portal-container {
  width: 95%; max-width: 1200px; padding: 50px; text-align: center; 
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  display: flex; flex-direction: column; align-items: center;
}
.portal-main-title { font-size: 2rem; margin-top: 0; margin-bottom: 10px; }
.description-text { color: #888; margin-bottom: 40px; }

.portal-card-grid {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; width: 100%; padding: 10px;
}
.module-card {
  flex:1; min-width: 260px; max-width: 350px; padding: 40px 20px; 
  cursor: pointer; transition: all 0.3s; border-radius: 16px; position: relative;
}
.module-card:hover { transform: translateY(-10px); background: rgba(255, 255, 255, 0.15); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15); }

.module-icon { font-size: 4.5rem; margin-bottom: 20px; text-shadow: 0 10px 20px rgba(0,0,0,0.2); }
.module-title { font-size: 1.4rem; margin-bottom: 10px; }
.module-desc { color:#888; font-size:0.9rem; line-height: 1.6; padding: 0 15px; }
.status-box { margin-top: 20px; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; }

.card-gear-icon {
  position: absolute; top: 15px; right: 15px; font-size: 1.4rem; opacity: 0.3; transition: all 0.3s; z-index: 10; padding: 8px; border-radius: 50%;
}
.card-gear-icon:hover { opacity: 1; transform: rotate(90deg) scale(1.2); background: rgba(255, 255, 255, 0.2); color: #409eff; }

.portal-footer { margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 25px; }
.hub-return-btn { width: 240px; border-radius: 30px; }

/* App Drawer 图标按钮 */
.app-drawer-btn-wrapper {
  position: relative; width: 64px; height: 64px; cursor: pointer; display: flex; justify-content: center; align-items: center; border-radius: 20px;
  background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.app-drawer-btn-wrapper:hover { transform: scale(1.1) rotate(5deg); background: rgba(255, 255, 255, 0.2); box-shadow: 0 10px 30px rgba(64, 158, 255, 0.3); }
.app-drawer-icon { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 12px; }
.app-drawer-icon span { width: 8px; height: 8px; background: white; border-radius: 2px; transition: all 0.3s; }
.app-drawer-btn-wrapper:hover .app-drawer-icon span { background: #409eff; border-radius: 50%; }

.drawer-glow { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 20px; background: linear-gradient(135deg, rgba(64, 158, 255, 0.4), rgba(114, 46, 209, 0.4)); filter: blur(15px); opacity: 0; transition: opacity 0.3s; z-index: -1; }
.app-drawer-btn-wrapper:hover .drawer-glow { opacity: 1; }

/* 动画与响应式 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

:global(.dark-mode) .description-text, :global(.dark-mode) .module-desc { color: #ccc !important; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
:global(.dark-mode) .module-title { filter: brightness(1.0); }
:global(.dark-mode) .glass-card { background: rgba(20, 20, 30, 0.7); }
:global(.dark-mode) .module-card:hover { 
  background: rgba(255, 255, 255, 0.08) !important; /* Reduced brightness to prevent overexposure */
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6);
}
:global(.dark-mode) .enter-btn:hover {
  box-shadow: 0 8px 25px rgba(155, 77, 202, 0.3); /* Muted glow for dark mode */
}
</style>
