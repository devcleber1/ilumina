import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true,
})

// Adiciona o token em todas as requisições se ele existir no localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para lidar com erros de autenticação (Token expirado, etc)
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Tenta renovar o token usando o refresh_token (que está no cookie)
        const response = await api.post('/auth/refresh')
        const { accessToken } = response.data

        if (accessToken) {
          localStorage.setItem('token', accessToken)

          // Atualiza o header da requisição original e repete
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Se falhar o refresh, desloga
        localStorage.removeItem('token')
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }

    return Promise.reject(error)
  }
)
