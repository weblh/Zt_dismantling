<template>
  <view class="page">
    <!-- 状态标签页 -->
    <view class="tabs">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @tap="switchTab(tab.key)"
      >
        <text class="tab-label">{{ tab.label }}</text>
        <text v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</text>
      </view>
    </view>

    <view v-if="loading" class="empty-state">
      <view class="loading-spinner" />
      <text class="empty-text">加载中...</text>
    </view>

    <view v-else-if="list.length === 0" class="empty-state">
      <text class="empty-icon">{{ currentTabIcon }}</text>
      <text class="empty-text">
        {{ getToken() ? `暂无${currentLabel}数据` : '登录后可查看流程' }}
      </text>
    </view>

    <view v-else class="list-area">
      <view
        v-for="(item, idx) in list"
        :key="item.taskId || item.dataId || idx"
        class="workflow-card"
        @tap="openDetail(item)"
      >
        <view class="card-header">
          <view class="card-title-row">
            <text class="card-title">{{ item.formName || item.title || '流程单据' }}</text>
            <text class="status-tag" :class="getStatusClass(item)">
              {{ getStatusText(item) }}
            </text>
          </view>
          <view class="card-desc">{{ item.summary || item.flowState || '待处理' }}</view>
        </view>
        <view class="card-footer">
          <view class="user-info">
            <view class="mini-avatar">{{ getAvatarText(item) }}</view>
            <text class="user-name">{{ item.creatorName || item.startUserName || '未知' }}</text>
          </view>
          <text class="card-time">{{ item.createdAt || item.startTime || '' }}</text>
        </view>
      </view>
    </view>

    <view class="safe-bottom" />
    <CustomTabBar current="workflow" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/CustomTabBar.vue'
import {
  flowCc,
  flowInitiated,
  flowProcessed,
  flowTodo,
} from '@/api/platform.js'
import { getToken } from '@/utils/auth.js'

const tabs = ref([
  { key: 'todo', label: '待办', count: 0 },
  { key: 'initiated', label: '我发起的', count: 0 },
  { key: 'processed', label: '我处理的', count: 0 },
  { key: 'cc', label: '抄送', count: 0 },
])

const activeTab = ref('todo')
const loading = ref(false)
const list = ref([])

const currentLabel = computed(() => tabs.value.find((t) => t.key === activeTab.value)?.label || '')
const currentTabIcon = computed(() => {
  const icons = { todo: '📋', initiated: '📝', processed: '✅', cc: '📨' }
  return icons[activeTab.value] || '📋'
})

onShow(() => {
  if (!getToken()) {
    list.value = []
    tabs.value = tabs.value.map((t) => ({ ...t, count: 0 }))
    return
  }
  loadList()
})

async function switchTab(key) {
  activeTab.value = key
  if (!getToken()) {
    list.value = []
    return
  }
  await loadList()
}

async function loadList() {
  loading.value = true
  try {
    const loaders = {
      todo: flowTodo,
      initiated: flowInitiated,
      processed: flowProcessed,
      cc: flowCc,
    }
    const res = await loaders[activeTab.value]()
    list.value = res.data || []
    // Update todo count
    if (activeTab.value === 'todo') {
      const todoCount = list.value.length
      tabs.value = tabs.value.map((t) =>
        t.key === 'todo' ? { ...t, count: todoCount } : t
      )
    }
  } finally {
    loading.value = false
  }
}

function getStatusText(item) {
  if (item.flowState) return item.flowState
  if (activeTab.value === 'todo') return '待审批'
  if (activeTab.value === 'initiated') return '已发起'
  if (activeTab.value === 'processed') return '已处理'
  if (activeTab.value === 'cc') return '已抄送'
  return '--'
}

function getStatusClass(item) {
  const text = getStatusText(item)
  if (text.includes('通过') || text.includes('完成') || text.includes('已')) return 'tag-success'
  if (text.includes('驳回') || text.includes('拒绝')) return 'tag-error'
  if (text.includes('待') || text.includes('进行') || text.includes('审批')) return 'tag-pending'
  return 'tag-default'
}

function getAvatarText(item) {
  const name = item.creatorName || item.startUserName || 'U'
  return name.slice(0, 1)
}

function openDetail(item) {
  const query = encodeURIComponent(JSON.stringify(item))
  uni.navigateTo({
    url: `/pages/workflow-detail/index?tab=${activeTab.value}&item=${query}`,
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.tabs {
  display: flex;
  background: #fff;
  padding: 16rpx 16rpx;
  gap: 12rpx;
  overflow-x: auto;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.tab-item {
  flex-shrink: 0;
  padding: 16rpx 28rpx;
  border-radius: 32rpx;
  font-size: 28rpx;
  color: #666;
  background: #f2f4f7;
  display: flex;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
}

.tab-item.active {
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  color: #fff;
  font-weight: 600;
}

.tab-label {
  font-size: 28rpx;
}

.tab-badge {
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

.tab-item.active .tab-badge {
  background: rgba(255, 255, 255, 0.3);
}

.list-area {
  padding: 24rpx 32rpx;
}

.workflow-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  line-height: 1.4;
}

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.tag-success {
  background: #e6fffb;
  color: #08979c;
}

.tag-error {
  background: #fff1f0;
  color: #cf1322;
}

.tag-pending {
  background: #fff7e6;
  color: #d46b08;
}

.tag-default {
  background: #f5f5f5;
  color: #666;
}

.card-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.mini-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: 24rpx;
  color: #666;
}

.card-time {
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

.safe-bottom {
  height: 120rpx;
}
</style>