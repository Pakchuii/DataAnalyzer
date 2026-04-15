<script setup>
import { ref } from 'vue'
import ModExportView from '@/modules/mod_export/mod_export_view.vue'
import ModPreviewEditor from '@/modules/mod_preview/mod_preview_editor.vue'

const editorRef = ref(null);

const handleUndo = () => editorRef.value?.undo();
const handleAddColumn = () => editorRef.value?.addColumn();
const handleAddRow = () => editorRef.value?.addNewRow();

const historyLength = ref(0);
// We can use a ref or just let ModExportView read from editorRef.historyLength if exposed
</script>

<template>
  <div class="management-editor-screen">
    
    <!-- 顶部动作栏积木 -->
    <ModExportView 
      :historyLength="editorRef?.historyLength || 0"
      @undo="handleUndo"
      @addColumn="handleAddColumn"
      @addRow="handleAddRow"
    />

    <!-- 核心手术台积木 (含搜索) -->
    <ModPreviewEditor ref="editorRef" />

  </div>
</template>

<style scoped>
.management-editor-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 20px;
}
</style>
