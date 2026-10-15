<template>
  <view class="tabbar">
    <view
      v-for="item in tabs"
      :key="item.path"
      class="tab-item"
      :class="{ active: current === item.key }"
      @tap="switchTab(item)"
    >
      <view class="icon-wrap" :class="{ active: current === item.key }">
        <text class="icon">{{ item.icon }}</text>
      </view>
      <text class="text" :class="{ active: current === item.key }">{{ item.text }}</text>
      <text v-if="item.badge > 0" class="badge">{{ item.badge > 99 ? '99+' : item.badge }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  current: { type: String, default: 'home' },
})

const tabs = ref([
  { key: 'home', text: '应用', icon: '🏠', path: '/pages/home/index', badge: 0 },
  { key: 'workflow', text: '流程', icon: '📋', path: '/pages/workflow/index', badge: 0 },
  { key: 'mine', text: '我的', icon: '👤', path: '/pages/mine/index', badge: 0 },
])

function switchTab(item) {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  const targetRoute = item.path.replace(/^\//, '')
  if (current === targetRoute) return
  uni.reLaunch({ url: item.path })
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 120rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  z-index: 99;
  box-shadow: 0 -2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  position: relative;
  gap: 4rpx;
}

.icon-wrap {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-wrap.active {
  background: linear-gradient(135deg, rgba(43, 127, 255, 0.1), rgba(91, 159, 255, 0.1));
}

.icon {
  font-size: 40rpx;
}

.text {
  font-size: 22rpx;
  color: #999;
  transition: color 0.2s;
}

.text.active {
  color: #2b7fff;
  font-weight: 600;
}

.tab-item.active {
  color: #2b7fff;
}

.badge {
  position: absolute;
  top: 6rpx;
  right: calc(50% - 60rpx);
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  min-width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  text-align: center;
  border-radius: 14rpx;
  padding: 0 6rpx;
}
</style>