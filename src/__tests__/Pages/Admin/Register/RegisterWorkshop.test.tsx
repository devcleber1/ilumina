import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterWorkshop from '../../../../Pages/Admin/Register/RegisterWorkshop'
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

describe('RegisterWorkshop Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url.includes('/professores/find')) {
        return { data: [{ id: 10, nome_completo: 'Professor da Oficina', formacao: 'Artes Plásticas' }] }
      }
      return { data: [] }
    })
  })

  it('deve renderizar o formulario de cadastro de oficinas', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <RegisterWorkshop />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Nova Oficina')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Oficina de Pintura')).toBeInTheDocument()
  })
})
