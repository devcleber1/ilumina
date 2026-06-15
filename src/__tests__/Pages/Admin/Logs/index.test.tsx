import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import Logs from '../../../../Pages/Admin/Logs/index'
import { api } from '../../../../lib/api'

// Define global mock para window.matchMedia (necessário para use-mobile.ts da Sidebar)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mocks do Contexto de Autenticação
const mockLogout = vi.fn()
let mockCurrentUser: any = {
  id: 1,
  nome_completo: 'Admin Ilumina',
  tipo: 'admin',
  nivel_acesso: 'superadmin',
  foto_perfil_url: ''
}

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: true,
    logout: mockLogout,
    loading: false
  })
}))

// Mock de alertas globais
vi.mock('../../../../contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: vi.fn()
  })
}))

// Mock da API inteligente para cobrir listagem e resumo do usuário no modal
vi.mock('../../../../lib/api', () => ({
  api: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/logs/user/')) {
        return Promise.resolve({
          data: {
            totalActions: 15,
            lastSeen: '2026-05-18T12:00:00.000Z',
            mostFrequentAction: 'MARK_ATTENDANCE'
          }
        })
      }
      return Promise.resolve({
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      })
    }),
    defaults: {
      baseURL: 'http://localhost:3001'
    }
  }
}))

// Mock da Sidebar do Layout do Admin (AppSidebar)
vi.mock('../../../../Components/AppSidebar', () => ({
  AppSidebar: () => <div data-testid="app-sidebar">Sidebar Mock</div>
}))

const mockLogsData = [
  {
    _id: 'log-1',
    userId: 2,
    userName: 'Roberto Professor',
    userRole: 'professor',
    userAvatar: '/foto-roberto.jpg',
    action: 'MARK_ATTENDANCE',
    module: 'Presenca',
    description: 'Roberto marcou presença para a turma A.',
    status: 'success',
    ip: '192.168.1.xxx',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
    createdAt: '2026-05-18T12:00:00.000Z'
  },
  {
    _id: 'log-2',
    userId: 3,
    userName: 'Maria Mãe',
    userRole: 'pai',
    userAvatar: undefined,
    action: 'LOGIN',
    module: 'Auth',
    description: 'Maria fez login com sucesso.',
    status: 'success',
    ip: '10.0.0.xxx',
    userAgent: 'Mozilla/5.0 Safari/17.0',
    createdAt: '2026-05-18T12:15:00.000Z'
  }
]

describe('Logs Page (Frontend)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockCurrentUser = {
      id: 1,
      nome_completo: 'Admin Ilumina',
      tipo: 'admin',
      nivel_acesso: 'superadmin',
      foto_perfil_url: ''
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Logs />
      </BrowserRouter>
    )
  }

  it('deve renderizar a página normalmente para usuários admins', async () => {
    mockCurrentUser.tipo = 'admin'
    
    await act(async () => {
      renderComponent()
    })

    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument()
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument()
  })

  it('deve exibir skeletons na tabela durante o carregamento de logs', async () => {
    // Mantém a requisição de API em suspenso para simular carregamento perpétuo
    let resolveApi: any
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    
    vi.mocked(api.get).mockImplementationOnce((url: string) => {
      if (url.includes('/logs/user/')) {
        return Promise.resolve({
          data: { totalActions: 5, lastSeen: '2026-05-18T12:00:00.000Z', mostFrequentAction: 'LOGIN' }
        })
      }
      return apiPromise as any
    })

    await act(async () => {
      renderComponent()
    })

    // Deve mostrar as linhas em pulse animado (skeletons)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)

    // Resolve a API para evitar leaks nos testes
    await act(async () => {
      resolveApi({
        data: { data: [], total: 0, page: 1, limit: 20, totalPages: 1 }
      })
    })
  })

  it('deve exibir os logs da resposta da API com foto, nome, badge e data em cada linha', async () => {
    vi.mocked(api.get).mockImplementationOnce((url: string) => {
      if (url.includes('/logs/user/')) {
        return Promise.resolve({
          data: { totalActions: 5, lastSeen: '2026-05-18T12:00:00.000Z', mostFrequentAction: 'LOGIN' }
        })
      }
      return Promise.resolve({
        data: {
          data: mockLogsData,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      }) as any
    })

    await act(async () => {
      renderComponent()
    })

    // Verifica se os nomes dos usuários aparecem
    expect(screen.getByText('Roberto Professor')).toBeInTheDocument()
    expect(screen.getByText('Maria Mãe')).toBeInTheDocument()

    // Verifica se as descrições aparecem
    expect(screen.getByText('Roberto marcou presença para a turma A.')).toBeInTheDocument()
    expect(screen.getByText('Maria fez login com sucesso.')).toBeInTheDocument()

    // Verifica se a imagem e as iniciais coloridas aparecem
    const img = screen.getByAltText('Roberto Professor')
    expect(img).toHaveAttribute('src', 'http://localhost:3001/foto-roberto.jpg')

    // Maria Mãe não tem avatar, deve renderizar as iniciais "MM"
    expect(screen.getByText('MM')).toBeInTheDocument()
  })

  it('clicar em uma linha de log da tabela deve abrir o modal de detalhes', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/logs/user/')) {
        return Promise.resolve({
          data: {
            totalActions: 15,
            lastSeen: '2026-05-18T12:00:00.000Z',
            mostFrequentAction: 'MARK_ATTENDANCE'
          }
        })
      }
      return Promise.resolve({
        data: {
          data: mockLogsData,
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      }) as any
    })

    await act(async () => {
      renderComponent()
    })

    // Clica na linha de Roberto Professor
    const row = screen.getByText('Roberto Professor')
    await act(async () => {
      fireEvent.click(row)
    })

    // Deve abrir o modal de detalhes
    expect(screen.getAllByText('Registro de Presença').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Roberto marcou presença para a turma A.').length).toBeGreaterThan(0)
  })

  it('o input de busca geral deve ter debounce de 400ms', async () => {
    await act(async () => {
      renderComponent()
    })

    const searchInput = screen.getByPlaceholderText('Nome do usuário ou descrição...')
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Cleber' } })
    })

    // Logo após a mudança de input, a API NÃO deve ter sido chamada com o termo de busca (esperando o debounce)
    expect(api.get).toHaveBeenCalledTimes(1) // Apenas a chamada inicial do useEffect

    // Avança 200ms (metade do debounce)
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(api.get).toHaveBeenCalledTimes(1)

    // Avança os 200ms restantes (total 400ms)
    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    // Agora sim, a API deve ter sido chamada com os query params na URL atualizados
    expect(window.location.search).toContain('search=Cleber')
  })

  it('os filtros devem aparecer como query params na URL do navegador ao serem alterados', async () => {
    await act(async () => {
      renderComponent()
    })

    // Altera o Dropdown de Status
    const selectStatus = screen.getByRole('combobox', { name: /status da ação/i })
    await act(async () => {
      fireEvent.change(selectStatus, { target: { value: 'error' } })
    })

    // Deve ter adicionado o query param à URL
    expect(window.location.search).toContain('status=error')

    // Altera o Dropdown de Módulo
    const selectModule = screen.getByRole('combobox', { name: /módulo/i })
    await act(async () => {
      fireEvent.change(selectModule, { target: { value: 'Auth' } })
    })

    expect(window.location.search).toContain('module=Auth')
  })
})
