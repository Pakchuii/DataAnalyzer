<script setup>
import { onMounted, watch } from 'vue'
import { store, actions } from '@/core/store.js'

// 📂 [系统架构层]: 核心视图载体
import AnalysisSidebar from '@/systems/analysis/AnalysisSidebar.vue'
import AnalysisScreen from '@/systems/analysis/AnalysisScreen.vue'
import ManagementView from '@/systems/management/ManagementView.vue'
import TemplateSystem from '@/systems/template/TemplateSystem.vue'

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

// ==========================================
// 【核心调度逻辑】
// ==========================================
onMounted(() => {
  actions.initTheme();
  actions.initSettings();
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
</script>

<template>
  <div :class="{ 'dark-mode': store.isDarkMode }" class="app-global-wrapper">
    
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

      <!-- B. 业务子系统视图 -->
      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'analysis'" class="main-dashboard">
          <AnalysisSidebar />
          <AnalysisScreen />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'management'" class="main-dashboard no-padding">
          <ManagementView />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'template'" class="main-dashboard no-padding">
          <TemplateSystem />
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

.blur-bg { filter: blur(15px); pointer-events: none; }

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
</style>