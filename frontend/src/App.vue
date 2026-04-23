<script setup>
import { onMounted, watch, computed } from 'vue'
import { store, actions } from '@/core/store.js'
import { systemsRegistry } from '@/core/systemRegistry.js'
import { initRandomWallpapers } from '@/core/wallpaperEngine.js'

// 🚀 [模块化组件层]: 基础支架与全局浮层
import ModSystemBackground from '@/modules/mod_system/mod_system_background.vue'
import ModSystemPortal from '@/modules/mod_system/mod_system_portal.vue'
import ModSystemSettings from '@/modules/mod_system/mod_system_settings.vue'
import ModSystemManual from '@/modules/mod_system/mod_system_manual.vue'
import ModSystemSwitcher from '@/modules/mod_system/mod_system_switcher.vue'
import ModSystemDialog from '@/modules/mod_system/mod_system_dialog.vue'
import ModSystemShelf from '@/modules/mod_system/mod_system_shelf.vue'
import ModSystemDrawer from '@/modules/mod_system/mod_system_drawer.vue'
import ModSystemTerminal from '@/modules/mod_system/mod_system_terminal.vue'
import ModCleanReport from '@/modules/mod_clean/mod_clean_report.vue'
import ModSystemWarning from '@/modules/mod_system/mod_system_warning.vue'
import ModSystemLoader from '@/modules/mod_system/mod_system_loader.vue'
import MiniPlayer from '@/systems/music/MiniPlayer.vue'
import GlobalMusicManager from '@/systems/music/GlobalMusicManager.vue'

// ==========================================
// 【动态调度逻辑】
// ==========================================
const activeSystem = computed(() => {
  return systemsRegistry[store.currentModule] || null;
});

onMounted(() => {
  initRandomWallpapers(); // 🎲 随机抽取壁纸资源
  actions.initTheme();
  actions.initSettings();

  // 🖥️ 桌面端 F12 全屏切换逻辑
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F12') {
      // 仅在 pywebview 环境下拦截 F12 用于全屏切换，网页端保持默认打开控制台
      if (window.pywebview && window.pywebview.api) {
        e.preventDefault();
        window.pywebview.api.toggle_fullscreen();
      }
    }
  });
});

watch(() => store.isDarkMode, (newVal) => {
  if (newVal) {
    document.body.classList.add('dark-mode');
    actions.addLog("👉 界面已切换至【夜间模式】", "info");
  } else {
    document.body.classList.remove('dark-mode');
    actions.addLog("👉 界面已切换至【白天模式】", "info");
  }
  actions.applyThemeColor();
});

// 高级主题切换逻辑 (带动画)
function toggleTheme(event) {
  const isDark = !store.isDarkMode;
  
  // 兼容性检查
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    store.isDarkMode = isDark;
    return;
  }

  // 捕获点击位置
  const x = event.clientX;
  const y = event.clientY;
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y)
  );

  const transition = document.startViewTransition(async () => {
    store.isDarkMode = isDark;
    // 强制 Vue 在过渡快照前完成 DOM 更新
    await nextTick();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0 at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  });
}
</script>

