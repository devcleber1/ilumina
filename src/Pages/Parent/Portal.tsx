import { useEffect, useState } from 'react'
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  LogOut,
  ChevronRight,
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
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import logo from '../../assets/logo.png'
import { useNavigate } from 'react-router-dom'

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
}

interface Presenca {
  id: number
  data: string
  oficina: string
  presente: boolean
  observacoes: string
}

export default function PortalResponsavel() {
  const { user, logout } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFilho, setSelectedFilho] = useState<Filho | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileForm, setProfileForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
    data_nascimento: '',
  })

  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmar: '',
  })

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const response = await api.get('/pais/me/portal')
        if (response.data.success) {
          setData(response.data)
          setProfileForm({
            nome: response.data.pai.nome,
            telefone: response.data.pai.telefone,
            email: response.data.pai.email,
            endereco: '',
            data_nascimento: response.data.pai.data_nascimento,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar portal:', error)
        showAlert('destructive', 'Erro', 'Não foi possível carregar os dados do portal.')
      } finally {
        setLoading(false)
      }
    }

    fetchPortalData()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleSaveProfile = async () => {
    if (isChangingPassword && passwords.nova !== passwords.confirmar) {
      return showAlert('destructive', 'Erro', 'As novas senhas não coincidem.')
    }

    setIsSaving(true)
    try {
      await api.put('/pais/me/profile', {
        nome_completo: profileForm.nome,
        telefone: profileForm.telefone,
        email: profileForm.email,
        data_nascimento: profileForm.data_nascimento,
        senhaAtual: passwords.atual,
        novaSenha: passwords.nova,
      })
      showAlert('success', 'Sucesso', 'Perfil atualizado com sucesso!')
      setIsProfileModalOpen(false)
      setIsChangingPassword(false)
      setPasswords({ atual: '', nova: '', confirmar: '' })

      const response = await api.get('/pais/me/portal')
      if (response.data.success) setData(response.data)
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error)
      showAlert(
        'destructive',
        'Erro',
        error.response?.data?.message || 'Não foi possível salvar as alterações.'
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
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center overflow-hidden border border-yellow-200">
                  {data?.pai.foto_perfil_url ? (
                    <img
                      src={`http://localhost:3001${data.pai.foto_perfil_url}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
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
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center flex flex-col items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mb-1" />
                <span className="text-xl font-black text-gray-900">
                  {data?.resumo.total_advertencias}
                </span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  Alertas
                </span>
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
            {data?.filhos.map((filho, idx) => (
              <div
                key={filho.id}
                className="group bg-white rounded-[40px] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-3xl overflow-hidden bg-gray-50 border-2 border-yellow-400 shadow-lg">
                    {filho.foto_perfil_url ? (
                      <img
                        src={`http://localhost:3001${filho.foto_perfil_url}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-yellow-600 font-black text-xl bg-yellow-50">
                        {filho.nome_completo.charAt(0)}
                      </div>
                    )}
                  </div>
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
                      <p
                        className={`text-xs font-black ${filho.total_advertencias > 0 ? 'text-red-500' : 'text-green-500'}`}
                      >
                        {filho.total_advertencias}
                      </p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Advertências</p>
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
            ))}
          </div>
        </section>
      </main>

      {/* Detalhes do Filho */}
      {selectedFilho && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl max-h-[95vh] sm:rounded-[48px] overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-500">
            <div className="p-6 sm:p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                  {selectedFilho.foto_perfil_url ? (
                    <img
                      src={`http://localhost:3001${selectedFilho.foto_perfil_url}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-yellow-400 text-white text-2xl font-black">
                      {selectedFilho.nome_completo.charAt(0)}
                    </div>
                  )}
                </div>
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
                      value={new Date(selectedFilho.data_nascimento).toLocaleDateString('pt-BR')}
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
                      <BarChart data={selectedFilho.oficinas}>
                        <Bar dataKey="percentual" radius={[4, 4, 0, 0]}>
                          {selectedFilho.oficinas.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.percentual > 80 ? '#4ADE80' : '#FACC15'}
                            />
                          ))}
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
                  {selectedFilho.oficinas.map(oficina => (
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
                <SectionTitle title="Advertências & Ocorrências" icon={AlertTriangle} />
                {selectedFilho.advertencias_list.length > 0 ? (
                  <div className="space-y-3">
                    {selectedFilho.advertencias_list.map(adv => (
                      <div
                        key={adv.id}
                        className="p-6 rounded-[32px] bg-red-50/50 border border-red-100 border-dashed flex flex-col sm:flex-row justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-full">
                              {adv.tipo}
                            </span>
                            <span className="text-xs font-bold text-gray-400">
                              {new Date(adv.data).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{adv.oficina}</p>
                          <p className="text-xs text-gray-600 italic">"{adv.descricao}"</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="p-2 bg-green-100 rounded-xl text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-black text-green-600 uppercase">
                            Resolvida
                          </span>
                        </div>
                      </div>
                    ))}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Data
                        </th>
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
                      {selectedFilho.historico_presenca.map(p => (
                        <tr key={p.id} className="group">
                          <td className="py-4 text-xs font-bold text-gray-900">
                            {new Date(p.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-4 text-xs font-medium text-gray-600">{p.oficina}</td>
                          <td className="py-4 text-center">
                            <span
                              className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                p.presente
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {p.presente ? 'Presente' : 'Falta'}
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
                  <div className="h-28 w-28 rounded-[36px] overflow-hidden border-4 border-yellow-400 shadow-xl">
                    {data?.pai.foto_perfil_url ? (
                      <img
                        src={`http://localhost:3001${data.pai.foto_perfil_url}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-50 flex items-center justify-center text-gray-300">
                        <User className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition border-4 border-white">
                    <Camera className="h-5 w-5 text-gray-900" />
                    <input type="file" className="hidden" accept="image/*" />
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
                />
                <InputItem
                  label="Telefone"
                  value={profileForm.telefone}
                  onChange={v => setProfileForm({ ...profileForm, telefone: v })}
                />
                <InputItem
                  label="E-mail"
                  value={profileForm.email}
                  onChange={v => setProfileForm({ ...profileForm, email: v })}
                />
                <InputItem
                  label="Data de Nascimento"
                  value={profileForm.data_nascimento}
                  type="date"
                  onChange={v => setProfileForm({ ...profileForm, data_nascimento: v })}
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
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputItem
                        label="Nova Senha"
                        value={passwords.nova}
                        type="password"
                        onChange={v => setPasswords({ ...passwords, nova: v })}
                      />
                      <InputItem
                        label="Confirmar Nova Senha"
                        value={passwords.confirmar}
                        type="password"
                        onChange={v => setPasswords({ ...passwords, confirmar: v })}
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
    </div>
  )
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
}: {
  label: string
  value: string
  type?: string
  onChange?: (v: string) => void
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
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition pr-12"
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
    </div>
  )
}
