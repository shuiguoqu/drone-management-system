import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../components/Layout.vue'
import DroneList from '../views/DroneList.vue'
import FlightRecord from '../views/FlightRecord.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        name: 'DroneList',
        component: DroneList
      },
      {
        path: '/flight-record',
        name: 'FlightRecord',
        component: FlightRecord
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.meta?.public) {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router
