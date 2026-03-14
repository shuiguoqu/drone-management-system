<template>
  <div class="radar-page">
    <div class="page-header">
      <h2>3D无人机实时监控</h2>
      <p>实时监控无人机位置与状态信息</p>
    </div>
    
    <div class="radar-container">
      <div ref="radarContainer" class="radar-scene"></div>
      
      <div v-if="hoveredDrone" class="drone-tooltip" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }">
        <div class="tooltip-header">{{ hoveredDrone.name }}</div>
        <div class="tooltip-content">
          <div class="tooltip-item">
            <span class="label">编号:</span>
            <span class="value">{{ hoveredDrone.droneCode }}</span>
          </div>
          <div class="tooltip-item">
            <span class="label">状态:</span>
            <a-tag :color="getStatusColor(hoveredDrone.status)" class="status-tag">{{ getStatusText(hoveredDrone.status) }}</a-tag>
          </div>
          <div class="tooltip-item">
            <span class="label">电量:</span>
            <a-progress :percent="hoveredDrone.batteryLevel" :stroke-color="getBatteryColor(hoveredDrone.batteryLevel)" size="small" />
          </div>
          <div class="tooltip-item">
            <span class="label">位置:</span>
            <span class="value">X: {{ hoveredDrone.position.x.toFixed(1) }}, Y: {{ hoveredDrone.position.y.toFixed(1) }}, Z: {{ hoveredDrone.position.z.toFixed(1) }}</span>
          </div>
          <div class="tooltip-item">
            <span class="label">高度:</span>
            <span class="value">{{ hoveredDrone.altitude }} 米</span>
          </div>
          <div class="tooltip-item">
            <span class="label">速度:</span>
            <span class="value">{{ hoveredDrone.speed }} m/s</span>
          </div>
        </div>
      </div>
      
      <div class="radar-stats">
        <a-row :gutter="12">
          <a-col :span="6" v-for="stat in statistics" :key="stat.key">
            <div class="stat-item" :class="stat.key">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const radarContainer = ref(null)
const hoveredDrone = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

let scene, camera, renderer, controls
let radarBase, scanLine, scanGroup
let droneMeshes = new Map()
let animationFrameId
let raycaster, mouse

const drones = ref([
  { id: 1, droneCode: 'DJI-001', name: '御3 侦察一号', status: 'flying', batteryLevel: 85, altitude: 120, speed: 8.5, position: { x: 15, y: 5, z: -20 } },
  { id: 2, droneCode: 'DJI-002', name: '御3 侦察二号', status: 'flying', batteryLevel: 72, altitude: 95, speed: 6.2, position: { x: -25, y: 3, z: -15 } },
  { id: 3, droneCode: 'DJI-003', name: '精灵4 巡检一号', status: 'idle', batteryLevel: 100, altitude: 0, speed: 0, position: { x: 30, y: 0, z: 10 } },
  { id: 4, droneCode: 'DJI-004', name: '精灵4 巡检二号', status: 'charging', batteryLevel: 45, altitude: 0, speed: 0, position: { x: -10, y: 0, z: 25 } },
  { id: 5, droneCode: 'DJI-005', name: 'Mavic Air2S', status: 'flying', batteryLevel: 65, altitude: 150, speed: 10.0, position: { x: -20, y: 6, z: -30 } },
  { id: 6, droneCode: 'DJI-006', name: 'Inspire 2', status: 'maintenance', batteryLevel: 30, altitude: 0, speed: 0, position: { x: 0, y: 0, z: 15 } },
  { id: 7, droneCode: 'DJI-007', name: 'Matrice 300', status: 'offline', batteryLevel: 0, altitude: 0, speed: 0, position: { x: 5, y: 0, z: -5 } }
])

const statistics = computed(() => {
  const stats = {
    total: drones.value.length,
    flying: 0,
    idle: 0,
    charging: 0,
    maintenance: 0,
    offline: 0
  }
  drones.value.forEach(drone => {
    if (stats[drone.status] !== undefined) {
      stats[drone.status]++
    }
  })
  return [
    { key: 'total', label: '全部无人机', value: stats.total },
    { key: 'flying', label: '飞行中', value: stats.flying },
    { key: 'idle', label: '待机', value: stats.idle },
    { key: 'charging', label: '充电中', value: stats.charging }
  ]
})

const getStatusColor = (status) => {
  const colors = {
    idle: 'green',
    flying: '#1677ff',
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

const getDroneColor = (status) => {
  const colors = {
    idle: 0x00ff88,
    flying: 0x0088ff,
    charging: 0xffaa00,
    maintenance: 0xaa00ff,
    offline: 0x666666
  }
  return colors[status] || 0x666666
}

const initScene = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x050a1a)
  scene.fog = new THREE.Fog(0x050a1a, 50, 200)

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 80, 120)

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(radarContainer.value.clientWidth, radarContainer.value.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  radarContainer.value.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.minDistance = 30
  controls.maxDistance = 200
  controls.maxPolarAngle = Math.PI / 2 - 0.1

  raycaster = new THREE.Raycaster()
  mouse = new THREE.Vector2()
}

