<script setup>
import { onMounted, watch, ref, nextTick } from 'vue'
import { store, actions } from '@/core/store.js'
import AnalysisSidebar from '@/systems/analysis/AnalysisSidebar.vue'
import AnalysisScreen from '@/systems/analysis/AnalysisScreen.vue'
import ManagementView from '@/systems/management/ManagementView.vue'
import TemplateSystem from '@/systems/template/TemplateSystem.vue'
import CommonModal from '@/components/CommonModal.vue'
import { systemsManifests } from '@/core/systemRegistry.js'
import { computed } from 'vue'

// 全局弹窗组件
import CleanReportModal from '@/components/CleanReportModal.vue'
import SampleInsufficientModal from '@/components/SampleInsufficientModal.vue'

const logContainer = ref(null);

// 系统槽位逻辑
const fixedSystems = computed(() => systemsManifests.slice(0, 2));
const pinnedSystem = computed(() => systemsManifests.find(s => s.id === store.pinnedSystemId) || systemsManifests[2]);

const setPinnedSystem = (id) => {
    store.pinnedSystemId = id;
    localStorage.setItem('pinnedSystemId', id);
    store.showSlotSwitcher = false;
    actions.addLog(`🔁 系统槽位已更新：当前挂载为【${systemsManifests.find(s => s.id === id).portal.title}】`, 'success');
};

// ==========================================
// 【组件生命周期钩子】：挂载时激活主题引擎与本地缓存水化
// ==========================================
onMounted(() => {
  actions.initTheme();
  actions.initSettings();
});

// 【视图响应式监听】：终端日志更新时，强制触发微任务实现平滑滚动至底部
watch(() => store.logs.length, async () => {
  if (store.showLogs) {
    await nextTick();
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  }
});

// 【视图响应式监听】：全局深色模式调度拦截
watch(() => store.isDarkMode, (newVal) => {
  if (newVal) {
    document.body.classList.add('dark-mode');
    actions.addLog("👉 界面已切换至【夜间模式】", "info");
  } else {
    document.body.classList.remove('dark-mode');
    actions.addLog("👉 界面已切换至【白天模式】", "info");
  }
  // 无论切到白天还是黑夜，强制唤醒色彩引擎重新合成 CSS 变量
  actions.applyThemeColor();
});

// 手动表格行列增删 actions (保留在 App 层级避免模块膨胀)
const addGridCol = () => {
    store.manualGrid[0].push(`新特征${store.manualGrid[0].length + 1}`);
    for (let i = 1; i < store.manualGrid.length; i++) {
        store.manualGrid[i].push("");
    }
};
const addGridRow = () => {
    const cols = store.manualGrid[0].length;
    store.manualGrid.push(new Array(cols).fill(""));
};
const removeGridCol = (cIdx) => {
    for (let i = 0; i < store.manualGrid.length; i++) {
        store.manualGrid[i].splice(cIdx, 1);
    }
};
const removeGridRow = (rIdx) => store.manualGrid.splice(rIdx, 1);
</script>

