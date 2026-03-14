<template>
  <a-layout class="layout">
    <a-layout-sider v-model:collapsed="collapsed" collapsible class="sidebar">
      <div class="sidebar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span v-if="!collapsed">大疆无人机</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="/">
          <UnorderedListOutlined />
          <span>无人机管理</span>
        </a-menu-item>
        <a-menu-item key="/radar">
          <RadarChartOutlined />
          <span>3D雷达监控</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header class="header">
        <div class="header-content">
          <h2 v-if="pageTitle">{{ pageTitle }}</h2>
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
import { UserOutlined, DownOutlined, LogoutOutlined, UnorderedListOutlined, RadarChartOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = ref([route.path])

const pageTitles = {
  '/': '无人机管理',
  '/radar': '3D雷达监控'
}

const pageTitle = computed(() => {
  return pageTitles[route.path] || '大疆无人机管理系统'
})

watch(route, (newRoute) => {
  selectedKeys.value = [newRoute.path]
}, { immediate: true })

const handleMenuClick = (e) => {
  router.push(e.key)
}

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
}

.sidebar {
  background: #001529;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.sidebar-logo svg {
  width: 28px;
  height: 28px;
  color: #667eea;
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
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.content {
  margin: 0;
  padding: 24px;
  background: #f0f2f5;
}
</style>
