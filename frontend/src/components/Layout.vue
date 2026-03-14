<template>
  <a-layout class="layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      class="sider"
      width="220"
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
          <RocketOutlined />
          <span>无人机管理</span>
        </a-menu-item>
        <a-menu-item key="flight-records">
          <HistoryOutlined />
          <span>飞行记录</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    
    <a-layout>
      <a-layout-header class="header">
        <div class="header-content">
          <div class="header-left">
            <a-button type="text" class="trigger" @click="collapsed = !collapsed">
              <MenuFoldOutlined v-if="!collapsed" />
              <MenuUnfoldOutlined v-else />
            </a-button>
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
  DownOutlined,
  LogoutOutlined,
  RocketOutlined,
  HistoryOutlined,
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

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  message.success('已退出登录')
  router.push('/login')
}

const handleMenuClick = ({ key }) => {
  if (key === 'drones') {
    router.push('/')
  } else if (key === 'flight-records') {
    router.push('/flight-records')
  }
}

watch(
  () => route.path,
  (path) => {
    if (path === '/' || path === '/drones') {
      selectedKeys.value = ['drones']
    } else if (path === '/flight-records') {
      selectedKeys.value = ['flight-records']
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.layout {
  min-height: 100vh;
}

.sider {
  background: linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo svg {
  width: 28px;
  height: 28px;
  color: #667eea;
  flex-shrink: 0;
}

.logo span {
  font-size: 16px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
}

.menu {
  background: transparent;
  border: none;
  margin-top: 8px;
}

.menu :deep(.ant-menu-item) {
  color: rgba(255, 255, 255, 0.75);
  margin: 4px 8px;
  border-radius: 6px;
  height: 44px;
  line-height: 44px;
}

.menu :deep(.ant-menu-item:hover) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.menu :deep(.ant-menu-item-selected) {
  color: white;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.menu :deep(.ant-menu-item .anticon) {
  font-size: 16px;
}

.header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
}

.trigger {
  font-size: 18px;
  padding: 0 12px;
}

.user-info {
  display: flex;
  align-items: center;
}

.content {
  background: #f0f2f5;
  padding: 24px;
  min-height: calc(100vh - 64px);
}
</style>
