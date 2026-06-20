import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortalResponsavel from '../../../Pages/Parent/Portal'
import { useAuth } from '../../../contexts/AuthContext'
import { api } from '../../../lib/api'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../../contexts/AlertContext', () => ({
  useAlert: () => ({ showAlert: vi.fn() }),
  AlertProvider: ({ children }: any) => <div data-testid="alert-provider">{children}</div>,
}))

vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
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

vi.mock('../../../lib/storageService', () => ({
  storageService: {
    getItem: vi.fn().mockReturnValue('dummy-token'),
    setItem: vi.fn(),
  },
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}))

vi.mock('../../../assets/logo.png', () => ({
  default: 'logo-mock-url',
}))

const mockPortalDataUmFilho = {
  success: true,
  pai: {
    nome: 'Carlos Silva',
    email: 'carlos@email.com',
    telefone: '11999999999',
    foto_perfil_url: '',
    data_nascimento: '1980-01-01',
    profissao: 'Engenheiro',
  },
  resumo: {
    total_filhos: 1,
    media_presenca: 90,
    total_advertencias: 0,
    total_advertencias_pendentes: 0,
    total_advertencias_resolvidas: 0,
  },
  filhos: [
    {
      id: 101,
      nome_completo: 'Lucas Silva',
      foto_perfil_url: '',
      idade: 12,
      data_nascimento: '2014-05-15',
      matricula: 'MAT-101',
      contato_emergencia: '11988888888',
      turma_principal: 'Turma A',
      percentual_presenca: 90,
      total_advertencias: 0,
      total_advertencias_pendentes: 0,
      total_advertencias_resolvidas: 0,
      oficinas: [
        {
          id: 1,
          nome: 'Teatro',
          professor: 'Professor Teatro',
          dias_semana: 'Seg e Qua',
          horario: '14:00',
          percentual: 90,
          status: 'Excelente',
        },
      ],
      advertencias_list: [],
      historico_presenca: [
        {
          id: 1,
          data: '2026-05-20',
          oficina: 'Teatro',
          presente: true,
          observacoes: 'Participou bem',
        },
        { id: 2, data: '2026-05-22', oficina: 'Teatro', presente: true, observacoes: '' },
        {
          id: 3,
          data: '2026-05-18',
          oficina: 'Teatro',
          presente: false,
          observacoes: 'Faltou sem justificativa',
        },
        { id: 4, data: '2026-05-25', oficina: 'Teatro', presente: true, observacoes: '' },
        { id: 5, data: '2026-05-24', oficina: 'Teatro', presente: true, observacoes: '' },
        {
          id: 6,
          data: '2026-05-19',
          oficina: 'Teatro',
          presente: false,
          observacoes: 'Consulta médica',
        },
      ],
    },
  ],
}

describe('PortalResponsavel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome_completo: 'Carlos Silva', tipo: 'responsavel' },
      isAuthenticated: true,
      loading: false,
      logout: vi.fn(),
    } as any)
  })

  it('it should render parent dashboard with child cards', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPortalDataUmFilho })

    await act(async () => {
      render(
        <MemoryRouter>
          <PortalResponsavel />
        </MemoryRouter>
      )
    })

    expect(screen.getByText('Olá, Carlos 👋')).toBeInTheDocument()
    expect(screen.getByText('Lucas Silva')).toBeInTheDocument()
  })

  it('it should order the attendance records from most recent to oldest and limit to 5 in recent history', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPortalDataUmFilho })

    await act(async () => {
      render(
        <MemoryRouter>
          <PortalResponsavel />
        </MemoryRouter>
      )
    })

    // Abre o modal de detalhes do filho
    const verDetalhesBtn = screen.getByText('Ver Detalhes')
    await act(async () => {
      fireEvent.click(verDetalhesBtn)
    })

    // Deve exibir no máximo 5 registros. As datas formatadas ordenadas decrescentemente:
    // 25 mai. 2026 (index 4) -> 24 mai. 2026 (index 5) -> 22 mai. 2026 (index 2) -> 20 mai. 2026 (index 1) -> 19 mai. 2026 (index 6)
    // 18 mai. 2026 (index 3) deve ficar oculto por padrão (limite de 5)
    expect(screen.getAllByText('25 mai. 2026')[0]).toBeInTheDocument()
    expect(screen.getAllByText('24 mai. 2026')[0]).toBeInTheDocument()
    expect(screen.getAllByText('22 mai. 2026')[0]).toBeInTheDocument()
    expect(screen.getAllByText('20 mai. 2026')[0]).toBeInTheDocument()
    expect(screen.getAllByText('19 mai. 2026')[0]).toBeInTheDocument()
    expect(screen.queryByText('18 mai. 2026')).not.toBeInTheDocument()
  })

  it('it should show the "Ver mais" button if there are more than 5 attendance records', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPortalDataUmFilho })

    await act(async () => {
      render(
        <MemoryRouter>
          <PortalResponsavel />
        </MemoryRouter>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Ver Detalhes'))
    })

    expect(screen.getByText('Ver mais')).toBeInTheDocument()
  })

  it('it should open the modal with all records ordered upon clicking "Ver mais"', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockPortalDataUmFilho })

    await act(async () => {
      render(
        <MemoryRouter>
          <PortalResponsavel />
        </MemoryRouter>
      )
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Ver Detalhes'))
    })

    const verMaisBtn = screen.getByText('Ver mais')
    await act(async () => {
      fireEvent.click(verMaisBtn)
    })

    // O modal contendo o histórico completo deve abrir
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Histórico de presenças — Lucas Silva')).toBeInTheDocument()

    // O sexto item que estava oculto agora deve estar visível
    expect(screen.getAllByText('25 mai. 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('24 mai. 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('22 mai. 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('20 mai. 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('19 mai. 2026').length).toBeGreaterThan(0)
    expect(screen.getAllByText('18 mai. 2026').length).toBeGreaterThan(0)
  })

  it('it should display child name in table headers and rows when multiple children are linked', async () => {
    const mockPortalDataMultiplo = {
      ...mockPortalDataUmFilho,
      resumo: { ...mockPortalDataUmFilho.resumo, total_filhos: 2 },
      filhos: [
        ...mockPortalDataUmFilho.filhos,
        {
          id: 102,
          nome_completo: 'Mariana Silva',
          foto_perfil_url: '',
          idade: 9,
          data_nascimento: '2017-08-10',
          matricula: 'MAT-102',
          contato_emergencia: '11988888888',
          turma_principal: 'Turma B',
          percentual_presenca: 95,
          total_advertencias: 0,
          total_advertencias_pendentes: 0,
          total_advertencias_resolvidas: 0,
          oficinas: [],
          advertencias_list: [],
          historico_presenca: [],
        },
      ],
    }

    vi.mocked(api.get).mockResolvedValue({ data: mockPortalDataMultiplo })

    await act(async () => {
      render(
        <MemoryRouter>
          <PortalResponsavel />
        </MemoryRouter>
      )
    })

    // Abre os detalhes de Lucas Silva
    const verDetalhesBtns = screen.getAllByText('Ver Detalhes')
    await act(async () => {
      fireEvent.click(verDetalhesBtns[0])
    })

    // Por haver múltiplos filhos, a coluna "Filho" e o nome do filho devem aparecer no cabeçalho e linhas
    expect(screen.getByText('Filho')).toBeInTheDocument()
    expect(screen.getAllByText('Lucas Silva').length).toBeGreaterThan(1) // no título do modal e nas linhas
  })
})
