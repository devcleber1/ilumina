import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAlert } from './AlertContext'

interface User {
  id: number
  nome_completo: string
  email: string
  tipo: string
  foto_perfil_url?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const { showAlert } = useAlert()

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && !user) {
        try {
          const response = await api.get('/auth/me')
          if (response.data.success) {
            const userData = response.data.user
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
          }
        } catch (error) {
          console.error('Erro ao recuperar perfil:', error)
          // Se falhar drasticamente, desloga
          if ((error as any).response?.status === 401) {
            logout()
          }
        }
      }
    }
    fetchUser()
  }, [isAuthenticated, user])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha: password,
      })

      if (response.status === 200) {
        const data = response.data
        if (data.accessToken && data.user) {
          localStorage.setItem('token', data.accessToken)
          localStorage.setItem('user', JSON.stringify(data.user))
          setIsAuthenticated(true)
          setUser(data.user)
          showAlert('success', 'Login realizado com sucesso!', 'Bem-vindo ao sistema.')
          return true
        }
        return false
      } else {
        showAlert('destructive', 'Erro no login', 'Credenciais inválidas.')
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      showAlert('destructive', 'Erro no login', 'Verifique sua conexão e tente novamente.')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
    showAlert('warning', 'Logout realizado', 'Você foi desconectado do sistema.')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
