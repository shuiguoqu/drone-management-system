import api from './index'

export const getDrones = (params) => {
  return api.get('/drones', { params })
}

export const getDroneById = (id) => {
  return api.get(`/drones/${id}`)
}

export const createDrone = (data) => {
  return api.post('/drones', data)
}

export const updateDrone = (id, data) => {
  return api.put(`/drones/${id}`, data)
}

export const deleteDrone = (id) => {
  return api.delete(`/drones/${id}`)
}
