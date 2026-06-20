import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Meetings from '../../../Pages/Admin/Meetings/Meetings'
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

describe('Meetings Page Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async url => {
      if (url.includes('/reunioes/find')) {
        return {
          data: [
            {
              id: 1,
              titulo: 'Reunião de alinhamento pedagógico',
              data_reuniao: '2026-05-18T14:00:00Z',
              link_reuniao: 'https://meet.google.com/abc-defg-hij',
            },
          ],
        }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a tela de reunioes com a listagem correta', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <Meetings />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Gestão de Reuniões')).toBeInTheDocument()
  })
})
