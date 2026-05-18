import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditUsers from '../../../../Pages/Admin/Users/EditUsers'
import { useAuth } from '../../../../contexts/AuthContext'
import { AlertProvider } from '../../../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../../../../lib/api'

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

describe('EditUsers Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url.includes('/admins/find')) {
        return { data: [{ id: 1, nome_completo: 'Admin Teste', email: 'admin@email.com', nivel_acesso: 'superadmin', status_admin: 'ativo' }] }
      }
      if (url.includes('/alunos/find')) {
        return { data: [] }
      }
      if (url.includes('/professores/find')) {
        return { data: [] }
      }
      if (url.includes('/pais/find')) {
        return { data: [] }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a listagem e edicao de usuarios', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <EditUsers />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Gerenciar Usuários')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar por nome...')).toBeInTheDocument()
  })
})
