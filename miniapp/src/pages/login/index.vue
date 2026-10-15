<template>
  <view class="page">
    <view class="header">
      <view class="logo-wrap">
        <text class="logo-icon">🏭</text>
      </view>
      <text class="app-name">攒碳移动办公</text>
      <text class="app-desc">钉钉通讯录账号 · 手机号激活后可授权微信直登</text>
    </view>

    <view class="login-card">
      <view class="mode-tabs">
        <view
          class="mode-tab"
          :class="{ active: mode === 'login' }"
          @tap="mode = 'login'"
        >
          登录
        </view>
        <view
          class="mode-tab"
          :class="{ active: mode === 'activate' }"
          @tap="mode = 'activate'"
        >
          首次激活
        </view>
      </view>

      <view class="form-area">
        <view class="field-row">
          <text class="field-label">{{ mode === 'activate' ? '手机号' : '账号' }}</text>
          <input
            v-model="account"
            class="field-input"
            maxlength="64"
            :placeholder="mode === 'activate' ? '钉钉通讯录中的手机号' : '用户名或手机号'"
            placeholder-class="field-placeholder"
          />
        </view>
        <view class="field-row">
          <text class="field-label">密码</text>
          <input
            v-model="password"
            class="field-input"
            password
            :placeholder="mode === 'activate' ? '设置登录密码（至少6位）' : '登录密码'"
            placeholder-class="field-placeholder"
          />
        </view>
        <view v-if="mode === 'activate'" class="field-row">
          <text class="field-label">确认密码</text>
          <input
            v-model="password2"
            class="field-input"
            password
            placeholder="再次输入密码"
            placeholder-class="field-placeholder"
          />
        </view>
      </view>

      <button
        class="btn-login"
        :loading="loading"
        :disabled="!canSubmit"
        @tap="handleSubmit"
      >
        {{ mode === 'activate' ? '激活并登录' : '登 录' }}
      </button>

      <view class="hint">
        {{
          mode === 'activate'
            ? '仅组织内已同步钉钉的手机号可激活。激活后请到「我的」绑定微信，下次可一键登录。'
            : '已激活过？直接登录。未设置过密码请点「首次激活」。登录后可在「我的」授权绑定微信。'
        }}
      </view>

      <view class="third-party">
        <view class="divider-line">
          <text class="divider-text">其他登录方式</text>
        </view>
        <!-- #ifdef MP-WEIXIN -->
        <view class="wechat-btn" :class="{ loading: wxLoading }" @tap="handleWechatLogin">
          <text class="wechat-icon">💬</text>
          <text class="wechat-text">微信一键登录</text>
        </view>
        <!-- #endif -->
      </view>
    </view>

    <view class="footer-tip">
      <text class="tip-text">登录即代表同意</text>
      <text class="tip-link">《用户协议》</text>
      <text class="tip-text">和</text>
      <text class="tip-link">《隐私政策》</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { activateByPhone, bindWechat, loginByPhone, loginByWechat } from '@/api/auth.js'
import { getToken, setAuth } from '@/utils/auth.js'

const mode = ref('login')
const account = ref('')
const password = ref('')
const password2 = ref('')
const loading = ref(false)
const wxLoading = ref(false)
const autoTried = ref(false)

const canSubmit = computed(() => {
  const a = account.value.trim()
  if (mode.value === 'activate') {
    if (!/^1\d{10}$/.test(a)) return false
    if (password.value.length < 6) return false
    return password.value === password2.value
  }
  if (a.length < 2) return false
  return password.value.length >= 6
})

onShow(() => {
  if (getToken()) {
    uni.reLaunch({ url: '/pages/home/index' })
    return
  }
  if (!autoTried.value) {
    autoTried.value = true
    trySilentWechatLogin()
  }
})

function goHome(res) {
  setAuth(res.data.token, res.data.user)
  uni.showToast({ title: '登录成功', icon: 'success' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/home/index' })
  }, 400)
}

function afterLogin(res) {
  goHome(res)
  // #ifdef MP-WEIXIN
  // 登录成功后尝试静默绑定；失败可到「我的」手动绑定
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      if (!loginRes.code) return
      try {
        await bindWechat(loginRes.code, account.value.trim(), password.value)
      } catch {
        // ignore
      }
    },
  })
  // #endif
}

async function handleSubmit() {
  if (!canSubmit.value) {
    if (mode.value === 'activate' && password.value !== password2.value) {
      uni.showToast({ title: '两次密码不一致', icon: 'none' })
      return
    }
    uni.showToast({ title: mode.value === 'activate' ? '请填写手机号和密码' : '请输入账号和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const phone = account.value.trim()
    const res =
      mode.value === 'activate'
        ? await activateByPhone(phone, password.value)
        : await loginByPhone(phone, password.value)
    afterLogin(res)
  } finally {
    loading.value = false
  }
}

function trySilentWechatLogin() {
  // #ifdef MP-WEIXIN
  wxLoading.value = true
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      try {
        const res = await loginByWechat(loginRes.code)
        goHome(res)
      } catch {
        // 未绑定则留在登录页
      } finally {
        wxLoading.value = false
      }
    },
    fail: () => {
      wxLoading.value = false
    },
  })
  // #endif
}

