import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Presenca } from '../../../../Pages/Admin/Presenca/Presenca'
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

vi.mock('../../../../lib/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }),
}))

vi.mock('../../../../Components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">App Sidebar</div>,
}))

vi.mock('../../../../Components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => ({ open: true, toggleSidebar: vi.fn() }),
}))

describe('Presenca Page', () => {
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
              descricao: 'Aulas de Teatro',
              capacidade_maxima: 20,
              horario_inicio: '10:00',
              horario_fim: '11:30',
              dias_semana: 'Seg,Ter',
              status_oficina: 'ativa',
            },
          ],
        }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a pagina de presenca', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <Presenca />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Controle de Presença')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma oficina para realizar a chamada')).toBeInTheDocument()
  })
})
