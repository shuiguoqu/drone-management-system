<template>
  <div class="monitor3d-container">
    <div ref="canvasContainer" class="canvas-container"></div>
    
    <!-- 悬浮提示 -->
    <div v-if="hoveredDrone" class="drone-tooltip" :style="tooltipStyle">
      <div class="tooltip-header">
        <span class="drone-name">{{ hoveredDrone.name }}</span>
        <span class="drone-status" :class="hoveredDrone.status">{{ getStatusText(hoveredDrone.status) }}</span>
      </div>
      <div class="tooltip-body">
        <div class="info-row">
          <span class="label">ID:</span>
          <span class="value">{{ hoveredDrone.id }}</span>
        </div>
        <div class="info-row">
          <span class="label">高度:</span>
          <span class="value">{{ hoveredDrone.position.y.toFixed(1) }}m</span>
        </div>
        <div class="info-row">
          <span class="label">速度:</span>
          <span class="value">{{ hoveredDrone.speed.toFixed(1) }}m/s</span>
        </div>
        <div class="info-row">
          <span class="label">电量:</span>
          <span class="value" :class="getBatteryClass(hoveredDrone.battery)">{{ hoveredDrone.battery }}%</span>
        </div>
        <div class="info-row">
          <span class="label">位置:</span>
          <span class="value">({{ hoveredDrone.position.x.toFixed(1) }}, {{ hoveredDrone.position.z.toFixed(1) }})</span>
        </div>
      </div>
    </div>
    
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="panel-header">
        <RadarChartOutlined />
        <span>实时监控</span>
      </div>
      <div class="panel-content">
        <div class="stat-item">
          <span class="stat-label">在线无人机</span>
          <span class="stat-value online">{{ onlineCount }}/{{ drones.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">警告状态</span>
          <span class="stat-value warning">{{ warningCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">离线状态</span>
          <span class="stat-value offline">{{ offlineCount }}</span>
        </div>
      </div>
    </div>
    
    <!-- 操作提示 -->
    <div class="operation-hint">
      <DragOutlined />
      <span>拖拽旋转视角 | 滚轮缩放</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RadarChartOutlined, DragOutlined } from '@ant-design/icons-vue'

const canvasContainer = ref(null)
const hoveredDrone = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// 模拟无人机数据
const drones = ref([
  { id: 'DRONE-001', name: '侦察机-Alpha', status: 'online', battery: 85, speed: 12.5, position: { x: -30, y: 25, z: -20 } },
  { id: 'DRONE-002', name: '巡逻机-Beta', status: 'online', battery: 72, speed: 8.3, position: { x: 25, y: 35, z: 15 } },
  { id: 'DRONE-003', name: '监控机-Gamma', status: 'warning', battery: 25, speed: 15.2, position: { x: -15, y: 20, z: 30 } },
  { id: 'DRONE-004', name: '探测机-Delta', status: 'online', battery: 91, speed: 10.7, position: { x: 40, y: 45, z: -25 } },
  { id: 'DRONE-005', name: '巡航机-Echo', status: 'offline', battery: 0, speed: 0, position: { x: -35, y: 15, z: 10 } },
  { id: 'DRONE-006', name: '追踪机-Fox', status: 'online', battery: 68, speed: 18.9, position: { x: 20, y: 30, z: -35 } },
  { id: 'DRONE-007', name: '搜索机-Golf', status: 'online', battery: 79, speed: 11.2, position: { x: -25, y: 40, z: 25 } },
  { id: 'DRONE-008', name: '监视机-Hotel', status: 'warning', battery: 18, speed: 6.5, position: { x: 35, y: 22, z: 5 } }
])

const onlineCount = computed(() => drones.value.filter(d => d.status === 'online').length)
const warningCount = computed(() => drones.value.filter(d => d.status === 'warning').length)
const offlineCount = computed(() => drones.value.filter(d => d.status === 'offline').length)

const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.value.x + 15}px`,
  top: `${tooltipPosition.value.y - 10}px`
}))

const getStatusText = (status) => {
  const statusMap = { online: '在线', warning: '警告', offline: '离线' }
  return statusMap[status] || status
}

const getBatteryClass = (battery) => {
  if (battery <= 20) return 'danger'
  if (battery <= 50) return 'warning'
  return 'good'
}

let scene, camera, renderer, controls, raycaster, mouse
let droneMeshes = []
let scanLight, scanLine
let animationId

onMounted(() => {
  initThreeJS()
  animate()
  
  // 模拟实时数据更新
  const updateInterval = setInterval(updateDronePositions, 2000)
  
  onUnmounted(() => {
    clearInterval(updateInterval)
    if (animationId) cancelAnimationFrame(animationId)
    if (renderer) {
      renderer.dispose()
      canvasContainer.value?.removeChild(renderer.domElement)
    }
  })
})

const initThreeJS = () => {
  // 场景设置
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008)
  
  // 相机设置
  camera = new THREE.PerspectiveCamera(60, canvasContainer.value.clientWidth / canvasContainer.value.clientHeight, 0.1, 1000)
  camera.position.set(0, 60, 80)
  
  // 渲染器设置
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  canvasContainer.value.appendChild(renderer.domElement)
  
  // 控制器
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxPolarAngle = Math.PI / 2 - 0.1
  controls.minDistance = 30
  controls.maxDistance = 150
  
  // 射线检测
  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
  
  // 创建场景元素
  createRadarBase()
  createGrid()
  createDrones()
  createScanEffect()
  createLights()
  
  // 事件监听
  window.addEventListener('resize', onWindowResize)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
}

const createRadarBase = () => {
  // 主底座 - 外圈
  const baseGeometry = new THREE.CylinderGeometry(60, 65, 3, 64)
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a1a2e,
    emissive: 0x0f0f1a,
    shininess: 100,
    transparent: true,
    opacity: 0.9
  })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = -1.5
  scene.add(base)
  
  // 内圈装饰
  const innerRingGeometry = new THREE.CylinderGeometry(55, 55, 4, 64)
  const innerRingMaterial = new THREE.MeshPhongMaterial({
    color: 0x16213e,
    emissive: 0x0a0a15,
    shininess: 80
  })
  const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial)
  innerRing.position.y = -1
  scene.add(innerRing)
  
  // 发光边缘
  const edgeGeometry = new THREE.TorusGeometry(60, 0.5, 16, 100)
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
  edge.rotation.x = Math.PI / 2
  edge.position.y = 0.1
  scene.add(edge)
  
  // 内圈发光边缘
  const innerEdgeGeometry = new THREE.TorusGeometry(55, 0.3, 16, 100)
  const innerEdgeMaterial = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.4 })
  const innerEdge = new THREE.Mesh(innerEdgeGeometry, innerEdgeMaterial)
  innerEdge.rotation.x = Math.PI / 2
  innerEdge.position.y = 0.2
  scene.add(innerEdge)
}

const createGrid = () => {
  // 极坐标网格
  const gridGroup = new THREE.Group()
  
  // 同心圆
  for (let r = 10; r <= 50; r += 10) {
    const circleGeometry = new THREE.RingGeometry(r - 0.1, r + 0.1, 64)
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })
    const circle = new THREE.Mesh(circleGeometry, circleMaterial)
    circle.rotation.x = Math.PI / 2
    gridGroup.add(circle)
  }
  
  // 径向线
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const lineGeometry = new THREE.PlaneGeometry(0.2, 50)
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.1
    })
    const line = new THREE.Mesh(lineGeometry, lineMaterial)
    line.position.set(Math.sin(angle) * 25, 0.05, Math.cos(angle) * 25)
    line.rotation.y = angle
    gridGroup.add(line)
  }
  
  scene.add(gridGroup)
}

const createDrones = () => {
  drones.value.forEach((drone, index) => {
    const group = new THREE.Group()
    
    // 根据状态设置颜色
    const colorMap = {
      online: 0x00ff88,
      warning: 0xffaa00,
      offline: 0xff4444
    }
    const color = colorMap[drone.status] || 0x00ff88
    
    // 无人机主体 - 锥形
    const bodyGeometry = new THREE.ConeGeometry(1.5, 4, 8)
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      shininess: 100
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.rotation.x = Math.PI
    group.add(body)
    
    // 螺旋桨臂
    for (let i = 0; i < 4; i++) {
      const armAngle = (i / 4) * Math.PI * 2
      const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3)
      const armMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 })
      const arm = new THREE.Mesh(armGeometry, armMaterial)
      arm.rotation.z = Math.PI / 2
      arm.rotation.y = armAngle
      arm.position.set(Math.cos(armAngle) * 1.5, 1, Math.sin(armAngle) * 1.5)
      group.add(arm)
      
      // 螺旋桨
      const propGeometry = new THREE.CylinderGeometry(1, 1, 0.1, 16)
      const propMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7
      })
      const prop = new THREE.Mesh(propGeometry, propMaterial)
      prop.position.set(Math.cos(armAngle) * 3, 1.5, Math.sin(armAngle) * 3)
      prop.userData = { isPropeller: true, speed: 0.3 + Math.random() * 0.2 }
      group.add(prop)
    }
    
    // 状态光环
    const ringGeometry = new THREE.RingGeometry(2.5, 3, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = Math.PI / 2
    ring.position.y = -1
    group.add(ring)
    
    // 垂直连接线
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -drone.position.y, 0)
    ])
    const lineMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    group.add(line)
    
    // 地面投影
    const shadowGeometry = new THREE.CircleGeometry(2, 32)
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15
    })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = Math.PI / 2
    shadow.position.y = -drone.position.y
    group.add(shadow)
    
    // 设置位置
    group.position.set(drone.position.x, drone.position.y, drone.position.z)
    group.userData = { droneId: drone.id, droneIndex: index }
    
    scene.add(group)
    droneMeshes.push(group)
  })
}

const createScanEffect = () => {
  // 扫描光束
  const scanGeometry = new THREE.CircleGeometry(60, 64, 0, Math.PI / 6)
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  })
  scanLight = new THREE.Mesh(scanGeometry, scanMaterial)
  scanLight.rotation.x = Math.PI / 2
  scanLight.position.y = 0.5
  scene.add(scanLight)
  
  // 扫描线
  const lineGeometry = new THREE.PlaneGeometry(0.5, 60)
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  scanLine = new THREE.Mesh(lineGeometry, lineMaterial)
  scanLine.geometry.translate(0, 30, 0)
  scanLine.rotation.x = Math.PI / 2
  scanLine.position.y = 0.5
  scene.add(scanLine)
}

const createLights = () => {
  // 环境光
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5)
  scene.add(ambientLight)
  
  // 主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50)
  scene.add(directionalLight)
  
  // 底座发光
  const pointLight = new THREE.PointLight(0x00ffff, 0.5, 100)
  pointLight.position.set(0, 10, 0)
  scene.add(pointLight)
}

const updateDronePositions = () => {
  drones.value.forEach((drone, index) => {
    if (drone.status === 'offline') return
    
    // 随机微调位置
    const moveRange = 3
    drone.position.x += (Math.random() - 0.5) * moveRange
    drone.position.z += (Math.random() - 0.5) * moveRange
    drone.position.y += (Math.random() - 0.5) * 2
    
    // 限制范围
    drone.position.x = Math.max(-50, Math.min(50, drone.position.x))
    drone.position.z = Math.max(-50, Math.min(50, drone.position.z))
    drone.position.y = Math.max(10, Math.min(60, drone.position.y))
    
    // 更新速度
    drone.speed = Math.max(5, Math.min(25, drone.speed + (Math.random() - 0.5) * 3))
    
    // 随机切换状态
    if (Math.random() < 0.05) {
      const statuses = ['online', 'warning', 'offline']
      const weights = [0.7, 0.2, 0.1]
      const random = Math.random()
      let cumulative = 0
      for (let i = 0; i < statuses.length; i++) {
        cumulative += weights[i]
        if (random < cumulative) {
          drone.status = statuses[i]
          break
        }
      }
    }
    
    // 更新电量
    if (drone.status !== 'offline') {
      drone.battery = Math.max(0, drone.battery - Math.random() * 2)
      if (drone.battery < 20) drone.status = 'warning'
    }
    
    // 更新3D模型
    if (droneMeshes[index]) {
      const mesh = droneMeshes[index]
      mesh.position.set(drone.position.x, drone.position.y, drone.position.z)
      
      // 更新颜色
      const colorMap = {
        online: 0x00ff88,
        warning: 0xffaa00,
        offline: 0xff4444
      }
      const newColor = new THREE.Color(colorMap[drone.status])
      
      mesh.children.forEach(child => {
        if (child.material && child.material.emissive) {
          child.material.color = newColor
          child.material.emissive = newColor
        } else if (child.material && child.material.color) {
          child.material.color = newColor
        }
      })
    }
  })
}

const onMouseMove = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  
  tooltipPosition.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  
  checkIntersection()
}

const checkIntersection = () => {
  raycaster.setFromCamera(mouse, camera)
  
  const intersects = raycaster.intersectObjects(droneMeshes, true)
  
  if (intersects.length > 0) {
    let object = intersects[0].object
    while (object.parent && !object.userData.droneId) {
      object = object.parent
    }
    
    if (object.userData.droneId) {
      const drone = drones.value.find(d => d.id === object.userData.droneId)
      if (drone) {
        hoveredDrone.value = drone
        document.body.style.cursor = 'pointer'
        return
      }
    }
  }
  
  hoveredDrone.value = null
  document.body.style.cursor = 'default'
}

const onWindowResize = () => {
  if (!camera || !renderer || !canvasContainer.value) return
  
  camera.aspect = canvasContainer.value.clientWidth / canvasContainer.value.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(canvasContainer.value.clientWidth, canvasContainer.value.clientHeight)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  const time = Date.now() * 0.001
  
  // 旋转扫描效果
  if (scanLight && scanLine) {
    const rotation = time * 0.8
    scanLight.rotation.z = rotation
    scanLine.rotation.z = rotation
  }
  
  // 旋转螺旋桨
  droneMeshes.forEach(group => {
    group.children.forEach(child => {
      if (child.userData.isPropeller) {
        child.rotation.y += child.userData.speed
      }
    })
    
    // 轻微浮动效果
    group.position.y += Math.sin(time * 2 + group.userData.droneIndex) * 0.02
  })
  
  controls.update()
  renderer.render(scene, camera)
}
</script>

<style scoped>
.monitor3d-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 112px);
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.drone-tooltip {
  position: absolute;
  background: rgba(10, 15, 30, 0.95);
  border: 1px solid rgba(0, 255, 136, 0.4);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 200px;
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 136, 0.1);
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
}

.drone-name {
  font-size: 14px;
  font-weight: 600;
  color: #00ff88;
}

.drone-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.drone-status.online {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

.drone-status.warning {
  background: rgba(255, 170, 0, 0.2);
  color: #ffaa00;
}

.drone-status.offline {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
}

.tooltip-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.info-row .label {
  color: rgba(255, 255, 255, 0.6);
}

.info-row .value {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.info-row .value.danger {
  color: #ff4444;
}

.info-row .value.warning {
  color: #ffaa00;
}

.info-row .value.good {
  color: #00ff88;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(10, 15, 30, 0.9);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 180px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #00ff88;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-value {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.stat-value.online {
  background: rgba(0, 255, 136, 0.15);
  color: #00ff88;
}

.stat-value.warning {
  background: rgba(255, 170, 0, 0.15);
  color: #ffaa00;
}

.stat-value.offline {
  background: rgba(255, 68, 68, 0.15);
  color: #ff4444;
}

.operation-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10, 15, 30, 0.8);
  border: 1px solid rgba(0, 255, 136, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>
