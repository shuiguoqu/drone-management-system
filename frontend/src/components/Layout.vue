<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="sider"
      width="240"
    >
      <div class="logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span v-show="!collapsed">大疆无人机管理系统</span>
      </div>
      
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        class="menu"
        @click="handleMenuClick"
      >
        <a-menu-item key="drones">
          <template #icon>
            <DatabaseOutlined />
          </template>
          <span>无人机管理</span>
        </a-menu-item>
        <a-menu-item key="radar">
          <template #icon>
            <RadarChartOutlined />
          </template>
          <span>3D雷达监控</span>
        </a-menu-item>
      </a-menu>
      
      <div class="sider-footer">
        <a-dropdown placement="topRight">
          <div class="user-info">
            <UserOutlined />
            <span v-show="!collapsed">{{ user?.username || '用户' }}</span>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item key="logout" @click="handleLogout">
                <LogoutOutlined />
                <span>退出登录</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </a-layout-sider>
    
    <a-layout class="main-layout">
      <a-layout-header class="header">
        <div class="header-content">
          <div class="collapse-btn" @click="collapsed = !collapsed">
            <MenuFoldOutlined v-if="!collapsed" />
            <MenuUnfoldOutlined v-else />
          </div>
          <div class="page-title">{{ pageTitle }}</div>
        </div>
      </a-layout-header>
      
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  UserOutlined,
  LogoutOutlined,
  DatabaseOutlined,
  RadarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const selectedKeys = ref(['drones'])

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

const pageTitle = computed(() => {
  const titles = {
    'DroneList': '无人机管理',
    'RadarMonitor': '3D雷达监控'
  }
  return titles[route.name] || '无人机管理'
})

watch(() => route.name, (name) => {
  if (name === 'DroneList') {
    selectedKeys.value = ['drones']
  } else if (name === 'RadarMonitor') {
    selectedKeys.value = ['radar']
  }
}, { immediate: true })

const handleMenuClick = ({ key }) => {
  if (key === 'drones') {
    router.push('/')
  } else if (key === 'radar') {
    router.push('/radar')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  message.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f0f2f5 !important;
}

.sider {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  position: relative;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #00ff88;
  flex-shrink: 0;
}

.logo span {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.menu {
  background: transparent;
  border: none;
  margin-top: 10px;
}

:deep(.ant-menu-item) {
  color: rgba(255, 255, 255, 0.65);
  margin: 4px 8px;
  border-radius: 8px;
}

:deep(.ant-menu-item:hover),
:deep(.ant-menu-item-selected) {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

:deep(.ant-menu-item-selected::after) {
  display: none;
}

.sider-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.main-layout {
  background: #f0f2f5;
}

.header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  height: 64px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  height: 100%;
}

.collapse-btn {
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.collapse-btn:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.content {
  padding: 24px;
  min-height: calc(100vh - 64px);
  overflow: auto;
}
</style>
