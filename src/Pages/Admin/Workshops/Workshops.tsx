import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronRight,
  Edit,
  Plus,
  Search,
  Trash2,
  Wrench,
  Clock,
  Users as UsersIcon,
  Calendar,
  X,
  UserPlus,
  GraduationCap
} from 'lucide-react'

interface Professor {
  id: number
  nome_completo: string
  formacao?: string
}


interface Aluno {
  id: number
  nome_completo: string
  numero_matricula?: string
}
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import * as yup from 'yup'

interface Oficina {
  id: number
  nome_oficina: string
  descricao?: string
  capacidade_maxima: number
  horario_inicio: string
  horario_fim: string
  dias_semana: string
  status_oficina: 'ativa' | 'inativa'
}

function WorkshopsContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()
  const [workshops, setWorkshops] = useState<Oficina[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selectedWorkshop, setSelectedWorkshop] = useState<Oficina | null>(null)
  const [editData, setEditData] = useState<Partial<Oficina>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [workshopToDelete, setWorkshopToDelete] = useState<Oficina | null>(null)

  const [workshopToLink, setWorkshopToLink] = useState<Oficina | null>(null)
  const [allStudents, setAllStudents] = useState<Aluno[]>([])
  const [linkedStudentIds, setLinkedStudentIds] = useState<number[]>([])
  const [isLinking, setIsLinking] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')

  const [workshopToLinkProf, setWorkshopToLinkProf] = useState<Oficina | null>(null)
  const [allProfs, setAllProfs] = useState<Professor[]>([])
  const [linkedProfIds, setLinkedProfIds] = useState<number[]>([])
  const [isLinkingProf, setIsLinkingProf] = useState(false)
  const [profSearch, setProfSearch] = useState('')

  const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  useEffect(() => {
    fetchWorkshops()
  }, [])

  const fetchWorkshops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/oficinas/find')
      setWorkshops(response.data)
    } catch (error) {
      console.error('Erro ao buscar oficinas:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestDelete = (workshop: Oficina) => {
    setWorkshopToDelete(workshop)
  }

  const confirmDelete = async () => {
    if (!workshopToDelete) return
    try {
      await api.delete(`/oficinas/delete/${workshopToDelete.id}`)
      setWorkshops(prev => prev.filter(w => w.id !== workshopToDelete.id))
      showAlert('success', 'Sucesso', 'Oficina excluída com sucesso.')
    } catch (error) {
      console.error('Erro ao deletar oficina:', error)
      showAlert('destructive', 'Erro', 'Erro ao deletar oficina.')
    } finally {
      setWorkshopToDelete(null)
    }
  }

  const toggleDay = (day: string) => {
    const currentDays = editData.dias_semana ? editData.dias_semana.split(',') : []
    const nextDays = currentDays.includes(day)
      ? currentDays.filter(current => current !== day)
      : [...currentDays, day]

    setEditData({ ...editData, dias_semana: nextDays.join(',') })
    setErrors(prev => ({ ...prev, dias_semana: '' }))
  }

  const handleOpenLinkModal = async (workshop: Oficina) => {
    setWorkshopToLink(workshop)
    setStudentSearch('')
    setIsLinking(true)
    try {
      const resAlunos = await api.get('/alunos/find')
      setAllStudents(resAlunos.data || [])
      
      const resVinculados = await api.get(`/oficinas/${workshop.id}/alunos`)
      const idsVinculados = (resVinculados.data?.data || []).map((a: any) => a.id)
      setLinkedStudentIds(idsVinculados)
    } catch (error) {
      console.error('Erro ao buscar dados de alunos', error)
      showAlert('destructive', 'Erro', 'Não foi possível carregar os alunos.')
    } finally {
      setIsLinking(false)
    }
  }

  const handleCloseLinkModal = () => {
    setWorkshopToLink(null)
    fetchWorkshops()
  }

  const toggleStudentLink = async (alunoId: number) => {
    if (!workshopToLink) return
    const isLinked = linkedStudentIds.includes(alunoId)
    
    try {
      if (isLinked) {
        await api.delete(`/alunos/${alunoId}/desvincular-oficina/${workshopToLink.id}`)
        setLinkedStudentIds(prev => prev.filter(id => id !== alunoId))
      } else {
        await api.post(`/alunos/${alunoId}/vincular-oficina`, { oficina_id: workshopToLink.id })
        setLinkedStudentIds(prev => [...prev, alunoId])
      }
    } catch (error: any) {
      console.error('Erro ao vincular/desvincular aluno', error)
      const msg = error.response?.data?.message || 'Erro na operação.'
      showAlert('destructive', 'Erro', msg)
    }
  }

  const handleOpenLinkProfModal = async (workshop: Oficina) => {
    setWorkshopToLinkProf(workshop)
    setProfSearch('')
    setIsLinkingProf(true)
    try {
      const resProfs = await api.get('/professores/find')
      setAllProfs(resProfs.data || [])
      
      const resVinculados = await api.get(`/oficinas/${workshop.id}/professores`)
      const idsVinculados = (resVinculados.data?.data || []).map((p: any) => p.professor?.id || p.professor_id)
      setLinkedProfIds(idsVinculados)
    } catch (error) {
      console.error('Erro ao buscar dados de professores', error)
      showAlert('destructive', 'Erro', 'Não foi possível carregar os professores.')
    } finally {
      setIsLinkingProf(false)
    }
  }

  const toggleProfLink = async (profId: number) => {
    if (!workshopToLinkProf) return
    const isLinked = linkedProfIds.includes(profId)
    
    try {
      if (isLinked) {
        await api.delete(`/oficinas/${workshopToLinkProf.id}/desvincular-professor/${profId}`)
        setLinkedProfIds(prev => prev.filter(id => id !== profId))
      } else {
        await api.post(`/oficinas/${workshopToLinkProf.id}/vincular-professor`, { professor_id: profId })
        setLinkedProfIds(prev => [...prev, profId])
      }
    } catch (error: any) {
      console.error('Erro ao vincular/desvincular professor', error)
      const msg = error.response?.data?.message || 'Erro na operação.'
      showAlert('destructive', 'Erro', msg)
    }
  }

  const confirmSave = async () => {
    if (!selectedWorkshop) return
    setIsSaving(true)
    setErrors({})

    const schema = yup.object().shape({
      nome_oficina: yup.string().required('Nome da oficina é obrigatório'),
      descricao: yup.string().required('Descrição é obrigatória'),
      capacidade_maxima: yup.number().typeError('Deve ser um número').min(1, 'Mínimo 1 vaga').required('Capacidade é obrigatória'),
      horario_inicio: yup.string().required('Horário de início é obrigatório'),
      horario_fim: yup.string().required('Horário de fim é obrigatório'),
      status_oficina: yup.string().oneOf(['ativa', 'inativa']).required(),
      dias_semana: yup.string().required('Selecione pelo menos um dia da semana'),
    })

    try {
      await schema.validate(editData, { abortEarly: false })
    } catch (err) {
      const newErrors: Record<string, string> = {}
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((e) => {
          if (e.path) newErrors[e.path] = e.message
        })
      }
      setErrors(newErrors)
      setShowSaveModal(false)
      setIsSaving(false)
      showAlert('destructive', 'Erro de validação', 'Verifique os campos em vermelho.')
      return
    }

    try {
      // Backend expects string format "HH:mm:ss" occasionally, but "HH:mm" works if mapped. Let's send what the UI has.
      await api.put(`/oficinas/update/${selectedWorkshop.id}`, editData)
      await fetchWorkshops()
      setSelectedWorkshop(null)
      setShowSaveModal(false)
      showAlert('success', 'Sucesso', 'Oficina atualizada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao atualizar oficina:', error)
      const msg = error.response?.data?.message || 'Erro ao atualizar oficina.'
      showAlert('destructive', 'Erro', msg)
      setShowSaveModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredWorkshops = workshops.filter(w =>
    w.nome_oficina.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 relative ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl uppercase font-extrabold text-gray-900">Oficinas</h1>
          <p className="font-body text-xs text-gray-400">
            Listagem e gestão de oficinas — ONG Iluminando o Futuro
          </p>
        </div>
        <NavLink
          to="/dashboard/cadastro-oficinas"
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Nova Oficina
        </NavLink>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="rounded-3xl bg-white p-4 shadow-sm flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar oficina por nome..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm text-center">
            <Wrench className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhuma oficina encontrada</h3>
            <p className="text-sm text-gray-500">Comece criando uma nova oficina no botão acima.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWorkshops.map(workshop => (
              <div
                key={workshop.id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2 items-center">
                    <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-500">
                      <Wrench className="h-6 w-6" />
                    </div>
                    {workshop.inscricoes_alunos && workshop.inscricoes_alunos.length >= workshop.capacidade_maxima && (
                      <span className="text-[9px] font-black tracking-wider bg-red-100 text-red-600 px-2.5 py-1 rounded-lg uppercase">
                        Cheia
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenLinkProfModal(workshop)}
                      className="p-2 rounded-xl hover:bg-green-50 text-green-500 transition cursor-pointer"
                      title="Vincular Professores"
                    >
                      <GraduationCap className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenLinkModal(workshop)}
                      className="p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition cursor-pointer"
                      title="Vincular Alunos"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedWorkshop(workshop)
                        setEditData({ ...workshop })
                        setErrors({})
                      }}
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => requestDelete(workshop)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-title text-lg font-bold text-gray-900 mb-2">
                  {workshop.nome_oficina}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                  {workshop.descricao}
                </p>

                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                    {workshop.dias_semana}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-yellow-500" />
                    {workshop.horario_inicio} - {workshop.horario_fim}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <UsersIcon className="h-3.5 w-3.5 text-yellow-500" />
                    Alunos inscritos: {workshop.inscricoes_alunos?.length || 0} / {workshop.capacidade_maxima}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {selectedWorkshop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-title text-xl font-bold text-gray-900">Editar Oficina</h2>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ajuste os dados da atividade</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nome da Oficina</label>
                <input
                  type="text"
                  placeholder="Obrigatório"
                  className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.nome_oficina ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                  value={editData.nome_oficina || ''}
                  onChange={e => {
                    setEditData({ ...editData, nome_oficina: e.target.value })
                    setErrors(prev => ({ ...prev, nome_oficina: '' }))
                  }}
                />
                {errors.nome_oficina && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.nome_oficina}</span>}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Obrigatório"
                  className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.descricao ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                  value={editData.descricao || ''}
                  onChange={e => {
                    setEditData({ ...editData, descricao: e.target.value })
                    setErrors(prev => ({ ...prev, descricao: '' }))
                  }}
                />
                {errors.descricao && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.descricao}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Capacidade Máxima</label>
                  <input
                    type="number"
                    placeholder="Ex: 20"
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.capacidade_maxima ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                    value={editData.capacidade_maxima || ''}
                    onChange={e => {
                      setEditData({ ...editData, capacidade_maxima: Number(e.target.value) })
                      setErrors(prev => ({ ...prev, capacidade_maxima: '' }))
                    }}
                  />
                  {errors.capacidade_maxima && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.capacidade_maxima}</span>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Status</label>
                  <select
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.status_oficina ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                    value={editData.status_oficina || 'ativa'}
                    onChange={e => {
                      setEditData({ ...editData, status_oficina: e.target.value as 'ativa' | 'inativa' })
                      setErrors(prev => ({ ...prev, status_oficina: '' }))
                    }}
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                  {errors.status_oficina && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.status_oficina}</span>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Horário Início</label>
                  <input
                    type="time"
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.horario_inicio ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                    value={editData.horario_inicio || ''}
                    onChange={e => {
                      setEditData({ ...editData, horario_inicio: e.target.value })
                      setErrors(prev => ({ ...prev, horario_inicio: '' }))
                    }}
                  />
                  {errors.horario_inicio && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.horario_inicio}</span>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Horário Fim</label>
                  <input
                    type="time"
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.horario_fim ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                    value={editData.horario_fim || ''}
                    onChange={e => {
                      setEditData({ ...editData, horario_fim: e.target.value })
                      setErrors(prev => ({ ...prev, horario_fim: '' }))
                    }}
                  />
                  {errors.horario_fim && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.horario_fim}</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Dias da Semana</label>
                <div className={`flex flex-wrap gap-2 p-3 rounded-xl border ${errors.dias_semana ? 'border-red-500 bg-red-50/20' : 'border-gray-200 bg-gray-50'}`}>
                  {daysOfWeek.map(day => {
                    const isSelected = editData.dias_semana?.split(',').includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                          isSelected
                            ? 'bg-yellow-400 text-gray-900 shadow-sm'
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
                {errors.dias_semana && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.dias_semana}</span>}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                Salvar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Salvamento */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 mb-2">Salvar Alterações</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deseja salvar as alterações feitas nesta oficina?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {workshopToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 mb-2">Excluir Oficina</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja excluir a oficina <strong>{workshopToDelete.nome_oficina}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setWorkshopToDelete(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vinculação de Alunos */}
      {workshopToLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-title text-xl font-bold text-gray-900">Vincular Alunos</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{workshopToLink.nome_oficina}</p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      {linkedStudentIds.length} / {workshopToLink.capacidade_maxima} Vagas
                    </span>
                    {linkedStudentIds.length >= workshopToLink.capacidade_maxima && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-100 text-red-600 uppercase">
                        Cheia
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCloseLinkModal}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-blue-500 transition">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar aluno por nome..."
                  className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-900"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {isLinking ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                ) : allStudents.length === 0 ? (
                  <div className="text-center p-8 text-sm text-gray-500">Nenhum aluno cadastrado no sistema.</div>
                ) : (
                  allStudents
                    .filter(a => a.nome_completo.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map(aluno => {
                      const isLinked = linkedStudentIds.includes(aluno.id)
                      return (
                        <div key={aluno.id} className={`flex items-center justify-between p-4 rounded-xl border transition ${isLinked ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{aluno.nome_completo}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{aluno.numero_matricula ? `Matrícula: ${aluno.numero_matricula}` : 'Sem matrícula'}</p>
                          </div>
                          <button
                            onClick={() => toggleStudentLink(aluno.id)}
                            disabled={!isLinked && linkedStudentIds.length >= workshopToLink.capacidade_maxima}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                              isLinked 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer' 
                                : linkedStudentIds.length >= workshopToLink.capacidade_maxima
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                            }`}
                          >
                            {isLinked ? 'Remover' : linkedStudentIds.length >= workshopToLink.capacidade_maxima ? 'Sem Vagas' : 'Adicionar'}
                          </button>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end">
              <button
                onClick={handleCloseLinkModal}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vinculação de Professores */}
      {workshopToLinkProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl text-green-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-title text-xl font-bold text-gray-900">Vincular Professores</h2>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{workshopToLinkProf.nome_oficina}</p>
                </div>
              </div>
              <button
                onClick={() => setWorkshopToLinkProf(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-hidden flex flex-col gap-4">
              <div className="flex items-center bg-gray-50 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                <Search className="h-4 w-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar professor por nome..."
                  className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-900"
                  value={profSearch}
                  onChange={e => setProfSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {isLinkingProf ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full" />
                  </div>
                ) : allProfs.length === 0 ? (
                  <div className="text-center p-8 text-sm text-gray-500">Nenhum professor cadastrado no sistema.</div>
                ) : (
                  allProfs
                    .filter(p => p.nome_completo.toLowerCase().includes(profSearch.toLowerCase()))
                    .map(prof => {
                      const isLinked = linkedProfIds.includes(prof.id)
                      return (
                        <div key={prof.id} className={`flex items-center justify-between p-4 rounded-xl border transition ${isLinked ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{prof.nome_completo}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{prof.formacao ? `Formação: ${prof.formacao}` : 'Cargo: Professor(a)'}</p>
                          </div>
                          <button
                            onClick={() => toggleProfLink(prof.id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${isLinked ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                          >
                            {isLinked ? 'Remover' : 'Adicionar'}
                          </button>
                        </div>
                      )
                    })
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end">
              <button
                onClick={() => setWorkshopToLinkProf(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function OpenSidebarButton() {
  const { toggleSidebar, open } = useSidebar()

  if (open) return null

  return (
    <button
      onClick={toggleSidebar}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex h-8 w-6 items-center justify-center rounded-r-lg bg-white border border-l-0 border-gray-200 shadow-md cursor-pointer hover:bg-gray-50 transition"
      title="Abrir menu"
    >
      <ChevronRight className="h-4 w-4 text-gray-600" />
    </button>
  )
}

export default function Workshops() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <WorkshopsContent />
      </div>
    </SidebarProvider>
  )
}
