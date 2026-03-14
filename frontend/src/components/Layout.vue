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
        <div class="user-info" v-if="user">
          <a-dropdown>
            <a-button type="text" class="user-dropdown">
              <UserOutlined />
              <span class="username">{{ user.username }}</span>
              <DownOutlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>
    </a-layout-header>
    
    <a-layout class="main-layout">
      <a-layout-sider 
        width="200" 
        class="sider"
        :collapsed="collapsed"
        :trigger="null"
        collapsible
      >
        <div class="sider-trigger" @click="collapsed = !collapsed">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </div>
        <a-menu
          mode="inline"
          :selected-keys="selectedKeys"
          :inline-collapsed="collapsed"
          class="nav-menu"
        >
          <a-menu-item key="DroneList" @click="$router.push('/')">
            <ControlOutlined />
            <span>无人机管理</span>
          </a-menu-item>
          <a-menu-item key="FlightRecords" @click="$router.push('/flight-records')">
            <FileTextOutlined />
            <span>飞行记录</span>
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
  ControlOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = ref([])

const user = computed(() => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
})

// 监听路由变化，更新选中菜单
watch(() => route.name, (newName) => {
  selectedKeys.value = [newName]
}, { immediate: true })

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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
}

.header-content {
  max-width: 100%;
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

.user-info {
  display: flex;
  align-items: center;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}

.username {
  margin: 0 4px;
}

.main-layout {
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.sider {
  background: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  z-index: 100;
}

.sider-trigger {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  font-size: 16px;
  transition: all 0.3s;
}

.sider-trigger:hover {
  background: #f5f5f5;
  color: #1890ff;
}

.nav-menu {
  height: calc(100% - 48px);
  border-right: none;
  padding-top: 8px;
}

:deep(.ant-menu-item) {
  margin: 4px 8px;
  border-radius: 4px;
  width: calc(100% - 16px);
}

:deep(.ant-menu-item-selected) {
  background: #e6f7ff;
  color: #1890ff;
}

.content {
  margin-left: 200px;
  padding: 24px;
  min-height: calc(100vh - 64px);
  transition: all 0.2s;
}

.sider-collapsed .content {
  margin-left: 80px;
}
</style>
