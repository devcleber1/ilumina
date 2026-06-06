import { useEffect, useState, useRef } from 'react'
import {
  X,
  Calendar,
  Clock,
  Globe,
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { api } from '../lib/api'

// Definição da interface ILog requerida pelas props
export interface ILog {
  _id: string
  userId: number
  userName: string
  userRole: string
  userAvatar?: string
  action: string
  module: string
  description: string
  status: 'success' | 'error' | 'warning' | string
  ip: string
  userAgent: string
  metadata?: Record<string, any>
  createdAt: string
}

interface LogDetailModalProps {
  log: ILog | null
  isOpen: boolean
  onClose: () => void
  onFilterByUser: (userId: number) => void
}

// Iniciais do Usuário para Fallback do Avatar
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Cores de Fallback do Avatar
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

export function LogDetailModal({ log, isOpen, onClose, onFilterByUser }: LogDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Seções colapsáveis e dados estendidos do usuário
  const [isColapsableOpen, setIsColapsableOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [loadingUserSummary, setLoadingUserSummary] = useState(false)

  // Focus Trap e Acessibilidade (ESC / Clique Fora)
  useEffect(() => {
    if (!isOpen || !log) return

    setIsColapsableOpen(false) // Começa fechada
    setLastSeen(null)

    // Buscar informações estendidas de resumo do usuário (como lastSeen do Passo 4)
    const fetchUserSummary = async () => {
      if (!log.userId) return
      setLoadingUserSummary(true)
      try {
        const response = await api.get(`/logs/user/${log.userId}`)
        if (response.data && response.data.lastSeen) {
          setLastSeen(response.data.lastSeen)
        }
      } catch (err) {
        console.error('Erro ao buscar resumo do usuário para o modal:', err)
      } finally {
        setLoadingUserSummary(false)
      }
    }

    fetchUserSummary()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
        )

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (focusableElements.length === 0) return

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    document.body.style.overflow = 'hidden'

    // Foco inicial
    setTimeout(() => {
      if (modalRef.current) {
        const closeBtn = modalRef.current.querySelector('.close-modal-btn') as HTMLElement
        if (closeBtn) closeBtn.focus()
      }
    }, 100)

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, log, onClose])

  if (!isOpen || !log) return null

  // Helpers de Estilização
  const getRoleBadgeClasses = (role: string) => {
    const r = role?.toLowerCase()
    if (r === 'admin' || r === 'superadmin') {
      return 'bg-purple-100 text-purple-700 border border-purple-200'
    } else if (r === 'professor' || r === 'teacher') {
      return 'bg-blue-100 text-blue-700 border border-blue-200'
    } else if (r === 'pai' || r === 'parent') {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200'
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

  // Tradução dos códigos de ação para PT-BR
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

  // Tradução dos módulos para PT-BR
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            <CheckCircle className="h-3.5 w-3.5" />
            Sucesso
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
            <XCircle className="h-3.5 w-3.5" />
            Erro
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alerta
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        )
    }
  }

  const formatFullDate = (dateStr: string) => {
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

  const formatLastSeen = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Mascarar o IP (mostrando apenas os 3 primeiros octetos para LGPD)
  const maskIp = (ip: string) => {
    if (!ip) return '***.***.***.***'
    if (ip.includes(':')) return ip // IPv6
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
    }
    return ip
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose} // Fecha clicando no backdrop
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden border border-gray-100 transform animate-in fade-in slide-in-from-bottom-10 duration-300"
        onClick={e => e.stopPropagation()} // Impede o clique de se propagar para o backdrop
      >
        {/* Cabeçalho do Modal: Perfil com foto grande de 80px */}
        <div className="relative p-6 bg-gradient-to-br from-yellow-50/50 to-white border-b border-gray-100 flex flex-col items-center text-center">
          {/* Botão de Fechar no Topo Direito */}
          <button
            onClick={onClose}
            className="close-modal-btn absolute top-4 right-4 p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Foto Circular de 80px com Fallback */}
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-yellow-400 shadow-md flex items-center justify-center mb-3">
            {log.userAvatar ? (
              <img
                src={
                  log.userAvatar.startsWith('http') || log.userAvatar.startsWith('data:')
                    ? log.userAvatar
                    : `http://localhost:3001${log.userAvatar}`
                }
                alt={log.userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={`h-full w-full flex items-center justify-center text-xl font-black border ${getAvatarBgColor(log.userName || 'Sistema')}`}
              >
                {getInitials(log.userName || 'Sistema')}
              </div>
            )}
          </div>

          {/* Nome e Cargo */}
          <h2
            id="modal-title"
            className="font-title text-lg font-black text-gray-900 leading-tight"
          >
            {log.userName || 'Sistema / Automático'}
          </h2>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getRoleBadgeClasses(log.userRole)}`}
            >
              {getRoleLabel(log.userRole)}
            </span>
          </div>

          {/* Último Acesso (lastSeen) */}
          <div className="mt-2.5 text-2xs uppercase tracking-widest text-gray-400 font-bold flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-gray-300" />
            {loadingUserSummary ? (
              <span className="inline-block w-20 h-3 bg-gray-100 animate-pulse rounded" />
            ) : lastSeen ? (
              <span>Visto por último: {formatLastSeen(lastSeen)}</span>
            ) : (
              <span>Visto por último: N/A</span>
            )}
          </div>
        </div>

        {/* Corpo do Modal com Detalhes da Ação */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[50vh] font-body text-xs">
          {/* Seção Principal de Detalhes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Status da Ação
              </span>
              {getStatusBadge(log.status)}
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                Módulo
              </span>
              <div className="px-3 py-2 bg-indigo-50/50 text-indigo-700 border border-indigo-100 rounded-xl font-bold uppercase tracking-wider inline-block">
                {getModuleLabel(log.module)}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Ação Realizada
            </span>
            <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-black">
              {getActionLabel(log.action)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Data e Hora Completa
            </span>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {formatFullDate(log.createdAt)}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
              Descrição da Ação
            </span>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-700 leading-relaxed">
              {log.description}
            </div>
          </div>

          {/* Seção Colapsável (IP, Navegador, Metadata) */}
          <div className="border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setIsColapsableOpen(!isColapsableOpen)}
              className="w-full flex items-center justify-between p-4 text-left font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition outline-none"
              aria-expanded={isColapsableOpen}
            >
              <span className="text-[10px] uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-yellow-500" />
                Dados do Ambiente e Metadados
              </span>
              {isColapsableOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isColapsableOpen && (
              <div className="p-4 space-y-4 border-t border-gray-150 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Endereço IP (Mascarado)
                    </span>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono font-medium flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      {maskIp(log.ip)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      Navegador
                    </span>
                    <div
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono font-medium truncate"
                      title={log.userAgent}
                    >
                      {log.userAgent}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                    Metadados de Contexto
                  </span>
                  {log.metadata && Object.keys(log.metadata).length > 0 ? (
                    <div className="p-4 bg-gray-950 text-emerald-400 rounded-2xl overflow-x-auto max-h-[150px] leading-relaxed shadow-inner font-mono text-[10px]">
                      <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-semibold italic">
                      Nenhum metadado adicional gravado.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
          {log.userId && log.userId !== 0 ? (
            <button
              onClick={() => {
                onFilterByUser(log.userId)
                onClose()
              }}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-xl shadow-md shadow-yellow-100 transition transform active:scale-95 text-center cursor-pointer"
            >
              Ver todos os logs deste usuário
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 font-bold transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
