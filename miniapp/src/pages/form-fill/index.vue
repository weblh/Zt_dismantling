<template>
  <view class="page">
    <!-- 页头 -->
    <view class="form-header">
      <view class="form-title">{{ formName }}</view>
      <view v-if="flowEnabled" class="flow-badge">
        <text class="flow-icon">⚡</text>
        <text>支持流程审批</text>
      </view>
    </view>

    <!-- 切换标签 -->
    <view class="tabs">
      <view
        class="tab-item"
        :class="{ active: mode === 'fill' }"
        @tap="mode = 'fill'"
      >
        <text class="tab-text">填写</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: mode === 'records' }"
        @tap="switchRecords"
      >
        <text class="tab-text">记录</text>
        <text v-if="records.length > 0" class="tab-count">{{ records.length }}</text>
      </view>
    </view>

    <!-- 表单填写 -->
    <scroll-view v-if="mode === 'fill'" scroll-y class="form-scroll">
      <view v-if="fields.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">该表单暂无字段配置</text>
      </view>
      <view v-else class="fields-area">
        <DynamicField
          v-for="field in fields"
          :key="field.key"
          :field="field"
          v-model="formData[field.key]"
        />
      </view>
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 提交记录 -->
    <scroll-view v-else scroll-y class="form-scroll">
      <view v-if="recordsLoading" class="empty-state">
        <view class="loading-spinner" />
        <text class="empty-text">加载中...</text>
      </view>
      <view v-else-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无提交记录</text>
      </view>
      <view v-else class="records-list">
        <view
          v-for="row in records"
          :key="row.id"
          class="record-card"
          @tap="loadRecord(row)"
        >
          <view class="record-header">
            <text class="record-id">#{{ row.id }}</text>
            <text class="record-status" :class="getRecordStatusClass(row)">
              {{ getRecordStatus(row) }}
            </text>
          </view>
          <view class="record-summary">{{ summarize(row.dataJson) }}</view>
          <view class="record-meta">
            <text>{{ row.creatorName || '未知' }}</text>
            <text>{{ row.updatedAt || row.createdAt || '' }}</text>
          </view>
        </view>
      </view>
      <view class="bottom-placeholder" />
    </scroll-view>

    <!-- 底部操作栏 -->
    <view v-if="mode === 'fill'" class="action-bar">
      <button class="btn-save" :loading="saving" @tap="submit(false)">
        <text class="btn-icon">💾</text>
        <text>保存</text>
      </button>
      <button
        v-if="flowEnabled"
        class="btn-submit"
        :loading="saving"
        @tap="submit(true)"
      >
        <text class="btn-icon">⚡</text>
        <text>提交审批</text>
      </button>
      <button v-else class="btn-submit" :loading="saving" @tap="submit(false)">
        <text class="btn-icon">✓</text>
        <text>提交</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import DynamicField from '@/components/DynamicField.vue'
import {
  createFormData,
  getForm,
  listFormData,
  parseSchema,
  updateFormData,
} from '@/api/platform.js'
import { getToken } from '@/utils/auth.js'

const formId = ref(0)
const formName = ref('')
const fields = ref([])
const formData = reactive({})
const flowEnabled = ref(false)
const mode = ref('fill')
const saving = ref(false)
const records = ref([])
const recordsLoading = ref(false)
const editingId = ref(null)

onLoad((query) => {
  formId.value = Number(query.formId || 0)
  formName.value = decodeURIComponent(query.name || '表单填写')
  uni.setNavigationBarTitle({ title: formName.value })
  loadForm()
})

async function loadForm() {
  if (!formId.value) return
  const res = await getForm(formId.value)
  fields.value = parseSchema(res.data?.schemaJson)
  flowEnabled.value = res.data?.flowEnabled === 1
  for (const f of fields.value) {
    if (formData[f.key] === undefined) {
      formData[f.key] = f.type === 'switch' ? false : ''
    }
  }
}

function switchRecords() {
  mode.value = 'records'
  loadRecords()
}

