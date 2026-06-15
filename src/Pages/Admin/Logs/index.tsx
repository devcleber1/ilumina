import { useEffect, useState, useRef, useCallback } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  Search,
  Calendar,
  X,
  RefreshCw,
  Clock,
  Server,
  ChevronLeft,
  ChevronRight,
  Filter,
  User as UserIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
} from 'lucide-react'
import { api } from '../../../lib/api'
import { getSocket } from '../../../lib/socket'
import { useSearchParams } from 'react-router-dom'
import { LogDetailModal, type ILog } from '../../../Components/LogDetailModal'

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

// Iniciais do Usuário para o Fallback do Avatar
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Cores de fundo do Fallback do Avatar baseadas no nome
function getAvatarBgColor(name: string): string {
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    'bg-purple-100 text-purple-700 border-purple-200',
    'bg-blue-100 text-blue-700 border-blue-200',
    'bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-rose-100 text-rose-700 border-rose-200',
    'bg-amber-100 text-amber-700 border-amber-200',
    'bg-cyan-100 text-cyan-700 border-cyan-200',
  ]
  return colors[hash % colors.length]
}

// Formatar data em formato relativo
function getRelativeTimeString(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'data desconhecida'

  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSeconds = Math.floor(diffInMs / 1000)

  if (diffInSeconds < 5) return 'agora mesmo'
  if (diffInSeconds < 60) return `há ${diffInSeconds} segundos`

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? 'há 1 minuto' : `há ${diffInMinutes} minutos`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return diffInHours === 1 ? 'há 1 hora' : `há ${diffInHours} horas`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return diffInDays === 1 ? 'há 1 dia' : `há ${diffInDays} dias`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? 'há 1 mês' : `há ${diffInMonths} meses`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return diffInYears === 1 ? 'há 1 ano' : `há ${diffInYears} anos`
}