const createLights = () => {
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(50, 100, 50)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  const pointLight = new THREE.PointLight(0x0088ff, 1, 100)
  pointLight.position.set(0, 30, 0)
  scene.add(pointLight)
}

const createRadarBase = () => {
  const radius = 100
  const segments = 128

  const baseGeometry = new THREE.CylinderGeometry(radius, radius, 2, segments, 1, true)
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x0a1a2a,
    emissive: 0x001122,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  })
  radarBase = new THREE.Mesh(baseGeometry, baseMaterial)
  radarBase.position.y = -1
  radarBase.receiveShadow = true
  scene.add(radarBase)

  const ringGeometry = new THREE.RingGeometry(radius - 0.5, radius, segments)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x0088ff,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  })
  const ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.1
  scene.add(ring)

  for (let i = 1; i < 5; i++) {
    const gridRadius = (radius / 5) * i
    const gridRing = new THREE.RingGeometry(gridRadius - 0.2, gridRadius, segments)
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x004488,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    })
    const gridMesh = new THREE.Mesh(gridRing, gridMaterial)
    gridMesh.rotation.x = -Math.PI / 2
    gridMesh.position.y = 0.1
    scene.add(gridMesh)
  }

  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
    ])
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x004488,
      transparent: true,
      opacity: 0.3
    })
    const line = new THREE.Line(lineGeometry, lineMaterial)
    line.position.y = 0.1
    scene.add(line)
  }

  const centerGeometry = new THREE.CylinderGeometry(2, 2, 4, 32)
  const centerMaterial = new THREE.MeshPhongMaterial({
    color: 0x0088ff,
    emissive: 0x004488,
    shininess: 100
  })
  const center = new THREE.Mesh(centerGeometry, centerMaterial)
  center.position.y = 2
  center.castShadow = true
  scene.add(center)
}

const createScanEffect = () => {
  scanGroup = new THREE.Group()
  scene.add(scanGroup)

  const scanLineGeometry = new THREE.PlaneGeometry(100, 2)
  const scanLineMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  scanLine = new THREE.Mesh(scanLineGeometry, scanLineMaterial)
  scanLine.rotation.x = -Math.PI / 2
  scanLine.position.y = 0.5
  scanGroup.add(scanLine)

  const scanGradientGeometry = new THREE.PlaneGeometry(100, 100)
  const scanGradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(0x00ff88) },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float time;
      varying vec2 vUv;
      void main() {
        float dist = length(vUv - vec2(0.0, 0.5));
        float alpha = max(0.0, 0.3 - dist * 0.5);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const scanGradient = new THREE.Mesh(scanGradientGeometry, scanGradientMaterial)
  scanGradient.rotation.x = -Math.PI / 2
  scanGradient.position.y = 0.2
  scanGroup.add(scanGradient)
}

const createDroneModel = (drone) => {
  const group = new THREE.Group()
  group.userData.drone = drone

  const bodyGeometry = new THREE.ConeGeometry(1.5, 4, 8)
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: getDroneColor(drone.status),
    emissive: getDroneColor(drone.status),
    emissiveIntensity: 0.3,
    shininess: 100
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.rotation.x = Math.PI
  body.position.y = 2
  body.castShadow = true
  group.add(body)

  const bladeGeometry = new THREE.BoxGeometry(6, 0.1, 0.3)
  const bladeMaterial = new THREE.MeshBasicMaterial({
    color: 0x666666,
    transparent: true,
    opacity: 0.8
  })
  
  const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial)
  blade1.position.y = 4.5
  group.add(blade1)
  
  const blade2 = blade1.clone()
  blade2.rotation.y = Math.PI / 2
  group.add(blade2)

  if (drone.status === 'flying') {
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: getDroneColor(drone.status),
      transparent: true,
      opacity: 0.2
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.y = 2
    group.add(glow)
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0, -drone.altitude / 2, 0)
  ])
  const lineMaterial = new THREE.LineDashedMaterial({
    color: getDroneColor(drone.status),
    dashSize: 1,
    gapSize: 1,
    transparent: true,
    opacity: 0.5
  })
  const altitudeLine = new THREE.Line(lineGeometry, lineMaterial)
  altitudeLine.computeLineDistances()
  group.add(altitudeLine)

  group.position.set(drone.position.x, drone.position.y, drone.position.z)
  return group
}

const createDrones = () => {
  drones.value.forEach(drone => {
    const mesh = createDroneModel(drone)
    droneMeshes.set(drone.id, mesh)
    scene.add(mesh)
  })
}

const updateDroneVisuals = (drone, mesh) => {
  const color = getDroneColor(drone.status)
  const body = mesh.children.find(c => c.geometry?.type === 'ConeGeometry')
  if (body) {
    body.material.color.setHex(color)
    body.material.emissive.setHex(color)
  }

  const altitudeLine = mesh.children.find(c => c.type === 'Line')
  if (altitudeLine) {
    altitudeLine.material.color.setHex(color)
  }

  let glow = mesh.children.find(c => c.geometry?.type === 'SphereGeometry' && c !== body)
  if (drone.status === 'flying' && !glow) {
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2
    })
    glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.y = 2
    mesh.add(glow)
  } else if (drone.status !== 'flying' && glow) {
    mesh.remove(glow)
    glow.geometry.dispose()
    glow.material.dispose()
  } else if (glow) {
    glow.material.color.setHex(color)
  }
}

