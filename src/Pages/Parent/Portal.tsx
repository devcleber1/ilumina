import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  LogOut,
  Activity,
  X,
  User,
  Settings,
  Save,
  Camera,
  Heart,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'
import { UserAvatar } from '../../Components/UserAvatar'
import * as Yup from 'yup'
import { getSocket } from '../../lib/socket'
import { storageService } from '../../lib/storageService'


interface PortalData {
  pai: {
    nome: string
    email: string
    telefone: string
    foto_perfil_url: string
    data_nascimento: string
    profissao: string
  }
  resumo: {
    total_filhos: number
    media_presenca: number
    total_advertencias: number
    total_advertencias_pendentes?: number
    total_advertencias_resolvidas?: number
  }
  filhos: Filho[]
}

interface Filho {
  id: number
  nome_completo: string
  foto_perfil_url: string
  idade: number
  data_nascimento: string
  matricula: string
  contato_emergencia: string
  turma_principal: string
  percentual_presenca: number
  total_advertencias: number
  total_advertencias_pendentes?: number
  total_advertencias_resolvidas?: number
  oficinas: Oficina[]
  advertencias_list: Advertencia[]
  historico_presenca: Presenca[]
}

interface Oficina {
  id: number
  nome: string
  professor: string
  dias_semana: string
  horario: string
  percentual: number
  status: string
}

interface Advertencia {
  id: number
  tipo: string
  data: string
  descricao: string
  oficina: string
  resolvida: boolean
  status?: string
}

interface Presenca {
  id: number
  data: string
  oficina: string
  presente: boolean
  observacoes: string
}

