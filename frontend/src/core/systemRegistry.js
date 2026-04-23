// core/systemRegistry.js 
// ==========================================
// 【架构设计：系统注册表 (System Registry V3)】
// 统一聚合并导出各个独立系统的 manifest 配置与组件入口。
// 当开发者需要增加新系统时，只需在此处引入其组件并在 registry 中注册即可。
// ==========================================

// 1. 导入 Manifests (用于元数据)
import analysisManifest from '@/systems/analysis/manifest.json';
import managementManifest from '@/systems/management/manifest.json';
import templateManifest from '@/systems/template/manifest.json';

// 2. 导入入口组件 (用于动态渲染)
// 智能分析系统
import AnalysisSidebar from '@/systems/analysis/AnalysisSidebar.vue';
import AnalysisScreen from '@/systems/analysis/AnalysisScreen.vue';

// 数据管理引擎 (ManagementView 内部自持布局)
import ManagementView from '@/systems/management/ManagementView.vue';

// 演示模板系统
import TemplateSidebar from '@/systems/template/TemplateSidebar.vue';
import TemplateScreen from '@/systems/template/TemplateScreen.vue';

// 🧪 实验室测试系统 (Module Laboratory)
import testerManifest from '@/systems/tester/manifest.json';
import TesterSidebar from '@/systems/tester/TesterSidebar.vue';
import TesterScreen from '@/systems/tester/TesterScreen.vue';

// 🎵 云端音乐系统
import musicManifest from '@/systems/music/manifest.json';
import MusicSidebar from '@/systems/music/MusicSidebar.vue';
import MusicScreen from '@/systems/music/MusicScreen.vue';

// 🖼️ 时光相册系统
import galleryManifest from '@/systems/gallery/manifest.json';
import GallerySystem from '@/systems/gallery/GallerySystem.vue';

/**
 * 全局系统注册表
 * 开发者手动在此处注册新系统。id 必须对应 store.currentModule
 */
export const systemsRegistry = {
    analysis: {
        id: 'analysis',
        manifest: analysisManifest,
        sidebar: AnalysisSidebar,
        screen: AnalysisScreen
    },
    management: {
        id: 'management',
        manifest: managementManifest,
        sidebar: null, // 管理引擎自持布局，无需底座侧边栏插槽
        screen: ManagementView
    },
    template: {
        id: 'template',
        manifest: templateManifest,
        sidebar: TemplateSidebar,
        screen: TemplateScreen
    },
    tester: {
        id: 'tester',
        manifest: testerManifest,
        sidebar: TesterSidebar,
        screen: TesterScreen
    },
    music: {
        id: 'music',
        manifest: musicManifest,
        sidebar: MusicSidebar,
        screen: MusicScreen
    },
    gallery: {
        id: 'gallery',
        manifest: galleryManifest,
        sidebar: null,
        screen: GallerySystem
    }
};

/**
 * 兼容旧版的 manifests 列表导出，供 Portal 等组件循环渲染卡片使用
 */
export const systemsManifests = Object.values(systemsRegistry).map(s => s.manifest);
