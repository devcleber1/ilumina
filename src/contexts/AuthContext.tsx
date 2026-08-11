import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setLoggingOut } from '../lib/api'
import { useAlert } from './AlertContext'
import { SessionTimeoutModal } from '../Components/SessionTimeoutModal'
import { storageService } from '../lib/storageService'
import { LogOut } from 'lucide-react'

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
  isLoggingOut: boolean
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
  const [isLoggingOutState, setIsLoggingOutState] = useState(false)
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
        if (response.data?.user) {
          setUser(response.data.user)
          storageService.setItem('user', response.data.user)

          if (response.data.expiresAt) {
            storageService.setItem('expiresAt', String(response.data.expiresAt))
            setExpiresAt(response.data.expiresAt)
          } else {
            const expirationTime = 15 * 60 * 1000
            const newExpiresAt = Date.now() + expirationTime
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
          storageService.setItem('accessToken', data.accessToken)

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
    setIsLoggingOutState(true)
    setLoggingOut(true)
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Erro ao chamar logout no backend:', err)
    }
    storageService.removeItem('user')
    storageService.removeItem('expiresAt')
    storageService.removeItem('accessToken')
    setIsAuthenticated(false)
    setUser(null)
    setExpiresAt(null)
    setShowSessionModal(false)
    setIsModalDismissed(false)
    showAlert('success', 'Sessão encerrada', 'Logout realizado com sucesso.')

    setTimeout(() => {
      setIsLoggingOutState(false)
      setLoggingOut(false)
    }, 1200)
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
        storageService.setItem('accessToken', accessToken)
      }
    } catch (error) {
      console.error('Erro ao renovar sessão:', error)
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        renewSession,
        loading,
        isLoggingOut: isLoggingOutState,
      }}
    >
      {children}

      {/* Overlay Animado e Responsivo de Logout */}
      {isLoggingOutState && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 select-none">
          <div className="relative flex items-center justify-center mb-5 sm:mb-6">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping duration-1000" />
            <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-gray-900 border-4 border-red-500 flex items-center justify-center text-red-500 shadow-2xl relative z-10 animate-pulse">
              <LogOut className="h-8 w-8 sm:h-12 sm:w-12" />
            </div>
          </div>
          <div className="space-y-1.5 sm:space-y-2 text-center max-w-xs sm:max-w-md">
            <h3 className="font-title text-xl sm:text-2xl font-black text-white tracking-wide uppercase">
              Encerrando Sessão...
            </h3>
            <p className="font-body text-xs sm:text-sm font-semibold text-gray-300 animate-pulse">
              Limpando suas credenciais com segurança. Até breve!
            </p>
          </div>
          <div className="mt-5 sm:mt-6 flex items-center gap-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-bounce" />
          </div>
        </div>
      )}

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