export default function PortalResponsavel() {
  const { logout } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFilho, setSelectedFilho] = useState<Filho | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [isAllPresencasModalOpen, setIsAllPresencasModalOpen] = useState(false)

  const [profileForm, setProfileForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_nascimento: '',
  })

  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmar: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const fetchPortalData = async (showLoading = false) => {
    if (!storageService.getItem('token')) return
    try {
      if (showLoading) setLoading(true)
      const response = await api.get('/pais/me/portal')
      if (response.data.success) {
        setData(response.data)
        setProfileForm({
          nome: response.data.pai.nome,
          telefone: response.data.pai.telefone,
          email: response.data.pai.email,
          data_nascimento: response.data.pai.data_nascimento,
        })
        if (!response.data.filhos || response.data.filhos.length === 0) {
          showAlert('warning', 'Atenção', 'Você não possui filho vinculado a este perfil.')
        } else {
          // Checagem de novas presenças do dia de hoje para mostrar notificação
          const hoje = new Date().toISOString().split('T')[0]
          response.data.filhos.forEach((filho: Filho) => {
            filho.historico_presenca?.forEach((p: Presenca) => {
              if (p.data === hoje) {
                const shownKey = `presenca_shown_${p.id}`
                if (!storageService.getItem(shownKey, true)) {
                  const statusStr = p.presente ? 'presente' : 'ausente'
                  showAlert('info', 'Presença de Hoje', `Seu filho(a) ${filho.nome_completo} esteve ${statusStr} na oficina de ${p.oficina}.`)
                  storageService.setItem(shownKey, 'true', true)
                }
              }
            })
          })
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar portal:', error)
      const msg = error.response?.data?.message || 'Não foi possível carregar os dados do portal.'
      showAlert('destructive', 'Erro', msg)
    } finally {
      setLoading(false)
    }
  }

  const refetchSilencioso = useCallback(() => fetchPortalData(false), [])

  useEffect(() => {
    fetchPortalData(true)

    // Polling de fallback a cada 30s (caso o WebSocket caia)
    const interval = setInterval(refetchSilencioso, 30000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Escutador dedicado para Notificações em Tempo Real com Alerta Instantâneo
  useEffect(() => {
    if (!data) return

    const socket = getSocket()
    
    const handleNovaPresenca = (eventoInfo: any) => {
      const filhoAtendido = data.filhos?.find((f: Filho) => f.id === eventoInfo.aluno_id)
      if (filhoAtendido) {
        const statusStr = eventoInfo.presente ? 'presente' : 'ausente'
        
        // Se houver data, formatamos. Caso contrário usamos Hoje como fallback
        const dataFormatada = eventoInfo.data 
          ? new Date(eventoInfo.data + 'T12:00:00').toLocaleDateString('pt-BR')
          : 'hoje'
          
        let titulo = 'Nova Presença!'
        let mensagem = `Seu filho(a) ${filhoAtendido.nome_completo} foi marcado(a) como ${statusStr} na oficina de ${eventoInfo.oficina_nome} (Data: ${dataFormatada}).`

        if (eventoInfo.isEdit) {
           titulo = 'Atenção: Presença Editada'
           const horaEdicao = eventoInfo.data_edicao 
             ? new Date(eventoInfo.data_edicao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
             : 'agora'
           mensagem = `O registro do dia ${dataFormatada} para seu filho(a) ${filhoAtendido.nome_completo} foi corrigido para ${statusStr} na oficina de ${eventoInfo.oficina_nome} (Editado às ${horaEdicao}).`
        }

        showAlert('info', titulo, mensagem)
      }
      refetchSilencioso() // atualiza os dados visuais logo em seguida
    }

    const handleNovaAdvertencia = (eventoInfo: any) => {
      const filhoAtendido = data.filhos?.find((f: Filho) => f.id === eventoInfo.aluno_id)
      if (filhoAtendido) {
        let titulo = 'Nova Advertência!'
        let mensagem = `Seu filho(a) ${filhoAtendido.nome_completo} recebeu uma advertência do tipo "${eventoInfo.tipo_advertencia}" (Gravidade: ${eventoInfo.gravidade}).`

        if (eventoInfo.isEdit) {
          titulo = 'Advertência Editada'
          mensagem = `A advertência do seu filho(a) ${filhoAtendido.nome_completo} do tipo "${eventoInfo.tipo_advertencia}" foi alterada.`
        }

        showAlert('warning', titulo, mensagem)
      }
      refetchSilencioso()
    }

    const handleAdvertenciaDeletada = (eventoInfo: any) => {
      const filhoAtendido = data.filhos?.find((f: Filho) => f.id === eventoInfo.aluno_id)
      if (filhoAtendido) {
        showAlert('info', 'Advertência Removida', `Uma advertência registrada para seu filho(a) ${filhoAtendido.nome_completo} foi excluída/removida.`)
      }
      refetchSilencioso()
    }

    socket.on('presenca:registered', handleNovaPresenca)
    socket.on('advertencia:created', handleNovaAdvertencia)
    socket.on('advertencia:deleted', handleAdvertenciaDeletada)

    return () => {
      socket.off('presenca:registered', handleNovaPresenca)
      socket.off('advertencia:created', handleNovaAdvertencia)
      socket.off('advertencia:deleted', handleAdvertenciaDeletada)
    }
  }, [data, refetchSilencioso, showAlert])

  useEffect(() => {
    if (data && selectedFilho) {
      const updatedFilho = data.filhos.find(f => f.id === selectedFilho.id)
      if (updatedFilho) {
        setSelectedFilho(updatedFilho)
      } else {
        setSelectedFilho(null)
      }
    }
  }, [data])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAllPresencasModalOpen(false)
      }
    }
    if (isAllPresencasModalOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAllPresencasModalOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }


  const profileSchema = Yup.object().shape({
    nome: Yup.string().required('Nome é obrigatório').min(3, 'Nome muito curto'),
    email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    telefone: Yup.string().required('Telefone é obrigatório'),
    data_nascimento: Yup.string().required('Data de nascimento é obrigatória'),
    ...(isChangingPassword ? {
      atual: Yup.string().required('Senha atual é obrigatória'),
      nova: Yup.string()
        .required('Nova senha é obrigatória')
        .min(12, 'Senha deve ter no mínimo 12 caracteres')
        .matches(/[a-z]/, 'Deve conter letras minúsculas')
        .matches(/[A-Z]/, 'Deve conter letras maiúsculas')
        .matches(/[0-9]/, 'Deve conter números')
        .matches(/[@$!%*?&#]/, 'Deve conter caracteres especiais (@$!%*?&#)'),
      confirmar: Yup.string()
        .oneOf([Yup.ref('nova')], 'As senhas não coincidem')
        .required('Confirmação é obrigatória'),
    } : {})

  })

  const handleSaveProfile = async () => {
    try {
      setErrors({})
      
      const validateData = {
        ...profileForm,
        ...(isChangingPassword ? passwords : {})
      }

      await profileSchema.validate(validateData, { abortEarly: false })

      setIsSaving(true)
      await api.put('/pais/me/profile', {
        nome_completo: profileForm.nome,
        telefone: profileForm.telefone,
        email: profileForm.email,
        data_nascimento: profileForm.data_nascimento,
        ...(isChangingPassword ? { 
          senhaAtual: passwords.atual, 
          novaSenha: passwords.nova 
        } : {})
      })
      
      showAlert('success', 'Sucesso', 'Perfil atualizado com sucesso!')
      setIsProfileModalOpen(false)
      setIsChangingPassword(false)
      setPasswords({ atual: '', nova: '', confirmar: '' })

      const response = await api.get('/pais/me/portal')
      if (response.data.success) setData(response.data)
    } catch (err: any) {
      if (err instanceof Yup.ValidationError) {
        const validationErrors: Record<string, string> = {}
        err.inner.forEach(error => {
          if (error.path) validationErrors[error.path] = error.message
        })
        setErrors(validationErrors)
        return
      }
      
      // Trata erro de senha atual incorreta vindo do backend
      if (err.response?.status === 400 && err.response?.data?.message?.includes('Senha atual')) {
        setErrors({ ...errors, atual: 'Senha atual incorreta' })
        return
      }

      console.error('Erro ao salvar perfil:', err)
      showAlert(
        'destructive',
        'Erro',
        err.response?.data?.message || 'Não foi possível salvar as alterações.'
      )
    } finally {
      setIsSaving(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            Carregando Portal...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-body pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-10 rounded-full border-2 border-yellow-400"
              />
              <div className="hidden sm:block">
                <h1 className="font-title text-sm font-black text-gray-900 uppercase">
                  ONG Iluminando o Futuro
                </h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  Portal do Responsável
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-gray-50 transition cursor-pointer"
              >
                <UserAvatar
                  src={data?.pai.foto_perfil_url}
                  name={data?.pai.nome}
                  className="h-8 w-8 rounded-full border border-yellow-200"
                />
                <span className="text-xs font-bold text-gray-700 hidden sm:inline">
                  {data?.pai.nome.split(' ')[0]}
                </span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Saudação e Resumo */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="font-title text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">
                Olá, {data?.pai.nome.split(' ')[0]} 👋
              </h2>
              <p className="text-gray-400 font-medium">
                Acompanhe o desempenho e frequência dos seus filhos.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
                <Users className="h-5 w-5 text-blue-500 mb-1" />
                <span className="text-xl font-black text-gray-900">
                  {data?.resumo.total_filhos}
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Filhos
                </span>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
                <Activity className="h-5 w-5 text-green-500 mb-1" />
                <span className="text-xl font-black text-gray-900">
                  {data?.resumo.media_presenca}%
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Presença
                </span>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center relative group/alerta cursor-help">
                <AlertTriangle className={`h-5 w-5 mb-1 ${
                  (data?.resumo.total_advertencias_pendentes || 0) > 0
                    ? 'text-red-500'
                    : (data?.resumo.total_advertencias_resolvidas || 0) > 0
                      ? 'text-blue-500'
                      : 'text-green-500'
                }`} />
                <span className={`text-xl font-black ${
                  (data?.resumo.total_advertencias_pendentes || 0) > 0
                    ? 'text-red-500'
                    : (data?.resumo.total_advertencias_resolvidas || 0) > 0
                      ? 'text-blue-500'
                      : 'text-green-500'
                }`}>
                  {data?.resumo.total_advertencias}
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Alertas
                </span>
                <div className="absolute top-full mt-2 hidden group-hover/alerta:flex flex-col bg-gray-900 text-white text-[9px] font-black uppercase p-3 rounded-2xl shadow-xl z-50 w-32 border border-gray-800 text-left gap-1 animate-in fade-in duration-200">
                  <span className="text-red-400">● {data?.resumo.total_advertencias_pendentes || 0} Pendentes</span>
                  <span className="text-green-400">● {data?.resumo.total_advertencias_resolvidas || 0} Resolvidas</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Listagem de Filhos */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-400" />
            <h3 className="font-title text-lg font-black text-gray-900 uppercase">Meus Filhos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!data?.filhos || data.filhos.length === 0 ? (
              <div className="col-span-full bg-white rounded-[40px] p-8 sm:p-12 border border-gray-100 shadow-xl shadow-gray-100/40 text-center space-y-6 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                <div className="mx-auto w-20 h-20 bg-yellow-50 rounded-[32px] flex items-center justify-center text-yellow-500 border border-yellow-100/50 shadow-inner">
                  <Users className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-title text-xl font-black text-gray-900 uppercase tracking-tight">
                    Nenhum Filho Vinculado
                  </h4>
                  <p className="text-gray-400 text-sm font-medium leading-relaxed">
                    Você não possui filho vinculado a este perfil.
                    Para visualizar o desempenho escolar, frequência e advertências, é necessário realizar o vínculo.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/30 text-[11px] font-bold text-yellow-700 uppercase tracking-wider max-w-md mx-auto">
                  📞 Por favor, entre em contato com a secretaria da ONG para solicitar a vinculação.
                </div>
              </div>
            ) : (
              data.filhos.map((filho, idx) => (
                <div
                  key={filho.id}
                  className="group bg-white rounded-[40px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <UserAvatar
                      src={filho.foto_perfil_url}
                      name={filho.nome_completo}
                      className="h-16 w-16 rounded-3xl border-2 border-yellow-400 shadow-lg"
                    />
                    <div>
                      <h4 className="font-title text-base font-black text-gray-900 leading-tight">
                        {filho.nome_completo}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                        {filho.idade} anos • {filho.turma_principal}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Frequência Geral
                        </span>
                        <span className="text-sm font-black text-gray-900">
                          {filho.percentual_presenca}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            filho.percentual_presenca > 85
                              ? 'bg-green-400'
                              : filho.percentual_presenca > 70
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${filho.percentual_presenca}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-b border-gray-50">
                      <div className="text-center">
                        <p className="text-xs font-black text-gray-900">{filho.oficinas.length}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Oficinas</p>
                      </div>
                      <div className="w-px h-6 bg-gray-100" />
                      <div className="text-center">
                        <div className="flex flex-col items-center leading-none">
                          <span
                            className={`text-xs font-black ${
                              (filho.total_advertencias_pendentes || 0) > 0
                                ? 'text-red-500'
                                : (filho.total_advertencias_resolvidas || 0) > 0
                                  ? 'text-blue-500'
                                  : 'text-green-500'
                            }`}
                          >
                            {filho.total_advertencias}
                          </span>
                          <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">
                            ({filho.total_advertencias_pendentes || 0} P • {filho.total_advertencias_resolvidas || 0} R)
                          </span>
                        </div>
                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Advertências</p>
                      </div>
                      <div className="w-px h-6 bg-gray-100" />
                      <div className="text-center">
                        <p className="text-xs font-black text-green-500">Ativo</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Status</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedFilho(filho)}
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 group/btn cursor-pointer shadow-lg shadow-yellow-100"
                    >
                      <span className="uppercase tracking-widest text-[10px]">Ver Detalhes</span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Detalhes do Filho */}
      {selectedFilho && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] sm:rounded-[48px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500">
            <div className="p-6 sm:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-5">
                <UserAvatar
                  src={selectedFilho.foto_perfil_url}
                  name={selectedFilho.nome_completo}
                  className="h-16 w-16 rounded-3xl border-4 border-white shadow-xl"
                />
                <div>
                  <h3 className="font-title text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tighter">
                    {selectedFilho.nome_completo}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    {selectedFilho.matricula}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFilho(null)}
                className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <SectionTitle title="Dados do Aluno" icon={User} />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                      label="Data de Nascimento"
                      value={selectedFilho.data_nascimento ? selectedFilho.data_nascimento.split('T')[0].split('-').reverse().join('/') : '—'}
                    />
                    <InfoItem label="Idade" value={`${selectedFilho.idade} anos`} />
                    <InfoItem label="Matrícula" value={selectedFilho.matricula} />
                    <InfoItem label="Emergência" value={selectedFilho.contato_emergencia} />
                  </div>
                </div>
                <div className="space-y-6">
                  <SectionTitle title="Visão Geral Presença" icon={Activity} />
                  <div className="h-40 w-full bg-gray-50 rounded-[32px] p-4 border border-gray-100">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedFilho.oficinas || []}>
                        <XAxis 
                          dataKey="nome" 
                          hide={false} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 8, fontWeight: 'bold', fill: '#9CA3AF' }}
                          interval={0}
                        />
                        <Bar dataKey="percentual" radius={[4, 4, 0, 0]} minPointSize={4}>
                          {(selectedFilho.oficinas || []).map((entry, index) => {
                            let barColor = '#F87171'; // Default Red (0-49)
                            if (entry.percentual >= 80) barColor = '#4ADE80'; // Green (80-100)
                            else if (entry.percentual >= 50) barColor = '#FB923C'; // Orange (50-79)
                            
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={barColor}
                              />
                            );
                          })}
                        </Bar>

                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                          }}
                        />
                      </BarChart>

                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <SectionTitle title="Oficinas & Frequência" icon={Clock} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedFilho.oficinas || []).map(oficina => (
                    <div
                      key={oficina.id}
                      className="p-5 rounded-[32px] bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h5 className="font-bold text-gray-900">{oficina.nome}</h5>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">
                            {oficina.professor}
                          </p>
                        </div>
                        <span
                          className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${
                            oficina.status === 'Excelente'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}
                        >
                          {oficina.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-medium mb-4">
                        <div className="flex items-center gap-1.5">
                          <CalendarCheck className="h-3 w-3" /> {oficina.dias_semana}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {oficina.horario}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-gray-400">PROGRESSO</span>
                          <span className="text-gray-900">{oficina.percentual}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${oficina.percentual}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <SectionTitle title="Advertências & Ocorrências" icon={AlertTriangle} />
                  <div className="flex gap-2">
                    <span className="text-[9px] font-black uppercase px-3 py-1 bg-red-100 text-red-600 rounded-full">
                      {(selectedFilho as any).total_advertencias_pendentes || 0} Pendentes
                    </span>
                    <span className="text-[9px] font-black uppercase px-3 py-1 bg-green-100 text-green-600 rounded-full">
                      {(selectedFilho as any).total_advertencias_resolvidas || 0} Resolvidas
                    </span>
                  </div>
                </div>

                {((selectedFilho as any).total_advertencias_pendentes || 0) > 0 && (
                  <div className="p-6 rounded-[32px] bg-yellow-50 border border-yellow-200 text-gray-900 flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="h-5 w-5 text-yellow-650 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Ação Requerida Presencialmente</h5>
                      <p className="text-xs text-gray-700 font-semibold leading-relaxed">
                        Detectamos ocorrência(s) pendente(s) de resolução para seu filho(a). É necessário o comparecimento presencial na ONG Iluminando o Futuro para regularização pedagógica e assinatura de ciência.
                      </p>
                      <button
                        onClick={() => setIsResolveModalOpen(true)}
                        className="text-[9px] font-black uppercase bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-xl transition cursor-pointer shadow-md shadow-yellow-100/50"
                      >
                        Ver Instruções de Resolução
                      </button>
                    </div>
                  </div>
                )}

                {(selectedFilho.advertencias_list || []).length > 0 ? (
                  <div className="space-y-3">
                    {(selectedFilho.advertencias_list || []).map(adv => {
                      const isResolvida = adv.status === 'resolvida' || (adv as any).resolvida;
                      return (
                        <div
                          key={adv.id}
                          className={`p-6 rounded-[32px] border border-dashed flex flex-col sm:flex-row justify-between gap-4 transition-all ${
                            isResolvida
                              ? 'bg-green-50/20 border-green-100'
                              : 'bg-red-50/50 border-red-100'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                isResolvida ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                              }`}>
                                {adv.tipo}
                              </span>
                              <span className="text-xs font-bold text-gray-400">
                                {adv.data ? adv.data.split('T')[0].split('-').reverse().join('/') : '—'}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-900">{adv.oficina}</p>
                            <p className="text-xs text-gray-600 italic">"{adv.descricao}"</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`p-2 rounded-xl ${isResolvida ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                              {isResolvida ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <AlertTriangle className="h-5 w-5" />
                              )}
                            </div>
                            <span className={`text-[10px] font-black uppercase ${isResolvida ? 'text-green-600' : 'text-red-600'}`}>
                              {isResolvida ? 'Resolvida' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-10 rounded-[48px] bg-green-50 border border-green-100 text-center space-y-2">
                    <p className="text-2xl">🎉</p>
                    <p className="text-sm font-black text-green-700 uppercase tracking-widest">
                      Nenhuma advertência registrada.
                    </p>
                    <p className="text-xs text-green-600/60 font-medium">
                      Parabéns pelo excelente comportamento!
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <SectionTitle title="Histórico Recente" icon={CalendarCheck} />
                {(() => {
                  const sortedHistorico = [...(selectedFilho.historico_presenca || [])].sort((a, b) => {
                    const dateA = a.data ? new Date(a.data).getTime() : 0
                    const dateB = b.data ? new Date(b.data).getTime() : 0
                    return dateB - dateA
                  })
                  const limitedHistorico = sortedHistorico.slice(0, 5)

                  return (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-gray-100">
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Data
                              </th>
                              {data?.filhos && data.filhos.length > 1 && (
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Filho
                                </th>
                              )}
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Oficina
                              </th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                                Status
                              </th>
                              <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Observação
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {limitedHistorico.map(p => (
                              <tr key={p.id} className="group">
                                <td className="py-4 text-xs font-bold text-gray-900">
                                  {formatarDataPortal(p.data)}
                                </td>
                                {data?.filhos && data.filhos.length > 1 && (
                                  <td className="py-4 text-xs font-semibold text-gray-600">
                                    {selectedFilho.nome_completo}
                                  </td>
                                )}
                                <td className="py-4 text-xs font-medium text-gray-600">{p.oficina}</td>
                                <td className="py-4 text-center">
                                  <span
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                      p.presente
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-red-100 text-red-600'
                                    }`}
                                  >
                                    {p.presente ? 'Presente' : 'Ausente'}
                                  </span>
                                </td>
                                <td className="py-4 text-xs text-gray-400 italic max-w-[200px] truncate">
                                  {p.observacoes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {sortedHistorico.length > 5 && (
                        <div className="flex justify-center pt-4">
                          <button
                            onClick={() => setIsAllPresencasModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 hover:border-yellow-400 hover:text-yellow-600 text-gray-500 font-black rounded-2xl transition cursor-pointer shadow-sm text-xs uppercase tracking-widest"
                          >
                            <span>Ver mais</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-8 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 rounded-2xl text-yellow-600">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-title text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Meu Perfil
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">Informações do Responsável</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsProfileModalOpen(false)
                  setIsChangingPassword(false)
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <UserAvatar
                    src={data?.pai.foto_perfil_url}
                    name={data?.pai.nome}
                    className="h-28 w-28 rounded-[36px] border-4 border-yellow-400 shadow-xl"
                  />
                  <label className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition border-4 border-white">
                    <Camera className="h-5 w-5 text-gray-900" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        const formData = new FormData();
                        formData.append('foto_perfil_url', file);

                        try {
                          setIsSaving(true);
                          const response = await api.patch('/pais/me/photo', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          });

                          if (response.data.success) {
                            // Atualiza o estado local para refletir a nova foto
                            if (data) {
                              setData({
                                ...data,
                                pai: {
                                  ...data.pai,
                                  foto_perfil_url: response.data.foto_perfil_url
                                }
                              });
                            }
                            showAlert('success', 'Sucesso', 'Foto de perfil atualizada!');
                          }
                        } catch (error) {
                          console.error('Erro ao subir foto:', error);
                          showAlert('destructive', 'Erro', 'Erro ao atualizar foto de perfil');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                    />
                  </label>

                </div>
                <div className="text-center">
                  <h3 className="font-bold text-gray-900">{data?.pai.nome}</h3>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                    Responsável Legal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputItem
                  label="Nome Completo"
                  value={profileForm.nome}
                  onChange={v => setProfileForm({ ...profileForm, nome: v })}
                  error={errors.nome}
                />
                <InputItem
                  label="Telefone"
                  value={profileForm.telefone}
                  onChange={v => setProfileForm({ ...profileForm, telefone: v })}
                  error={errors.telefone}
                />
                <InputItem
                  label="E-mail"
                  value={profileForm.email}
                  onChange={v => setProfileForm({ ...profileForm, email: v })}
                  error={errors.email}
                />
                <InputItem
                  label="Data de Nascimento"
                  value={profileForm.data_nascimento}
                  type="date"
                  onChange={v => setProfileForm({ ...profileForm, data_nascimento: v })}
                  error={errors.data_nascimento}
                />
              </div>

              <div className="pt-6 border-t border-gray-100">
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-yellow-600 transition cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Alterar Senha de Acesso
                </button>

                {isChangingPassword && (
                  <div className="mt-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                    <InputItem
                      label="Senha Atual"
                      value={passwords.atual}
                      type="password"
                      onChange={v => setPasswords({ ...passwords, atual: v })}
                      error={errors.atual}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputItem
                        label="Nova Senha"
                        value={passwords.nova}
                        type="password"
                        onChange={v => setPasswords({ ...passwords, nova: v })}
                        error={errors.nova}
                      />
                      <InputItem
                        label="Confirmar Nova Senha"
                        value={passwords.confirmar}
                        type="password"
                        onChange={v => setPasswords({ ...passwords, confirmar: v })}
                        error={errors.confirmar}
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-[24px] shadow-xl shadow-yellow-100 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span className="uppercase tracking-widest text-xs">
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Instruções de Resolução de Advertências */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] max-w-xl w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-400 overflow-hidden border border-gray-50">
            <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-yellow-100 rounded-2xl text-yellow-650">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-title text-xl font-black text-gray-900 uppercase tracking-tighter">
                    Resolução de Advertência
                  </h2>
                  <p className="text-xs text-gray-400 font-medium">Instruções para o Responsável</p>
                </div>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar text-sm text-gray-700">
              <div className="space-y-2">
                <p className="font-black text-gray-900 uppercase tracking-widest text-[10px] text-yellow-650">📍 O que fazer agora?</p>
                <p className="leading-relaxed font-semibold text-gray-900">
                  Para garantir o melhor acompanhamento pedagógico e a segurança de seu filho(a), solicitamos o comparecimento presencial do responsável legal à secretaria da <strong>ONG Iluminando o Futuro</strong> o quanto antes.
                </p>
              </div>

              <div className="space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <h4 className="font-black text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" /> Etapas para Resolução:
                </h4>
                <ol className="space-y-3 text-xs font-semibold text-gray-600 pl-4 list-decimal leading-relaxed">
                  <li>
                    Comparecer à secretaria da ONG durante o horário de atendimento (Segunda a Sexta, das 08:00 às 17:00).
                  </li>
                  <li>
                    Apresentar um documento de identificação com foto do responsável pedagógico.
                  </li>
                  <li>
                    Realizar a leitura conjunta e assinatura do <strong>Termo de Ciência de Ocorrência Pedagógica</strong>.
                  </li>
                  <li>
                    Alinhar as diretrizes de apoio e acompanhamento pedagógico com a equipe de coordenação.
                  </li>
                </ol>
              </div>

              <div className="p-5 bg-yellow-50 rounded-3xl border border-yellow-100 text-xs font-bold text-gray-900 leading-relaxed space-y-1">
                <p className="font-black uppercase tracking-wider text-yellow-700 text-[10px]">📞 Dúvidas ou Agendamento?</p>
                <p className="text-gray-700">
                  Caso precise alinhar um horário específico ou tirar dúvidas, entre em contato direto com a nossa secretaria pelo telefone de suporte pedagógico da ONG.
                </p>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100">
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-[24px] shadow-xl shadow-yellow-100 transition transform active:scale-[0.98] uppercase tracking-widest text-xs cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {isAllPresencasModalOpen && selectedFilho && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setIsAllPresencasModalOpen(false)}
        >
          <div
            className="bg-white rounded-[40px] max-w-3xl w-full shadow-2xl flex flex-col animate-in zoom-in-95 duration-400 overflow-hidden border border-gray-50 max-h-[85vh]"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-presencas-titulo"
          >
            <div className="flex items-start justify-between p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 gap-4">
              <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                <div className="p-3 bg-yellow-100 rounded-2xl text-yellow-600 shrink-0">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="modal-presencas-titulo" className="font-title text-sm sm:text-xl font-black text-gray-900 uppercase tracking-tight break-words">
                    Histórico de presenças — {selectedFilho.nome_completo}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    Lista completa de presenças e ausências
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllPresencasModalOpen(false)}
                className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-gray-900 transition cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
              {/* Visualização Desktop (Tabela) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Data
                      </th>
                      {data?.filhos && data.filhos.length > 1 && (
                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Filho
                        </th>
                      )}
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Oficina
                      </th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Status
                      </th>
                      <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Observação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...(selectedFilho.historico_presenca || [])]
                      .sort((a, b) => {
                        const dateA = a.data ? new Date(a.data).getTime() : 0
                        const dateB = b.data ? new Date(b.data).getTime() : 0
                        return dateB - dateA
                      })
                      .map(p => (
                        <tr key={p.id} className="group">
                          <td className="py-4 text-xs font-bold text-gray-900">
                            {formatarDataPortal(p.data)}
                          </td>
                          {data?.filhos && data.filhos.length > 1 && (
                            <td className="py-4 text-xs font-semibold text-gray-600">
                              {selectedFilho.nome_completo}
                            </td>
                          )}
                          <td className="py-4 text-xs font-medium text-gray-600">{p.oficina}</td>
                          <td className="py-4 text-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                p.presente
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {p.presente ? 'Presente' : 'Ausente'}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-gray-400 italic max-w-[200px] truncate">
                            {p.observacoes || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Visualização Mobile (Cards) */}
              <div className="md:hidden space-y-3">
                {[...(selectedFilho.historico_presenca || [])]
                  .sort((a, b) => {
                    const dateA = a.data ? new Date(a.data).getTime() : 0
                    const dateB = b.data ? new Date(b.data).getTime() : 0
                    return dateB - dateA
                  })
                  .map(p => (
                    <div
                      key={p.id}
                      className={`p-4 rounded-3xl border border-dashed flex items-center justify-between gap-3 ${
                        p.presente
                          ? 'bg-green-50/10 border-green-100/50'
                          : 'bg-red-50/10 border-red-100/50'
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider shrink-0">
                            {formatarDataPortal(p.data)}
                          </span>
                          {data?.filhos && data.filhos.length > 1 && (
                            <span className="text-[9px] font-black bg-gray-150 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                              {selectedFilho.nome_completo}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs font-black text-gray-900 leading-tight truncate">
                          {p.oficina}
                        </h5>
                        {p.observacoes && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5 leading-snug truncate">
                            "{p.observacoes}"
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${
                            p.presente
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {p.presente ? 'Presente' : 'Ausente'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsAllPresencasModalOpen(false)}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-3 px-8 rounded-2xl shadow-md shadow-yellow-100 transition transform active:scale-[0.98] uppercase tracking-widest text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatarDataPortal(dataStr: string): string {
  if (!dataStr) return '—'
  const date = new Date(dataStr + 'T12:00:00')
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  return formatted.replace(/\sde\s/g, ' ')
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
        <Icon className="h-4 w-4" />
      </div>
      <h4 className="font-title text-sm font-black text-gray-900 uppercase tracking-widest">
        {title}
      </h4>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xs font-bold text-gray-900">{value}</p>
    </div>
  )
}

function InputItem({
  label,
  value,
  type = 'text',
  onChange,
  error,
}: {
  label: string
  value: string
  type?: string
  onChange?: (v: string) => void
  error?: string
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          className={`w-full bg-gray-50 border ${
            error ? 'border-red-400 focus:ring-red-400/20' : 'border-gray-100 focus:ring-yellow-400/20 focus:border-yellow-400'
          } rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none transition pr-12`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[9px] font-bold text-red-500 ml-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  )
}

