// core/systemRegistry.js 
// ==========================================
// 【架构设计：系统注册表 (System Registry)】
// 统一聚合并导出各个独立系统的 manifest 配置文件。
// 当需要增加新系统时，只需在此处引入其 manifest.json 即可实现 UI 的全量同步。
// ==========================================

import analysisManifest from '@/systems/analysis/manifest.json';
import managementManifest from '@/systems/management/manifest.json';
import templateManifest from '@/systems/template/manifest.json';

export const systemsManifests = [
    analysisManifest,
    managementManifest,
    templateManifest
];