function handleWechatLogin() {
  wxLoading.value = true
  uni.login({
    provider: 'weixin',
    success: async (loginRes) => {
      try {
        const res = await loginByWechat(loginRes.code)
        goHome(res)
      } catch (e) {
        const msg = String(e.message || e.errMsg || '')
        if (msg.includes('未绑定') || msg.includes('绑定')) {
          promptBind(loginRes.code)
        } else if (msg.includes('invalid code') || msg.includes('code 无效')) {
          uni.showModal({
            title: '微信授权失败',
            content:
              '请确认非游客模式且 AppID 正确；也可先「首次激活」或账号密码登录，再到「我的」绑定微信。',
            showCancel: false,
          })
        } else {
          uni.showToast({ title: msg || '微信登录失败', icon: 'none', duration: 3000 })
        }
      } finally {
        wxLoading.value = false
      }
    },
    fail: () => {
      wxLoading.value = false
      uni.showToast({ title: '微信授权失败', icon: 'none' })
    },
  })
}

function promptBind(code) {
  uni.showModal({
    title: '绑定系统账号',
    content:
      '请先在上方填写手机号和密码（未设密请切到「首次激活」），再点确定完成微信绑定。',
    confirmText: '去绑定',
    success: async (modalRes) => {
      if (!modalRes.confirm) return
      if (mode.value === 'activate') {
        if (!canSubmit.value) {
          uni.showToast({ title: '请先完成激活表单', icon: 'none' })
          return
        }
        wxLoading.value = true
        try {
          await activateByPhone(account.value.trim(), password.value)
          const res = await bindWechat(code, account.value.trim(), password.value)
          goHome(res)
        } finally {
          wxLoading.value = false
        }
        return
      }
      if (!canSubmit.value) {
        uni.showToast({ title: '请先填写账号和密码', icon: 'none' })
        return
      }
      wxLoading.value = true
      try {
        const res = await bindWechat(code, account.value.trim(), password.value)
        goHome(res)
      } finally {
        wxLoading.value = false
      }
    },
  })
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 100rpx 48rpx 40rpx;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 64rpx;
}

.logo-wrap {
  width: 140rpx;
  height: 140rpx;
  margin: 0 auto 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(43, 127, 255, 0.25);
}

.logo-icon {
  font-size: 64rpx;
}

.app-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 2rpx;
}

.app-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #999;
}

.login-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 40rpx 48rpx;
  box-shadow: 0 4rpx 32rpx rgba(0, 0, 0, 0.04);
}

.mode-tabs {
  display: flex;
  background: #f5f7fa;
  border-radius: 16rpx;
  padding: 6rpx;
  margin-bottom: 32rpx;
}

.mode-tab {
  flex: 1;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  padding: 18rpx 0;
  border-radius: 12rpx;
}

.mode-tab.active {
  background: #fff;
  color: #2b7fff;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.form-area {
  margin-bottom: 24rpx;
}

.field-row {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.field-label {
  width: 140rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #333;
}

.field-input {
  flex: 1;
  font-size: 30rpx;
  color: #1a1a1a;
  background: transparent;
}

.field-placeholder {
  color: #bbb;
  font-size: 28rpx;
}

.btn-login {
  width: 100%;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #2b7fff, #5b9fff);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  margin-top: 16rpx;
  box-shadow: 0 8rpx 24rpx rgba(43, 127, 255, 0.25);
}

.btn-login:disabled {
  background: #d0d0d0;
  box-shadow: none;
}

.hint {
  margin-top: 20rpx;
  font-size: 22rpx;
  color: #999;
  line-height: 1.5;
  text-align: center;
}

.third-party {
  margin-top: 40rpx;
}

.divider-line {
  position: relative;
  text-align: center;
  margin-bottom: 32rpx;
}

.divider-line::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1rpx;
  background: #f0f0f0;
}

.divider-text {
  position: relative;
  padding: 0 24rpx;
  background: #fff;
  font-size: 24rpx;
  color: #999;
}

.wechat-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  background: #f7f7f7;
  border-radius: 44rpx;
  margin: 0 auto;
  width: 320rpx;
}

.wechat-icon {
  font-size: 36rpx;
}

.wechat-text {
  font-size: 28rpx;
  color: #333;
}

.wechat-btn.loading {
  opacity: 0.7;
}

.footer-tip {
  position: fixed;
  bottom: 80rpx;
  left: 0;
  right: 0;
  text-align: center;
}

.tip-text {
  font-size: 22rpx;
  color: #bbb;
}

.tip-link {
  font-size: 22rpx;
  color: #2b7fff;
}
</style>
