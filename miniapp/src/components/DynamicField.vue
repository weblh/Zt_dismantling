<template>
  <view class="field-wrap" v-if="field.type !== 'subform'">
    <view class="field-label-row">
      <text v-if="field.required" class="required">*</text>
      <text class="field-label">{{ field.label }}</text>
      <text v-if="field.type === 'number' && field.unit" class="field-unit">{{ field.unit }}</text>
    </view>

    <!-- 文本输入 -->
    <input
      v-if="isText"
      class="field-input"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      placeholder-class="input-placeholder"
      @input="onInput"
    />

    <!-- 多行文本 -->
    <textarea
      v-else-if="field.type === 'textarea'"
      class="field-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      placeholder-class="input-placeholder"
      @input="onInput"
      auto-height
    />

    <!-- 数字 -->
    <input
      v-else-if="field.type === 'number'"
      class="field-input"
      type="digit"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      placeholder-class="input-placeholder"
      @input="onInput"
    />

    <!-- 日期 -->
    <picker
      v-else-if="field.type === 'date'"
      mode="date"
      :value="modelValue || ''"
      :disabled="disabled"
      @change="onPickerChange"
    >
      <view class="field-value" :class="{ placeholder: !modelValue }">
        <text>{{ modelValue || placeholder }}</text>
        <text class="arrow">›</text>
      </view>
    </picker>

    <!-- 日期时间 -->
    <picker
      v-else-if="field.type === 'datetime'"
      mode="date"
      :value="datePart"
      :disabled="disabled"
      @change="onDatePartChange"
    >
      <view class="field-value" :class="{ placeholder: !modelValue }">
        <text>{{ modelValue || placeholder }}</text>
        <text class="arrow">›</text>
      </view>
    </picker>

    <!-- 下拉选择 -->
    <picker
      v-else-if="field.type === 'select'"
      mode="selector"
      :range="optionLabels"
      :disabled="disabled"
      @change="onSelectChange"
    >
      <view class="field-value" :class="{ placeholder: !modelValue }">
        <text>{{ displaySelect || placeholder }}</text>
        <text class="arrow">›</text>
      </view>
    </picker>

    <!-- 开关 -->
    <view v-else-if="field.type === 'switch'" class="switch-wrap">
      <text class="switch-label">{{ modelValue ? '是' : '否' }}</text>
      <switch
        :checked="!!modelValue"
        :disabled="disabled"
        color="#2b7fff"
        @change="onSwitchChange"
      />
    </view>

    <!-- 图片上传 -->
    <view v-else-if="field.type === 'image'" class="image-wrap">
      <view class="image-list">
        <view v-for="(img, idx) in imageList" :key="idx" class="image-item">
          <image :src="cosUrl(img)" mode="aspectFill" class="thumb" @tap="previewImage(idx)" />
          <view v-if="!disabled" class="remove-btn" @tap.stop="removeImage(idx)">×</view>
        </view>
        <view v-if="!disabled && imageList.length < 9" class="add-btn" @tap="chooseImage">
          <text class="add-icon">+</text>
          <text class="add-text">拍照/相册</text>
        </view>
      </view>
    </view>

    <!-- 默认：文本 -->
    <input
      v-else
      class="field-input"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      placeholder-class="input-placeholder"
      @input="onInput"
    />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { cosUrl } from '@/config/index'

const props = defineProps({
  field: { type: Object, required: true },
  modelValue: { type: [String, Number, Boolean, Array, Object], default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const placeholder = computed(() => `请填写${props.field.label}`)
const isText = computed(() => !props.field.type || props.field.type === 'text')

const optionLabels = computed(() =>
  (props.field.options || []).map((o) => {
    if (typeof o === 'string') return o
    return o.label || o.text || o.name || String(o.value ?? '')
  }),
)

const displaySelect = computed(() => {
  if (!props.modelValue) return ''
  const idx = optionLabels.value.indexOf(props.modelValue)
  return idx >= 0 ? optionLabels.value[idx] : String(props.modelValue)
})

const datePart = computed(() => {
  if (!props.modelValue) return ''
  return String(props.modelValue).slice(0, 10)
})

const imageList = computed(() => {
  if (Array.isArray(props.modelValue)) return props.modelValue
  if (typeof props.modelValue === 'string' && props.modelValue) return [props.modelValue]
  return []
})

function onInput(e) {
  emit('update:modelValue', e.detail.value)
}

function onPickerChange(e) {
  emit('update:modelValue', e.detail.value)
}

function onDatePartChange(e) {
  const time = props.modelValue && String(props.modelValue).length > 10
    ? String(props.modelValue).slice(11)
    : '00:00'
  emit('update:modelValue', `${e.detail.value} ${time}`)
}

function onSelectChange(e) {
  const idx = Number(e.detail.value)
  emit('update:modelValue', optionLabels.value[idx] || '')
}

function onSwitchChange(e) {
  emit('update:modelValue', e.detail.value)
}

function chooseImage() {
  uni.chooseImage({
    count: 9 - imageList.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      emit('update:modelValue', [...imageList.value, ...res.tempFilePaths])
    },
  })
}

function removeImage(idx) {
  const next = imageList.value.filter((_, i) => i !== idx)
  emit('update:modelValue', next)
}

function previewImage(idx) {
  const urls = imageList.value.map((img) => cosUrl(img))
  uni.previewImage({
    current: urls[idx],
    urls,
  })
}
</script>

<style scoped>
.field-wrap {
  margin-bottom: 32rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
}

.field-label-row {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.required {
  color: #ff4d4f;
  margin-right: 6rpx;
  font-size: 28rpx;
}

.field-label {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  flex: 1;
}

.field-unit {
  font-size: 24rpx;
  color: #999;
  background: #f2f4f7;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1a1a1a;
  background: transparent;
  padding: 8rpx 0;
}

.field-textarea {
  width: 100%;
  box-sizing: border-box;
  font-size: 30rpx;
  color: #1a1a1a;
  background: transparent;
  min-height: 120rpx;
  padding: 8rpx 0;
}

.input-placeholder {
  color: #bbb;
  font-size: 30rpx;
}

.field-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
  font-size: 30rpx;
  color: #1a1a1a;
}

.field-value.placeholder {
  color: #bbb;
}

.arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: bold;
}

.switch-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.switch-label {
  font-size: 28rpx;
  color: #333;
}

.image-wrap {
  padding: 8rpx 0;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  position: relative;
  overflow: hidden;
}

.thumb {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-bottom-left-radius: 16rpx;
  text-align: center;
  line-height: 36rpx;
  font-size: 28rpx;
}

.add-btn {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx dashed #d0d5dd;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafbfc;
}

.add-icon {
  font-size: 48rpx;
  color: #bbb;
  line-height: 1;
}

.add-text {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}
</style>