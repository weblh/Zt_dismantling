<template>
  <view class="page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索表单名称"
          placeholder-class="search-placeholder"
          confirm-type="search"
        />
      </view>
    </view>

    <!-- 问候区 -->
    <view class="greeting-bar">
      <view class="greeting-left">
        <text class="hello">你好，{{ userName }}</text>
        <text class="subtitle">选择应用开始填写</text>
      </view>
      <view class="greeting-right" @tap="goMine">
        <view class="avatar">{{ avatarText }}</view>
      </view>
    </view>

    <view v-if="loading" class="state-box">
      <view class="loading-spinner" />
      <text class="state-text">加载中...</text>
    </view>

    <view v-else-if="filteredGroups.length === 0" class="state-box">
      <text class="state-icon">📭</text>
      <text class="state-text">
        {{ keyword ? '未找到匹配的表单' : '暂无可用表单，请联系管理员在平台发布表单' }}
      </text>
    </view>

    <view v-else class="content">
      <!-- 分组显示表单 -->
      <view v-for="group in filteredGroups" :key="group.name" class="group">
        <view class="group-header">
          <view class="group-indicator" />
          <text class="group-title">{{ group.name }}</text>
          <text class="group-count">{{ group.forms.length }}</text>
        </view>
        <view class="form-grid">
          <view
            v-for="form in group.forms"
            :key="form.id"
            class="form-item"
            @tap="openForm(form)"
          >
            <view class="form-icon-wrap" :style="{ background: getIconBg(form.name) }">
              <text class="form-icon">{{ getFormIcon(form.name) }}</text>
            </view>
            <text class="form-name">{{ form.name }}</text>
            <text class="form-action">新增填写</text>
          </view>
        </view>
      </view>
    </view>

    <view class="safe-bottom" />
    <CustomTabBar current="home" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { listForms } from '@/api/platform.js'
import { getToken, getUser } from '@/utils/auth.js'

const loading = ref(false)
const forms = ref([])
const keyword = ref('')

const userName = computed(() => {
  if (!getToken()) return '游客'
  return getUser()?.nickname || getUser()?.username || '用户'
})
const avatarText = computed(() => {
  if (!getToken()) return '?'
  const name = getUser()?.nickname || getUser()?.username || 'U'
  return name.slice(0, 1).toUpperCase()
})

const groups = computed(() => {
  const map = new Map()
  for (const form of forms.value) {
    if (form.status !== 1 && form.status !== undefined && form.status !== null) continue
    const groupName = form.menuGroup || '业务表单'
    if (!map.has(groupName)) map.set(groupName, [])
    map.get(groupName).push(form)
  }
  return Array.from(map.entries())
    .map(([name, list]) => ({
      name,
      forms: list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
})

const filteredGroups = computed(() => {
  if (!keyword.value.trim()) return groups.value
  const kw = keyword.value.trim().toLowerCase()
  return groups.value
    .map((g) => ({
      ...g,
      forms: g.forms.filter((f) => f.name.toLowerCase().includes(kw)),
    }))
    .filter((g) => g.forms.length > 0)
})

onShow(() => {
  loadForms()
})

async function loadForms() {
  loading.value = true
  try {
    const res = await listForms()
    forms.value = res.data || []
  } finally {
    loading.value = false
  }
}

const iconColors = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fad0c4, #ffd1ff)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #ff9a9e, #fecfef)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
]

function getIconBg(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return iconColors[hash % iconColors.length]
}

function getFormIcon(name = '') {
  const icons = ['📦', '🚗', '⚖️', '📸', '🔧', '💰', '📋', '🏭', '📝', '🔍', '📊', '🏷️']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return icons[hash % icons.length]
}

function openForm(form) {
  uni.navigateTo({
    url: `/pages/form-fill/index?formId=${form.id}&name=${encodeURIComponent(form.name)}`,
  })
}

function goMine() {
  uni.reLaunch({ url: '/pages/mine/index' })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

.search-bar {
  background: #fff;
  padding: 20rpx 32rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-box {
  background: #f2f4f7;
  border-radius: 36rpx;
  padding: 16rpx 28rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-icon {
  font-size: 28rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  background: transparent;
  min-height: 40rpx;
}

.search-placeholder {
  color: #bbb;
  font-size: 28rpx;
}

.greeting-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx 16rpx;
}

.greeting-left {
  flex: 1;
}

.hello {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
}

.subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #999;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.state-box {
  text-align: center;
  padding: 120rpx 0;
}

.state-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.state-text {
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

.content {
  padding: 0 32rpx;
}

.group {
  margin-bottom: 40rpx;
}

.group-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  padding-left: 8rpx;
}

.group-indicator {
  width: 8rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #2b7fff, #5b9fff);
  border-radius: 4rpx;
  margin-right: 16rpx;
}

.group-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.group-count {
  font-size: 24rpx;
  color: #999;
  background: #eef2f7;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 16rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.03);
}

.form-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 8rpx;
}

.form-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.form-icon {
  font-size: 44rpx;
}

.form-name {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.form-action {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #2b7fff;
}

.safe-bottom {
  height: 120rpx;
}
</style>