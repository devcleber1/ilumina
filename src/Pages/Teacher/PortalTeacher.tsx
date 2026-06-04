import { useEffect, useState, useCallback } from 'react'
import {
  Users,
  AlertTriangle,
  LogOut,
  X,
  User,
  Settings,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  BookOpen,
  Mail,
  Phone,
  Calendar,
  AlertOctagon,
  PenTool,
  Send,
  Lock,
  Save
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useAlert } from '../../contexts/AlertContext'
import logo from '../../assets/logo.png'
import { UserAvatar } from '../../Components/UserAvatar'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { getSocket } from '../../lib/socket'

interface TeacherData {
  professor: {
    id: number
    nome_completo: string
    email: string
    telefone: string
    foto_perfil_url: string
    data_nascimento: string
    formacao: string
  }
  oficinas: Oficina[]
  alunos: Aluno[]
}

interface Oficina {
  id: number
  nome_oficina: string
  dias_semana: string
  horario_inicio: string
  horario_fim: string
}

interface Aluno {
  id: number
  nome_completo: string
  numero_matricula: string
  foto_perfil_url: string
  total_presencas: number
  total_faltas: number
  presencas_oficina?: Record<number, { presencas: number; faltas: number }>
  presencas_hoje?: PresencaHoje[]
  presenca_hoje: PresencaHoje | null
  advertencias: Advertencia[]
  oficinas: number[]
}

interface PresencaHoje {
  id: number
  aluno_id: number
  oficina_id: number
  data: string
  presente: boolean
  justificativa?: string
  total_edicoes: number
  edicoes_professor?: number
}

interface Advertencia {
  id: number
  tipo_advertencia: string
  descricao: string
  data_advertencia: string
  gravidade: 'baixa' | 'media' | 'alta'
  status: 'pendente' | 'resolvida'
  total_edicoes: number
  registrado_por_professor_id?: number
  registrado_por_admin_id?: number
  oficina_id?: number
  professor_registrador?: {
    id: number
    nome_completo: string
  }
  admin_registrador?: {
    id: number
    nome_completo: string
  }
}

