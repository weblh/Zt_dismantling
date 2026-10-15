<template>
  <view class="page">
    <!-- 个人信息卡：未登录时点击进入登录 -->
    <view class="profile-card">
      <view class="profile-bg" />
      <view class="profile-content" @tap="handleProfileTap">
        <view class="avatar">{{ avatarText }}</view>
        <view class="info">
          <text class="name">{{ displayName }}</text>
          <view class="role-badge">
            <text>{{ loggedIn ? roleText : '点击登录' }}</text>
          </view>
        </view>
        <view class="arrow">›</view>
      </view>
    </view>

    <!-- 快捷功能 -->
    <view class="section-card">
      <view class="section-header">
        <view class="section-indicator" />
        <text class="section-title">快捷功能</text>
      </view>
      <view class="quick-grid">
        <view class="quick-item" @tap="goWorkflow('todo')">
          <view class="quick-icon" style="background: linear-gradient(135deg, #fff7e6, #ffe7ba); color: #d46b08;">📋</view>
          <text class="quick-label">待办流程</text>
        </view>
        <view class="quick-item" @tap="goWorkflow('initiated')">
          <view class="quick-icon" style="background: linear-gradient(135deg, #e6f7ff, #bae7ff); color: #096dd9;">📝</view>
          <text class="quick-label">我发起的</text>
        </view>
        <view class="quick-item" @tap="goHome">
          <view class="quick-icon" style="background: linear-gradient(135deg, #f6ffed, #d9f7be); color: #389e0d;">📄</view>
          <text class="quick-label">新建表单</text>
        </view>
        <view class="quick-item" @tap="goWorkflow('processed')">
          <view class="quick-icon" style="background: linear-gradient(135deg, #fff1f0, #ffccc7); color: #cf1322;">✅</view>
          <text class="quick-label">已处理</text>
        </view>
      </view>
    </view>

    <!-- 账号信息（仅登录后展示） -->
    <view v-if="loggedIn" class="section-card">
      <view class="section-header">
        <view class="section-indicator" />
        <text class="section-title">账号信息</text>
      </view>
      <view class="info-list">
        <view class="info-row">
          <text class="info-label">账号</text>
          <text class="info-value">{{ user?.username || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">部门</text>
          <text class="info-value">{{ user?.department || '未设置' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">角色</text>
          <text class="info-value">{{ roleText }}</text>
        </view>
        <view class="info-row" @tap="handleBindWechat">
          <text class="info-label">微信绑定</text>
          <text class="info-value" :class="{ arrow: !wechatBound, bound: wechatBound }">
            {{ wechatBound ? '已绑定' : '点击绑定 ›' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 设置列表 -->
    <view class="section-card">
      <view class="section-header">
        <view class="section-indicator" />
        <text class="section-title">设置</text>
      </view>
      <view class="info-list">
        <view class="info-row" @tap="showToast('功能开发中')">
          <text class="info-label">🔔 消息通知</text>
          <text class="info-value arrow">›</text>
        </view>
        <view class="info-row" @tap="showToast('功能开发中')">
          <text class="info-label">🌙 深色模式</text>
          <text class="info-value arrow">›</text>
        </view>
        <view class="info-row" @tap="showToast('功能开发中')">
          <text class="info-label">💬 意见反馈</text>
          <text class="info-value arrow">›</text>
        </view>
        <view class="info-row" @tap="showToast('功能开发中')">
          <text class="info-label">📖 关于我们</text>
          <text class="info-value arrow small">v1.0.0</text>
        </view>
      </view>
    </view>

    <button v-if="loggedIn" class="logout-btn" @tap="handleLogout">
      <text class="logout-icon">🚪</text>
      <text>退出登录</text>
    </button>

    <view class="safe-bottom" />
    <CustomTabBar current="mine" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import CustomTabBar from '@/components/CustomTabBar.vue'
import { bindWechatCurrent } from '@/api/auth.js'
import { clearAuth, getToken, getUser, setAuth } from '@/utils/auth.js'

const user = ref(getUser())
const loggedIn = ref(!!getToken())
const binding = ref(false)

const displayName = computed(() => {
  if (!loggedIn.value) return '未登录'
  return user.value?.nickname || user.value?.username || '用户'
})

const avatarText = computed(() => {
  if (!loggedIn.value) return '?'
  const name = user.value?.nickname || user.value?.username || 'U'
  return name.slice(0, 1).toUpperCase()
})

const roleText = computed(() => {
  const role = user.value?.role
  if (role === 'SUPER_ADMIN') return '超级管理员'
  if (role === 'ADMIN') return '管理员'
  return '普通用户'
})

const wechatBound = computed(() => !!user.value?.wechatBound)

onShow(() => {
  loggedIn.value = !!getToken()
  user.value = loggedIn.value ? getUser() : null
})

function handleProfileTap() {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
  }
}

function goHome() {
  uni.reLaunch({ url: '/pages/home/index' })
}

function goWorkflow(tab) {
  uni.reLaunch({ url: '/pages/workflow/index' })
}

function showToast(title) {
  uni.showToast({ title, icon: 'none' })
}

function handleBindWechat() {
  if (!getToken()) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  if (wechatBound.value) {
    uni.showToast({ title: '当前账号已绑定微信', icon: 'none' })
    return
  }
  if (binding.value) return
  // #ifdef MP-WEIXIN
  binding.value = true
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      try {
        if (!loginRes.code) {
          uni.showToast({ title: '微信授权失败', icon: 'none' })
          return
        }
        const res = await bindWechatCurrent(loginRes.code)
        setAuth(res.data.token, res.data.user)
        user.value = res.data.user
        uni.showToast({ title: '微信绑定成功', icon: 'success' })
      } catch (e) {
        // request 已 toast
      } finally {
        binding.value = false
      }
    },
    fail: () => {
      binding.value = false
      uni.showToast({ title: '微信授权失败', icon: 'none' })
    },
  })
  // #endif
  // #ifndef MP-WEIXIN
  uni.showToast({ title: '请在微信小程序中绑定', icon: 'none' })
  // #endif
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    confirmColor: '#ff4d4f',
    success(res) {
      if (res.confirm) {
        clearAuth()
        loggedIn.value = false
        user.value = null
        uni.reLaunch({ url: '/pages/home/index' })
      }
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 140rpx;
}

.profile-card {
  position: relative;
  margin: 24rpx 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  box-shadow: 0 12rpx 40rpx rgba(43, 127, 255, 0.25);
}

.profile-bg {
  position: absolute;
  top: 0;
  right: 0;
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0 0 0 200rpx;
}

.profile-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 40rpx 32rpx;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 48rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12rpx;
}

.role-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 36rpx;
  flex-shrink: 0;
}

.section-card {
  background: #fff;
  margin: 24rpx 32rpx;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.03);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-indicator {
  width: 8rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #2b7fff, #5b9fff);
  border-radius: 4rpx;
  margin-right: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx 16rpx;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.quick-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.quick-label {
  font-size: 24rpx;
  color: #666;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #333;
}

.info-value {
  font-size: 26rpx;
  color: #666;
}

.info-value.arrow {
  color: #ccc;
  font-size: 32rpx;
}

.info-value.bound {
  color: #52c41a;
}

.info-value.arrow.small {
  font-size: 24rpx;
  color: #999;
}

.logout-btn {
  margin: 48rpx 32rpx 0;
  background: #fff;
  color: #ff4d4f;
  border: 1rpx solid #ffd6d6;
  border-radius: 24rpx;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.logout-icon {
  font-size: 32rpx;
}

.safe-bottom {
  height: 120rpx;
}
</style>