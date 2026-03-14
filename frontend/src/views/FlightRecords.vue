<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-title">
        <h2>飞行记录</h2>
        <p>查看和管理无人机的飞行历史记录</p>
      </div>
    </div>

    <!-- 搜索表单 -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-form-item label="无人机名称">
          <a-input
            v-model:value="filterForm.droneName"
            placeholder="请输入无人机名称"
            allowClear
            style="width: 200px"
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
            show-time
            format="YYYY-MM-DD HH:mm"
            :placeholder="['开始时间', '结束时间']"
            style="width: 360px"
            @change="handleSearch"
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

    <!-- 统计卡片 -->
    <a-row :gutter="16" class="stats-row">
      <a-col :span="4" v-for="stat in statistics" :key="stat.key">
        <a-card class="stat-card" :class="stat.key">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </a-card>
      </a-col>
    </a-row>

    <!-- 数据表格 -->
    <a-card class="table-card">
      <a-table
        :columns="columns"
        :data-source="filteredRecords"
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
          <template v-else-if="column.key === 'flightDuration'">
            <span>{{ formatDuration(record.flightDuration) }}</span>
          </template>
          <template v-else-if="column.key === 'flightDistance'">
            <span>{{ record.flightDistance.toFixed(2) }} km</span>
          </template>
          <template v-else-if="column.key === 'maxAltitude'">
            <span>{{ record.maxAltitude }} m</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button class="action-btn" type="link" @click="handleViewDetail(record)">
              <EyeOutlined />
              查看详情
            </a-button>
          </template>
        </template>

        <!-- 空状态 -->
        <template #emptyText>
          <a-empty description="暂无飞行记录">
            <template #description>
              <p>暂无符合条件的飞行记录</p>
            </template>
          </a-empty>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:visible="detailModalVisible"
      title="飞行记录详情"
      width="700px"
      :footer="null"
    >
      <a-descriptions v-if="currentRecord" :column="2" bordered>
        <a-descriptions-item label="记录ID">{{ currentRecord.id }}</a-descriptions-item>
        <a-descriptions-item label="无人机名称">{{ currentRecord.droneName }}</a-descriptions-item>
        <a-descriptions-item label="无人机编号">{{ currentRecord.droneCode }}</a-descriptions-item>
        <a-descriptions-item label="飞行状态">
          <a-tag :color="getStatusColor(currentRecord.status)">
            {{ getStatusText(currentRecord.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="起飞时间">{{ currentRecord.takeoffTime }}</a-descriptions-item>
        <a-descriptions-item label="降落时间">{{ currentRecord.landingTime || '-' }}</a-descriptions-item>
        <a-descriptions-item label="飞行时长">{{ formatDuration(currentRecord.flightDuration) }}</a-descriptions-item>
        <a-descriptions-item label="飞行距离">{{ currentRecord.flightDistance.toFixed(2) }} km</a-descriptions-item>
        <a-descriptions-item label="最高海拔">{{ currentRecord.maxAltitude }} m</a-descriptions-item>
        <a-descriptions-item label="平均速度">{{ currentRecord.avgSpeed }} m/s</a-descriptions-item>
        <a-descriptions-item label="最高速度">{{ currentRecord.maxSpeed }} m/s</a-descriptions-item>
        <a-descriptions-item label="起飞电量">{{ currentRecord.takeoffBattery }}%</a-descriptions-item>
        <a-descriptions-item label="降落电量">{{ currentRecord.landingBattery !== null ? currentRecord.landingBattery + '%' : '-' }}</a-descriptions-item>
        <a-descriptions-item label="起飞地点">{{ currentRecord.takeoffLocation }}</a-descriptions-item>
        <a-descriptions-item label="降落地点">{{ currentRecord.landingLocation || '-' }}</a-descriptions-item>
        <a-descriptions-item label="飞行员">{{ currentRecord.pilotName }}</a-descriptions-item>
        <a-descriptions-item label="任务类型">{{ currentRecord.missionType }}</a-descriptions-item>
        <a-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '无' }}</a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

// Mock 数据 - 飞行记录
const mockFlightRecords = [
  {
    id: 'FL20240301001',
    droneId: 'DR001',
    droneName: '御 Mavic 3 Pro',
    droneCode: 'DJI-M3P-001',
    status: 'completed',
    takeoffTime: '2024-03-01 08:30:00',
    landingTime: '2024-03-01 09:45:00',
    flightDuration: 75,
    flightDistance: 12.56,
    maxAltitude: 120,
    avgSpeed: 8.5,
    maxSpeed: 15.2,
    takeoffBattery: 98,
    landingBattery: 45,
    takeoffLocation: '北京市朝阳区奥林匹克公园',
    landingLocation: '北京市朝阳区奥林匹克公园',
    pilotName: '张伟',
    missionType: '航拍测绘',
    remark: '完成公园全景拍摄任务'
  },
  {
    id: 'FL20240301002',
    droneId: 'DR002',
    droneName: 'Air 3',
    droneCode: 'DJI-A3-002',
    status: 'completed',
    takeoffTime: '2024-03-01 10:15:00',
    landingTime: '2024-03-01 11:20:00',
    flightDuration: 65,
    flightDistance: 8.32,
    maxAltitude: 100,
    avgSpeed: 7.8,
    maxSpeed: 12.5,
    takeoffBattery: 95,
    landingBattery: 38,
    takeoffLocation: '上海市浦东新区陆家嘴',
    landingLocation: '上海市浦东新区陆家嘴',
    pilotName: '李娜',
    missionType: '建筑巡检',
    remark: '完成三栋高楼外墙检查'
  },
  {
    id: 'FL20240302001',
    droneId: 'DR003',
    droneName: 'Mini 4 Pro',
    droneCode: 'DJI-M4P-003',
    status: 'completed',
    takeoffTime: '2024-03-02 14:00:00',
    landingTime: '2024-03-02 14:35:00',
    flightDuration: 35,
    flightDistance: 4.18,
    maxAltitude: 80,
    avgSpeed: 6.5,
    maxSpeed: 10.0,
    takeoffBattery: 100,
    landingBattery: 62,
    takeoffLocation: '深圳市南山区深圳湾公园',
    landingLocation: '深圳市南山区深圳湾公园',
    pilotName: '王强',
    missionType: '风景摄影',
    remark: '拍摄日落景观'
  },
  {
    id: 'FL20240302002',
    droneId: 'DR001',
    droneName: '御 Mavic 3 Pro',
    droneCode: 'DJI-M3P-001',
    status: 'completed',
    takeoffTime: '2024-03-02 16:30:00',
    landingTime: '2024-03-02 18:00:00',
    flightDuration: 90,
    flightDistance: 15.67,
    maxAltitude: 150,
    avgSpeed: 9.2,
    maxSpeed: 18.5,
    takeoffBattery: 96,
    landingBattery: 28,
    takeoffLocation: '北京市海淀区颐和园',
    landingLocation: '北京市海淀区颐和园',
    pilotName: '张伟',
    missionType: '航拍测绘',
    remark: '颐和园全景航拍'
  },
  {
    id: 'FL20240303001',
    droneId: 'DR004',
    droneName: 'FPV 无人机',
    droneCode: 'DJI-FPV-004',
    status: 'completed',
    takeoffTime: '2024-03-03 09:00:00',
    landingTime: '2024-03-03 09:25:00',
    flightDuration: 25,
    flightDistance: 6.84,
    maxAltitude: 200,
    avgSpeed: 15.6,
    maxSpeed: 35.0,
    takeoffBattery: 100,
    landingBattery: 55,
    takeoffLocation: '成都市锦江区天府广场',
    landingLocation: '成都市锦江区天府广场',
    pilotName: '刘洋',
    missionType: '竞速训练',
    remark: '穿越机技巧练习'
  },
  {
    id: 'FL20240303002',
    droneId: 'DR002',
    droneName: 'Air 3',
    droneCode: 'DJI-A3-002',
    status: 'aborted',
    takeoffTime: '2024-03-03 11:00:00',
    landingTime: '2024-03-03 11:08:00',
    flightDuration: 8,
    flightDistance: 0.95,
    maxAltitude: 30,
    avgSpeed: 5.2,
    maxSpeed: 8.0,
    takeoffBattery: 92,
    landingBattery: 85,
    takeoffLocation: '广州市天河区珠江新城',
    landingLocation: '广州市天河区珠江新城',
    pilotName: '李娜',
    missionType: '紧急巡检',
    remark: '因天气原因提前返航'
  },
  {
    id: 'FL20240304001',
    droneId: 'DR005',
    droneName: 'Matrice 350 RTK',
    droneCode: 'DJI-M350-005',
    status: 'completed',
    takeoffTime: '2024-03-04 07:30:00',
    landingTime: '2024-03-04 10:15:00',
    flightDuration: 165,
    flightDistance: 28.45,
    maxAltitude: 300,
    avgSpeed: 10.5,
    maxSpeed: 20.0,
    takeoffBattery: 100,
    landingBattery: 35,
    takeoffLocation: '杭州市西湖区西湖景区',
    landingLocation: '杭州市西湖区西湖景区',
    pilotName: '陈明',
    missionType: '电力巡检',
    remark: '完成10公里输电线路巡检'
  },
  {
    id: 'FL20240304002',
    droneId: 'DR003',
    droneName: 'Mini 4 Pro',
    droneCode: 'DJI-M4P-003',
    status: 'completed',
    takeoffTime: '2024-03-04 15:00:00',
    landingTime: '2024-03-04 15:42:00',
    flightDuration: 42,
    flightDistance: 5.23,
    maxAltitude: 90,
    avgSpeed: 7.0,
    maxSpeed: 11.5,
    takeoffBattery: 98,
    landingBattery: 48,
    takeoffLocation: '西安市雁塔区大雁塔',
    landingLocation: '西安市雁塔区大雁塔',
    pilotName: '王强',
    missionType: '旅游航拍',
    remark: '游客航拍服务'
  },
  {
    id: 'FL20240305001',
    droneId: 'DR006',
    droneName: 'Inspire 3',
    droneCode: 'DJI-I3-006',
    status: 'completed',
    takeoffTime: '2024-03-05 06:00:00',
    landingTime: '2024-03-05 08:30:00',
    flightDuration: 150,
    flightDistance: 22.18,
    maxAltitude: 250,
    avgSpeed: 8.8,
    maxSpeed: 16.5,
    takeoffBattery: 100,
    landingBattery: 32,
    takeoffLocation: '三亚市海棠湾',
    landingLocation: '三亚市海棠湾',
    pilotName: '赵磊',
    missionType: '影视拍摄',
    remark: '电影航拍镜头采集'
  },
  {
    id: 'FL20240305002',
    droneId: 'DR001',
    droneName: '御 Mavic 3 Pro',
    droneCode: 'DJI-M3P-001',
    status: 'completed',
    takeoffTime: '2024-03-05 14:20:00',
    landingTime: '2024-03-05 15:35:00',
    flightDuration: 75,
    flightDistance: 11.89,
    maxAltitude: 110,
    avgSpeed: 8.2,
    maxSpeed: 14.8,
    takeoffBattery: 97,
    landingBattery: 42,
    takeoffLocation: '南京市玄武区玄武湖',
    landingLocation: '南京市玄武区玄武湖',
    pilotName: '张伟',
    missionType: '环境监测',
    remark: '水质采样点巡查'
  },
  {
    id: 'FL20240306001',
    droneId: 'DR007',
    droneName: 'Agras T50',
    droneCode: 'DJI-T50-007',
    status: 'completed',
    takeoffTime: '2024-03-06 05:30:00',
    landingTime: '2024-03-06 07:45:00',
    flightDuration: 135,
    flightDistance: 18.56,
    maxAltitude: 50,
    avgSpeed: 7.5,
    maxSpeed: 12.0,
    takeoffBattery: 100,
    landingBattery: 25,
    takeoffLocation: '哈尔滨市松北区农田',
    landingLocation: '哈尔滨市松北区农田',
    pilotName: '孙涛',
    missionType: '农业植保',
    remark: '完成50亩农田农药喷洒'
  },
  {
    id: 'FL20240306002',
    droneId: 'DR004',
    droneName: 'FPV 无人机',
    droneCode: 'DJI-FPV-004',
    status: 'crashed',
    takeoffTime: '2024-03-06 16:00:00',
    landingTime: null,
    flightDuration: 12,
    flightDistance: 2.34,
    maxAltitude: 80,
    avgSpeed: 12.0,
    maxSpeed: 25.0,
    takeoffBattery: 95,
    landingBattery: null,
    takeoffLocation: '武汉市江汉区江滩公园',
    landingLocation: null,
    pilotName: '刘洋',
    missionType: '特技飞行',
    remark: '操作失误导致坠机'
  },
  {
    id: 'FL20240307001',
    droneId: 'DR002',
    droneName: 'Air 3',
    droneCode: 'DJI-A3-002',
    status: 'completed',
    takeoffTime: '2024-03-07 09:30:00',
    landingTime: '2024-03-07 10:50:00',
    flightDuration: 80,
    flightDistance: 10.45,
    maxAltitude: 120,
    avgSpeed: 7.8,
    maxSpeed: 13.5,
    takeoffBattery: 99,
    landingBattery: 40,
    takeoffLocation: '重庆市渝中区解放碑',
    landingLocation: '重庆市渝中区解放碑',
    pilotName: '李娜',
    missionType: '城市测绘',
    remark: '3D城市建模数据采集'
  },
  {
    id: 'FL20240307002',
    droneId: 'DR005',
    droneName: 'Matrice 350 RTK',
    droneCode: 'DJI-M350-005',
    status: 'completed',
    takeoffTime: '2024-03-07 13:00:00',
    landingTime: '2024-03-07 16:20:00',
    flightDuration: 200,
    flightDistance: 35.67,
    maxAltitude: 350,
    avgSpeed: 10.8,
    maxSpeed: 22.0,
    takeoffBattery: 100,
    landingBattery: 28,
    takeoffLocation: '昆明市官渡区滇池',
    landingLocation: '昆明市官渡区滇池',
    pilotName: '陈明',
    missionType: '生态监测',
    remark: '滇池水质及生态调查'
  },
  {
    id: 'FL20240308001',
    droneId: 'DR003',
    droneName: 'Mini 4 Pro',
    droneCode: 'DJI-M4P-003',
    status: 'completed',
    takeoffTime: '2024-03-08 17:00:00',
    landingTime: '2024-03-08 17:28:00',
    flightDuration: 28,
    flightDistance: 3.56,
    maxAltitude: 85,
    avgSpeed: 6.8,
    maxSpeed: 10.5,
    takeoffBattery: 100,
    landingBattery: 68,
    takeoffLocation: '厦门市思明区鼓浪屿',
    landingLocation: '厦门市思明区鼓浪屿',
    pilotName: '王强',
    missionType: '夜景拍摄',
    remark: '鼓浪屿夜景航拍'
  },
  {
    id: 'FL20240308002',
    droneId: 'DR006',
    droneName: 'Inspire 3',
    droneCode: 'DJI-I3-006',
    status: 'in_progress',
    takeoffTime: '2024-03-08 08:00:00',
    landingTime: null,
    flightDuration: 45,
    flightDistance: 8.92,
    maxAltitude: 180,
    avgSpeed: 9.5,
    maxSpeed: 17.0,
    takeoffBattery: 100,
    landingBattery: null,
    takeoffLocation: '青岛市市南区栈桥',
    landingLocation: null,
    pilotName: '赵磊',
    missionType: '广告拍摄',
    remark: '汽车广告航拍进行中'
  },
  {
    id: 'FL20240309001',
    droneId: 'DR001',
    droneName: '御 Mavic 3 Pro',
    droneCode: 'DJI-M3P-001',
    status: 'completed',
    takeoffTime: '2024-03-09 11:00:00',
    landingTime: '2024-03-09 12:15:00',
    flightDuration: 75,
    flightDistance: 13.24,
    maxAltitude: 130,
    avgSpeed: 8.8,
    maxSpeed: 15.5,
    takeoffBattery: 98,
    landingBattery: 38,
    takeoffLocation: '苏州市姑苏区拙政园',
    landingLocation: '苏州市姑苏区拙政园',
    pilotName: '张伟',
    missionType: '园林测绘',
    remark: '古典园林数字化存档'
  },
  {
    id: 'FL20240309002',
    droneId: 'DR007',
    droneName: 'Agras T50',
    droneCode: 'DJI-T50-007',
    status: 'completed',
    takeoffTime: '2024-03-09 06:00:00',
    landingTime: '2024-03-09 08:30:00',
    flightDuration: 150,
    flightDistance: 21.34,
    maxAltitude: 45,
    avgSpeed: 7.2,
    maxSpeed: 11.5,
    takeoffBattery: 100,
    landingBattery: 22,
    takeoffLocation: '郑州市金水区农田',
    landingLocation: '郑州市金水区农田',
    pilotName: '孙涛',
    missionType: '农业植保',
    remark: '小麦病虫害防治作业'
  }
]

const loading = ref(false)
const flightRecords = ref([])
const detailModalVisible = ref(false)
const currentRecord = ref(null)

const filterForm = reactive({
  droneName: '',
  dateRange: null
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showTotal: (total) => `共 ${total} 条`
})

const columns = [
  { title: '记录ID', dataIndex: 'id', key: 'id', width: 140 },
  { title: '无人机名称', dataIndex: 'droneName', key: 'droneName', width: 160 },
  { title: '无人机编号', dataIndex: 'droneCode', key: 'droneCode', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '起飞时间', dataIndex: 'takeoffTime', key: 'takeoffTime', width: 170 },
  { title: '降落时间', dataIndex: 'landingTime', key: 'landingTime', width: 170 },
  { title: '飞行时长', dataIndex: 'flightDuration', key: 'flightDuration', width: 110 },
  { title: '飞行距离', dataIndex: 'flightDistance', key: 'flightDistance', width: 110 },
  { title: '最高海拔', dataIndex: 'maxAltitude', key: 'maxAltitude', width: 100 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' }
]

const statistics = computed(() => {
  const stats = {
    total: flightRecords.value.length,
    completed: 0,
    in_progress: 0,
    aborted: 0,
    crashed: 0
  }
  flightRecords.value.forEach(record => {
    if (stats[record.status] !== undefined) {
      stats[record.status]++
    }
  })
  return [
    { key: 'total', label: '全部记录', value: stats.total },
    { key: 'completed', label: '已完成', value: stats.completed },
    { key: 'in_progress', label: '进行中', value: stats.in_progress },
    { key: 'aborted', label: '已中止', value: stats.aborted },
    { key: 'crashed', label: '已坠毁', value: stats.crashed }
  ]
})

const filteredRecords = computed(() => {
  let result = [...flightRecords.value]

  // 按无人机名称筛选
  if (filterForm.droneName) {
    const keyword = filterForm.droneName.toLowerCase()
    result = result.filter(record => 
      record.droneName.toLowerCase().includes(keyword) ||
      record.droneCode.toLowerCase().includes(keyword)
    )
  }

  // 按日期范围筛选
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const startDate = filterForm.dateRange[0].startOf('day')
    const endDate = filterForm.dateRange[1].endOf('day')
    result = result.filter(record => {
      const recordDate = dayjs(record.takeoffTime)
      return recordDate.isAfter(startDate) && recordDate.isBefore(endDate)
    })
  }

  // 更新分页总数
  pagination.total = result.length

  // 分页处理
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return result.slice(start, end)
})

const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    in_progress: 'processing',
    aborted: 'warning',
    crashed: 'error'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    completed: '已完成',
    in_progress: '进行中',
    aborted: '已中止',
    crashed: '已坠毁'
  }
  return texts[status] || status
}

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

const fetchRecords = async () => {
  loading.value = true
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    flightRecords.value = mockFlightRecords
    pagination.total = mockFlightRecords.length
  } catch (error) {
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
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

const handleViewDetail = (record) => {
  currentRecord.value = record
  detailModalVisible.value = true
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.page-container {
  padding: 0 24px;
  max-width: 1400px;
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
