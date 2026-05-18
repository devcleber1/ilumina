import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Dashboard } from '../../../Pages/Admin/Dashboard/Dashboard'
import { useAuth } from '../../../contexts/AuthContext'
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

vi.mock('../../../lib/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
  }),
}))

vi.mock('../../../Components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="sidebar">App Sidebar</div>,
}))

vi.mock('../../../Components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  useSidebar: () => ({ open: true, toggleSidebar: vi.fn() }),
}))

// Mock de recharts para não falhar nos testes sem window/canvas reais
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}))

describe('Dashboard Page Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Admin Teste', tipo: 'admin', nivel_acesso: 'superadmin' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)

    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url.includes('/stats/dashboard')) {
        return {
          data: {
            summary: {
              totalAlunos: 15,
              totalProfessores: 3,
              totalOficinas: 4,
              totalPais: 12,
            },
            chartData: [
              { month: 'Jan', alunos: 5 },
              { month: 'Fev', alunos: 10 },
              { month: 'Mar', alunos: 15 },
            ],
            ultimasAdvertencias: [
              {
                id: 1,
                data_advertencia: '2026-05-18T10:00:00Z',
                tipo_advertencia: 'Comportamento',
                descricao: 'Conversa paralela excessiva',
                gravidade: 'baixa',
                aluno: { nome_completo: 'Aluno Bagunceiro' },
                oficina: { nome_oficina: 'Oficina de Teatro' },
              },
            ],
            presencasPorOficina: [
              { turma: 'Oficina de Teatro', percentual: 90 },
            ],
          },
        }
      }
      if (url.includes('/logs')) {
        return {
          data: {
            logs: [
              {
                acao: 'Login de administrador',
                usuario_nome: 'Admin Teste',
                timestamp: '2026-05-18T12:00:00Z',
              },
            ],
          },
        }
      }
      return { data: [] }
    })
  })

  it('deve renderizar a tela de dashboard principal', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Monitoramento em Tempo Real — ONG Ilumina')).toBeInTheDocument()
    expect(screen.getAllByText('Alunos')[0]).toBeInTheDocument()
    expect(screen.getByText('Professores')).toBeInTheDocument()
    expect(screen.getByText('Oficinas')).toBeInTheDocument()
    expect(screen.getByText('Famílias')).toBeInTheDocument()
  })
})