<template>
  <div :class="{ 'dark-mode': store.isDarkMode }" class="app-global-wrapper">
    
    <!-- 0. 全屏加载启动页 -->
    <ModSystemLoader />

    <!-- 1. 底层背景引擎 -->
    <ModSystemBackground />

    <!-- 2. 全局交互支架 (不占位浮层) -->
    <ModSystemDialog />
    <ModSystemTerminal />
    <ModSystemSettings />
    <ModSystemManual />
    <ModSystemSwitcher />
    <ModSystemShelf />
    <ModSystemDrawer v-if="store.showAppDesktop" />
    <ModCleanReport v-if="store.showCleanReportModal" />
    <ModSystemWarning v-if="store.showSampleInsufficientModal" />

    <!-- 3. 主体内容路由/分发层 -->
    <div class="app-wrapper" :class="{ 'blur-bg': store.showUploadModal || store.dialog.show || store.showManualModal || store.showSettings }">
      
      <!-- A. 欢迎与工作中心 (Portal) -->
      <ModSystemPortal />

      <!-- B. 动态系统底座 (按照 V3 注册表协议渲染) -->
      <transition name="fade">
        <div v-if="store.isEntered && activeSystem" 
             class="main-dashboard" 
             :class="{ 'no-padding': activeSystem.id === 'management' }">
          <!-- 仅在系统声明了 sidebar 组件时渲染 -->
          <component v-if="activeSystem.sidebar" :is="activeSystem.sidebar" />
          
          <!-- 渲染主屏幕/大屏组件 -->
          <component :is="activeSystem.screen" />
        </div>
      </transition>
    </div>

    <!-- 4. 其它全局辅助层 -->
    <div v-if="store.showUploadModal" class="modal-overlay">
      <div class="modal-content glass-card">
        <h2 class="upload-success-title">🎉 数据准备就绪</h2>
        <p>数据源 <strong>{{ store.uploadedFileName }}</strong> 已成功解析并接入系统！</p>
        <button @click="store.showUploadModal = false" class="enter-btn-small">开启可视化分析</button>
      </div>
    </div>

    <!-- 5. 全局功能悬浮按钮 (Advanced Theme Toggle) -->
    <div class="theme-toggle-wrapper">
      <button @click="toggleTheme" class="theme-toggle-btn" :class="{ 'is-dark': store.isDarkMode }">
        <div class="icon-morph">
          <span v-if="!store.isDarkMode" class="sun-icon">☀️</span>
          <span v-else class="moon-icon">🌙</span>
        </div>
        <span class="toggle-label">{{ store.isDarkMode ? '切换日间' : '切换夜间' }}</span>
      </button>
    </div>

    <!-- 6. 全局迷你音乐播放器与管理器 -->
    <MiniPlayer v-if="store.showMiniPlayer" />
    <GlobalMusicManager />

  </div>
</template>

<style>
/* 这里保留极少数真正需要跨组件渗透的全局布局样式，大部分已移至 core/styles/base.css */
@import "@/core/styles/base.css";

.no-padding { padding: 0 !important; }

.app-global-wrapper {
    position: relative; width: 100vw; height: 100vh; overflow: hidden;
    font-family: 'Helvetica Neue', Arial, sans-serif; transition: color 0.3s;
}

.app-wrapper {
    position: relative; z-index: 10; width: 100%; height: 100%; transition: filter 0.3s;
}

.blur-bg { filter: blur(var(--glass-blur)); pointer-events: none; }

.main-dashboard {
    display: flex; width: 100%; height: 100%; padding: 20px; gap: 20px; animation: fadeIn 0.8s ease;
}

/* 欢迎页小按钮适配 */
.upload-success-title { color: #67c23a; margin-top:0; }
.enter-btn-small { 
  padding: 10px 30px; margin-top: 15px; border-radius: 20px; border: none; 
  background: #67c23a; color: white; cursor: pointer; font-weight: bold;
}

/* 简易切换动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* --- 升级版悬浮功能组件样式 (Morphing Pill) --- */
.theme-toggle-wrapper {
    position: fixed; bottom: 30px; right: 30px; z-index: 10005;
}
.theme-toggle-btn {
    width: 50px; height: 50px; border-radius: 25px;
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.1); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; cursor: pointer; transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    overflow: hidden; white-space: nowrap; padding: 0;
}
.theme-toggle-btn:hover { 
    width: 160px; transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2); 
}

.icon-morph {
    flex-shrink: 0; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;
}

.toggle-label {
    font-size: 0.9rem; font-weight: bold; color: #409eff;
    opacity: 0; width: 0; overflow: hidden;
    transition: all 0.3s ease;
}
.theme-toggle-btn:hover .toggle-label {
    opacity: 1; width: 80px; margin-left: 5px;
}

:global(.dark-mode) .theme-toggle-btn {
    background: rgba(30, 30, 45, 0.8); border-color: rgba(255, 255, 255, 0.1);
}
:global(.dark-mode) .toggle-label { color: #fff !important; }

/* 视图过渡核心动画 (原生支持 View Transition API) */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 9999; }
.dark-mode::view-transition-old(root) { z-index: 9999; }
.dark-mode::view-transition-new(root) { z-index: 1; }
</style>