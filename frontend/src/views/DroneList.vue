<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-title">
        <h2>无人机管理</h2>
        <p>管理您的无人机设备，查看实时状态</p>
      </div>
      <a-button type="primary" size="large" @click="handleAdd">
        <PlusOutlined />
        新增无人机
      </a-button>
    </div>

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="4" v-for="stat in statistics" :key="stat.key">
        <a-card class="stat-card" :class="stat.key">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 筛选和搜索 -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="搜索">
          <a-input
            v-model:value="filterForm.keyword"
            placeholder="编号/名称/机型"
            allowClear
            @pressEnter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="filterForm.status"
            placeholder="全部状态"
            allowClear
            style="width: 140px"
            @change="handleSearch"
          >
            <a-select-option value="idle">待机</a-select-option>
            <a-select-option value="flying">飞行中</a-select-option>
            <a-select-option value="charging">充电中</a-select-option>
            <a-select-option value="maintenance">维护中</a-select-option>
            <a-select-option value="offline">离线</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" @click="handleSearch">
            <SearchOutlined />
            查询
          </a-button>
          <a-button style="margin-left: 8px" @click="handleReset">
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 数据表格 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="droneList"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <!-- 状态列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'batteryLevel'">
            <a-progress
              :percent="record.batteryLevel"
              :stroke-color="getBatteryColor(record.batteryLevel)"
              size="small"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button class="action-btn" type="link" @click="handleEdit(record)">
                <EditOutlined />
                编辑
              </a-button>
              <a-popconfirm
                title="确定要删除这个无人机吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record)"
              >
                <a-button class="action-btn" type="link" danger>
                  <DeleteOutlined />
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <a-empty description="暂无无人机数据">
            <a-button type="primary" @click="handleAdd">
              <PlusOutlined />
              添加第一台无人机
            </a-button>
          </a-empty>
        </template>
      </a-table>
    </a-card>

    <!-- 新增/编辑弹窗 -->
    <DroneModal
      v-model:visible="modalVisible"
      :drone="currentDrone"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import { getDrones, deleteDrone } from '../api/drone'
import DroneModal from '../components/DroneModal.vue'

const loading = ref(false)
const droneList = ref([])
const modalVisible = ref(false)
const currentDrone = ref(null)

const filterForm = reactive({
  keyword: '',
  status: undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`
})

const statistics = computed(() => {
  const stats = {
    total: droneList.value.length,
    idle: 0,
    flying: 0,
    charging: 0,
    maintenance: 0,
    offline: 0
  }
  droneList.value.forEach(drone => {
    if (stats[drone.status] !== undefined) {
      stats[drone.status]++
    }
  })
  return [
    { key: 'total', label: '全部', value: stats.total },
    { key: 'idle', label: '待机', value: stats.idle },
    { key: 'flying', label: '飞行中', value: stats.flying },
    { key: 'charging', label: '充电中', value: stats.charging },
    { key: 'maintenance', label: '维护中', value: stats.maintenance },
    { key: 'offline', label: '离线', value: stats.offline }
  ]
})

const columns = [
  { title: '编号', dataIndex: 'droneCode', key: 'droneCode', width: 120 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '机型', dataIndex: 'model', key: 'model', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '电量', dataIndex: 'batteryLevel', key: 'batteryLevel', width: 150 },
  { title: '最近心跳', dataIndex: 'lastHeartbeatAt', key: 'lastHeartbeatAt', width: 180 },
  { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
  { title: '操作', key: 'action', width: 220, fixed: 'right' }
]

const getStatusColor = (status) => {
  const colors = {
    idle: 'green',
    flying: 'blue',
    charging: 'orange',
    maintenance: 'purple',
    offline: 'default'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    idle: '待机',
    flying: '飞行中',
    charging: '充电中',
    maintenance: '维护中',
    offline: '离线'
  }
  return texts[status] || status
}

const getBatteryColor = (level) => {
  if (level > 60) return '#52c41a'
  if (level > 20) return '#faad14'
  return '#ff4d4f'
}

const fetchDrones = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined
    }
    const res = await getDrones(params)
    if (res.success) {
      droneList.value = res.data.list
      pagination.total = res.data.pagination.total
    } else {
      message.error(res.message || '获取数据失败')
    }
  } catch (error) {
    message.error(error.response?.data?.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  fetchDrones()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.status = undefined
  pagination.current = 1
  fetchDrones()
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchDrones()
}

const handleAdd = () => {
  currentDrone.value = null
  modalVisible.value = true
}

const handleEdit = (record) => {
  currentDrone.value = record
  modalVisible.value = true
}

const handleDelete = async (record) => {
  try {
    const res = await deleteDrone(record.id)
    if (res.success) {
      message.success('删除成功')
      fetchDrones()
    } else {
      message.error(res.message || '删除失败')
    }
  } catch (error) {
    message.error(error.response?.data?.message || '删除失败')
  }
}

const handleModalSuccess = () => {
  modalVisible.value = false
  fetchDrones()
}

onMounted(() => {
  fetchDrones()
})
</script>

<style scoped>
.page-container {
  padding: 0 24px;
  max-width: 1280px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-title h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-title p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

:deep(.ant-tag) {
  font-size: 13px;
  padding: 2px 8px;
}

:deep(.action-btn.ant-btn-link) {
  padding: 0 4px;
}
</style>
