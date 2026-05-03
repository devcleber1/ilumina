import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAlert } from './AlertContext'
import { SessionTimeoutModal } from '../Components/SessionTimeoutModal'

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
  renewSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const saved = localStorage.getItem('expiresAt')
    return saved ? Number(saved) : null
  })

  const { showAlert } = useAlert()

  // Monitorar expiração do token
  useEffect(() => {
    if (!isAuthenticated || !expiresAt) return

    const checkSession = () => {
      const now = Date.now()
      const timeLeft = expiresAt - now
      
      // Mostrar aviso faltando 2 minutos (120.000 ms)
      if (timeLeft <= 120000 && timeLeft > 0 && !showSessionModal) {
        setShowSessionModal(true)
      }
      
      // Se expirou e o modal não renovou, força logout
      if (timeLeft <= 0) {
        logout()
      }
    }

    const handleSessionRenewed = () => {
      const saved = localStorage.getItem('expiresAt')
      if (saved) {
        setExpiresAt(Number(saved))
        setShowSessionModal(false)
      }
    }

    window.addEventListener('session-renewed', handleSessionRenewed)

    const interval = setInterval(checkSession, 1000) // Verifica a cada 1s
    return () => {
      clearInterval(interval)
      window.removeEventListener('session-renewed', handleSessionRenewed)
    }
  }, [isAuthenticated, expiresAt, showSessionModal])

  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && !user) {
        try {
          const response = await api.get('/auth/me')
          if (response.data.success) {
            const userData = response.data.user
            setUser(userData)
            localStorage.setItem('user', JSON.stringify(userData))
            
            // Garantir que expiresAt seja definido se estiver faltando
            if (!localStorage.getItem('expiresAt')) {
               const newExpiresAt = Date.now() + (15 * 60 * 1000)
               localStorage.setItem('expiresAt', String(newExpiresAt))
               setExpiresAt(newExpiresAt)
            }
          }
        } catch (error) {
          console.error('Erro ao recuperar perfil:', error)
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
          // O backend retorna 15m para o access_token
          const expirationTime = 15 * 60 * 1000 
          const newExpiresAt = Date.now() + expirationTime
          
          localStorage.setItem('token', data.accessToken)
          localStorage.setItem('user', JSON.stringify(data.user))
          localStorage.setItem('expiresAt', String(newExpiresAt))
          
          setExpiresAt(newExpiresAt)
          setIsAuthenticated(true)
          setUser(data.user)
          setShowSessionModal(false)
          
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
    localStorage.removeItem('expiresAt')
    setIsAuthenticated(false)
    setUser(null)
    setExpiresAt(null)
    setShowSessionModal(false)
    showAlert('warning', 'Sessão encerrada', 'Você foi desconectado por segurança.')
  }

  const renewSession = async () => {
    try {
      const response = await api.post('/auth/refresh')
      const { accessToken } = response.data
      
      if (accessToken) {
        localStorage.setItem('token', accessToken)
        const expirationTime = 15 * 60 * 1000
        const newExpiresAt = Date.now() + expirationTime
        
        localStorage.setItem('expiresAt', String(newExpiresAt))
        setExpiresAt(newExpiresAt)
        setShowSessionModal(false)
        window.dispatchEvent(new Event('session-renewed'))
        showAlert('success', 'Sessão renovada', 'Sua conexão permanecerá ativa.')
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, renewSession }}>
      {children}
      <SessionTimeoutModal 
        isOpen={showSessionModal}
        onRenew={renewSession}
        onLogout={logout}
        expiresInSeconds={expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0}
      />
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
