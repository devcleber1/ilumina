import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronLeft,
  Calendar,
  Search,
  Loader2,
  ChevronRight,
  AlertTriangle,
  ShieldAlert,
  Send,
  X,
  Plus,
  Clock,
  Edit2,
  Trash2,
  User,
  Info,
  Users,
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'

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
  foto_perfil_url?: string
}

interface Advertencia {
  id: number
  aluno_id: number
  tipo_advertencia: string
  descricao: string
  data_advertencia: string
  gravidade: 'baixa' | 'media' | 'alta'
  aluno?: Aluno
  professor_registrador?: { nome_completo: string; foto_perfil_url?: string }
  admin_registrador?: { nome_completo: string; foto_perfil_url?: string }
}

interface AdvertenciaFormData {
  id?: number
  aluno_id: number
  tipo_advertencia: string
  descricao: string
  data_advertencia: string
  gravidade: 'baixa' | 'media' | 'alta'
  oficina_id?: number
}

function AdvertenciaContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()

  const [workshops, setWorkshops] = useState<Oficina[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Oficina | null>(null)
  const [students, setStudents] = useState<Aluno[]>([])
  const [workshopWarnings, setWorkshopWarnings] = useState<Advertencia[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [search, setSearch] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Aluno | null>(null)
  const [formData, setFormData] = useState<AdvertenciaFormData>({
    aluno_id: 0,
    tipo_advertencia: '',
    descricao: '',
    data_advertencia: new Date().toISOString().split('T')[0],
    gravidade: 'baixa',
  })
  const [submitting, setSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Advertencia | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchWorkshops()
  }, [])

  useEffect(() => {
    if (selectedWorkshop) {
      fetchStudents()
    }
  }, [selectedWorkshop])

  const fetchWorkshops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/oficinas/find')
      setWorkshops(response.data)
    } catch (error) {
      showAlert('destructive', 'Erro', 'NÃ£o foi possÃ­vel carregar as oficinas.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!selectedWorkshop) return
    try {
      setLoadingStudents(true)
      const response = await api.get(`/oficinas/${selectedWorkshop.id}/alunos`)
      const loaded: Aluno[] = response.data.data
      setStudents(loaded)
      if (loaded.length > 0) {
        const ids = loaded.map(s => s.id).join(',')
        const advRes = await api.get(`/advertencias/listar-advertencias?aluno_ids=${ids}`)
        setWorkshopWarnings(advRes.data.data || [])
      }
    } catch (error) {
      showAlert('destructive', 'Erro', 'Falha ao carregar lista de alunos.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const reloadWarnings = async () => {
    if (!selectedWorkshop) return
    try {
      const alunosRes = await api.get(`/oficinas/${selectedWorkshop.id}/alunos`)
      const loaded: Aluno[] = alunosRes.data.data
      setStudents(loaded)
      if (loaded.length === 0) {
        setWorkshopWarnings([])
        return
      }
      const ids = loaded.map(s => s.id).join(',')
      const advRes = await api.get(`/advertencias/listar-advertencias?aluno_ids=${ids}`)
      setWorkshopWarnings(advRes.data.data || [])
    } catch (error) {
      console.error('Erro ao recarregar advertÃªncias', error)
    }
  }

  const handleOpenModal = (student: Aluno) => {
    setSelectedStudent(student)
    setIsEditing(false)
    setFormData({
      aluno_id: student.id,
      tipo_advertencia: '',
      descricao: '',
      data_advertencia: new Date().toISOString().split('T')[0],
      gravidade: 'baixa',
      oficina_id: selectedWorkshop?.id,
    })
    setIsModalOpen(true)
  }

  const handleEdit = (adv: Advertencia) => {
    setIsEditing(true)
    setSelectedStudent(adv.aluno || null)
    setFormData({
      id: adv.id,
      aluno_id: adv.aluno_id,
      tipo_advertencia: adv.tipo_advertencia,
      descricao: adv.descricao,
      data_advertencia: adv.data_advertencia,
      gravidade: adv.gravidade,
      oficina_id: selectedWorkshop?.id,
    })
    setIsModalOpen(true)
  }

  const handleDelete = (adv: Advertencia) => {
    setDeleteTarget(adv)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await api.delete(`/advertencias/deletar/${deleteTarget.id}`)
      showAlert('success', 'Sucesso', 'AdvertÃªncia removida com sucesso.')
      setDeleteTarget(null)
      reloadWarnings()
    } catch (error) {
      showAlert('destructive', 'Erro', 'NÃ£o foi possÃ­vel remover a advertÃªncia.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo_advertencia || !formData.descricao) {
      showAlert('warning', 'Campos obrigatÃ³rios', 'Por favor, preencha o tipo e a descriÃ§Ã£o.')
      return
    }

    try {
      setSubmitting(true)
      if (isEditing && formData.id) {
        await api.put(`/advertencias/atualizar/${formData.id}`, formData)
        showAlert('success', 'Sucesso', 'AdvertÃªncia atualizada com sucesso.')
      } else {
        await api.post('/advertencias/registrar', formData)
        showAlert('success', 'Sucesso', 'AdvertÃªncia registrada com sucesso.')
      }
      setIsModalOpen(false)
      reloadWarnings()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao salvar advertÃªncia.'
      showAlert('destructive', 'Erro', msg)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredWorkshops = workshops.filter(w =>
    w.nome_oficina.toLowerCase().includes(search.toLowerCase())
  )

  const getStudentWarnings = (studentId: number) => {
    return workshopWarnings.filter(w => w.aluno_id === studentId)
  }

  if (!selectedWorkshop) {
    return (
      <main
        className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
      >
        <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
          <div>
            <h1 className="font-title text-xl font-extrabold text-gray-900 uppercase tracking-tight">
              Gestão de Advertências
            </h1>
            <p className="font-body text-xs text-gray-400 font-bold uppercase">
              Selecione uma oficina para iniciar o registro
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center gap-3 border border-gray-100 max-w-xl">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar oficina por nome..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 font-bold placeholder:font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredWorkshops.map(workshop => (
                <button
                  key={workshop.id}
                  onClick={() => setSelectedWorkshop(workshop)}
                  className="group relative overflow-hidden rounded-[32px] bg-white p-6 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-yellow-200 text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-yellow-50 p-3 text-yellow-600 transition group-hover:bg-yellow-400 group-hover:text-white">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-title text-lg font-black text-gray-900 group-hover:text-yellow-600 transition-colors uppercase">
                      {workshop.nome_oficina}
                    </h3>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{workshop.dias_semana}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {workshop.horario_inicio} Ã s {workshop.horario_fim}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedWorkshop(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-title text-xl font-black text-gray-900 uppercase">
              {selectedWorkshop.nome_oficina}
            </h1>
            <p className="font-body text-[10px] text-gray-400 font-black uppercase tracking-tighter">
              Clique no Aluno para registrar ou veja o histÃ³rico detalhado ao lado
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Lista de Alunos para Registro */}
        <div className="space-y-4">
          <SectionTitle
            title="Alunos Matriculados"
            sub="Selecione um aluno para nova ocorrÃªncia"
          />
          {loadingStudents ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : students.length === 0 ? (
            <div className="bg-white rounded-[40px] p-12 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-500">
              <div className="h-20 w-20 rounded-full bg-yellow-50 flex items-center justify-center mb-6">
                <Users className="h-10 w-10 text-yellow-400" />
              </div>
              <h3 className="font-title text-xl font-black text-gray-900 uppercase">
                Nenhum aluno vinculado
              </h3>
              <p className="text-gray-400 text-sm mt-3 max-w-sm leading-relaxed font-medium italic">
                NÃ£o identificamos alunos matriculados nesta oficina. Verifique o cadastro de turmas
                para prosseguir com o registro de advertÃªncias.
              </p>
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
              >
                Voltar para Oficinas
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {students.map(student => {
                const warns = getStudentWarnings(student.id)
                return (
                  <button
                    key={student.id}
                    onClick={() => handleOpenModal(student)}
                    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 relative">
                        {student.foto_perfil_url ? (
                          <img
                            src={`http://localhost:3001${student.foto_perfil_url}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-yellow-50 text-yellow-600 font-black text-lg">
                            {student.nome_completo.charAt(0)}
                          </div>
                        )}
                        {warns.length > 0 && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-sm">
                            <span className="text-[8px] text-white font-black">{warns.length}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="font-title text-sm font-black text-gray-900 group-hover:text-yellow-600 transition-colors uppercase">
                          {student.nome_completo}
                        </h4>
                        <span className="text-[9px] text-gray-400 font-black tracking-widest uppercase">
                          MATRÃCULA: {student.numero_matricula}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-yellow-50 transition-colors">
                      <Plus className="h-5 w-5 text-gray-300 group-hover:text-yellow-500" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* HistÃ³rico Recente da Oficina */}
        <div className="space-y-4">
          <SectionTitle
            title="HistÃ³rico da Oficina"
            sub="OcorrÃªncias registradas nesta atividade"
          />
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4 h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar">
            {workshopWarnings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Info className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  Sem histÃ³rico
                  <br />
                  nesta oficina
                </p>
              </div>
            ) : (
              workshopWarnings.map(adv => (
                <div
                  key={adv.id}
                  className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 group/item"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white overflow-hidden border border-gray-200 shadow-sm">
                        {adv.aluno?.foto_perfil_url ? (
                          <img
                            src={`http://localhost:3001${adv.aluno.foto_perfil_url}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[8px] font-black bg-yellow-50 text-yellow-600">
                            {adv.aluno?.nome_completo.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-black text-gray-900 uppercase truncate max-w-[150px]">
                        {adv.aluno?.nome_completo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(adv)}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-blue-500 transition-all cursor-pointer shadow-sm"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(adv)}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-500 transition-all cursor-pointer shadow-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            adv.gravidade === 'alta'
                              ? 'bg-red-500'
                              : adv.gravidade === 'media'
                                ? 'bg-yellow-400'
                                : 'bg-green-500'
                          }`}
                        />
                        {adv.tipo_advertencia}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-gray-400">
                        {new Date(adv.data_advertencia).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed italic line-clamp-3">
                      "{adv.descricao}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100/50">
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        adv.gravidade === 'alta'
                          ? 'bg-red-100 text-red-600'
                          : adv.gravidade === 'media'
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {adv.gravidade}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-gray-400 uppercase">Por:</span>
                      <span className="text-[8px] font-black text-gray-600 uppercase truncate max-w-[80px]">
                        {adv.professor_registrador?.nome_completo ||
                          adv.admin_registrador?.nome_completo ||
                          'Sistema'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de ExclusÃ£o */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6" />
                <h2 className="font-title text-xl font-black uppercase">Excluir AdvertÃªncia</h2>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-white border border-red-200 shrink-0">
                  {deleteTarget.aluno?.foto_perfil_url ? (
                    <img
                      src={`http://localhost:3001${deleteTarget.aluno.foto_perfil_url}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-red-100 text-red-600 font-black">
                      {deleteTarget.aluno?.nome_completo.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-tighter">
                    Aluno
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {deleteTarget.aluno?.nome_completo}
                  </p>
                  <p className="text-[10px] font-bold text-red-500 uppercase">
                    {deleteTarget.tipo_advertencia}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center leading-relaxed">
                Esta aÃ§Ã£o Ã© <strong className="text-red-600">permanente e irreversÃ­vel</strong>.
                Deseja realmente excluir esta advertÃªncia?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black text-gray-600 uppercase tracking-widest hover:bg-gray-100 transition-all cursor-pointer border border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-[2] py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-red-500 text-white shadow-lg hover:bg-red-600 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Confirmar ExclusÃ£o
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro/EdiÃ§Ã£o */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div
              className={`px-8 py-6 flex items-center justify-between ${isEditing ? 'bg-blue-500' : 'bg-yellow-400'}`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className={`h-6 w-6 ${isEditing ? 'text-white' : 'text-gray-900'}`} />
                <h2
                  className={`font-title text-xl font-black uppercase ${isEditing ? 'text-white' : 'text-gray-900'}`}
                >
                  {isEditing ? 'Editar OcorrÃªncia' : 'Nova AdvertÃªncia'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer ${isEditing ? 'text-white' : 'text-gray-900'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-gray-200">
                  {selectedStudent.foto_perfil_url ? (
                    <img
                      src={`http://localhost:3001${selectedStudent.foto_perfil_url}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-yellow-50 text-yellow-600 font-black text-xl">
                      {selectedStudent.nome_completo.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    ALUNO
                  </p>
                  <p className="text-base font-black text-gray-900">
                    {selectedStudent.nome_completo}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase tracking-wider">
                    Tipo de OcorrÃªncia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Atraso, Indisciplina..."
                    value={formData.tipo_advertencia}
                    onChange={e => setFormData({ ...formData, tipo_advertencia: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase tracking-wider">
                    Data do Ocorrido
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.data_advertencia}
                      onChange={e => setFormData({ ...formData, data_advertencia: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 ml-1 uppercase tracking-wider">
                  DescriÃ§Ã£o dos Fatos
                </label>
                <textarea
                  rows={4}
                  placeholder="Descreva detalhadamente o ocorrido..."
                  value={formData.descricao}
                  onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-yellow-400/20 focus:border-yellow-400 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 ml-1 uppercase tracking-wider">
                  Grau de Gravidade
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['baixa', 'media', 'alta'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gravidade: g as any })}
                      className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                        formData.gravidade === g
                          ? g === 'alta'
                            ? 'bg-red-500 border-red-500 text-white'
                            : g === 'media'
                              ? 'bg-yellow-400 border-yellow-400 text-white'
                              : 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-[2] py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                    isEditing ? 'bg-blue-500 text-white' : 'bg-yellow-400 text-gray-900'
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {isEditing ? 'Atualizar AdvertÃªncia' : 'Registrar AdvertÃªncia'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-2">
      <h2 className="font-title text-sm font-black text-gray-900 uppercase tracking-tight">
        {title}
      </h2>
      {sub && <p className="font-body text-[10px] text-gray-400 font-bold uppercase">{sub}</p>}
    </div>
  )
}

function OpenSidebarButton() {
  const { toggleSidebar, open } = useSidebar()
  if (open) return null
  return (
    <button
      onClick={toggleSidebar}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex h-10 w-8 items-center justify-center rounded-r-xl bg-white border border-l-0 border-gray-200 shadow-lg cursor-pointer hover:bg-gray-50 transition"
      title="Abrir menu"
    >
      <ChevronRight className="h-5 w-5 text-gray-600" />
    </button>
  )
}

export function Advertencia() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full font-body overflow-hidden">
        <AppSidebar />
        <OpenSidebarButton />
        <AdvertenciaContent />
      </div>
    </SidebarProvider>
  )
}
