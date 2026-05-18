import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterTeacher from '../../../../Pages/Admin/Register/RegisterTeacher'
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

describe('RegisterTeacher Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)
  })

  it('deve renderizar o formulario de cadastro de professores', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <RegisterTeacher />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Cadastro de Professores')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Carlos Alberto')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex: Graduação em Educação Física')).toBeInTheDocument()
  })
})
