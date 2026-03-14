<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-title">
        <h2>飞行记录</h2>
        <p>查看和管理无人机飞行历史记录</p>
      </div>
    </div>

    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="无人机名称">
          <a-input
            v-model:value="filterForm.droneName"
            placeholder="请输入无人机名称"
            allowClear
            style="width: 200px"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="起飞时间">
          <a-range-picker
            v-model:value="filterForm.dateRange"
            :placeholder="['开始日期', '结束日期']"
            style="width: 260px"
            format="YYYY-MM-DD"
          />
        </a-form-item>
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              <SearchOutlined />
              查询
            </a-button>
            <a-button @click="handleReset">
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="paginatedData"
        :loading="loading"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'droneName'">
            <div class="drone-name">
              <RocketOutlined class="drone-icon" />
              <span>{{ record.droneName }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'takeoffTime'">
            <div class="time-cell">
              <CalendarOutlined class="time-icon" />
              <span>{{ record.takeoffTime }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'landingTime'">
            <div class="time-cell">
              <CalendarOutlined class="time-icon" />
              <span>{{ record.landingTime }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'flightDuration'">
            <a-tag color="blue">
              <ClockCircleOutlined />
              {{ formatDuration(record.flightDuration) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'flightDistance'">
            <span class="distance">{{ record.flightDistance.toFixed(2) }} km</span>
          </template>
          <template v-else-if="column.key === 'maxAltitude'">
            <span class="altitude">
              <ArrowUpOutlined class="altitude-icon" />
              {{ record.maxAltitude }} m
            </span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
        </template>

        <template #emptyText>
          <a-empty description="暂无飞行记录" />
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  SearchOutlined,
  RocketOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined
} from '@ant-design/icons-vue'

const loading = ref(false)

const filterForm = reactive({
  droneName: '',
  dateRange: null
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条记录`
})

const mockFlightRecords = [
  {
    id: 1,
    droneName: 'DJI Mavic 3 Pro',
    takeoffTime: '2024-01-15 09:30:00',
    landingTime: '2024-01-15 10:45:00',
    flightDuration: 75,
    flightDistance: 12.5,
    maxAltitude: 350,
    status: 'completed'
  },
  {
    id: 2,
    droneName: 'DJI Air 2S',
    takeoffTime: '2024-01-15 14:20:00',
    landingTime: '2024-01-15 15:05:00',
    flightDuration: 45,
    flightDistance: 8.2,
    maxAltitude: 280,
    status: 'completed'
  },
  {
    id: 3,
    droneName: 'DJI Mini 3 Pro',
    takeoffTime: '2024-01-16 08:00:00',
    landingTime: '2024-01-16 08:35:00',
    flightDuration: 35,
    flightDistance: 5.8,
    maxAltitude: 150,
    status: 'completed'
  },
  {
    id: 4,
    droneName: 'DJI Mavic 3 Pro',
    takeoffTime: '2024-01-17 11:15:00',
    landingTime: '2024-01-17 12:30:00',
    flightDuration: 75,
    flightDistance: 15.3,
    maxAltitude: 420,
    status: 'completed'
  },
  {
    id: 5,
    droneName: 'DJI Air 2S',
    takeoffTime: '2024-01-18 16:45:00',
    landingTime: '2024-01-18 17:20:00',
    flightDuration: 35,
    flightDistance: 6.1,
    maxAltitude: 200,
    status: 'aborted'
  },
  {
    id: 6,
    droneName: 'DJI Inspire 3',
    takeoffTime: '2024-01-19 07:30:00',
    landingTime: '2024-01-19 08:45:00',
    flightDuration: 75,
    flightDistance: 18.7,
    maxAltitude: 500,
    status: 'completed'
  },
  {
    id: 7,
    droneName: 'DJI Mini 3 Pro',
    takeoffTime: '2024-01-20 10:00:00',
    landingTime: '2024-01-20 10:25:00',
    flightDuration: 25,
    flightDistance: 4.2,
    maxAltitude: 120,
    status: 'completed'
  },
  {
    id: 8,
    droneName: 'DJI Mavic 3 Pro',
    takeoffTime: '2024-01-21 15:30:00',
    landingTime: '2024-01-21 16:50:00',
    flightDuration: 80,
    flightDistance: 14.8,
    maxAltitude: 380,
    status: 'completed'
  },
  {
    id: 9,
    droneName: 'DJI Air 2S',
    takeoffTime: '2024-01-22 09:00:00',
    landingTime: '2024-01-22 09:40:00',
    flightDuration: 40,
    flightDistance: 7.5,
    maxAltitude: 250,
    status: 'completed'
  },
  {
    id: 10,
    droneName: 'DJI Inspire 3',
    takeoffTime: '2024-01-23 13:00:00',
    landingTime: '2024-01-23 14:15:00',
    flightDuration: 75,
    flightDistance: 20.1,
    maxAltitude: 450,
    status: 'completed'
  },
  {
    id: 11,
    droneName: 'DJI Mini 3 Pro',
    takeoffTime: '2024-01-24 17:00:00',
    landingTime: '2024-01-24 17:30:00',
    flightDuration: 30,
    flightDistance: 3.8,
    maxAltitude: 100,
    status: 'aborted'
  },
  {
    id: 12,
    droneName: 'DJI Mavic 3 Pro',
    takeoffTime: '2024-01-25 08:30:00',
    landingTime: '2024-01-25 09:55:00',
    flightDuration: 85,
    flightDistance: 16.2,
    maxAltitude: 400,
    status: 'completed'
  },
  {
    id: 13,
    droneName: 'DJI Air 2S',
    takeoffTime: '2024-01-26 11:00:00',
    landingTime: '2024-01-26 11:35:00',
    flightDuration: 35,
    flightDistance: 6.8,
    maxAltitude: 220,
    status: 'completed'
  },
  {
    id: 14,
    droneName: 'DJI Inspire 3',
    takeoffTime: '2024-01-27 14:30:00',
    landingTime: '2024-01-27 15:45:00',
    flightDuration: 75,
    flightDistance: 22.5,
    maxAltitude: 550,
    status: 'completed'
  },
  {
    id: 15,
    droneName: 'DJI Mini 3 Pro',
    takeoffTime: '2024-01-28 16:00:00',
    landingTime: '2024-01-28 16:28:00',
    flightDuration: 28,
    flightDistance: 4.5,
    maxAltitude: 130,
    status: 'completed'
  }
]

const columns = [
  { title: '无人机名称', dataIndex: 'droneName', key: 'droneName', width: 180 },
  { title: '起飞时间', dataIndex: 'takeoffTime', key: 'takeoffTime', width: 180 },
  { title: '降落时间', dataIndex: 'landingTime', key: 'landingTime', width: 180 },
  { title: '飞行时长', dataIndex: 'flightDuration', key: 'flightDuration', width: 120 },
  { title: '飞行距离', dataIndex: 'flightDistance', key: 'flightDistance', width: 120 },
  { title: '最高海拔', dataIndex: 'maxAltitude', key: 'maxAltitude', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 }
]

const filteredData = computed(() => {
  let result = [...mockFlightRecords]

  if (filterForm.droneName) {
    const keyword = filterForm.droneName.toLowerCase()
    result = result.filter(item => 
      item.droneName.toLowerCase().includes(keyword)
    )
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const startDate = new Date(filterForm.dateRange[0])
    const endDate = new Date(filterForm.dateRange[1])
    endDate.setHours(23, 59, 59, 999)
    
    result = result.filter(item => {
      const takeoffDate = new Date(item.takeoffTime)
      return takeoffDate >= startDate && takeoffDate <= endDate
    })
  }

  return result
})

const paginatedData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  pagination.total = filteredData.value.length
  return filteredData.value.slice(start, end)
})

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

const getStatusColor = (status) => {
  const colors = {
    completed: 'green',
    aborted: 'orange',
    in_progress: 'blue'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    completed: '已完成',
    aborted: '已中断',
    in_progress: '进行中'
  }
  return texts[status] || status
}

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  filterForm.droneName = ''
  filterForm.dateRange = null
  pagination.current = 1
}

const handleTableChange = (pag) => {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
}

onMounted(() => {
  pagination.total = mockFlightRecords.length
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

.filter-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.drone-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drone-icon {
  color: #667eea;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  color: #8c8c8c;
}

.distance {
  font-weight: 500;
  color: #1890ff;
}

.altitude {
  display: flex;
  align-items: center;
  gap: 4px;
}

.altitude-icon {
  color: #52c41a;
}

:deep(.ant-tag) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
