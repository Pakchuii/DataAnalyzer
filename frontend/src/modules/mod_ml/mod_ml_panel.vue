<script setup>
import { store } from '@/core/store.js'
</script>

<template>
  <div v-if="store.showML && store.mlResult" class="glass-card result-panel">
    <div class="panel-header">
      <h3 class="panel-title" style="color:#722ed1;">🧠 机器学习：随机森林回归模型 (RF Regressor)</h3>
    </div>
    
    <div style="display: flex; gap: 20px; align-items: flex-start;">
      <div class="glass-inner" style="flex: 1; padding: 20px;">
        <h4 style="margin-top: 0; color: #722ed1;">✨ 模型预测与评估细节：</h4>
        <div style="font-family: monospace; line-height: 1.8; color: var(--text-color, inherit);">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 5px 0;">
            <span>🎯 目标预测变量 (Target):</span>
            <span style="font-weight: bold; color: #1890ff;">{{ store.mlTargetVar }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 5px 0;">
            <span>📐 测试集 R² 得分:</span>
            <span :style="{ fontWeight: 'bold', color: store.mlResult.r2_score > 0.6 ? '#52c41a' : '#f5222d' }">{{ store.mlResult.r2_score }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 5px 0;">
            <span>📉 均方误差 (MSE):</span>
            <span style="font-weight: bold;">{{ store.mlResult.mse }}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 5px 0;">
            <span>⚖️ 特征总权重比例:</span>
            <span style="font-weight: bold; color: #52c41a;">100.00%</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(0,0,0,0.05); padding: 5px 0;">
            <span>📦 数据集惩罚状态 (Penalty):</span>
            <span :style="{ fontWeight: 'bold', color: store.mlResult.penalty_applied ? '#fa8c16' : '#52c41a' }">
              {{ store.mlResult.penalty_applied ? `已启用 (${store.mlResult.penalty_reason})` : '未生效 (样本充足)' }}
            </span>
          </div>
        </div>
      </div>
      
      <div v-if="store.predictData" class="glass-inner" style="flex: 1; padding: 20px;">
        <h4 style="margin-top: 0; color: #52c41a;">🔮 模型推理洞察 (Inference Insights)：</h4>
        <div style="background: rgba(82, 196, 26, 0.05); padding: 15px; border-radius: 8px; border: 1px dashed rgba(82, 196, 26, 0.3);">
          <p style="margin-top:0; font-size: 0.9rem; color: #666;">基于当前特征向量，系统预测 <b>{{ store.mlTargetVar }}</b> 可能的数值为：</p>
          <div style="font-size: 2.2rem; font-weight: bold; color: #389e0d; text-align: center; margin: 10px 0;">
            {{ store.predictData.prediction }}
          </div>
          <p style="margin-bottom:0; font-size: 0.8rem; color: #888; text-align: right;">* 置信度估计：{{ (store.mlResult.r2_score * 100).toFixed(2) }}%</p>
        </div>
      </div>
    </div>

    <div class="sub-panel" style="margin-top: 30px;">
      <div class="sub-header"><h4>📊 特征重要性贡献度图表 (Feature Importance)</h4></div>
      <div id="importance-container" class="chart-box" style="height: 400px;"></div>
    </div>
  </div>
</template>
