import { createContext, useContext, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAlert } from './AlertContext'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))
  const { showAlert } = useAlert()

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha: password,
      })

      if (response.status === 200) {
        const data = response.data
        // O back-end retorna accessToken na resposta
        if (data.accessToken) {
          localStorage.setItem('token', data.accessToken)
          setIsAuthenticated(true)
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
    setIsAuthenticated(false)
    showAlert('warning', 'Logout realizado', 'Você foi desconectado do sistema.')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