// Formatar data completa com segundos para o tooltip
function getFullDateTimeString(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function LogsContent() {
  const { open } = useSidebar()
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados dos filtros e dados
  const [logs, setLogs] = useState<ILog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal de Detalhes
  const [selectedLog, setSelectedLog] = useState<ILog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtros locais (inicializados a partir dos query params ou defaults)
  const [searchVal, setSearchVal] = useState(searchParams.get('search') || '')
  const [actionVal, setActionVal] = useState(searchParams.get('action') || 'todos')
  const [moduleVal, setModuleVal] = useState(searchParams.get('module') || 'todos')
  const [statusVal, setStatusVal] = useState(searchParams.get('status') || 'todos')
  const [startDateVal, setStartDateVal] = useState(searchParams.get('startDate') || '')
  const [endDateVal, setEndDateVal] = useState(searchParams.get('endDate') || '')
  const [userIdVal, setUserIdVal] = useState(searchParams.get('userId') || '')
  const [limitVal, setLimitVal] = useState(Number(searchParams.get('limit')) || 20)
  const [pageVal, setPageVal] = useState(Number(searchParams.get('page')) || 1)

  // Ref de debounce para busca
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Atualizar os query params da URL e disparar a busca
  const syncFiltersToURLAndFetch = (options: {
    search?: string
    action?: string
    module?: string
    status?: string
    startDate?: string
    endDate?: string
    userId?: number | string
    limit?: number
    page?: number
  }) => {
    const nextParams = new URLSearchParams(searchParams)

    // Auxiliar para setar ou deletar parametro
    const updateParam = (key: string, value: string | number | undefined) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'todos') {
        nextParams.set(key, String(value))
      } else {
        nextParams.delete(key)
      }
    }

    updateParam('search', options.search !== undefined ? options.search : searchVal)
    updateParam('action', options.action !== undefined ? options.action : actionVal)
    updateParam('module', options.module !== undefined ? options.module : moduleVal)
    updateParam('status', options.status !== undefined ? options.status : statusVal)
    updateParam('startDate', options.startDate !== undefined ? options.startDate : startDateVal)
    updateParam('endDate', options.endDate !== undefined ? options.endDate : endDateVal)
    updateParam('userId', options.userId !== undefined ? options.userId : userIdVal)
    updateParam('limit', options.limit !== undefined ? options.limit : limitVal)

    // Se mudou algum filtro estrutural, reseta para a página 1
    const isFilterChanged =
      options.search !== undefined ||
      options.action !== undefined ||
      options.module !== undefined ||
      options.status !== undefined ||
      options.startDate !== undefined ||
      options.endDate !== undefined ||
      options.userId !== undefined

    const newPage = isFilterChanged ? 1 : options.page !== undefined ? options.page : pageVal
    updateParam('page', newPage)

    if (isFilterChanged) {
      setPageVal(1)
    }

    setSearchParams(nextParams)
  }

  // Buscar logs da API
  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const queryParams: Record<string, any> = {}

      const search = searchParams.get('search')
      const action = searchParams.get('action')
      const module = searchParams.get('module')
      const status = searchParams.get('status')
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const userId = searchParams.get('userId')
      const limit = Number(searchParams.get('limit')) || 20
      const page = Number(searchParams.get('page')) || 1

      if (search) queryParams.search = search
      if (action && action !== 'todos') queryParams.action = action
      if (module && module !== 'todos') queryParams.module = module
      if (status && status !== 'todos') queryParams.status = status
      if (startDate) queryParams.startDate = startDate
      if (endDate) queryParams.endDate = endDate
      if (userId) queryParams.userId = userId
      queryParams.limit = limit
      queryParams.page = page

      const response = await api.get('/logs', { params: queryParams })
      if (response.data) {
        setLogs(response.data.data || [])
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 20,
          totalPages: response.data.totalPages || 1,
        })
      }
    } catch (err: any) {
      console.error('Erro ao buscar logs no frontend:', err)
      setError(
        err.response?.data?.message || 'Falha ao conectar com o serviço de auditoria de logs.'
      )
    } finally {
      setLoading(false)
    }
  }

  // IDs de logs recém-chegados em tempo real (para animação de flash)
  const [realtimeIds, setRealtimeIds] = useState<Set<string>>(new Set())
  const [socketConnected, setSocketConnected] = useState(false)

  // Verifica se um log recebido em tempo real atende aos filtros ativos
  const logMatchesFilters = useCallback(
    (log: ILog): boolean => {
      const activeSearch = searchParams.get('search')
      const activeAction = searchParams.get('action')
      const activeModule = searchParams.get('module')
      const activeStatus = searchParams.get('status')
      const activeUserId = searchParams.get('userId')
      const activeStartDate = searchParams.get('startDate')
      const activeEndDate = searchParams.get('endDate')

      if (activeSearch) {
        const term = activeSearch.toLowerCase()
        const nameMatch = log.userName?.toLowerCase().includes(term)
        const descMatch = log.description?.toLowerCase().includes(term)
        if (!nameMatch && !descMatch) return false
      }
      if (activeAction && activeAction !== 'todos' && log.action !== activeAction) return false
      if (activeModule && activeModule !== 'todos' && log.module !== activeModule) return false
      if (activeStatus && activeStatus !== 'todos' && log.status !== activeStatus) return false
      if (activeUserId && String(log.userId) !== activeUserId) return false
      if (activeStartDate && new Date(log.createdAt) < new Date(activeStartDate)) return false
      if (activeEndDate && new Date(log.createdAt) > new Date(activeEndDate + 'T23:59:59'))
        return false

      return true
    },
    [searchParams]
  )

  // Monitorar alterações nos searchParams para disparar a busca
  useEffect(() => {
    fetchLogs()
    // Sincronizar estados locais caso o usuário use botões de voltar/avançar no browser
    setSearchVal(searchParams.get('search') || '')
    setActionVal(searchParams.get('action') || 'todos')
    setModuleVal(searchParams.get('module') || 'todos')
    setStatusVal(searchParams.get('status') || 'todos')
    setStartDateVal(searchParams.get('startDate') || '')
    setEndDateVal(searchParams.get('endDate') || '')
    setUserIdVal(searchParams.get('userId') || '')
    setLimitVal(Number(searchParams.get('limit')) || 20)
    setPageVal(Number(searchParams.get('page')) || 1)
  }, [searchParams])

  // Socket.IO: escutar novos logs em tempo real
  useEffect(() => {
    const socket = getSocket()

    const handleConnect = () => setSocketConnected(true)
    const handleDisconnect = () => setSocketConnected(false)

    const handleNovoLog = (novoLog: ILog) => {
      // Só insere na lista se estamos na página 1 e o log atende aos filtros
      const currentPage = Number(searchParams.get('page')) || 1
      if (currentPage !== 1) return
      if (!logMatchesFilters(novoLog)) return

      setLogs(prev => {
        // Evita duplicata
        if (prev.some(l => l._id === novoLog._id)) return prev
        // Insere no topo e remove o último para manter o tamanho da página
        const updated = [novoLog, ...prev]
        const currentLimit = Number(searchParams.get('limit')) || 20
        return updated.slice(0, currentLimit)
      })

      // Incrementa o total de paginação
      setPagination(prev => ({ ...prev, total: prev.total + 1 }))

      // Marca o ID como novo para animação de flash
      setRealtimeIds(prev => new Set(prev).add(novoLog._id))

      // Remove a animação de flash após 3 segundos
      setTimeout(() => {
        setRealtimeIds(prev => {
          const next = new Set(prev)
          next.delete(novoLog._id)
          return next
        })
      }, 3000)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('novo-log', handleNovoLog)

    if (socket.connected) setSocketConnected(true)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('novo-log', handleNovoLog)
    }
  }, [searchParams, logMatchesFilters])

  // Lidar com o input de busca (com Debounce de 400ms)
  const handleSearchChange = (val: string) => {
    setSearchVal(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      syncFiltersToURLAndFetch({ search: val })
    }, 400)
  }

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSearchVal('')
    setActionVal('todos')
    setModuleVal('todos')
    setStatusVal('todos')
    setStartDateVal('')
    setEndDateVal('')
    setUserIdVal('')
    setLimitVal(20)
    setPageVal(1)

    setSearchParams(new URLSearchParams())
  }

  // Helpers de Estilização das Roles (Cargos)
  const getRoleBadgeClasses = (role: string) => {
    const r = role?.toLowerCase()
    if (r === 'admin' || r === 'superadmin') {
      return 'bg-purple-50 text-purple-700 border border-purple-100'
    } else if (r === 'professor' || r === 'teacher') {
      return 'bg-blue-50 text-blue-700 border border-blue-100'
    } else if (r === 'pai' || r === 'parent') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    }
    return 'bg-gray-50 text-gray-600 border border-gray-100'
  }

  const getRoleLabel = (role: string) => {
    const r = role?.toLowerCase()
    if (r === 'admin') return 'Administrador'
    if (r === 'superadmin') return 'Super Admin'
    if (r === 'professor' || r === 'teacher') return 'Professor'
    if (r === 'pai' || r === 'parent') return 'Responsável'
    if (r === 'sistema') return 'Sistema'
    return role || 'Sistema'
  }

  // Tradução dos códigos de ação para PT-BR legível
  const actionLabels: Record<string, string> = {
    LOGIN: 'Login',
    LOGIN_FAILED: 'Falha no Login',
    LOGOUT: 'Logout',
    SESSION_EXPIRED: 'Sessão Expirada',
    RESET_PASSWORD: 'Troca de Senha',
    CREATE_USER: 'Criação de Usuário',
    UPDATE_USER: 'Atualização de Usuário',
    DELETE_USER: 'Exclusão de Usuário',
    CHANGE_ROLE: 'Alteração de Cargo',
    CREATE_STUDENT: 'Criação de Aluno',
    UPDATE_STUDENT: 'Atualização de Aluno',
    DELETE_STUDENT: 'Exclusão de Aluno',
    CREATE_WORKSHOP: 'Criação de Oficina',
    UPDATE_WORKSHOP: 'Atualização de Oficina',
    DELETE_WORKSHOP: 'Exclusão de Oficina',
    CREATE_MEETING: 'Criação de Reunião',
    UPDATE_MEETING: 'Atualização de Reunião',
    DELETE_MEETING: 'Cancelamento de Reunião',
    CREATE_WARNING: 'Criação de Advertência',
    UPDATE_WARNING: 'Atualização de Advertência',
    DELETE_WARNING: 'Remoção de Advertência',
    MARK_ATTENDANCE: 'Registro de Presença',
    CREATE_ATTENDANCE: 'Registro de Presença',
    UPDATE_ATTENDANCE: 'Atualização de Presença',
    DELETE_ATTENDANCE: 'Exclusão de Presença',
    ACCESS_DENIED: 'Acesso Negado',
    EXPORT_DATA: 'Exportação de Dados',
    SYSTEM_CRON: 'Tarefa do Sistema',
    ERROR: 'Erro do Sistema',
  }

  const getActionLabel = (action: string): string => {
    return actionLabels[action] || action
  }

  // Tradução dos módulos para PT-BR legível
  const moduleLabels: Record<string, string> = {
    Auth: 'Autenticação',
    Admin: 'Administração',
    Professor: 'Professores',
    Pai: 'Responsáveis',
    Aluno: 'Alunos',
    UserRole: 'Cargos e Permissões',
    Oficina: 'Oficinas',
    Reuniao: 'Reuniões',
    Presenca: 'Presenças',
    Advertencia: 'Advertências',
    Logs: 'Auditoria',
    Geral: 'Geral',
  }

  const getModuleLabel = (mod: string): string => {
    return moduleLabels[mod] || mod
  }

  // Helpers de Estilização de Status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5" />
            Sucesso
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3.5 w-3.5" />
            Erro
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alerta
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        )
    }
  }

  // Lista pré-definida de ações comuns para filtro
  const availableActions = [
    { value: 'LOGIN', label: 'Login' },
    { value: 'LOGOUT', label: 'Logout' },
    { value: 'CREATE_USER', label: 'Criar Usuário' },
    { value: 'UPDATE_USER', label: 'Atualizar Usuário' },
    { value: 'DELETE_USER', label: 'Excluir Usuário' },
    { value: 'CHANGE_ROLE', label: 'Alterar Cargo' },
    { value: 'CREATE_WORKSHOP', label: 'Criar Oficina' },
    { value: 'UPDATE_WORKSHOP', label: 'Atualizar Oficina' },
    { value: 'DELETE_WORKSHOP', label: 'Excluir Oficina' },
    { value: 'CREATE_MEETING', label: 'Criar Reunião' },
    { value: 'UPDATE_MEETING', label: 'Atualizar Reunião' },
    { value: 'DELETE_MEETING', label: 'Cancelar Reunião' },
    { value: 'CREATE_WARNING', label: 'Emitir Advertência' },
    { value: 'UPDATE_WARNING', label: 'Atualizar Advertência' },
    { value: 'DELETE_WARNING', label: 'Remover Advertência' },
    { value: 'MARK_ATTENDANCE', label: 'Marcar Presença' },
    { value: 'UPDATE_ATTENDANCE', label: 'Atualizar Presença' },
    { value: 'DELETE_ATTENDANCE', label: 'Excluir Presença' },
    { value: 'ACCESS_DENIED', label: 'Acesso Negado' },
    { value: 'ERROR', label: 'Erro do Sistema' },
  ]

  // Lista pré-definida de módulos comuns para filtro
  const availableModules = [
    { value: 'Auth', label: 'Autenticação' },
    { value: 'Admin', label: 'Módulo Admins' },
    { value: 'Professor', label: 'Módulo Professores' },
    { value: 'Pai', label: 'Módulo Responsáveis' },
    { value: 'Aluno', label: 'Módulo Alunos' },
    { value: 'UserRole', label: 'Cargos e Permissões' },
    { value: 'Oficina', label: 'Oficinas' },
    { value: 'Reuniao', label: 'Reuniões' },
    { value: 'Presenca', label: 'Chamadas e Presenças' },
    { value: 'Advertencia', label: 'Ocorrências/Advertências' },
    { value: 'Logs', label: 'Auditoria de Logs' },
  ]

  // Abrir modal de detalhes
  const handleOpenModal = (log: ILog) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  // Filtrar por ID de usuário ao clicar no modal
  const handleFilterByUser = (userId: number) => {
    setUserIdVal(String(userId))
    syncFiltersToURLAndFetch({ userId })
  }

  return (
    <main
      className={`flex-1 bg-gray-55 min-h-screen transition-all duration-300 relative ${!open ? 'pl-8' : ''}`}
    >
      {/* Header Fixo e Elegante */}
      <div className="flex w-full items-center justify-between px-6 py-5 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-100 rounded-lg text-yellow-600">
              <Server className="h-4 w-4" />
            </span>
            <h1 className="font-title text-xl uppercase font-black text-gray-900 tracking-tight">
              Logs de Auditoria
            </h1>
          </div>
          <p className="font-body text-xs text-gray-400 mt-0.5">
            Histórico completo e imutável de ações realizadas no sistema para conformidade com a
            LGPD
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Indicador de Tempo Real */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all ${
              socketConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-gray-50 text-gray-400 border border-gray-200'
            }`}
          >
            <span className={`relative flex h-2 w-2`}>
              {socketConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${socketConnected ? 'bg-emerald-500' : 'bg-gray-300'}`}
              />
            </span>
            <Wifi className="h-3 w-3" />
            {socketConnected ? 'Ao Vivo' : 'Offline'}
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 text-xs font-bold transition transform active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Grid de Filtros */}
      <div className="p-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-55 pb-3">
            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs uppercase tracking-wider">
              <Filter className="h-4 w-4 text-yellow-500" />
              Filtros Avançados
            </div>

            {/* Badge de Filtro por Usuário Ativo */}
            {userIdVal && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-2xs font-extrabold uppercase animate-pulse">
                <span>Filtrando por Usuário ID: {userIdVal}</span>
                <button
                  onClick={() => {
                    setUserIdVal('')
                    syncFiltersToURLAndFetch({ userId: '' })
                  }}
                  className="hover:bg-purple-100 rounded-full p-0.5 transition cursor-pointer text-purple-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Input de Busca Debounced */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="search-input"
                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Busca Geral
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <Search className="h-4 w-4 text-gray-400 shrink-0" />
                <input
                  id="search-input"
                  type="text"
                  placeholder="Nome do usuário ou descrição..."
                  className="bg-transparent border-none outline-none text-xs text-gray-900 flex-1 placeholder:text-gray-400"
                  value={searchVal}
                  onChange={e => handleSearchChange(e.target.value)}
                />
                {searchVal && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown de Ação */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="action-select"
                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Tipo de Ação
              </label>
              <select
                id="action-select"
                className="w-full bg-gray-50 border border-gray-200 outline-none text-xs text-gray-700 py-3 px-3 rounded-xl font-medium focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
                value={actionVal}
                onChange={e => {
                  setActionVal(e.target.value)
                  syncFiltersToURLAndFetch({ action: e.target.value })
                }}
              >
                <option value="todos">Todas as Ações</option>
                {availableActions.map(act => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown de Módulo */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="module-select"
                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Módulo
              </label>
              <select
                id="module-select"
                className="w-full bg-gray-50 border border-gray-200 outline-none text-xs text-gray-700 py-3 px-3 rounded-xl font-medium focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
                value={moduleVal}
                onChange={e => {
                  setModuleVal(e.target.value)
                  syncFiltersToURLAndFetch({ module: e.target.value })
                }}
              >
                <option value="todos">Todos os Módulos</option>
                {availableModules.map(mod => (
                  <option key={mod.value} value={mod.value}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown de Status */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="status-select"
                className="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                Status da Ação
              </label>
              <select
                id="status-select"
                className="w-full bg-gray-50 border border-gray-200 outline-none text-xs text-gray-700 py-3 px-3 rounded-xl font-medium focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition cursor-pointer"
                value={statusVal}
                onChange={e => {
                  setStatusVal(e.target.value)
                  syncFiltersToURLAndFetch({ status: e.target.value })
                }}
              >
                <option value="todos">Todos os Status</option>
                <option value="success">Sucesso</option>
                <option value="warning">Alerta</option>
                <option value="error">Erro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center pt-2">
            {/* Seletor de Período de Datas */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Data Inicial
                </span>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="bg-transparent border-none outline-none text-xs text-gray-700 cursor-pointer"
                    value={startDateVal}
                    onChange={e => {
                      setStartDateVal(e.target.value)
                      syncFiltersToURLAndFetch({ startDate: e.target.value })
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end pt-5 hidden md:block">
                <span className="text-gray-300 font-bold text-xs">até</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Data Final
                </span>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="bg-transparent border-none outline-none text-xs text-gray-700 cursor-pointer"
                    value={endDateVal}
                    onChange={e => {
                      setEndDateVal(e.target.value)
                      syncFiltersToURLAndFetch({ endDate: e.target.value })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Ações de Filtros */}
            <div className="flex items-end justify-end gap-3 pt-5 lg:pt-0">
              {(searchVal ||
                actionVal !== 'todos' ||
                moduleVal !== 'todos' ||
                statusVal !== 'todos' ||
                startDateVal ||
                endDateVal ||
                userIdVal) && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl hover:bg-gray-100 text-gray-500 text-xs font-bold transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela de Resultados ou Estados Especiais */}
        {error ? (
          <div className="rounded-3xl bg-white p-12 border border-rose-100 shadow-sm text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto h-12 w-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Erro ao carregar auditoria</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{error}</p>
            <button
              onClick={fetchLogs}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-bold rounded-xl shadow-md transition transform active:scale-95 cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        ) : loading ? (
          /* SKELETON LOADER NAS LINHAS */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="p-5 flex items-center gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-3 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full shrink-0" />
                  <div className="h-3 w-16 bg-gray-100 rounded shrink-0 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        ) : logs.length === 0 ? (
          /* NENHUM RESULTADO ENCONTRADO */
          <div className="rounded-3xl bg-white p-16 shadow-sm border border-gray-100 text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto h-16 w-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center">
              <Server className="h-8 w-8" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900">Nenhum log encontrado</h3>
            <p className="font-body text-sm text-gray-500">
              Não encontramos nenhum registro de auditoria que corresponda aos filtros aplicados.
            </p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        ) : (
          /* TABELA DE AUDITORIA DE LOGS */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {logs.map(log => {
                const isSystem = !log.userName || log.userName.toLowerCase() === 'sistema'
                const fallbackBg = getAvatarBgColor(log.userName || 'Sistema')
                const initials = getInitials(log.userName || 'Sistema')

                return (
                  <div
                    key={log._id}
                    onClick={() => handleOpenModal(log)}
                    className={`p-5 flex items-center gap-4 hover:bg-gray-50/70 transition-all duration-500 cursor-pointer select-none group ${
                      realtimeIds.has(log._id)
                        ? 'bg-yellow-50/80 border-l-4 border-l-yellow-400 animate-pulse'
                        : ''
                    }`}
                  >
                    {/* Foto circular de 40px com fallback de iniciais coloridas */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center shadow-sm">
                        {log.userAvatar ? (
                          <img
                            src={
                              log.userAvatar.startsWith('http') ||
                              log.userAvatar.startsWith('data:')
                                ? log.userAvatar
                                : `http://localhost:3001${log.userAvatar}`
                            }
                            alt={log.userName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`h-full w-full flex items-center justify-center text-xs font-black border ${fallbackBg}`}
                          >
                            {initials}
                          </div>
                        )}
                      </div>

                      {isSystem && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-gray-900 border border-white p-0.5 rounded-full">
                          <UserIcon className="h-2.5 w-2.5" />
                        </div>
                      )}
                    </div>

                    {/* Nome, Cargo e Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h4 className="font-title text-sm font-bold text-gray-900 truncate">
                          {log.userName || 'Sistema / Automático'}
                        </h4>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${getRoleBadgeClasses(log.userRole)}`}
                        >
                          {getRoleLabel(log.userRole)}
                        </span>

                        <span className="text-[10px] font-bold text-gray-400 hidden sm:inline">
                          •
                        </span>

                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                          {getModuleLabel(log.module)}
                        </span>
                      </div>

                      <p className="font-body text-xs text-gray-500 mt-1 font-medium line-clamp-1 group-hover:text-gray-800 transition flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold text-yellow-700 bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded-md shrink-0">
                          {getActionLabel(log.action)}
                        </span>
                        <span className="truncate">{log.description}</span>
                      </p>
                    </div>

                    {/* Badge Colorido da Ação */}
                    <div className="shrink-0">{getStatusBadge(log.status)}</div>

                    {/* Data Relativa com Tooltip da data completa */}
                    <div
                      className="shrink-0 text-right hidden md:block relative"
                      title={`Data Completa: ${getFullDateTimeString(log.createdAt)}`}
                    >
                      <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5 text-gray-300" />
                        {getRelativeTimeString(log.createdAt)}
                      </div>
                      <span className="text-[9px] text-gray-300 block mt-0.5">IP: {log.ip}</span>
                    </div>

                    {/* Ícone de seta com hover micro-animation */}
                    <div className="shrink-0 text-gray-350 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Rodapé da Tabela: Paginação e Controle de Limite */}
            <div className="p-5 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400 font-medium">
                Exibindo{' '}
                <span className="font-extrabold text-gray-800">
                  {Math.min(pagination.total, (pagination.page - 1) * pagination.limit + 1)}
                </span>{' '}
                a{' '}
                <span className="font-extrabold text-gray-800">
                  {Math.min(pagination.total, pagination.page * pagination.limit)}
                </span>{' '}
                de <span className="font-extrabold text-gray-800">{pagination.total}</span>{' '}
                registros
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => syncFiltersToURLAndFetch({ page: pagination.page - 1 })}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                    let targetPage = pagination.page
                    if (pagination.page <= 3) {
                      targetPage = index + 1
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      targetPage = pagination.totalPages - 4 + index
                    } else {
                      targetPage = pagination.page - 2 + index
                    }

                    if (targetPage < 1 || targetPage > pagination.totalPages) return null

                    return (
                      <button
                        key={targetPage}
                        onClick={() => syncFiltersToURLAndFetch({ page: targetPage })}
                        className={`h-9 w-9 text-xs font-bold rounded-xl transition cursor-pointer ${
                          pagination.page === targetPage
                            ? 'bg-yellow-400 text-gray-900 shadow-md shadow-yellow-100'
                            : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                        }`}
                      >
                        {targetPage}
                      </button>
                    )
                  })}
                </div>

                <button
                  disabled={pagination.page >= pagination.totalPages || loading}
                  onClick={() => syncFiltersToURLAndFetch({ page: pagination.page + 1 })}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                  Itens p/ página
                </span>
                <select
                  className="bg-white border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 transition"
                  value={limitVal}
                  onChange={e => {
                    const newLimit = Number(e.target.value)
                    setLimitVal(newLimit)
                    syncFiltersToURLAndFetch({ limit: newLimit })
                  }}
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COMPONENTE DO MODAL DE DETALHES COM ACESSIBILIDADE E FOCUS TRAP */}
      <LogDetailModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedLog(null)
        }}
        onFilterByUser={handleFilterByUser}
      />
    </main>
  )
}

export default function Logs() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <LogsContent />
      </div>
    </SidebarProvider>
  )
}
