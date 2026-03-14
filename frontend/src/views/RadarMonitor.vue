<template>
  <div class="radar-monitor">
    <div class="page-header">
      <div class="header-title">
        <h2>3D 雷达监控</h2>
        <p>实时监控所有无人机位置与状态</p>
      </div>
      <div class="header-stats">
        <div class="stat-item" v-for="stat in stats" :key="stat.key" :class="stat.key">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </div>

    <div class="radar-container">
      <div ref="containerRef" class="three-container"></div>
      
      <div class="info-panel">
        <div class="panel-title">
          <span class="pulse-dot"></span>
          无人机列表
        </div>
        <div class="drone-list">
          <div 
            v-for="drone in drones" 
            :key="drone.id"
            class="drone-item"
            :class="{ active: hoveredDrone === drone.id }"
            @mouseenter="handleDroneHover(drone.id)"
            @mouseleave="handleDroneLeave"
          >
            <div class="drone-icon" :style="{ background: drone.color }"></div>
            <div class="drone-info">
              <span class="drone-name">{{ drone.name }}</span>
              <a-tag :color="getStatusColor(drone.status)" size="small">
                {{ getStatusText(drone.status) }}
              </a-tag>
            </div>
            <div class="drone-coords">
              X: {{ drone.position.x.toFixed(1) }} 
              Y: {{ drone.position.y.toFixed(1) }} 
              Z: {{ drone.position.z.toFixed(1) }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="tooltip.visible" 
           class="tooltip" 
           :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
        <div class="tooltip-header" :style="{ borderColor: tooltip.color }">
          <span class="tooltip-icon" :style="{ background: tooltip.color }"></span>
          <span class="tooltip-name">{{ tooltip.name }}</span>
        </div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="label">状态</span>
            <a-tag :color="getStatusColor(tooltip.status)" size="small">
              {{ getStatusText(tooltip.status) }}
            </a-tag>
          </div>
          <div class="tooltip-row">
            <span class="label">机型</span>
            <span class="value">{{ tooltip.model }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">电量</span>
            <a-progress :percent="tooltip.battery" :stroke-color="getBatteryColor(tooltip.battery)" size="small" />
          </div>
          <div class="tooltip-row">
            <span class="label">高度</span>
            <span class="value">{{ tooltip.position.z.toFixed(1) }} m</span>
          </div>
          <div class="tooltip-row">
            <span class="label">坐标</span>
            <span class="value coords">
              ({{ tooltip.position.x.toFixed(1) }}, {{ tooltip.position.y.toFixed(1) }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const containerRef = ref(null)
const hoveredDrone = ref(null)

let scene, camera, renderer, controls
let radarBase, scanLine, droneMeshes = []
let animationId
let positionUpdateInterval, statusUpdateInterval

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  status: '',
  model: '',
  battery: 0,
  position: { x: 0, y: 0, z: 0 },
  color: ''
})

const drones = ref([
  {
    id: 1,
    name: 'DJI-Mavic-001',
    model: 'Mavic 3 Pro',
    status: 'flying',
    battery: 85,
    position: { x: 15, y: 20, z: 25 },
    color: '#00ff88'
  },
  {
    id: 2,
    name: 'DJI-Mavic-002',
    model: 'Mavic 3 Classic',
    status: 'idle',
    battery: 100,
    position: { x: -25, y: 15, z: 10 },
    color: '#00d4ff'
  },
  {
    id: 3,
    name: 'DJI-Air-001',
    model: 'Air 2S',
    status: 'flying',
    battery: 62,
    position: { x: 30, y: -10, z: 35 },
    color: '#ff6b6b'
  },
  {
    id: 4,
    name: 'DJI-Mini-001',
    model: 'Mini 3 Pro',
    status: 'charging',
    battery: 45,
    position: { x: -10, y: -30, z: 5 },
    color: '#ffd93d'
  },
  {
    id: 5,
    name: 'DJI-Mavic-003',
    model: 'Mavic 3 Enterprise',
    status: 'flying',
    battery: 78,
    position: { x: 5, y: 35, z: 45 },
    color: '#c56cf0'
  },
  {
    id: 6,
    name: 'DJI-Air-002',
    model: 'Air 3',
    status: 'maintenance',
    battery: 30,
    position: { x: -35, y: 5, z: 8 },
    color: '#ff9f43'
  },
  {
    id: 7,
    name: 'DJI-Mini-002',
    model: 'Mini 4 Pro',
    status: 'flying',
    battery: 92,
    position: { x: 20, y: -25, z: 30 },
    color: '#54a0ff'
  }
])

const stats = computed(() => {
  const statusCounts = {
    total: drones.value.length,
    flying: drones.value.filter(d => d.status === 'flying').length,
    idle: drones.value.filter(d => d.status === 'idle').length,
    charging: drones.value.filter(d => d.status === 'charging').length,
    maintenance: drones.value.filter(d => d.status === 'maintenance').length
  }
  return [
    { key: 'total', label: '总数', value: statusCounts.total },
    { key: 'flying', label: '飞行中', value: statusCounts.flying },
    { key: 'idle', label: '待机', value: statusCounts.idle },
    { key: 'charging', label: '充电', value: statusCounts.charging },
    { key: 'maintenance', label: '维护', value: statusCounts.maintenance }
  ]
})

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

const initThree = () => {
  const container = containerRef.value
  if (!container) return

  const width = container.clientWidth
  const height = container.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a1a)
  scene.fog = new THREE.Fog(0x0a0a1a, 80, 200)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(60, 50, 60)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 30
  controls.maxDistance = 150
  controls.maxPolarAngle = Math.PI / 2.2

  createRadarBase()
  createGridLines()
  createScanEffect()
  createDrones()
  addLights()

  animate()
}

const createRadarBase = () => {
  const baseGeometry = new THREE.CylinderGeometry(50, 52, 3, 64)
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a1a2e,
    transparent: true,
    opacity: 0.9,
    shininess: 100
  })
  radarBase = new THREE.Mesh(baseGeometry, baseMaterial)
  radarBase.position.y = -1.5
  scene.add(radarBase)

  const ringGeometry = new THREE.TorusGeometry(50, 0.5, 16, 100)
  const ringMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x00ff88, 
    transparent: true, 
    opacity: 0.6 
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0
  scene.add(ring)

  for (let i = 1; i <= 4; i++) {
    const innerRingGeometry = new THREE.TorusGeometry(i * 12, 0.2, 16, 100)
    const innerRingMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.3 
    })
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial)
    innerRing.rotation.x = Math.PI / 2
    innerRing.position.y = 0.1
    scene.add(innerRing)
  }

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const lineGeometry = new THREE.BufferGeometry()
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0x00ff88, 
      transparent: true, 
      opacity: 0.2 
    })
    const points = [
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(Math.cos(angle) * 50, 0.1, Math.sin(angle) * 50)
    ]
    lineGeometry.setFromPoints(points)
    const line = new THREE.Line(lineGeometry, lineMaterial)
    scene.add(line)
  }
}

