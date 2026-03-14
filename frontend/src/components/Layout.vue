<template>
  <a-layout class="layout">
    <a-layout-header class="header">
      <div class="header-content">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>大疆无人机管理系统</span>
        </div>
        <div class="user-info">
          <a-dropdown>
            <a-button type="text">
              <UserOutlined />
              <span>{{ user?.username || '用户' }}</span>
              <DownOutlined />
            </a-button>
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
      </div>
    </a-layout-header>
    
    <a-layout class="main-layout">
      <a-layout-sider class="sider" width="200">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          mode="inline"
          class="nav-menu"
        >
          <a-menu-item key="drones" @click="$router.push('/')">
            <UnorderedListOutlined />
            <span>无人机列表</span>
          </a-menu-item>
          <a-menu-item key="monitor3d" @click="$router.push('/monitor3d')">
            <RadarChartOutlined />
            <span>3D监控中心</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      
      <a-layout-content class="content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { 
  UserOutlined, 
  DownOutlined, 
  LogoutOutlined,
  UnorderedListOutlined,
  RadarChartOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const selectedKeys = ref(['drones'])

watch(() => route.path, (path) => {
  if (path === '/monitor3d') {
    selectedKeys.value = ['monitor3d']
  } else {
    selectedKeys.value = ['drones']
  }
}, { immediate: true })

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

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
  background: #f0f2f5;
}

.header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #667eea;
}

.logo span {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.main-layout {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  background: transparent;
}

.sider {
  background: white;
  margin: 24px 0 24px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.nav-menu {
  height: 100%;
  border-radius: 12px;
  border-right: none;
}

:deep(.ant-menu-item) {
  margin: 4px 8px;
  border-radius: 8px;
}

:deep(.ant-menu-item-selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

:deep(.ant-menu-item-selected .anticon) {
  color: white;
}

.content {
  padding: 24px;
  min-height: calc(100vh - 64px);
}
</style>
