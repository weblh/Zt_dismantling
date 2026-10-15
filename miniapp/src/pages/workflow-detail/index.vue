<template>
  <view class="page">
    <!-- 流程状态卡片 -->
    <view class="status-card">
      <view class="status-header">
        <view class="status-icon-wrap" :class="statusClass">
          <text class="status-icon">{{ statusIcon }}</text>
        </view>
        <view class="status-info">
          <text class="status-title">{{ detail.formName || detail.title || '流程详情' }}</text>
          <text class="status-text">{{ statusText }}</text>
        </view>
      </view>
      <view v-if="detail.summary" class="status-summary">{{ detail.summary }}</view>
      <view v-if="detail.createdAt || detail.startTime" class="status-time">
        <text>发起时间：{{ detail.createdAt || detail.startTime }}</text>
      </view>
      <!-- 审批进度条（如果有流程步骤） -->
      <view v-if="hasSteps" class="progress-steps">
        <view
          v-for="(step, idx) in steps"
          :key="idx"
          class="step"
          :class="{ active: step.active, done: step.done }"
        >
          <view class="step-dot">{{ step.done ? '✓' : (idx + 1) }}</view>
          <text class="step-name">{{ step.name }}</text>
        </view>
      </view>
    </view>

    <!-- 表单详情 -->
    <view class="detail-card">
      <view class="detail-header">
        <view class="detail-indicator" />
        <text class="detail-title">表单内容</text>
      </view>
      <view v-if="Object.keys(displayData).length === 0" class="empty-tip">暂无表单数据</view>
      <view v-else class="data-list">
        <view v-for="(item, idx) in displayData" :key="idx" class="data-row">
          <text class="data-label">{{ item.label }}</text>
          <text class="data-value">{{ item.value }}</text>
        </view>
      </view>
    </view>

    <!-- 审批意见（仅审批时显示） -->
    <view v-if="tab === 'todo'" class="comment-card">
      <view class="comment-header">
        <view class="detail-indicator" />
        <text class="detail-title">审批意见</text>
      </view>
      <textarea
        v-model="comment"
        class="comment-input"
        placeholder="请输入审批意见（选填）"
        placeholder-class="comment-placeholder"
      />
    </view>

    <!-- 底部操作栏 -->
    <view v-if="tab === 'todo'" class="action-bar">
      <button class="btn-reject" :loading="acting" @tap="handleReject">
        <text class="btn-icon">✕</text>
        <text>驳回</text>
      </button>
      <button class="btn-approve" :loading="acting" @tap="handleApprove">
        <text class="btn-icon">✓</text>
        <text>同意</text>
      </button>
    </view>

    <view v-else-if="tab === 'initiated' || tab === 'cc'" class="action-bar">
      <button class="btn-secondary" @tap="handleWithdraw">撤回</button>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { flowApprove, flowReject } from '@/api/platform.js'

const tab = ref('todo')
const detail = ref({})
const acting = ref(false)
const comment = ref('')

// 字段标签映射（可从form schema获取，这里做简单映射）
const fieldLabels = computed(() => {
  const raw = detail.value.dataJson
  if (!raw) return {}
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = key
      return acc
    }, {})
  } catch {
    return {}
  }
})

const dataObj = computed(() => {
  const raw = detail.value.dataJson
  if (!raw) return {}
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return {}
  }
})

const displayData = computed(() => {
  return Object.keys(dataObj.value).map((key) => ({
    label: fieldLabels.value[key] || key,
    value: formatVal(dataObj.value[key]),
  }))
})

const statusText = computed(() => detail.value.flowState || detail.value.status || '待审批')
const statusIcon = computed(() => {
  if (statusText.value.includes('通过') || statusText.value.includes('完成')) return '✓'
  if (statusText.value.includes('驳回') || statusText.value.includes('拒绝')) return '✕'
  return '⏳'
})
const statusClass = computed(() => {
  if (statusText.value.includes('通过') || statusText.value.includes('完成')) return 'success'
  if (statusText.value.includes('驳回') || statusText.value.includes('拒绝')) return 'error'
  return 'pending'
})