export default function PortalTeacher() {
  const { logout } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TeacherData | null>(null)
  const [activeOficinaId, setActiveOficinaId] = useState<number | null>(null)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'perfil' | 'senha'>('perfil')
  const [isSaving, setIsSaving] = useState(false)

  // Modais de Controle
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [isAdvertenciasModalOpen, setIsAdvertenciasModalOpen] = useState(false)
  const [isNewAdvertenciaModalOpen, setIsNewAdvertenciaModalOpen] = useState(false)
  const [isEditAdvertenciaModalOpen, setIsEditAdvertenciaModalOpen] = useState(false)
  const [selectedAdvertencia, setSelectedAdvertencia] = useState<Advertencia | null>(null)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [blockModalMessage, setBlockModalMessage] = useState('')


  // Controle de presenças inline
  const [changedPresencas, setChangedPresencas] = useState<Record<number, { presente: boolean; justificativa: string }>>({})
  const [savingPresencaStudentId, setSavingPresencaStudentId] = useState<number | null>(null)
  const [editingPresencaAlunoId, setEditingPresencaAlunoId] = useState<number | null>(null)
  const [expandedNewAdvertenciaAlunoId, setExpandedNewAdvertenciaAlunoId] = useState<number | null>(null)

  // Form de Perfil
  const [profileForm, setProfileForm] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    formacao: '',
    data_nascimento: ''
  })

  // Form de Senha
  const [passwords, setPasswords] = useState({
    atual: '',
    nova: '',
    confirmar: ''
  })
  const [showPassword, setShowPassword] = useState({
    atual: false,
    nova: false,
    confirmar: false
  })

  // Form de Advertência
  const [advertenciaForm, setAdvertenciaForm] = useState({
    tipo_advertencia: '',
    gravidade: 'media' as 'baixa' | 'media' | 'alta',
    descricao: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Buscar dados consolidados do portal
  const fetchPortalData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const response = await api.get('/professores/me/portal')
      if (response.data.success) {
        setData(response.data)
        
        // Inicializar profileForm
        const prof = response.data.professor
        setProfileForm({
          nome_completo: prof.nome_completo || '',
          email: prof.email || '',
          telefone: prof.telefone || '',
          formacao: prof.formacao || '',
          data_nascimento: prof.data_nascimento ? prof.data_nascimento.substring(0, 10) : ''
        })

        // Pré-selecionar oficina se houver
        if (response.data.oficinas.length > 0) {
          setActiveOficinaId(prev => prev || response.data.oficinas[0].id)
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do portal:', error)
      showAlert('destructive', 'Erro', 'Não foi possível carregar os dados do portal.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [showAlert])

  // Escutar eventos Socket.io em tempo real
  useEffect(() => {
    fetchPortalData()

    const socket = getSocket()
    if (socket) {
      socket.on('presenca:registered', () => {
        fetchPortalData(false)
      })
      socket.on('advertencia:created', () => {
        fetchPortalData(false)
      })
    }

    return () => {
      if (socket) {
        socket.off('presenca:registered')
        socket.off('advertencia:created')
      }
    }
  }, [fetchPortalData])

  // Sincronizar selectedAluno se data mudar
  useEffect(() => {
    if (selectedAluno && data) {
      const updated = data.alunos.find(a => a.id === selectedAluno.id)
      if (updated) setSelectedAluno(updated)
    }
  }, [data, selectedAluno])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Lançar ou alterar presença do dia de forma inline (Toggles rápidos)
  const handleTogglePresenca = (alunoId: number, novoPresente: boolean, presencaHoje: PresencaHoje | null) => {
    // Se a presença já foi registrada e o professor já atingiu o limite de edições
    if (presencaHoje && (presencaHoje.edicoes_professor || 0) >= 1) {
      setBlockModalMessage(
        'Você já editou a presença de hoje para este aluno uma vez. Para qualquer alteração adicional, por favor entre em contato com o administrador do sistema.'
      )
      setIsBlockModalOpen(true)
      return
    }

    setChangedPresencas(prev => ({
      ...prev,
      [alunoId]: {
        presente: novoPresente,
        justificativa: novoPresente ? '' : (prev[alunoId]?.justificativa ?? presencaHoje?.justificativa ?? '')
      }
    }))
  }

  // Alterar justificativa de falta inline
  const handleJustificativaChangeLocal = (alunoId: number, texto: string, presencaHoje: PresencaHoje | null) => {
    setChangedPresencas(prev => ({
      ...prev,
      [alunoId]: {
        presente: prev[alunoId]?.presente ?? presencaHoje?.presente ?? false,
        justificativa: texto
      }
    }))
  }

  // Iniciar edição de presença com controle de limite
  const handleStartEditPresenca = (alunoId: number, presencaHoje: PresencaHoje) => {
    if ((presencaHoje.edicoes_professor || 0) >= 1) {
      setBlockModalMessage(
        'Você já atingiu o limite de edição permitido para este registro. Para qualquer alteração adicional, por favor entre em contato com o administrador do sistema.'
      )
      setIsBlockModalOpen(true)
      return
    }
    setEditingPresencaAlunoId(alunoId)
  }

  // Salvar a chamada/presença daquele aluno individualmente de forma inline
  const handleSalvarPresencaLocal = async (alunoId: number, presencaHoje: PresencaHoje | null) => {
    const alteracao = changedPresencas[alunoId]
    if (!alteracao) return

    if (!alteracao.presente && !alteracao.justificativa.trim()) {
      showAlert('destructive', 'Atenção', 'Justificativa é obrigatória para ausência.')
      return
    }

    try {
      setSavingPresencaStudentId(alunoId)
      const hoje = new Date().toLocaleString('sv', { timeZone: 'America/Sao_Paulo' }).substring(0, 10)

      if (presencaHoje?.id) {
        // Rota correta do backend de edições: /presencas/atualizar/:id
        const response = await api.put(`/presencas/atualizar/${presencaHoje.id}`, {
          presente: alteracao.presente,
          justificativa: alteracao.justificativa,
          data: hoje
        })

        if (response.data.success) {
          showAlert('success', 'Sucesso', 'Presença editada com sucesso!')
          setEditingPresencaAlunoId(null)
          setChangedPresencas(prev => {
            const next = { ...prev }
            delete next[alunoId]
            return next
          })
          fetchPortalData(false)
        }
      } else {
        // Rota correta do backend de registro: /presencas/registrar
        const response = await api.post('/presencas/registrar', {
          aluno_id: alunoId,
          oficina_id: activeOficinaId,
          data: hoje,
          presente: alteracao.presente,
          justificativa: alteracao.justificativa
        })

        if (response.data.success) {
          showAlert('success', 'Sucesso', 'Presença lançada com sucesso!')
          setEditingPresencaAlunoId(null)
          setChangedPresencas(prev => {
            const next = { ...prev }
            delete next[alunoId]
            return next
          })
          fetchPortalData(false)
        }
      }
    } catch (error: any) {
      console.error('Erro ao salvar presença:', error)
      showAlert('destructive', 'Erro', error.response?.data?.message || 'Erro ao salvar presença.')
    } finally {
      setSavingPresencaStudentId(null)
    }
  }

  // Criar Ocorrência / Advertência
  const handleCriarAdvertencia = async () => {
    if (!selectedAluno || !activeOficinaId) return
    try {
      const schema = Yup.object().shape({
        tipo_advertencia: Yup.string().required('Tipo de ocorrência é obrigatório'),
        gravidade: Yup.string().oneOf(['baixa', 'media', 'alta']).required('Gravidade é obrigatória'),
        descricao: Yup.string().min(10, 'Descreva com pelo menos 10 caracteres').required('Descrição é obrigatória')
      })

      await schema.validate(advertenciaForm, { abortEarly: false })
      setErrors({})

      const hoje = new Date().toLocaleString('sv', { timeZone: 'America/Sao_Paulo' }).substring(0, 10)
      const response = await api.post('/advertencias/registrar', {
        aluno_id: selectedAluno.id,
        tipo_advertencia: advertenciaForm.tipo_advertencia,
        descricao: advertenciaForm.descricao,
        data_advertencia: hoje,
        gravidade: advertenciaForm.gravidade,
        status: 'pendente',
        oficina_id: activeOficinaId
      })

      if (response.data.success) {
        showAlert('success', 'Sucesso', 'Ocorrência registrada com sucesso!')
        setExpandedNewAdvertenciaAlunoId(null)
        fetchPortalData(false)
        setIsNewAdvertenciaModalOpen(false)
        setAdvertenciaForm({ tipo_advertencia: '', gravidade: 'media', descricao: '' })
      }
    } catch (error: any) {
      if (error instanceof Yup.ValidationError) {
        const errMap: Record<string, string> = {}
        error.inner.forEach((e: any) => {
          if (e.path) errMap[e.path] = e.message
        })
        setErrors(errMap)
      } else {
        console.error('Erro ao registrar ocorrência:', error)
        showAlert('destructive', 'Erro', error.response?.data?.message || 'Erro ao criar ocorrência.')
      }
    }
  }

  // Iniciar Edição de Advertência (Bloqueado para professores - apenas administradores podem alterar após o registro)
  const handleStartEditAdvertencia = (_advertencia: Advertencia) => {
    setIsAdvertenciasModalOpen(false)
    setSelectedAluno(null)
    setBlockModalMessage(
      'Para alterar ou remover uma ocorrência pedagógica já registrada, por favor entre em contato com o administrador do sistema.'
    )
    setIsBlockModalOpen(true)
  }

  const handleSalvarEdicaoAdvertencia = async () => {
    if (!selectedAdvertencia) return
    try {
      const schema = Yup.object().shape({
        tipo_advertencia: Yup.string().required('Tipo é obrigatório'),
        gravidade: Yup.string().oneOf(['baixa', 'media', 'alta']).required('Gravidade é obrigatória'),
        descricao: Yup.string().min(10, 'Mínimo 10 caracteres').required('Descrição é obrigatória')
      })

      await schema.validate(advertenciaForm, { abortEarly: false })
      setErrors({})

      const response = await api.put(`/advertencias/update/${selectedAdvertencia.id}`, {
        tipo_advertencia: advertenciaForm.tipo_advertencia,
        gravidade: advertenciaForm.gravidade,
        descricao: advertenciaForm.descricao
      })

      if (response.data.success) {
        showAlert('success', 'Sucesso', 'Ocorrência pedagógica atualizada com sucesso!')
        fetchPortalData(false)
        setIsEditAdvertenciaModalOpen(false)
        setSelectedAdvertencia(null)
        setAdvertenciaForm({ tipo_advertencia: '', gravidade: 'media', descricao: '' })
      }
    } catch (error: any) {
      if (error instanceof Yup.ValidationError) {
        const errMap: Record<string, string> = {}
        error.inner.forEach((e: any) => {
          if (e.path) errMap[e.path] = e.message
        })
        setErrors(errMap)
      } else {
        console.error('Erro ao editar ocorrência:', error)
        showAlert('destructive', 'Erro', error.response?.data?.message || 'Erro ao editar ocorrência.')
      }
    }
  }

  // Atualizar Perfil Completo
  const handleSaveProfile = async () => {
    if (!data?.professor.id) return
    try {
      const schema = Yup.object().shape({
        nome_completo: Yup.string().required('Nome completo é obrigatório'),
        email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
        telefone: Yup.string().required('Telefone é obrigatório'),
        formacao: Yup.string().required('Formação é obrigatória'),
        data_nascimento: Yup.string().required('Data de nascimento é obrigatória')
      })

      await schema.validate(profileForm, { abortEarly: false })
      setErrors({})
      setIsSaving(true)

      const response = await api.put(`/professores/me/update`, profileForm)

      if (response.data.success) {
        showAlert('success', 'Sucesso', 'Perfil atualizado com sucesso!')
        fetchPortalData(false)
        setIsConfigModalOpen(false)
      }
    } catch (error: any) {
      if (error instanceof Yup.ValidationError) {
        const errMap: Record<string, string> = {}
        error.inner.forEach((e: any) => {
          if (e.path) errMap[e.path] = e.message
        })
        setErrors(errMap)
      } else {
        console.error('Erro ao atualizar perfil:', error)
        showAlert('destructive', 'Erro', error.response?.data?.message || 'Erro ao atualizar perfil.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Alterar Senha
  const handleChangePassword = async () => {
    if (!data?.professor.id) return
    try {
      const schema = Yup.object().shape({
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
          .required('Confirme a nova senha')
      })

      await schema.validate(passwords, { abortEarly: false })
      setErrors({})
      setIsSaving(true)

      const response = await api.put(`/professores/trocar-senha/${data.professor.id}`, {
        senhaAtual: passwords.atual,
        novaSenha: passwords.nova
      })

      if (response.status === 200 || response.data?.success) {
        showAlert('success', 'Sucesso', 'Senha alterada com sucesso!')
        setPasswords({ atual: '', nova: '', confirmar: '' })
        setIsConfigModalOpen(false)
      }
    } catch (error: any) {
      if (error instanceof Yup.ValidationError) {
        const errMap: Record<string, string> = {}
        error.inner.forEach((e: any) => {
          if (e.path) errMap[e.path] = e.message
        })
        setErrors(errMap)
      } else {
        console.error('Erro ao alterar senha:', error)
        showAlert('destructive', 'Erro', error.response?.data?.message || 'Erro ao alterar senha.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Upload Foto de Perfil
  const handleUploadPhoto = async (file: File) => {
    const formData = new FormData()
    formData.append('foto_perfil_url', file)

    try {
      setIsSaving(true)
      const response = await api.put(`/professores/me/update`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data.success) {
        showAlert('success', 'Sucesso', 'Foto de perfil atualizada!')
        fetchPortalData(false)
      }
    } catch (error) {
      console.error('Erro ao subir foto:', error)
      showAlert('destructive', 'Erro', 'Erro ao atualizar foto de perfil')
    } finally {
      setIsSaving(false)
    }
  }

  // Filtrar alunos pela oficina ativa
  const filteredAlunos = data?.alunos.filter(aluno => 
    activeOficinaId ? aluno.oficinas.includes(activeOficinaId) : false
  ) || []

  const activeOficinaName = data?.oficinas.find(o => o.id === activeOficinaId)?.nome_oficina || 'Minha Oficina'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="h-10 w-10 text-yellow-500 animate-spin mb-4" />
        <p className="text-gray-600 font-bold animate-pulse">Carregando portal do professor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12 antialiased selection:bg-yellow-100 selection:text-yellow-900">
      {/* HEADER PREMIUM */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ONG Ilumina" className="h-12 w-auto object-contain" />
            <div className="h-8 w-[1px] bg-gray-200" />
            <div>
              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block">
                Portal do Colaborador
              </span>
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                Área do Professor
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-3 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-2xl transition cursor-pointer"
              title="Meu Perfil e Configurações"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition cursor-pointer"
              title="Sair do Sistema"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* FOTO DO PROFESSOR */}
            <UserAvatar
              src={data?.professor.foto_perfil_url}
              name={data?.professor.nome_completo}
              className="h-11 w-11 rounded-[16px] border-2 border-yellow-400"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* CARD DO PROFESSOR */}
        <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 bg-yellow-400 rounded-full opacity-10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 translate-y-12 h-48 w-48 bg-yellow-400 rounded-full opacity-5 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <UserAvatar
                  src={data?.professor.foto_perfil_url}
                  name={data?.professor.nome_completo}
                  className="h-24 w-24 rounded-[28px] border-4 border-yellow-400 shadow-xl"
                />
                <label className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 rounded-xl shadow-lg cursor-pointer hover:scale-115 transition border-2 border-gray-900">
                  <Camera className="h-4 w-4 text-gray-900" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadPhoto(file)
                    }}
                  />
                </label>
              </div>

              <div>
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-1">
                  Professor Responsável
                </span>
                <h2 className="text-2xl font-black tracking-tight">{data?.professor.nome_completo}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-gray-300">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-yellow-400" />
                    {data?.professor.formacao}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gray-500 hidden sm:inline" />
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-yellow-400" />
                    {data?.professor.email}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-gray-500 hidden sm:inline" />
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-yellow-400" />
                    {data?.professor.telefone}
                  </span>
                </div>
              </div>
            </div>

            {/* SELETOR DE OFICINA */}
            {data && data.oficinas.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-[24px] min-w-[280px]">
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest block mb-2">
                  Oficina Selecionada
                </span>
                <div className="relative">
                  <select
                    value={activeOficinaId || ''}
                    onChange={e => setActiveOficinaId(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 text-white font-bold py-2.5 px-4 rounded-[16px] appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
                  >
                    {data.oficinas.map(oficina => (
                      <option key={oficina.id} value={oficina.id} className="text-gray-900 font-bold">
                        {oficina.nome_oficina}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-yellow-400 pointer-events-none" />
                </div>
                {/* HORÁRIOS */}
                {activeOficinaId && (
                  <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-300 font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                    <span>
                      {data.oficinas.find(o => o.id === activeOficinaId)?.dias_semana} das{' '}
                      {data.oficinas.find(o => o.id === activeOficinaId)?.horario_inicio.substring(0, 5)} às{' '}
                      {data.oficinas.find(o => o.id === activeOficinaId)?.horario_fim.substring(0, 5)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ALUNOS MATRICULADOS */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-gray-900">Alunos Matriculados</h3>
              <p className="text-xs font-semibold text-gray-500 mt-1">
                Visualizando estudantes vinculados à oficina <span className="text-yellow-600 font-bold">{activeOficinaName}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white border border-gray-100 p-2.5 rounded-[20px] shadow-sm">
              <Users className="h-5 w-5 text-yellow-500 ml-2" />
              <span className="text-xs font-black uppercase text-gray-400 tracking-wider">Total de Alunos:</span>
              <span className="text-sm font-black text-gray-900 bg-yellow-100 px-3 py-1 rounded-xl">
                {filteredAlunos.length}
              </span>
            </div>
          </div>

          {filteredAlunos.length === 0 ? (
            <div className="bg-white border border-gray-100 p-16 rounded-[32px] text-center shadow-sm">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-base font-black text-gray-800">Nenhum aluno matriculado</h4>
              <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
                Não encontramos alunos associados a esta oficina específica. Se achar que é um erro, consulte a coordenação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlunos.map(aluno => {
                const advertenciasFiltradas = activeOficinaId
                  ? aluno.advertencias.filter(a => a.oficina_id === activeOficinaId)
                  : aluno.advertencias

                const totalAdvertenciasPendente = advertenciasFiltradas.filter(a => a.status === 'pendente').length
                
                // Regra de cores do número de ocorrências:
                // Verde: 0 advertências
                // Vermelho: se houver pelo menos 1 pendente
                // Azul/Dourado: se tiver registradas, mas todas já resolvidas!
                let advertenciasColorClass = 'text-green-500'
                if (advertenciasFiltradas.length > 0) {
                  if (totalAdvertenciasPendente > 0) {
                    advertenciasColorClass = 'text-red-500'
                  } else {
                    advertenciasColorClass = 'text-blue-500'
                  }
                }

                const presencasOficina = (activeOficinaId && aluno.presencas_oficina)
                  ? (aluno.presencas_oficina[activeOficinaId]?.presencas ?? 0)
                  : aluno.total_presencas

                const faltasOficina = (activeOficinaId && aluno.presencas_oficina)
                  ? (aluno.presencas_oficina[activeOficinaId]?.faltas ?? 0)
                  : aluno.total_faltas

                const presencaHoje = activeOficinaId && aluno.presencas_hoje
                  ? (aluno.presencas_hoje.find(p => p.oficina_id === activeOficinaId) ?? null)
                  : null

                // Mapear presença local inline
                const alteracaoLocal = changedPresencas[aluno.id]
                const isPresente = alteracaoLocal !== undefined
                  ? alteracaoLocal.presente
                  : (presencaHoje ? presencaHoje.presente : null)

                const justificativaLocal = alteracaoLocal !== undefined
                  ? alteracaoLocal.justificativa
                  : (presencaHoje ? (presencaHoje.justificativa || '') : '')

                const temAlteracao = alteracaoLocal !== undefined
                const isLocked = presencaHoje && (presencaHoje.edicoes_professor || 0) >= 1
                const isEditing = editingPresencaAlunoId === aluno.id
                const isAddingAdvertencia = expandedNewAdvertenciaAlunoId === aluno.id

                return (
                  <div
                    key={aluno.id}
                    className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/5 rounded-bl-[80px] group-hover:scale-110 transition duration-300 pointer-events-none" />

                    <div className="flex items-center gap-4">
                      {/* FOTO DO ALUNO */}
                      <UserAvatar
                        src={aluno.foto_perfil_url}
                        name={aluno.nome_completo}
                        className="h-16 w-16 rounded-[20px] border-2 border-yellow-400 shadow-md"
                      />

                      <div>
                        <h4 className="font-bold text-gray-900 leading-snug group-hover:text-yellow-600 transition">
                          {aluno.nome_completo}
                        </h4>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mt-0.5">
                          Matrícula: {aluno.numero_matricula}
                        </span>
                      </div>
                    </div>

                    {/* ESTATÍSTICAS */}
                    <div className="grid grid-cols-3 gap-2 my-5 bg-gray-50/50 p-3 rounded-[20px] border border-gray-100">
                      <div className="text-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          Presenças
                        </span>
                        <span className="text-sm font-black text-green-600">{presencasOficina}</span>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          Faltas
                        </span>
                        <span className="text-sm font-black text-red-500">{faltasOficina}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          Ocorrências
                        </span>
                        <span className={`text-sm font-black ${advertenciasColorClass}`}>
                          {advertenciasFiltradas.length}
                        </span>
                      </div>
                    </div>

                    {/* BOTÕES DE PRESENÇA DE HOJE INLINE */}
                    <div className="space-y-3 relative">
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                          Chamada de Hoje
                        </span>

                        {!presencaHoje || isEditing ? (
                          // MODO DE LANÇAMENTO OU EDIÇÃO ATIVA
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTogglePresenca(aluno.id, true, presencaHoje)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[16px] text-xs font-bold transition-all cursor-pointer ${
                                  isPresente === true
                                    ? 'bg-green-500 text-white shadow-md shadow-green-100'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Presente
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePresenca(aluno.id, false, presencaHoje)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[16px] text-xs font-bold transition-all cursor-pointer ${
                                  isPresente === false
                                    ? 'bg-red-500 text-white shadow-md shadow-red-100'
                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                }`}
                              >
                                <X className="h-4 w-4" />
                                Ausente
                              </button>

                              {temAlteracao && (
                                <button
                                  type="button"
                                  onClick={() => handleSalvarPresencaLocal(aluno.id, presencaHoje)}
                                  disabled={savingPresencaStudentId === aluno.id}
                                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[16px] text-xs font-black bg-yellow-400 text-gray-900 shadow-md shadow-yellow-100 hover:bg-yellow-300 transition-all animate-in zoom-in-95 duration-200 cursor-pointer"
                                >
                                  {savingPresencaStudentId === aluno.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  Salvar
                                </button>
                              )}
                            </div>

                            {/* TEXTAREA INLINE PARA JUSTIFICATIVA */}
                            {isPresente === false && (
                              <div className="mt-3 pt-3 border-t border-red-50 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-[9px] font-bold text-red-400 mb-1 block uppercase tracking-wider">
                                  Justificativa da Ausência
                                </label>
                                <textarea
                                  value={justificativaLocal}
                                  onChange={e => handleJustificativaChangeLocal(aluno.id, e.target.value, presencaHoje)}
                                  placeholder="Informe o motivo da falta..."
                                  className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-xs text-gray-800 placeholder:text-gray-300 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100/50 resize-none h-16 transition"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          // MODO ESTÁTICO DE VISUALIZAÇÃO COM OPÇÃO DE EDITAR
                          <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-[20px] transition duration-200 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                              {presencaHoje.presente ? (
                                <span className="flex items-center gap-1.5 text-xs font-black text-green-700 bg-green-100 px-3 py-1.5 rounded-full shadow-sm shadow-green-100/30">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Presente
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-1.5 text-xs font-black text-red-600 bg-red-100 px-3 py-1.5 rounded-full shadow-sm shadow-red-100/30 w-max">
                                    <Clock className="h-4 w-4" />
                                    Ausente
                                  </span>
                                  {presencaHoje.justificativa && (
                                    <span className="text-[10px] text-gray-500 font-semibold italic pl-1">
                                      Obs: "{presencaHoje.justificativa}"
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleStartEditPresenca(aluno.id, presencaHoje)}
                              className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                                isLocked
                                  ? 'text-gray-400 hover:text-gray-400 bg-gray-100 hover:bg-gray-100 border border-gray-200/50 opacity-80'
                                  : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-200'
                              }`}
                            >
                              {isLocked ? (
                                <>
                                  <Lock className="h-3.5 w-3.5 text-yellow-500" />
                                  Bloqueado
                                </>
                              ) : (
                                <>
                                  <PenTool className="h-3.5 w-3.5" />
                                  Editar
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SEÇÃO DE OCORRÊNCIAS PEDAGÓGICAS */}
                      <div className="space-y-3 pt-3 border-t border-gray-50">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAluno(aluno)
                              setIsAdvertenciasModalOpen(true)
                            }}
                            className="flex-1 border border-gray-200 hover:border-yellow-400 text-gray-600 hover:text-gray-900 font-black py-2.5 rounded-[16px] text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                          >
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                            Histórico ({advertenciasFiltradas.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAddingAdvertencia) {
                                setExpandedNewAdvertenciaAlunoId(null)
                              } else {
                                setSelectedAluno(aluno)
                                setAdvertenciaForm({ tipo_advertencia: '', gravidade: 'media', descricao: '' })
                                setErrors({})
                                setExpandedNewAdvertenciaAlunoId(aluno.id)
                              }
                            }}
                            className={`flex-1 border font-black py-2.5 rounded-[16px] text-[10px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              isAddingAdvertencia
                                ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-md shadow-yellow-100'
                                : 'border-gray-200 hover:border-yellow-400 text-gray-600 hover:text-gray-900 bg-white'
                            }`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Nova Ocorrência
                          </button>
                        </div>

                        {/* FORMULÁRIO INLINE DE NOVA OCORRÊNCIA PEDAGÓGICA */}
                        {isAddingAdvertencia && (
                          <div className="mt-3 p-4 bg-yellow-50/20 rounded-[20px] border border-dashed border-yellow-200/50 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest flex items-center gap-1">
                                <AlertOctagon className="h-3.5 w-3.5" />
                                Registrar Ocorrência
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpandedNewAdvertenciaAlunoId(null)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Tipo da Ocorrência
                                </label>
                                <input
                                  type="text"
                                  value={advertenciaForm.tipo_advertencia}
                                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, tipo_advertencia: e.target.value })}
                                  placeholder="Ex: Indisciplina, Uso de Celular, Atraso"
                                  className="w-full p-2.5 border border-gray-200 focus:border-yellow-400 rounded-xl text-xs font-bold bg-white focus:outline-none"
                                />
                                {errors.tipo_advertencia && <p className="text-[9px] text-red-500 font-bold mt-0.5">{errors.tipo_advertencia}</p>}
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Gravidade
                                </label>
                                <div className="grid grid-cols-3 gap-1.5">
                                  {(['baixa', 'media', 'alta'] as const).map(g => {
                                    let gColor = 'border-green-200 text-green-700 bg-green-50'
                                    if (g === 'media') gColor = 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                    if (g === 'alta') gColor = 'border-red-200 text-red-700 bg-red-50'

                                    const isSelected = advertenciaForm.gravidade === g

                                    return (
                                      <button
                                        type="button"
                                        key={g}
                                        onClick={() => setAdvertenciaForm({ ...advertenciaForm, gravidade: g })}
                                        className={`py-2 px-1 border rounded-xl text-[10px] font-black uppercase transition cursor-pointer text-center ${
                                          isSelected ? `${gColor} ring-1 ring-yellow-400` : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                                        }`}
                                      >
                                        {g}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Descrição dos Fatos
                                </label>
                                <textarea
                                  value={advertenciaForm.descricao}
                                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, descricao: e.target.value })}
                                  placeholder="Descreva detalhadamente o ocorrido..."
                                  rows={3}
                                  className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-xl resize-none text-xs font-bold bg-white focus:outline-none"
                                />
                                {errors.descricao && <p className="text-[9px] text-red-500 font-bold mt-0.5">{errors.descricao}</p>}
                              </div>

                              <button
                                type="button"
                                onClick={handleCriarAdvertencia}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md shadow-yellow-100 flex items-center justify-center gap-1.5"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Salvar Ocorrência
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL BLOQUEANTE DE EXCESSO DE EDICÕES */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 text-center shadow-2xl border border-gray-100 animate-scale-up">
            <div className="h-16 w-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertOctagon className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black text-gray-950">Ação Bloqueada</h3>
            <p className="text-xs font-semibold text-gray-500 mt-3 leading-relaxed">
              {blockModalMessage}
            </p>

            <button
              onClick={() => setIsBlockModalOpen(false)}
              className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-black py-4 rounded-[20px] shadow-lg transition active:scale-[0.98] cursor-pointer"
            >
              Compreendi
            </button>
          </div>
        </div>
      )}



      {/* MODAL LISTAGEM DE ADVERTÊNCIAS PEDAGÓGICAS */}
      {isAdvertenciasModalOpen && selectedAluno && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-2xl w-full p-8 shadow-2xl border border-gray-100 animate-scale-up max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block">
                  Controle Pedagógico
                </span>
                <h3 className="text-xl font-black text-gray-950">
                  Ocorrências - {selectedAluno.nome_completo}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAdvertenciasModalOpen(false)
                  setSelectedAluno(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <button
                onClick={() => {
                  setAdvertenciaForm({ tipo_advertencia: '', gravidade: 'media', descricao: '' })
                  setIsNewAdvertenciaModalOpen(true)
                }}
                className="w-full border-2 border-dashed border-gray-200 hover:border-yellow-400 text-gray-500 hover:text-gray-900 font-bold py-4 rounded-[24px] text-xs transition flex items-center justify-center gap-2 cursor-pointer bg-gray-50/50"
              >
                <Plus className="h-4.5 w-4.5 text-yellow-500" />
                Registrar Nova Ocorrência Pedagógica
              </button>

              {(() => {
                const advertenciasFiltradas = selectedAluno.advertencias.filter(a => a.oficina_id === activeOficinaId)
                if (advertenciasFiltradas.length === 0) {
                  return (
                    <div className="text-center py-12 bg-gray-50 rounded-[24px] border border-gray-100">
                      <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500">Nenhuma ocorrência registrada nesta oficina.</p>
                    </div>
                  )
                }
                return advertenciasFiltradas.map(adv => {
                  const isResolvida = adv.status === 'resolvida'
                  const isAuthor = adv.registrado_por_professor_id === data?.professor.id

                  let gravidadeColor = 'bg-green-50 text-green-700 border-green-200'
                  if (adv.gravidade === 'media') gravidadeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  if (adv.gravidade === 'alta') gravidadeColor = 'bg-red-50 text-red-700 border-red-200'

                  return (
                    <div
                      key={adv.id}
                      className={`p-5 rounded-[24px] border transition shadow-sm ${
                        isResolvida 
                          ? 'bg-green-50/20 border-green-100' 
                          : 'bg-red-50/20 border-dashed border-red-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${gravidadeColor}`}>
                            {adv.gravidade}
                          </span>
                          <span className="text-xs font-black text-gray-900">
                            {adv.tipo_advertencia}
                          </span>
                        </div>

                        <span className="text-[10px] font-semibold text-gray-400">
                          {new Date(adv.data_advertencia).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-gray-100">
                        {adv.descricao}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400 font-semibold">
                          Por: {adv.professor_registrador?.nome_completo || adv.admin_registrador?.nome_completo || 'Administrador'}
                        </span>

                        <div className="flex items-center gap-2">
                          {isResolvida ? (
                            <span className="text-[10px] font-black text-green-700 uppercase tracking-wider bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Assinada
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider bg-red-100 px-3 py-1 rounded-full flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Pendente
                            </span>
                          )}

                          {isAuthor && !isResolvida && (
                            <button
                              onClick={() => handleStartEditAdvertencia(adv)}
                              className="text-[10px] font-black text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 border border-transparent hover:border-yellow-200"
                            >
                              <PenTool className="h-3 w-3" />
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE ADVERTÊNCIA */}
      {isNewAdvertenciaModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-950">Registrar Ocorrência</h3>
              <button
                onClick={() => setIsNewAdvertenciaModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Tipo da Ocorrência
                </label>
                <input
                  type="text"
                  value={advertenciaForm.tipo_advertencia}
                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, tipo_advertencia: e.target.value })}
                  placeholder="Ex: Indisciplina, Desrespeito, Uso de Celular"
                  className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                />
                {errors.tipo_advertencia && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.tipo_advertencia}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Gravidade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baixa', 'media', 'alta'] as const).map(g => {
                    let gColor = 'border-green-200 text-green-700 bg-green-50'
                    if (g === 'media') gColor = 'border-yellow-200 text-yellow-700 bg-yellow-50'
                    if (g === 'alta') gColor = 'border-red-200 text-red-700 bg-red-50'

                    const isSelected = advertenciaForm.gravidade === g

                    return (
                      <button
                        key={g}
                        onClick={() => setAdvertenciaForm({ ...advertenciaForm, gravidade: g })}
                        className={`py-3 px-2 border rounded-[16px] text-xs font-black uppercase transition cursor-pointer ${
                          isSelected ? `${gColor} ring-2 ring-offset-2 ring-yellow-400 scale-102` : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Descrição dos Fatos
                </label>
                <textarea
                  value={advertenciaForm.descricao}
                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, descricao: e.target.value })}
                  placeholder="Descreva detalhadamente o ocorrido com o aluno..."
                  rows={4}
                  className="w-full p-4 border border-gray-200 focus:border-yellow-400 rounded-[20px] resize-none text-xs font-bold focus:outline-none"
                />
                {errors.descricao && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.descricao}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsNewAdvertenciaModalOpen(false)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-[20px] text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarAdvertencia}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-3.5 rounded-[20px] text-xs transition cursor-pointer shadow-lg shadow-yellow-100 flex items-center justify-center gap-1.5"
              >
                <Send className="h-4 w-4" />
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE ADVERTÊNCIA */}
      {isEditAdvertenciaModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-gray-950">Editar Ocorrência</h3>
              <button
                onClick={() => {
                  setIsEditAdvertenciaModalOpen(false)
                  setSelectedAdvertencia(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Tipo da Ocorrência
                </label>
                <input
                  type="text"
                  value={advertenciaForm.tipo_advertencia}
                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, tipo_advertencia: e.target.value })}
                  placeholder="Ex: Indisciplina, Desrespeito"
                  className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                />
                {errors.tipo_advertencia && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.tipo_advertencia}</p>}
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Gravidade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['baixa', 'media', 'alta'] as const).map(g => {
                    let gColor = 'border-green-200 text-green-700 bg-green-50'
                    if (g === 'media') gColor = 'border-yellow-200 text-yellow-700 bg-yellow-50'
                    if (g === 'alta') gColor = 'border-red-200 text-red-700 bg-red-50'

                    const isSelected = advertenciaForm.gravidade === g

                    return (
                      <button
                        key={g}
                        onClick={() => setAdvertenciaForm({ ...advertenciaForm, gravidade: g })}
                        className={`py-3 px-2 border rounded-[16px] text-xs font-black uppercase transition cursor-pointer ${
                          isSelected ? `${gColor} ring-2 ring-offset-2 ring-yellow-400 scale-102` : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                  Descrição dos Fatos
                </label>
                <textarea
                  value={advertenciaForm.descricao}
                  onChange={e => setAdvertenciaForm({ ...advertenciaForm, descricao: e.target.value })}
                  placeholder="Descreva o ocorrido..."
                  rows={4}
                  className="w-full p-4 border border-gray-200 focus:border-yellow-400 rounded-[20px] resize-none text-xs font-bold focus:outline-none"
                />
                {errors.descricao && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.descricao}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditAdvertenciaModalOpen(false)
                  setSelectedAdvertencia(null)
                }}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-[20px] text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicaoAdvertencia}
                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-3.5 rounded-[20px] text-xs transition cursor-pointer shadow-lg shadow-yellow-100 flex items-center justify-center gap-1.5"
              >
                <PenTool className="h-4 w-4" />
                Salvar Edição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÕES / MEU PERFIL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[32px] max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-8 bg-gradient-to-r from-yellow-400/20 to-yellow-100/20 border-b border-gray-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest block">
                  Configurações Pessoais
                </span>
                <h3 className="text-xl font-black text-gray-900">Configurar Meu Perfil</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full shadow-sm transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* ABAS */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('perfil')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  activeTab === 'perfil'
                    ? 'border-yellow-400 text-yellow-600 bg-yellow-50/10'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Dados Cadastrais
              </button>
              <button
                onClick={() => setActiveTab('senha')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
                  activeTab === 'senha'
                    ? 'border-yellow-400 text-yellow-600 bg-yellow-50/10'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Segurança & Senha
              </button>
            </div>

            {/* CORPO DE DADOS CADASTRAIS */}
            {activeTab === 'perfil' ? (
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <UserAvatar
                      src={data?.professor.foto_perfil_url}
                      name={data?.professor.nome_completo}
                      className="h-28 w-28 rounded-[36px] border-4 border-yellow-400 shadow-xl"
                    />
                    <label className="absolute -bottom-2 -right-2 p-2 bg-yellow-400 rounded-2xl shadow-lg cursor-pointer hover:scale-110 transition border-4 border-white">
                      <Camera className="h-5 w-5 text-gray-900" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadPhoto(file)
                        }}
                      />
                    </label>
                  </div>
                  <div className="text-center">
                    <h4 className="font-bold text-gray-900">{data?.professor.nome_completo}</h4>
                    <p className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">
                      Educador Ilumina
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={profileForm.nome_completo}
                      onChange={e => setProfileForm({ ...profileForm, nome_completo: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    {errors.nome_completo && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.nome_completo}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Formação Pedagógica
                    </label>
                    <input
                      type="text"
                      value={profileForm.formacao}
                      onChange={e => setProfileForm({ ...profileForm, formacao: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    {errors.formacao && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.formacao}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      E-mail
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={profileForm.telefone}
                      onChange={e => setProfileForm({ ...profileForm, telefone: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    {errors.telefone && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.telefone}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={profileForm.data_nascimento}
                      onChange={e => setProfileForm({ ...profileForm, data_nascimento: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    {errors.data_nascimento && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.data_nascimento}</p>}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-[20px] shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar Dados Cadastrais
                  </button>
                </div>
              </div>
            ) : (
              /* CORPO DE SEGURANÇA E SENHA */
              <div className="p-8 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar flex-1">
                <div className="bg-yellow-50 border border-yellow-200/50 p-4 rounded-[20px] flex gap-3 text-yellow-800 text-xs font-semibold">
                  <ShieldCheck className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p>
                    Para alterar sua senha, preencha os campos abaixo. A nova senha deve ter pelo menos 12 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&#).
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                      Senha Atual
                    </label>
                    <input
                      type={showPassword.atual ? 'text' : 'password'}
                      value={passwords.atual}
                      onChange={e => setPasswords({ ...passwords, atual: e.target.value })}
                      className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword({ ...showPassword, atual: !showPassword.atual })}
                      className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition cursor-pointer"
                    >
                      {showPassword.atual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {errors.atual && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.atual}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Nova Senha
                      </label>
                      <input
                        type={showPassword.nova ? 'text' : 'password'}
                        value={passwords.nova}
                        onChange={e => setPasswords({ ...passwords, nova: e.target.value })}
                        className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, nova: !showPassword.nova })}
                        className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition cursor-pointer"
                      >
                        {showPassword.nova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {errors.nova && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.nova}</p>}
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type={showPassword.confirmar ? 'text' : 'password'}
                        value={passwords.confirmar}
                        onChange={e => setPasswords({ ...passwords, confirmar: e.target.value })}
                        className="w-full p-3 border border-gray-200 focus:border-yellow-400 rounded-[16px] text-xs font-bold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirmar: !showPassword.confirmar })}
                        className="absolute right-4 top-[38px] text-gray-400 hover:text-gray-600 transition cursor-pointer"
                      >
                        {showPassword.confirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {errors.confirmar && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.confirmar}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-black py-4 rounded-[20px] shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Alterar Senha de Acesso
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
