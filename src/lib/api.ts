import axios from 'axios'
import { storageService } from './storageService'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true,
})

// Proteção CSRF Global (Contrato com o Backend)
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
api.defaults.headers.common['Content-Type'] = 'application/json'

// Adiciona o token em todas as requisições se ele existir no localStorage
api.interceptors.request.use(config => {
  const token = storageService.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Interceptor para lidar com erros de autenticação (Token expirado, etc)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    // Disparar evento global de servidor indisponível
    if (error.code === 'ERR_NETWORK') {
      window.dispatchEvent(new Event('server-down'))
    }

    // Não tentar renovar se a requisição for de login ou refresh
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Tenta renovar o token usando o refresh_token (que está no cookie)
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data

        if (accessToken) {
          storageService.setItem('token', accessToken)
          
          // Atualiza o tempo de expiração para o AuthContext
          const newExpiresAt = Date.now() + (15 * 60 * 1000)
          storageService.setItem('expiresAt', String(newExpiresAt))
          window.dispatchEvent(new Event('session-renewed'))

          // Atualiza o header da requisição original e repete
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          
          processQueue(null, accessToken)
          isRefreshing = false
          
          return api(originalRequest)
        }
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false
        
        // Se falhar o refresh, desloga limpando completamente a sessão
        storageService.removeItem('token')
        storageService.removeItem('user')
        storageService.removeItem('expiresAt')
        
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }

    return Promise.reject(error)
  }
)