async function loadRecords() {
  recordsLoading.value = true
  try {
    const res = await listFormData(formId.value, 1, 50)
    records.value = res.data?.records || []
  } finally {
    recordsLoading.value = false
  }
}

function summarize(dataJson) {
  try {
    const obj = JSON.parse(dataJson || '{}')
    return Object.keys(obj)
      .slice(0, 3)
      .map((k) => `${k}: ${obj[k]}`)
      .join(' · ')
  } catch {
    return dataJson || ''
  }
}

function getRecordStatus(row) {
  if (row.flowState) return row.flowState
  if (row.status === 1) return '已提交'
  if (row.status === 0) return '草稿'
  return '已保存'
}

function getRecordStatusClass(row) {
  const status = getRecordStatus(row)
  if (status.includes('通过') || status.includes('完成')) return 'status-success'
  if (status.includes('驳回') || status.includes('拒绝')) return 'status-error'
  if (status.includes('审批') || status.includes('待办') || status.includes('进行')) return 'status-pending'
  return 'status-default'
}

function loadRecord(row) {
  editingId.value = row.id
  mode.value = 'fill'
  try {
    const obj = JSON.parse(row.dataJson || '{}')
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, obj)
  } catch {
    uni.showToast({ title: '数据解析失败', icon: 'none' })
  }
}

function validateForm() {
  for (const f of fields.value) {
    if (f.required) {
      const val = formData[f.key]
      if (val === '' || val === null || val === undefined || (Array.isArray(val) && val.length === 0)) {
        uni.showToast({ title: `请填写${f.label}`, icon: 'none' })
        return false
      }
    }
  }
  return true
}

async function submit(startFlow) {
  if (!validateForm()) return
  if (!getToken()) {
    uni.showToast({ title: '请先登录后再提交', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/index' })
    }, 400)
    return
  }
  saving.value = true
  try {
    const dataJson = JSON.stringify(formData)
    if (editingId.value) {
      await updateFormData(editingId.value, dataJson)
      uni.showToast({ title: '已保存', icon: 'success' })
    } else {
      await createFormData(formId.value, dataJson, startFlow)
      uni.showToast({
        title: startFlow ? '已提交审批' : '提交成功',
        icon: 'success',
      })
      Object.keys(formData).forEach((k) => {
        formData[k] = fields.value.find((f) => f.key === k)?.type === 'switch' ? false : ''
      })
      editingId.value = null
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.form-header {
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12rpx;
}

.flow-badge {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  background: linear-gradient(90deg, #fff7e6, #ffe7ba);
  color: #d46b08;
  font-size: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.flow-icon {
  font-size: 24rpx;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 0 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  position: relative;
  padding: 24rpx 32rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.tab-item.active .tab-text {
  color: #2b7fff;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 32rpx;
  right: 32rpx;
  height: 4rpx;
  background: #2b7fff;
  border-radius: 2rpx;
}

.tab-text {
  font-size: 30rpx;
  color: #666;
}

.tab-count {
  background: #ff4d4f;
  color: #fff;
  font-size: 22rpx;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  text-align: center;
  border-radius: 16rpx;
  padding: 0 8rpx;
}

.form-scroll {
  flex: 1;
  height: calc(100vh - 340rpx);
}

.fields-area {
  padding: 24rpx 32rpx;
}

.records-list {
  padding: 24rpx 32rpx;
}

.record-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-id {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.record-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.status-success {
  background: #e6fffb;
  color: #08979c;
}

.status-error {
  background: #fff1f0;
  color: #cf1322;
}

.status-pending {
  background: #fff7e6;
  color: #d46b08;
}

.status-default {
  background: #f5f5f5;
  color: #666;
}

.record-summary {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
  margin-bottom: 12rpx;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  font-size: 22rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.loading-spinner {
  display: inline-block;
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #e8e8e8;
  border-top-color: #2b7fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.bottom-placeholder {
  height: 200rpx;
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

.btn-save,
.btn-submit {
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

.btn-save {
  background: #f2f4f7;
  color: #333;
}

.btn-submit {
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(43, 127, 255, 0.25);
}

.btn-icon {
  font-size: 28rpx;
}
</style>