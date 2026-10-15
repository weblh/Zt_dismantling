<script>
export default {
  onLaunch() {
    // Check login status
    const token = uni.getStorageSync('zt_token')
    if (token) {
      // Already logged in, will be handled by individual pages
    }
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  },
}
</script>

<style>
page {
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

view, text {
  box-sizing: border-box;
}

button::after {
  border: none;
}

image {
  display: block;
}

/* Common utility classes */
.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-1 {
  flex: 1;
}

.text-center {
  text-align: center;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Loading spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Safe area */
.safe-bottom {
  height: calc(120rpx + env(safe-area-inset-bottom));
}
</style>