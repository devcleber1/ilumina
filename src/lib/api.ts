import axios from 'axios'
import { storageService } from './storageService'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
)

const DEFAULT_API_URL = isLocalhost 
  ? 'http://localhost:3001' 
  : 'https://back-end-ilumina-production.up.railway.app'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
  withCredentials: true,
})

// Proteção CSRF Global (Contrato com o Backend)
api.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
api.defaults.headers.common['Content-Type'] = 'application/json'

api.interceptors.request.use(
  config => {
    const token = storageService.getItem<string>('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: any[] = []

export let isLoggingOut = false
export const setLoggingOut = (value: boolean) => {
  isLoggingOut = value
}

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

    // Ignora erros pendentes de outras rotas se estivermos no meio do logout
    if (isLoggingOut) {
      if (originalRequest?.url?.includes('/auth/logout')) {
        return Promise.reject(error)
      }
      return new Promise(() => {}) // pending infinito para suprimir o erro nos componentes
    }

    // Disparar evento global de servidor indisponível
    if (error.code === 'ERR_NETWORK') {
      window.dispatchEvent(new Event('server-down'))
    }

    // Não tentar renovar se a requisição for de login ou refresh
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error)
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(originalRequest))
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Tenta renovar o token usando o refresh_token (que está no cookie)
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data

        if (accessToken) {
          storageService.setItem('accessToken', accessToken)
        }

        const newExpiresAt = Date.now() + 15 * 60 * 1000
        storageService.setItem('expiresAt', String(newExpiresAt))
        window.dispatchEvent(new Event('session-renewed'))

        processQueue(null)
        isRefreshing = false

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        isRefreshing = false

        // Se falhar o refresh, desloga limpando completamente a sessão
        storageService.removeItem('user')
        storageService.removeItem('expiresAt')
        storageService.removeItem('accessToken')

        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }

    return Promise.reject(error)
  }
)
