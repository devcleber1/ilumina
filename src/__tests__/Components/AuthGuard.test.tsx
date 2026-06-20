import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthGuard } from '../../Components/AuthGuard'
import { useAuth } from '../../contexts/AuthContext'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('AuthGuard Component', () => {
  it('deve exibir spinner/loading se loading for true', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
      loading: true,
    } as any)

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  it('deve renderizar children se o usuario for admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, tipo: 'admin' },
      isAuthenticated: true,
      logout: vi.fn(),
      loading: false,
    } as any)

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('deve bloquear acesso para nao-admin em tela restrita', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 2, tipo: 'pai' },
      isAuthenticated: true,
      logout: vi.fn(),
      loading: false,
    } as any)

    delete (window as any).location
    window.location = new URL('http://localhost:3000/dashboard') as any

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    )

    expect(screen.queryByText('Protected Content')).toBeNull()
    expect(screen.getByText('Acesso Bloqueado')).toBeInTheDocument()
  })
})
