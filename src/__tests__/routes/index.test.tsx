import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AppRoutes from '../../routes/index'
import { useAuth } from '../../contexts/AuthContext'
import { MemoryRouter } from 'react-router-dom'


vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../Pages/Auth/Auth', () => ({
  default: () => <div data-testid="auth-page">Login Page</div>
}))

vi.mock('../../Pages/Parent/Portal', () => ({
  default: () => <div>Portal Responsavel</div>
}))

vi.mock('../../Pages/Teacher/PortalTeacher', () => ({
  default: () => <div>Portal Professor</div>
}))

vi.mock('../../Pages/Admin/Dashboard/Dashboard', () => ({
  Dashboard: () => <div>Dashboard Admin</div>
}))

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar a tela de login quando nao autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      logout: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByTestId('auth-page')).toBeInTheDocument()
  })

  it('deve renderizar Dashboard se autenticado como admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, tipo: 'admin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument()
  })
})
