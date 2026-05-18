import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterAdmin from '../../../../Pages/Admin/Register/RegisterAdmin'
import { useAuth } from '../../../../contexts/AuthContext'
import { AlertProvider } from '../../../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:3001',
    },
  },
}))

vi.mock('../../../../Components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">App Sidebar</div>,
}))

vi.mock('../../../../Components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => ({ open: true, toggleSidebar: vi.fn() }),
}))

describe('RegisterAdmin Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)
  })

  it('deve renderizar o formulario de cadastro de administradores', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <RegisterAdmin />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Cadastro de Administradores')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Ana Maria Silva')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('admin@email.com')).toBeInTheDocument()
  })
})
