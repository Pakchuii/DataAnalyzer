<script setup>
/**
 * 【系统编排容器：演示模板系统】
 * 演示如何拼装 Sidebar 和 Screen 构成一个完整的功能域。
 */
import TemplateSidebar from './TemplateSidebar.vue';
import TemplateScreen from './TemplateScreen.vue';

</script>

<template>
  <div class="main-dashboard template-system-layout">
    <TemplateSidebar />
    <TemplateScreen />
  </div>
</template>

<style scoped>
.template-system-layout {
  display: flex;
  width: 100%;
  height: 100%;
}
</style>
