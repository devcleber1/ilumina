import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setLoggingOut } from '../lib/api'
import { useAlert } from './AlertContext'
import { SessionTimeoutModal } from '../Components/SessionTimeoutModal'
import { storageService } from '../lib/storageService'

interface User {
  id: number
  nome_completo: string
  email: string
  tipo: string
  foto_perfil_url?: string
  nivel_acesso?: string
  precisa_trocar_senha?: boolean
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  renewSession: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!storageService.getItem<User>('user')
  )
  const [user, setUser] = useState<User | null>(() => {
    return storageService.getItem<User>('user') || null
  })

  const [showSessionModal, setShowSessionModal] = useState(false)
  const [isModalDismissed, setIsModalDismissed] = useState(false)
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const saved = storageService.getItem<string>('expiresAt')
    return saved ? Number(saved) : null
  })
  const [loading, setLoading] = useState(true)

  const { showAlert } = useAlert()

  // Monitorar expiração do token
  useEffect(() => {
    if (!isAuthenticated || !expiresAt) return

    const checkSession = () => {
      const now = Date.now()
      const timeLeft = expiresAt - now

      // Mostrar aviso faltando 2 minutos (120.000 ms)
      if (timeLeft <= 120000 && timeLeft > 0 && !showSessionModal && !isModalDismissed) {
        setShowSessionModal(true)
      }

      // Se expirou e o modal não renovou, força logout
      if (timeLeft <= 0) {
        logout()
      }
    }

    const handleSessionRenewed = () => {
      const saved = storageService.getItem<string>('expiresAt')
      if (saved) {
        setExpiresAt(Number(saved))
        setShowSessionModal(false)
        setIsModalDismissed(false)
      }
    }

    window.addEventListener('session-renewed', handleSessionRenewed)

    const interval = setInterval(checkSession, 1000) // Verifica a cada 1s
    return () => {
      clearInterval(interval)
      window.removeEventListener('session-renewed', handleSessionRenewed)
    }
  }, [isAuthenticated, expiresAt, showSessionModal, isModalDismissed])

  useEffect(() => {
    const fetchUser = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        if (response.data.success) {
          const userData = response.data.user
          setUser(userData)
          storageService.setItem('user', userData)

          if (!storageService.getItem('expiresAt')) {
            const newExpiresAt = Date.now() + 15 * 60 * 1000
            storageService.setItem('expiresAt', String(newExpiresAt))
            setExpiresAt(newExpiresAt)
          }

          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Erro ao recuperar perfil:', error)
        if ((error as any).response?.status === 401) {
          logout()
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [isAuthenticated])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha: password,
      })

      if (response.status === 200) {
        const data = response.data
        if (data.user) {
          const expirationTime = 15 * 60 * 1000
          const newExpiresAt = Date.now() + expirationTime

          storageService.setItem('user', data.user)
          storageService.setItem('expiresAt', String(newExpiresAt))

          setExpiresAt(newExpiresAt)
          setIsAuthenticated(true)
          setUser(data.user)
          setShowSessionModal(false)
          setIsModalDismissed(false)

          showAlert('success', 'Login realizado com sucesso!', 'Bem-vindo ao sistema.')
          return true
        }
        return false
      } else {
        showAlert('destructive', 'Erro no login', 'Credenciais inválidas.')
        return false
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      if (error.response?.status === 401) {
        // Retorna false silenciosamente para que o Auth.tsx cuide do erro (texto vermelho nos inputs)
        return false
      } else if (error.response?.status === 429) {
        showAlert(
          'destructive',
          'Acesso bloqueado temporariamente',
          'Muitas tentativas de login. Tente novamente mais tarde.'
        )
        return false
      } else {
        showAlert('destructive', 'Erro no login', 'Verifique sua conexão e tente novamente.')
        return false
      }
    }
  }

  const logout = async () => {
    setLoggingOut(true)
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Erro ao chamar logout no backend:', err)
    }
    storageService.removeItem('user')
    storageService.removeItem('expiresAt')
    setIsAuthenticated(false)
    setUser(null)
    setExpiresAt(null)
    setShowSessionModal(false)
    setIsModalDismissed(false)
    showAlert('success', 'Sessão encerrada', 'Logout realizado com sucesso.')

    setTimeout(() => {
      setLoggingOut(false)
    }, 1000)
  }

  const renewSession = async () => {
    try {
      const response = await api.post('/auth/refresh')
      const { accessToken } = response.data

      const expirationTime = 15 * 60 * 1000
      const newExpiresAt = Date.now() + expirationTime
      storageService.setItem('expiresAt', String(newExpiresAt))
      setExpiresAt(newExpiresAt)
      setShowSessionModal(false)
      setIsModalDismissed(false)
      window.dispatchEvent(new Event('session-renewed'))
      showAlert('success', 'Sessão renovada', 'Sua conexão permanecerá ativa.')

      if (accessToken) {
        // O backend atualiza o cookie HttpOnly; o frontend não persiste o token.
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, renewSession, loading }}>
      {children}
      <SessionTimeoutModal
        isOpen={showSessionModal}
        onRenew={renewSession}
        onLogout={logout}
        onClose={() => {
          setShowSessionModal(false)
          setIsModalDismissed(true)
        }}
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