const createGridLines = () => {
  const gridHelper = new THREE.GridHelper(100, 20, 0x00ff88, 0x004422)
  gridHelper.position.y = 0.2
  gridHelper.material.opacity = 0.15
  gridHelper.material.transparent = true
  scene.add(gridHelper)
}

const createScanEffect = () => {
  const scanGeometry = new THREE.CircleGeometry(50, 64, 0, Math.PI / 6)
  const scanMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide
  })
  scanLine = new THREE.Mesh(scanGeometry, scanMaterial)
  scanLine.rotation.x = -Math.PI / 2
  scanLine.position.y = 0.3
  scene.add(scanLine)
}

const createDrones = () => {
  droneMeshes.forEach(mesh => {
    if (mesh.userData.line) scene.remove(mesh.userData.line)
    scene.remove(mesh)
  })
  droneMeshes = []

  drones.value.forEach(drone => {
    const coneGeometry = new THREE.ConeGeometry(1.5, 3, 8)
    const coneMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(drone.color),
      emissive: new THREE.Color(drone.color),
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.9
    })
    const cone = new THREE.Mesh(coneGeometry, coneMaterial)
    cone.position.set(drone.position.x, drone.position.z, drone.position.y)
    cone.rotation.x = Math.PI
    cone.userData = { droneId: drone.id }

    const glowGeometry = new THREE.SphereGeometry(2, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(drone.color),
      transparent: true,
      opacity: 0.2
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    cone.add(glow)

    const lineGeometry = new THREE.BufferGeometry()
    const lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(drone.color),
      transparent: true,
      opacity: 0.4
    })
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -drone.position.z, 0)
    ]
    lineGeometry.setFromPoints(points)
    const line = new THREE.Line(lineGeometry, lineMaterial)
    line.position.set(drone.position.x, drone.position.z, drone.position.y)
    scene.add(line)
    cone.userData.line = line

    scene.add(cone)
    droneMeshes.push(cone)
  })
}

const addLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50)
  scene.add(directionalLight)

  const pointLight = new THREE.PointLight(0x00ff88, 1, 100)
  pointLight.position.set(0, 30, 0)
  scene.add(pointLight)
}

const animate = () => {
  animationId = requestAnimationFrame(animate)

  if (scanLine) {
    scanLine.rotation.z += 0.01
  }

  droneMeshes.forEach((mesh, index) => {
    mesh.position.y += Math.sin(Date.now() * 0.002 + index) * 0.02
    if (mesh.userData.line) {
      const drone = drones.value.find(d => d.id === mesh.userData.droneId)
      if (drone) {
        mesh.userData.line.position.y = mesh.position.y / 2
        mesh.userData.line.scale.y = mesh.position.y / drone.position.z
      }
    }
  })

  controls.update()
  renderer.render(scene, camera)
}