<template>
  <div :class="{ 'dark-mode': store.isDarkMode }" class="app-global-wrapper">

    <div class="video-background">
      <video v-if="store.bgType === 'default'" :key="store.isDarkMode ? 'dark' : 'light'" autoplay loop muted playsinline class="bg-video">
        <source :src="store.isDarkMode ? '/bg-dark.mp4' : '/bg-light.mp4'" type="video/mp4" />
      </video>
      <video v-else-if="store.bgType === 'video'" :key="store.bgUrl" autoplay loop muted playsinline class="bg-video">
        <source :src="store.bgUrl" />
      </video>
      <img v-else-if="store.bgType === 'image'" :src="store.bgUrl" class="bg-video" style="object-fit: cover; width: 100%; height: 100%;" />
      <div class="bg-overlay" :style="{ background: store.isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.1)' }"></div>
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

    <!-- 全局通用弹窗组件 -->
    <CommonModal />

    <div v-if="store.showSettings" class="modal-overlay" style="z-index: 3000;">
      <div class="glass-card settings-modal-container">
        <button @click="store.showSettings = false" class="close-btn modal-close-btn">✕</button>
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

    <div v-if="store.showManualModal" class="modal-overlay" style="z-index: 2500;">
      <div class="glass-card" style="width: 80vw; max-width: 900px; height: 80vh; display: flex; flex-direction: column; padding: 25px; position: relative;">
        <div style="display:flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(0,0,0,0.1); padding-bottom: 15px; margin-bottom: 15px;">
          <h2 style="margin:0; color:#409eff; display: flex; align-items: center; gap: 10px;">
            📝 在线表格编辑器 <span style="font-size: 0.9rem; color: #888; font-weight: normal;">(直接输入数据，支持行列增删)</span>
          </h2>
          <button @click="store.showManualModal = false" class="close-btn" style="font-size: 1.5rem; background:none; border:none; cursor:pointer;">✕</button>
        </div>
        <div style="display:flex; gap:10px; margin-bottom: 15px;">
          <button @click="addGridCol" class="glass-btn secondary-btn" style="width:auto; padding: 6px 15px; background: rgba(144, 147, 153, 0.4);">➕ 添加一列</button>
          <button @click="addGridRow" class="glass-btn secondary-btn" style="width:auto; padding: 6px 15px; background: rgba(144, 147, 153, 0.4);">➕ 添加一行</button>
        </div>
        <div style="flex: 1; overflow: auto; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: rgba(255,255,255,0.3);">
          <table class="glass-table manual-table" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th v-for="(col, cIdx) in store.manualGrid[0]" :key="'h'+cIdx" style="position: sticky; top: 0; background: rgba(64,158,255,0.2); z-index: 10;">
                  <div style="display: flex; align-items: center;">
                    <input v-model="store.manualGrid[0][cIdx]" class="edit-input head-input" placeholder="输入表头" />
                    <button @click="removeGridCol(cIdx)" class="mini-del-btn" v-if="store.manualGrid[0].length > 1" title="删除该列">✕</button>
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
                  <button @click="removeGridRow(rIdx + 1)" class="mini-del-btn" style="color: #f56c6c;" title="删除该行">➖</button>
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
            <p class="version">Version: 4.0 | 模块化架构</p>
            <button @click="store.isEntered = true; store.currentModule = 'portal'" class="enter-btn">🚀 点击进入系统</button>
            <div style="margin-top: 20px;">
              <button @click="store.showSettings = true" class="enter-btn" style="padding: 10px 25px; font-weight: normal; font-size: 0.9rem; background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); box-shadow: 0 4px 15px rgba(0, 242, 254, 0.4);">
                ⚙️ 系统设置 & 作者名片
              </button>
            </div>
          </div>
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'portal'" style="position: absolute; top:0; left:0; width:100%; height:100%; display:flex; justify-content:center; align-items:center; z-index: 20;">
          <div class="glass-card workspace-portal" style="width: 95%; max-width: 1200px; padding: 50px; text-align: center; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); display: flex; flex-direction: column; align-items: center;">
            <h2 style="font-size: 2rem; margin-top: 0; margin-bottom: 10px; color: var(--text-color, inherit);">🌌 请选择您的工作空间</h2>
            <p class="description-text" style="color: #888; margin-bottom: 40px;">DataAnalyzer 模块化微服务架构 V4.0</p>

            <div class="portal-card-grid">
              <!-- 核心固定系统 (前两个) -->
              <div v-for="sys in fixedSystems" :key="sys.id" class="glass-inner module-card" @click="store.currentModule = sys.id" style="flex:1; min-width: 260px; max-width: 350px; padding: 40px 20px; cursor: pointer; transition: all 0.3s; border-radius: 16px;">
                <div class="module-icon">{{ sys.portal.icon }}</div>
                <h3 class="module-title" :style="{ fontSize: '1.4rem', color: sys.portal.titleColor, marginBottom: '10px' }">{{ sys.portal.title }}</h3>
                <p class="module-desc" style="color:#888; font-size:0.9rem; line-height: 1.6; padding: 0 15px;">{{ sys.portal.description }}</p>
                <div style="margin-top: 20px;"><span class="status-badge" :style="{ background: sys.portal.statusBg, color: sys.portal.statusColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', border: sys.portal.statusBorder }">{{ sys.portal.statusText }}</span></div>
              </div>

              <!-- 动态挂载系统 (第三个) -->
              <div class="glass-inner module-card" @click="store.currentModule = pinnedSystem.id" style="flex:1; min-width: 260px; max-width: 350px; padding: 40px 20px; cursor: pointer; transition: all 0.3s; border-radius: 16px; position: relative;">
                <div class="card-gear-icon" @click.stop="store.showSlotSwitcher = true" title="更换此位置挂载的业务系统">⚙️</div>
                <div class="module-icon">{{ pinnedSystem.portal.icon }}</div>
                <h3 class="module-title" :style="{ fontSize: '1.4rem', color: pinnedSystem.portal.titleColor, marginBottom: '10px' }">{{ pinnedSystem.portal.title }}</h3>
                <p class="module-desc" style="color:#888; font-size:0.9rem; line-height: 1.6; padding: 0 15px;">{{ pinnedSystem.portal.description }}</p>
                <div style="margin-top: 20px;"><span class="status-badge" :style="{ background: pinnedSystem.portal.statusBg, color: pinnedSystem.portal.statusColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', border: pinnedSystem.portal.statusBorder }">{{ pinnedSystem.portal.statusText }}</span></div>
              </div>
            </div>

            <div style="margin-top: 40px; display: flex; flex-direction: column; align-items: center; gap: 25px;">
              <button @click="store.isEntered = false" class="glass-btn secondary-btn" style="width: 240px; border-radius: 30px;">⬅️ 返回系统主页</button>
              
              <!-- App Drawer 交互图标 -->
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


      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'analysis'" class="main-dashboard">
          <AnalysisSidebar />
          <AnalysisScreen />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'management'" class="main-dashboard" style="padding: 0;">
          <ManagementView style="width: 100%; height: 100%;" />
        </div>
      </transition>

      <transition name="fade">
        <div v-if="store.isEntered && store.currentModule === 'template'" class="main-dashboard" style="padding: 0;">
          <TemplateSystem />
        </div>
      </transition>
    </div>

    <div v-if="store.showLogs" class="log-console-panel">
      <div class="log-header">
        <span>📟 终端监控台 (Terminal)</span>
        <button @click="store.showLogs = false" class="close-log-btn">✕</button>
      </div>
      <div class="log-body" ref="logContainer">
        <div v-if="store.logs.length === 0" style="color: #666; font-style: italic;">系统就绪，等待指令...</div>
        <div v-for="(log, idx) in store.logs" :key="idx" class="log-line">
          <span v-if="log.includes('[ERROR]')" style="color: #ff4d4f;">{{ log }}</span>
          <span v-else-if="log.includes('[SUCCESS]')" style="color: #52c41a;">{{ log }}</span>
          <span v-else>{{ log }}</span>
        </div>
        <div class="blinking-cursor">_</div>
      </div>
    </div>

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
            <div v-for="sys in systemsManifests" :key="sys.id" class="shelf-item" :class="{ active: store.currentModule === sys.id }" @click="actions.requestSystemSwitch(sys.id)">
              <div class="shelf-icon">{{ sys.shelf.icon }}</div>
              <div class="shelf-name">{{ sys.shelf.name }}</div>
            </div>
          </div>
          <p class="shelf-tip">提示：切换系统将触发核心同步与工作流重组</p>
        </div>
      </div>
    </transition>

    <!-- 全维应用桌面 (Mobile-style App Drawer) -->
    <transition name="desktop-slide">
      <div v-if="store.showAppDesktop" class="app-desktop-overlay" @click.self="store.showAppDesktop = false">
        <div class="glass-card app-desktop-content">
          <div class="desktop-header">
            <h2 class="desktop-title">🌌 全维系统桌面</h2>
            <div class="desktop-subtitle">V4.0 NEXT GENERATION DASHBOARD</div>
          </div>
          
          <div class="app-grid">
            <div v-for="sys in systemsManifests" :key="sys.id" class="app-icon-item" @click="store.currentModule = sys.id; store.showAppDesktop = false">
              <div class="app-icon-inner glass-inner" :style="{ background: sys.drawer.iconBackground }">{{ sys.drawer.icon }}</div>
              <span class="app-label">{{ sys.drawer.name }}</span>
            </div>
          </div>

          <div class="desktop-footer" @click="store.showAppDesktop = false">
            <div class="swipe-handle"></div>
            <p>点击空白处返回工作空间</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 槽位调度器 (Full-Screen Desktop Switcher) -->
    <transition name="desktop-slide">
      <div v-if="store.showSlotSwitcher" class="app-desktop-overlay" @click.self="store.showSlotSwitcher = false">
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

          <div class="desktop-footer" @click="store.showSlotSwitcher = false">
            <div class="swipe-handle"></div>
            <p>点击空白处或向上滑动返回工作空间</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- 业务系统全局模态层 -->
    <CleanReportModal v-if="store.showCleanReportModal" />
    <SampleInsufficientModal v-if="store.showSampleInsufficientModal" />

  </div>
