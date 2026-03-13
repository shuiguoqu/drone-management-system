<template>
  <a-modal
    :title="isEdit ? '编辑无人机' : '新增无人机'"
    :visible="visible"
    :confirmLoading="submitting"
    @ok="handleSubmit"
    @cancel="handleCancel"
    width="600px"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
    >
      <a-form-item label="无人机编号" name="droneCode">
        <a-input
          v-model:value="formState.droneCode"
          placeholder="请输入无人机编号"
          :disabled="isEdit"
        />
      </a-form-item>

      <a-form-item label="名称" name="name">
        <a-input
          v-model:value="formState.name"
          placeholder="请输入无人机名称"
        />
      </a-form-item>

      <a-form-item label="机型" name="model">
        <a-select
          v-model:value="formState.model"
          placeholder="请选择机型"
        >
          <a-select-option value="DJI Mavic 3 Enterprise">DJI Mavic 3 Enterprise</a-select-option>
          <a-select-option value="DJI Phantom 4 RTK">DJI Phantom 4 RTK</a-select-option>
          <a-select-option value="DJI Matrice 30T">DJI Matrice 30T</a-select-option>
          <a-select-option value="DJI Matrice 350 RTK">DJI Matrice 350 RTK</a-select-option>
          <a-select-option value="DJI Air 3">DJI Air 3</a-select-option>
          <a-select-option value="DJI Mini 4 Pro">DJI Mini 4 Pro</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="状态" name="status">
        <a-select
          v-model:value="formState.status"
          placeholder="请选择状态"
        >
          <a-select-option value="idle">待机</a-select-option>
          <a-select-option value="flying">飞行中</a-select-option>
          <a-select-option value="charging">充电中</a-select-option>
          <a-select-option value="maintenance">维护中</a-select-option>
          <a-select-option value="offline">离线</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="电量" name="batteryLevel">
        <a-slider
          v-model:value="formState.batteryLevel"
          :min="0"
          :max="100"
          :marks="{ 0: '0%', 50: '50%', 100: '100%' }"
        />
      </a-form-item>

      <a-form-item label="备注" name="remark">
        <a-textarea
          v-model:value="formState.remark"
          placeholder="请输入备注信息"
          :rows="3"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { createDrone, updateDrone } from '../api/drone'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  drone: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref()
const submitting = ref(false)

const isEdit = computed(() => !!props.drone)

const formState = reactive({
  droneCode: '',
  name: '',
  model: undefined,
  status: 'idle',
  batteryLevel: 100,
  remark: ''
})

const rules = {
  droneCode: [
    { required: true, message: '请输入无人机编号', trigger: 'blur' },
    { max: 50, message: '编号不能超过50个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { max: 100, message: '名称不能超过100个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请选择机型', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

watch(
  () => props.drone,
  (newDrone) => {
    if (newDrone) {
      formState.droneCode = newDrone.droneCode
      formState.name = newDrone.name
      formState.model = newDrone.model
      formState.status = newDrone.status
      formState.batteryLevel = newDrone.batteryLevel
      formState.remark = newDrone.remark || ''
    } else {
      formState.droneCode = ''
      formState.name = ''
      formState.model = undefined
      formState.status = 'idle'
      formState.batteryLevel = 100
      formState.remark = ''
    }
  },
  { immediate: true }
)

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    const data = {
      droneCode: formState.droneCode,
      name: formState.name,
      model: formState.model,
      status: formState.status,
      batteryLevel: formState.batteryLevel,
      remark: formState.remark
    }
    
    if (isEdit.value) {
      const res = await updateDrone(props.drone.id, {
        name: data.name,
        model: data.model,
        status: data.status,
        batteryLevel: data.batteryLevel,
        remark: data.remark
      })
      if (res.success) {
        message.success('更新成功')
        emit('success')
      } else {
        message.error(res.message || '更新失败')
      }
    } else {
      const res = await createDrone(data)
      if (res.success) {
        message.success('创建成功')
        emit('success')
      } else {
        message.error(res.message || '创建失败')
      }
    }
  } catch (error) {
    if (error.response) {
      message.error(error.response.data?.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  formRef.value?.resetFields()
  emit('update:visible', false)
}
</script>