const handleResize = () => {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

const handleMouseMove = (event) => {
  if (!containerRef.value || !camera || !scene) return

  const rect = containerRef.value.getBoundingClientRect()
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )

  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(droneMeshes)

  if (intersects.length > 0) {
    const droneId = intersects[0].object.userData.droneId
    const drone = drones.value.find(d => d.id === droneId)
    if (drone) {
      hoveredDrone.value = droneId
      tooltip.visible = true
      tooltip.x = event.clientX - rect.left + 15
      tooltip.y = event.clientY - rect.top + 15
      tooltip.name = drone.name
      tooltip.status = drone.status
      tooltip.model = drone.model
      tooltip.battery = drone.battery
      tooltip.position = drone.position
      tooltip.color = drone.color
    }
  } else {
    hoveredDrone.value = null
    tooltip.visible = false
  }
}

const handleDroneHover = (droneId) => {
  hoveredDrone.value = droneId
  const mesh = droneMeshes.find(m => m.userData.droneId === droneId)
  if (mesh) {
    mesh.scale.set(1.3, 1.3, 1.3)
  }
}

const handleDroneLeave = () => {
  hoveredDrone.value = null
  droneMeshes.forEach(mesh => {
    mesh.scale.set(1, 1, 1)
  })
}

const updateDronePositions = () => {
  drones.value.forEach(drone => {
    if (drone.status === 'flying') {
      drone.position.x += (Math.random() - 0.5) * 2
      drone.position.y += (Math.random() - 0.5) * 2
      drone.position.x = Math.max(-45, Math.min(45, drone.position.x))
      drone.position.y = Math.max(-45, Math.min(45, drone.position.y))
    }
  })

  droneMeshes.forEach(mesh => {
    const drone = drones.value.find(d => d.id === mesh.userData.droneId)
    if (drone) {
      mesh.position.x = drone.position.x
      mesh.position.z = drone.position.y
    }
  })
}

const updateDroneStatus = () => {
  const statuses = ['flying', 'idle', 'charging', 'maintenance']
  const randomDrone = drones.value[Math.floor(Math.random() * drones.value.length)]
  const currentIndex = statuses.indexOf(randomDrone.status)
  const newIndex = (currentIndex + 1) % statuses.length
  randomDrone.status = statuses[newIndex]
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', handleResize)
  containerRef.value?.addEventListener('mousemove', handleMouseMove)
  
  positionUpdateInterval = setInterval(updateDronePositions, 2000)
  statusUpdateInterval = setInterval(updateDroneStatus, 8000)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  if (positionUpdateInterval) {
    clearInterval(positionUpdateInterval)
  }
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval)
  }
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.radar-monitor {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  margin: -24px;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
}

.header-title h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

.header-title p {
  margin: 0;
  color: #888;
  font-size: 14px;
}

.header-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.stat-item.flying .stat-value { color: #1890ff; }
.stat-item.idle .stat-value { color: #52c41a; }
.stat-item.charging .stat-value { color: #faad14; }
.stat-item.maintenance .stat-value { color: #722ed1; }

.radar-container {
  flex: 1;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 136, 0.2);
  box-shadow: 
    0 0 40px rgba(0, 255, 136, 0.1),
    inset 0 0 60px rgba(0, 255, 136, 0.05);
}

.three-container {
  width: 100%;
  height: 100%;
}

.info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: rgba(10, 10, 26, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 136, 0.3);
  backdrop-filter: blur(10px);
  max-height: calc(100% - 40px);
  overflow: hidden;
}

.panel-title {
  padding: 15px 20px;
  font-size: 14px;
  font-weight: 600;
  color: #00ff88;
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #00ff88;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.drone-list {
  max-height: 400px;
  overflow-y: auto;
}

.drone-item {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s;
}

.drone-item:hover,
.drone-item.active {
  background: rgba(0, 255, 136, 0.1);
}

.drone-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 10px;
  box-shadow: 0 0 10px currentColor;
}

.drone-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.drone-name {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.drone-coords {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.tooltip {
  position: absolute;
  background: rgba(10, 10, 26, 0.95);
  border-radius: 8px;
  padding: 12px 16px;
  min-width: 200px;
  pointer-events: none;
  z-index: 100;
  border: 1px solid rgba(0, 255, 136, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  border-bottom: 2px solid;
}

.tooltip-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

.tooltip-name {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tooltip-row .label {
  color: #888;
  font-size: 12px;
  width: 40px;
}

.tooltip-row .value {
  color: #fff;
  font-size: 12px;
}

.tooltip-row .coords {
  font-family: monospace;
}

.tooltip-row :deep(.ant-progress) {
  flex: 1;
}

.drone-list::-webkit-scrollbar {
  width: 4px;
}

.drone-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.drone-list::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 136, 0.3);
  border-radius: 2px;
}
</style>