</template>

<style scoped>
/* Home Pillar 样式 */
.home-pillar-container {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10000;
}
.home-pillar {
  width: 100px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  transition: all 0.3s;
}
.home-pillar-container:hover .home-pillar {
  width: 140px;
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

/* 模块卡片设置图标 */
.card-gear-icon {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 1.4rem;
  opacity: 0.3;
  transition: all 0.3s;
  z-index: 10;
  padding: 8px;
  border-radius: 50%;
}
.card-gear-icon:hover {
  opacity: 1;
  transform: rotate(90deg) scale(1.2);
  background: rgba(255, 255, 255, 0.2);
  color: #409eff;
}

/* 全维应用桌面样式 */
.app-desktop-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: flex-end; /* 从底部升起 */
}
.app-desktop-content {
  width: 100%;
  max-width: 900px;
  height: 85vh;
  border-radius: 40px 40px 0 0;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 -20px 60px rgba(0, 0, 0, 0.4);
}
.dark-mode .app-desktop-content {
  background: rgba(20, 20, 30, 0.6);
}

.desktop-header {
  text-align: center;
  margin-bottom: 60px;
}
.desktop-title {
  font-size: 2.2rem;
  margin: 0;
  background: linear-gradient(90deg, #fff, #409eff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}
.desktop-subtitle {
  font-size: 0.8rem;
  letter-spacing: 4px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 10px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 40px;
  justify-items: center;
  padding: 20px;
}
.app-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: transform 0.3s;
}
.app-icon-item:hover {
  transform: translateY(-10px);
}
.app-icon-inner {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3.5rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
.app-label {
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* 槽位选择状态点 */
.active-dot {
  position: absolute;
  bottom: -15px;
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  box-shadow: 0 0 10px #409eff;
}

/* 锁定/占位符样式 */
.locked-slot {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px dashed rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: none !important;
}
.opacity-40 {
  opacity: 0.4;
}

/* 响应式枢纽布局 */
.portal-card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  width: 100%;
  padding: 10px;
}
.module-icon {
  font-size: 4.5rem;
  margin-bottom: 20px;
  text-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

/* 黑夜模式文字差分适配 (Accessibility) */
.dark-mode .description-text,
.dark-mode .module-desc {
  color: #ccc !important; /* 提升暗色模式下的可视度 */
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.dark-mode .module-title {
  filter: brightness(1.2); /* 增强标题亮感 */
}
.dark-mode .glass-card {
  background: rgba(20, 20, 30, 0.7); /* 稍微加深蒙版以突出白色文字 */
}

.desktop-footer {
  margin-top: auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
}
.swipe-handle {
  width: 60px;
  height: 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  margin: 0 auto 15px;
}

/* 桌面切换动画 */
.desktop-slide-enter-active,
.desktop-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
}
.desktop-slide-enter-from,
.desktop-slide-leave-to {
  opacity: 0;
}
.desktop-slide-enter-from .app-desktop-content,
.desktop-slide-leave-to .app-desktop-content {
  transform: translateY(100%) scale(0.9);
}

/* App Drawer 图标按钮 */
.app-drawer-btn-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: breathingPulse 4s infinite ease-in-out;
}
.app-drawer-btn-wrapper:hover {
  transform: scale(1.1) rotate(5deg);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 30px rgba(64, 158, 255, 0.3);
}
.app-drawer-icon {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 12px;
}
.app-drawer-icon span {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s;
}
.app-drawer-btn-wrapper:hover .app-drawer-icon span {
  background: #409eff;
  border-radius: 50%;
}

.drawer-glow {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.4), rgba(114, 46, 209, 0.4));
  filter: blur(15px);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}
.app-drawer-btn-wrapper:hover .drawer-glow {
  opacity: 1;
}

/* 槽位选择器样式 */
.slot-switcher-content {
  width: 90%;
  max-width: 500px;
  padding: 40px;
  text-align: center;
  border-radius: 30px;
}
.slot-title {
  margin-top: 0;
  margin-bottom: 30px;
  font-size: 1.4rem;
  color: #409eff;
}
.slot-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.slot-item {
  padding: 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}
.slot-item:hover {
  background: rgba(64, 158, 255, 0.1);
  transform: translateY(-5px);
}
.slot-item.active {
  background: rgba(64, 158, 255, 0.2);
  border-color: #409eff;
}
.slot-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}
.slot-name {
  font-weight: bold;
  font-size: 0.9rem;
}

@keyframes breathingPulse {
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 255, 255, 0); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(64, 158, 255, 0.2); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(255, 255, 255, 0); }
}
</style>