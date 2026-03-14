<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-title">
        <h2>飞行记录</h2>
        <p>查看和管理所有无人机的飞行历史记录</p>
      </div>
    </div>

    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="无人机名称">
          <a-input
            v-model:value="filterForm.droneName"
            placeholder="请输入无人机名称"
            allowClear
            @pressEnter="handleSearch"
          >
            <template #prefix>
              <SearchOutlined />
            </template>
          </a-input>
        </a-form-item>
        <a-form-item label="起飞时间">
          <a-range-picker
            v-model:value="filterForm.dateRange"
            format="YYYY-MM-DD HH:mm:ss"
            @change="handleSearch"
            show-time
          />
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

    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="paginatedRecords"
        :pagination="pagination"
        @change="handleTableChange"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'duration'">
            {{ formatDuration(record.duration) }}
          </template>
          <template v-else-if="column.key === 'distance'">
            {{ record.distance }} km
          </template>
          <template v-else-if="column.key === 'maxAltitude'">
            {{ record.maxAltitude }} m
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

const mockFlightRecords = [
  {
    id: 1,
    droneName: '精灵4 Pro V2.0',
    takeoffTime: '2026-03-01 08:30:00',
    landingTime: '2026-03-01 09:15:00',
    duration: 2700,
    distance: 12.5,
    maxAltitude: 120,
    status: 'completed'
  },
  {
    id: 2,
    droneName: '御Mavic Air 2',
    takeoffTime: '2026-03-01 14:20:00',
    landingTime: '2026-03-01 14:55:00',
    duration: 2100,
    distance: 8.3,
    maxAltitude: 85,
    status: 'completed'
  },
  {
    id: 3,
    droneName: '悟Inspire 2',
    takeoffTime: '2026-03-02 10:00:00',
    landingTime: '2026-03-02 10:45:00',
    duration: 2700,
    distance: 15.7,
    maxAltitude: 200,
    status: 'completed'
  },
  {
    id: 4,
    droneName: '御Mavic 3',
    takeoffTime: '2026-03-02 16:45:00',
    landingTime: '2026-03-02 17:20:00',
    duration: 2100,
    distance: 10.2,
    maxAltitude: 150,
    status: 'in-progress'
  },
  {
    id: 5,
    droneName: '精灵4 RTK',
    takeoffTime: '2026-03-03 09:15:00',
    landingTime: '2026-03-03 09:50:00',
    duration: 2100,
    distance: 9.8,
    maxAltitude: 110,
    status: 'completed'
  },
  {
    id: 6,
    droneName: '御Mavic Mini 2',
    takeoffTime: '2026-03-03 15:30:00',
    landingTime: '2026-03-03 16:05:00',
    duration: 2100,
    distance: 7.5,
    maxAltitude: 95,
    status: 'completed'
  },
  {
    id: 7,
    droneName: '精灵4 Pro V2.0',
    takeoffTime: '2026-03-04 07:45:00',
    landingTime: '2026-03-04 08:30:00',
    duration: 2700,
    distance: 13.1,
    maxAltitude: 135,
    status: 'completed'
  },
  {
    id: 8,
    droneName: '悟Inspire 2',
    takeoffTime: '2026-03-04 11:20:00',
    landingTime: '2026-03-04 11:55:00',
    duration: 2100,
    distance: 14.3,
    maxAltitude: 180,
    status: 'aborted'
  },
  {
    id: 9,
    droneName: '御Mavic 3',
    takeoffTime: '2026-03-05 08:00:00',
    landingTime: '2026-03-05 08:45:00',
    duration: 2700,
    distance: 11.9,
    maxAltitude: 160,
    status: 'completed'
  },
  {
    id: 10,
    droneName: '御Mavic Air 2S',
    takeoffTime: '2026-03-05 13:30:00',
    landingTime: '2026-03-05 14:15:00',
    duration: 2700,
    distance: 10.8,
    maxAltitude: 125,
    status: 'completed'
  },
  {
    id: 11,
    droneName: '精灵4 RTK',
    takeoffTime: '2026-03-06 10:30:00',
    landingTime: '2026-03-06 11:15:00',
    duration: 2700,
    distance: 12.7,
    maxAltitude: 140,
    status: 'completed'
  },
  {
    id: 12,
    droneName: '御Mavic Mini 2',
    takeoffTime: '2026-03-06 16:00:00',
    landingTime: '2026-03-06 16:45:00',
    duration: 2700,
    distance: 8.6,
    maxAltitude: 100,
    status: 'completed'
  },
  {
    id: 13,
    droneName: '御Mavic 3',
    takeoffTime: '2026-03-07 09:45:00',
    landingTime: '2026-03-07 10:30:00',
    duration: 2700,
    distance: 14.2,
    maxAltitude: 175,
    status: 'in-progress'
  },
  {
    id: 14,
    droneName: '悟Inspire 2',
    takeoffTime: '2026-03-07 14:10:00',
    landingTime: '2026-03-07 14:55:00',
    duration: 2700,
    distance: 16.5,
    maxAltitude: 210,
    status: 'completed'
  },
  {
    id: 15,
    droneName: '精灵4 Pro V2.0',
    takeoffTime: '2026-03-08 11:00:00',
    landingTime: '2026-03-08 11:45:00',
    duration: 2700,
    distance: 13.8,
    maxAltitude: 145,
    status: 'completed'
  }
]

const filterForm = reactive({
  droneName: '',
  dateRange: []
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`
})

const columns = [
  { title: '无人机名称', dataIndex: 'droneName', key: 'droneName', width: 180 },
  { title: '起飞时间', dataIndex: 'takeoffTime', key: 'takeoffTime', width: 180 },
  { title: '降落时间', dataIndex: 'landingTime', key: 'landingTime', width: 180 },
  { title: '飞行时长', key: 'duration', width: 120 },
  { title: '飞行距离', key: 'distance', width: 120 },
  { title: '最高海拔', key: 'maxAltitude', width: 120 },
  { title: '飞行状态', dataIndex: 'status', key: 'status', width: 100 }
]

const filteredRecords = computed(() => {
  let result = [...mockFlightRecords]

  if (filterForm.droneName) {
    result = result.filter(record =>
      record.droneName.toLowerCase().includes(filterForm.droneName.toLowerCase())
    )
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    result = result.filter(record => {
      const takeoffTime = new Date(record.takeoffTime).getTime()
      return takeoffTime >= startDate.getTime() && takeoffTime <= endDate.getTime()
    })
  }

  pagination.total = result.length
  return result
})

const paginatedRecords = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredRecords.value.slice(start, end)
})

const getStatusColor = (status) => {
  const colors = {
    'completed': 'green',
    'in-progress': 'blue',
    'aborted': 'red'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    'completed': '已完成',
    'in-progress': '进行中',
    'aborted': '已中断'
  }
  return texts[status] || status
}

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }
  return `${minutes}分钟`
}

const handleSearch = () => {
  pagination.current = 1
}

const handleReset = () => {
  filterForm.droneName = ''
  filterForm.dateRange = []
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

:deep(.ant-tag) {
  font-size: 13px;
  padding: 2px 8px;
}
</style>