const updateDronePositions = () => {
  drones.value.forEach(drone => {
    if (Math.random() < 0.0005) {
      const statuses = ['idle', 'flying', 'charging', 'maintenance', 'offline']
      drone.prevStatus = drone.status
      drone.status = statuses[Math.floor(Math.random() * statuses.length)]
      if (drone.status === 'flying' && drone.prevStatus !== 'flying') {
        drone.altitude = 50 + Math.random() * 150
        drone.speed = 3 + Math.random() * 10
      } else if (drone.status !== 'flying') {
        drone.altitude = 0
        drone.speed = 0
      }
    }

    if (drone.status === 'flying') {
      drone.position.x += (Math.random() - 0.5) * 0.3
      drone.position.z += (Math.random() - 0.5) * 0.3
      drone.position.y = 2 + Math.random() * 4

      if (Math.random() < 0.01) {
        drone.batteryLevel = Math.max(0, drone.batteryLevel - 1)
      }
    } else if (drone.status === 'charging') {
      if (Math.random() < 0.02) {
        drone.batteryLevel = Math.min(100, drone.batteryLevel + 1)
      }
    }

    const mesh = droneMeshes.get(drone.id)
    if (mesh) {
      if (drone.status === 'flying') {
        mesh.position.x = drone.position.x
        mesh.position.y = drone.position.y
        mesh.position.z = drone.position.z
      }

      updateDroneVisuals(drone, mesh)
    }
  })
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)

  if (scanGroup) {
    scanGroup.rotation.y += 0.01
  }

  updateDronePositions()

  droneMeshes.forEach((mesh) => {
    const blades = mesh.children.filter(c => c.geometry?.type === 'BoxGeometry' && c.geometry.parameters.height === 0.1)
    blades.forEach(blade => {
      blade.rotation.y += 0.3
    })
  })

  controls.update()
  renderer.render(scene, camera)
}

const handleMouseMove = (event) => {
  const rect = radarContainer.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  let foundDrone = null
  for (let intersect of intersects) {
    let object = intersect.object
    while (object && !object.userData.drone) {
      object = object.parent
    }
    if (object && object.userData.drone) {
      foundDrone = object.userData.drone
      break
    }
  }

  if (foundDrone) {
    hoveredDrone.value = foundDrone
    tooltipPosition.value = { x: event.clientX + 15, y: event.clientY + 15 }
    document.body.style.cursor = 'pointer'
  } else {
    hoveredDrone.value = null
    document.body.style.cursor = 'default'
  }
}

const handleResize = () => {
  if (camera && renderer && radarContainer.value) {
    camera.aspect = radarContainer.value.clientWidth / radarContainer.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(radarContainer.value.clientWidth, radarContainer.value.clientHeight)
  }
}

onMounted(async () => {
  await nextTick()
  initScene()
  createLights()
  createRadarBase()
  createScanEffect()
  createDrones()
  animate()

  window.addEventListener('resize', handleResize)
  radarContainer.value.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (radarContainer.value) {
    radarContainer.value.removeEventListener('mousemove', handleMouseMove)
  }
  cancelAnimationFrame(animationFrameId)
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.radar-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.page-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.page-header h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.radar-container {
  position: relative;
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.radar-scene {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #0a1a2a 0%, #050a1a 100%);
}

.drone-tooltip {
  position: fixed;
  background: rgba(10, 26, 42, 0.95);
  border: 1px solid #0088ff;
  border-radius: 8px;
  padding: 12px;
  color: white;
  z-index: 1000;
  min-width: 220px;
  box-shadow: 0 4px 20px rgba(0, 136, 255, 0.3);
  backdrop-filter: blur(8px);
}

.tooltip-header {
  font-size: 16px;
  font-weight: 600;
  color: #00ff88;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 136, 255, 0.3);
  padding-bottom: 8px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tooltip-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.tooltip-item .label {
  color: #8899aa;
}

.tooltip-item .value {
  color: #ffffff;
  font-weight: 500;
}

.status-tag {
  margin: 0;
  padding: 1px 6px;
  font-size: 12px;
}

.radar-stats {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 100;
}

.stat-item {
  background: rgba(10, 26, 42, 0.8);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: 1px solid rgba(0, 136, 255, 0.2);
  backdrop-filter: blur(8px);
}

.stat-item .stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #8899aa;
  margin-top: 4px;
}

.stat-item.total .stat-value {
  color: #ffffff;
}

.stat-item.flying .stat-value {
  color: #0088ff;
}

.stat-item.idle .stat-value {
  color: #00ff88;
}

.stat-item.charging .stat-value {
  color: #ffaa00;
}
</style>