// 简单的步骤生成（可根据后端返回的流程数据优化）
const steps = computed(() => {
  const state = statusText.value
  const currentUser = detail.value.assignee || '当前审批人'
  const startedBy = detail.value.startUserName || detail.value.creatorName || '发起人'
  const baseSteps = [
    { name: startedBy, done: true, active: false },
    { name: currentUser, done: state.includes('通过') || state.includes('完成'), active: !state.includes('通过') && !state.includes('完成') && !state.includes('驳回') && !state.includes('拒绝') },
    { name: '流程结束', done: state.includes('通过') || state.includes('完成') || state.includes('驳回') || state.includes('拒绝'), active: false },
  ]
  return baseSteps
})
const hasSteps = computed(() => tab.value !== 'cc')

onLoad((query) => {
  tab.value = query.tab || 'todo'
  try {
    detail.value = JSON.parse(decodeURIComponent(query.item || '{}'))
  } catch {
    detail.value = {}
  }
  uni.setNavigationBarTitle({ title: '流程详情' })
})

function formatVal(val) {
  if (Array.isArray(val)) return val.join(', ')
  if (val === null || val === undefined || val === '') return '-'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

async function handleApprove() {
  const taskId = detail.value.taskId
  if (!taskId) {
    uni.showToast({ title: '缺少任务ID', icon: 'none' })
    return
  }
  acting.value = true
  try {
    await flowApprove(taskId, comment.value || '同意')
    uni.showToast({ title: '已同意', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    acting.value = false
  }
}

async function handleReject() {
  const taskId = detail.value.taskId
  if (!taskId) {
    uni.showToast({ title: '缺少任务ID', icon: 'none' })
    return
  }
  acting.value = true
  try {
    await flowReject(taskId, comment.value || '驳回')
    uni.showToast({ title: '已驳回', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 500)
  } finally {
    acting.value = false
  }
}

function handleWithdraw() {
  uni.showToast({ title: '撤回功能开发中', icon: 'none' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 24rpx 32rpx;
  padding-bottom: 200rpx;
}

.status-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.status-header {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
}

.status-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon-wrap.success {
  background: #e6fffb;
  color: #08979c;
}

.status-icon-wrap.error {
  background: #fff1f0;
  color: #cf1322;
}

.status-icon-wrap.pending {
  background: #fff7e6;
  color: #d46b08;
}

.status-icon {
  font-size: 40rpx;
  font-weight: 700;
}

.status-info {
  flex: 1;
  min-width: 0;
}

.status-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.4;
}

.status-text {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 26rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background: #f5f5f5;
  color: #666;
}

.status-summary {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.status-time {
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #999;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 28rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid #f0f0f0;
}

.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  position: relative;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20rpx;
  left: calc(50% + 16rpx);
  right: calc(-50% + 16rpx);
  height: 4rpx;
  background: #e8e8e8;
}

.step.done::after {
  background: #52c41a;
}

.step-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #e8e8e8;
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.step.done .step-dot {
  background: #52c41a;
}

.step.active .step-dot {
  background: #2b7fff;
  box-shadow: 0 0 0 6rpx rgba(43, 127, 255, 0.2);
}

.step-name {
  font-size: 22rpx;
  color: #666;
  text-align: center;
  max-width: 100rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.detail-indicator {
  width: 8rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #2b7fff, #5b9fff);
  border-radius: 4rpx;
  margin-right: 16rpx;
}

.detail-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.data-list {
  display: flex;
  flex-direction: column;
}

.data-row {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
  gap: 24rpx;
}

.data-row:last-child {
  border-bottom: none;
}

.data-label {
  width: 180rpx;
  flex-shrink: 0;
  font-size: 26rpx;
  color: #999;
}

.data-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
  line-height: 1.4;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 60rpx 0;
  font-size: 26rpx;
}

.comment-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.comment-input {
  width: 100%;
  min-height: 160rpx;
  background: #f9fafb;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.comment-placeholder {
  color: #bbb;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  gap: 20rpx;
}

.btn-reject,
.btn-approve,
.btn-secondary {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.btn-reject {
  background: #fff1f0;
  color: #cf1322;
}

.btn-approve {
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(43, 127, 255, 0.25);
}

.btn-secondary {
  background: #f2f4f7;
  color: #666;
}

.btn-icon {
  font-size: 28rpx;
}
</style>