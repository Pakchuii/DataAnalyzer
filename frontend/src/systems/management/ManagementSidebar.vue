<script setup>
import ModExit from '@/modules/mod_exit/ModExit.vue'
import ModUploadView from '@/modules/mod_upload/mod_upload_view.vue'
import ModDataIoView from '@/modules/mod_data_io/mod_data_io_view.vue'
</script>

<template>
  <div class="management-sidebar glass-card">
    
    <!-- 统一退出模块 -->
    <ModExit />

    <!-- 积木组件：上传与导入 -->
    <ModUploadView />

    <!-- 积木组件：数据管理与状态 -->
    <ModDataIoView />

  </div>
</template>

<style scoped>
.management-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  margin-right: 20px;
  border-radius: 16px;
  transition: all 0.3s;
  position: relative;
  height: 100%;
  box-sizing: border-box;
}

.portal-back-btn {
  width: 100%;
  padding: 12px;
  margin-bottom: 25px;
  border-radius: 30px;
  font-weight: bold;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  box-shadow: 0 4px 15px rgba(24, 144, 255, 0.3);
}
</style>
