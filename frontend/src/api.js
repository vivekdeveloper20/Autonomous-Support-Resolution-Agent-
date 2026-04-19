import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getTickets  = (params) => api.get('/tickets', { params })
export const getTicket   = (id)     => api.get(`/tickets/${id}`)
export const runAgent    = (data)   => api.post('/run-agent', data)
export const getLogs     = (limit)  => api.get('/logs', { params: { limit } })
export const getStats    = ()       => api.get('/stats')

export default api
