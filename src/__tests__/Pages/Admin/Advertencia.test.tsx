import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Advertencia } from '../../../Pages/Admin/Advertencia/Advertencia'
import { useAuth } from '../../../contexts/AuthContext'
import { AlertProvider } from '../../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import { api } from '../../../lib/api'
import React from 'react'

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

describe('Advertencia Page Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url.includes('/oficinas/find')) {
        return { data: [{ id: 1, nome_oficina: 'Oficina de Teatro', dias_semana: 'Seg/Qua', horario_inicio: '14:00', horario_fim: '16:00' }] }
      }
      if (url.includes('/alunos/find')) {
        return { data: [{ id: 10, nome_completo: 'Aluno Teste', numero_matricula: '123' }] }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a tela de advertencias com a listagem inicial', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AlertProvider>
            <Advertencia />
          </AlertProvider>
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Gestão de Advertências')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Pesquisar oficina por nome...')).toBeInTheDocument()
  })
})
