import { createContext, useContext, useState, type ReactNode } from 'react'
import axios from 'axios'
import { useAlert } from './AlertContext'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { showAlert } = useAlert()

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(
        '/api/auth/login',
        {
          email,
          senha: password,
        },
        {
          withCredentials: true, // Para enviar e receber cookies
        }
      )

      if (response.status === 200) {
        const data = response.data
        // O back-end retorna accessToken na resposta
        localStorage.setItem('token', data.accessToken)
        setIsAuthenticated(true)
        showAlert('success', 'Login realizado com sucesso!', 'Bem-vindo ao sistema.')
        return true
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
