import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Workshops from '../../../Pages/Admin/Workshops/Workshops'
import { useAuth } from '../../../contexts/AuthContext'
import { AlertProvider } from '../../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../../../lib/api'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../lib/api', () => ({
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

vi.mock('../../../Components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">App Sidebar</div>,
}))

vi.mock('../../../Components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => ({ open: true, toggleSidebar: vi.fn() }),
}))

describe('Workshops Page Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async url => {
      if (url.includes('/oficinas/find')) {
        return {
          data: [
            {
              id: 1,
              nome_oficina: 'Oficina de Teatro',
              descricao: 'Expressao corporal',
              horario_inicio: '14:00',
              horario_fim: '16:00',
              dias_semana: 'Seg,Qua',
              capacidade_maxima: 15,
            },
          ],
        }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a tela de oficinas do administrador', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <Workshops />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Oficinas')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Buscar oficina por nome...')).toBeInTheDocument()
  })
})
