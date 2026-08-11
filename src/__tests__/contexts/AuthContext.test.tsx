import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { AlertProvider } from '../../contexts/AlertContext'
import { storageService } from '../../lib/storageService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
    setLoggingOut: vi.fn(),
  }
})

const AuthConsumer = () => {
  const { isAuthenticated, user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="auth-state">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
      <span data-testid="user-email">{user?.email || 'no-user'}</span>
      <button onClick={() => login('test@exemplo.com', 'senha123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    storageService.clearAll()
    vi.clearAllMocks()
  })

  it('deve restaurar a autenticacao se o user existir no storage', async () => {
    storageService.setItem('user', { email: 'saved@test.com', tipo: 'pai' })

    await act(async () => {
      render(
        <AlertProvider>
          <AuthProvider>
            <AuthConsumer />
          </AuthProvider>
        </AlertProvider>
      )
    })

    expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-in')
    expect(screen.getByTestId('user-email')).toHaveTextContent('saved@test.com')
  })

  it('deve realizar login com sucesso, definir token e recuperar dados do user', async () => {
    const userMock = {
      id: 1,
      email: 'test@exemplo.com',
      tipo: 'professor',
      nome_completo: 'Professor Teste',
    }
    vi.mocked(api.post).mockResolvedValueOnce({
      status: 200,
      data: { accessToken: 'valid-jwt-token', user: userMock },
    })

    render(
      <AlertProvider>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </AlertProvider>
    )

    const loginBtn = screen.getByText('Login')
    await act(async () => {
      loginBtn.click()
    })

    expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-in')
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@exemplo.com')
    expect(storageService.getItem('token')).toBeNull()
  })

  it('deve limpar os dados do storage e o estado no logout', async () => {
    storageService.setItem('user', { email: 'saved@test.com', tipo: 'pai' })

    vi.mocked(api.post).mockResolvedValueOnce({ status: 200 })

    render(
      <AlertProvider>
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      </AlertProvider>
    )

    const logoutBtn = screen.getByText('Logout')
    await act(async () => {
      logoutBtn.click()
    })

    expect(screen.getByTestId('auth-state')).toHaveTextContent('logged-out')
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user')
    expect(storageService.getItem('user')).toBeNull()
    expect(storageService.getItem('accessToken')).toBeNull()
  })

  it('deve exibir o overlay animado de logout e garantir que nenhuma senha é exposta no DOM', async () => {
    storageService.setItem('user', { email: 'secure@test.com', tipo: 'admin' })
    vi.mocked(api.post).mockResolvedValueOnce({ status: 200 })

    const SecureConsumer = () => {
      const { logout, isLoggingOut } = useAuth()
      return (
        <div>
          <span data-testid="logging-out-state">{isLoggingOut ? 'yes' : 'no'}</span>
          <button onClick={logout}>Encerrar</button>
        </div>
      )
    }

    render(
      <AlertProvider>
        <AuthProvider>
          <SecureConsumer />
        </AuthProvider>
      </AlertProvider>
    )

    await act(async () => {
      screen.getByText('Encerrar').click()
    })

    // Garantir que a tela de logout com texto seguro é exibida
    expect(screen.getByText('Encerrando Sessão...')).toBeInTheDocument()
    expect(screen.getByText('Limpando suas credenciais com segurança. Até breve!')).toBeInTheDocument()

    // Garantir que tokens e dados sensíveis não são vazados no DOM
    const bodyHtml = document.body.innerHTML
    expect(bodyHtml).not.toContain('senha123')
    expect(bodyHtml).not.toContain('valid-jwt-token')
  })
})
