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
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import { useAuth } from '../../../contexts/AuthContext'

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
  status?: 'pendente' | 'resolvida'
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
  status?: 'pendente' | 'resolvida'
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
  const [view, setView] = useState<'registro' | 'historico'>('registro')
  const [search, setSearch] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [historySearch, setHistorySearch] = useState('')

  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.tipo === 'admin' && (currentUser?.nivel_acesso === 'superadmin' || (currentUser as any).isSuperAdmin === true)

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
    if (currentUser) {
      fetchWorkshops()
    }
  }, [currentUser])

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
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Não foi possível carregar as oficinas.'
      showAlert('destructive', 'Erro', msg)
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
      console.error('Erro ao recarregar advertências', error)
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
      status: 'pendente',
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
      status: adv.status || 'pendente',
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
      showAlert('success', 'Sucesso', 'Advertência removida com sucesso.')
      setDeleteTarget(null)
      reloadWarnings()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Não foi possível remover a advertência.'
      showAlert('destructive', 'Erro', msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tipo_advertencia || !formData.descricao) {
      showAlert('warning', 'Campos obrigatórios', 'Por favor, preencha o tipo e a descrição.')
      return
    }

    try {
      setSubmitting(true)
      if (isEditing && formData.id) {
        await api.put(`/advertencias/atualizar/${formData.id}`, formData)
        showAlert('success', 'Sucesso', 'Advertência atualizada com sucesso.')
      } else {
        await api.post('/advertencias/registrar', formData)
        showAlert('success', 'Sucesso', 'Advertência registrada com sucesso.')
      }
      setIsModalOpen(false)
      reloadWarnings()
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao salvar advertência.'
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

  // Agrupar advertências por data para o histórico
  const groupedWarnings = workshopWarnings
    .filter(w => {
      const search = historySearch.toLowerCase()
      const studentName = w.aluno?.nome_completo?.toLowerCase() || ''
      const matricula = w.aluno?.numero_matricula || ''
      const type = w.tipo_advertencia?.toLowerCase() || ''
      
      return studentName.includes(search) || 
             matricula.includes(search) || 
             type.includes(search)
    })
    .reduce((acc: Record<string, Advertencia[]>, curr) => {
      const date = curr.data_advertencia
      if (!acc[date]) acc[date] = []
      acc[date].push(curr)
      return acc
    }, {})

  const sortedDates = Object.keys(groupedWarnings).sort((a, b) => b.localeCompare(a))

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
                          {workshop.horario_inicio} às {workshop.horario_fim}
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
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex w-full items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedWorkshop(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="font-title text-2xl font-black text-gray-900 leading-none">
                {selectedWorkshop.nome_oficina}
              </h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                Gestão de Ocorrências e Advertências
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 border-t border-gray-100">
          <div className="flex gap-8 ml-12">
            <button
              onClick={() => setView('registro')}
              className={`py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                view === 'registro' ? 'border-yellow-400 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Registrar Advertência
            </button>
            <button
              onClick={() => setView('historico')}
              className={`py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                view === 'historico' ? 'border-yellow-400 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Histórico de Advertências
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full">
        {view === 'registro' ? (
          <div className="space-y-8">
            {/* Barra de Pesquisa Centralizada Estilo Presença */}
            <div className="flex justify-center">
              <div className="bg-white w-full max-w-3xl px-6 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                <Search className="h-6 w-6 text-gray-300" />
                <input
                  type="text"
                  placeholder="Buscar aluno por nome ou matrícula..."
                  className="bg-transparent border-none outline-none text-base font-medium text-gray-900 w-full placeholder:text-gray-400"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-yellow-400" />
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {students
                  .filter(s => 
                    s.nome_completo.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.numero_matricula.includes(studentSearch)
                  )
                  .map(student => {
                    const warns = getStudentWarnings(student.id)
                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm flex items-center justify-between group transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 relative">
                            {student.foto_perfil_url ? (
                              <img
                                src={`http://localhost:3001${student.foto_perfil_url}`}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-yellow-50 text-yellow-600 font-black font-title text-2xl">
                                {student.nome_completo.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-title text-sm font-bold text-gray-900 uppercase">
                              {student.nome_completo}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                              MATRÍCULA: <span className="text-gray-600">{student.numero_matricula || 'N/A'}</span>
                            </p>
                            {warns.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-black font-title text-red-500 uppercase">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>{warns.length} {warns.length === 1 ? 'Ocorrência' : 'Ocorrências'} registrada(s)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenModal(student)}
                          className="flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gray-50 text-gray-400 font-black font-title text-[10px] uppercase tracking-widest hover:bg-yellow-400 hover:text-white transition-all shadow-sm group-hover:bg-yellow-50 group-hover:text-yellow-600 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          Dar Advertência
                        </button>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Barra de Pesquisa para Histórico */}
            <div className="flex justify-center">
              <div className="bg-white w-full max-w-3xl px-6 py-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                <Search className="h-6 w-6 text-gray-300" />
                <input
                  type="text"
                  placeholder="Pesquisar no histórico por nome..."
                  className="bg-transparent border-none outline-none text-base font-medium text-gray-900 w-full placeholder:text-gray-400"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                />
              </div>
            </div>

            {sortedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-40">
                <Clock className="h-16 w-16 text-gray-300 mb-4" />
                <p className="font-black text-sm text-gray-400 uppercase tracking-widest">Nenhuma ocorrência registrada</p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-10">
                {sortedDates.map(date => (
                  <div key={date} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-white px-6 py-2 rounded-full border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-black font-title text-gray-900 uppercase tracking-widest">
                          {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'full' })}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {groupedWarnings[date].map(adv => (
                        <div
                          key={adv.id}
                          className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-all group/card relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="h-14 w-14 rounded-2xl bg-gray-50 overflow-hidden border border-gray-200 shadow-sm">
                                {adv.aluno?.foto_perfil_url ? (
                                  <img
                                    src={`http://localhost:3001${adv.aluno.foto_perfil_url}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-base font-black font-title bg-yellow-50 text-yellow-600 uppercase">
                                    {adv.aluno?.nome_completo.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold font-title text-gray-900 uppercase leading-tight">
                                  {adv.aluno?.nome_completo}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-bold font-body uppercase tracking-widest mt-1">
                                  MATRÍCULA: <span className="text-gray-600">{adv.aluno?.numero_matricula || 'N/A'}</span>
                                </p>
                              </div>
                            </div>
                            
                            {isSuperAdmin && (
                              <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEdit(adv)}
                                  className="p-2.5 hover:bg-blue-50 rounded-2xl text-gray-400 hover:text-blue-500 transition-all cursor-pointer shadow-sm bg-white border border-gray-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(adv)}
                                  className="p-2.5 hover:bg-red-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all cursor-pointer shadow-sm bg-white border border-gray-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black font-title text-red-500 uppercase flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                {adv.tipo_advertencia}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[8px] font-black font-title uppercase px-3 py-1 rounded-full border ${
                                    adv.status === 'resolvida'
                                      ? 'bg-green-100 text-green-600 border-green-200'
                                      : 'bg-red-100 text-red-600 border-red-200'
                                  }`}
                                >
                                  {adv.status === 'resolvida' ? 'Resolvida' : 'Pendente'}
                                </span>
                                <span
                                  className={`text-[8px] font-black font-title uppercase px-3 py-1 rounded-full ${
                                    adv.gravidade === 'alta'
                                      ? 'bg-red-100 text-red-600'
                                      : adv.gravidade === 'media'
                                        ? 'bg-yellow-100 text-yellow-600'
                                        : 'bg-green-100 text-green-600'
                                  }`}
                                >
                                  {adv.gravidade}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm font-body text-gray-600 italic leading-relaxed">
                              "{adv.descricao}"
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 px-1">
                            <div className="flex items-center gap-2 text-[9px] font-black font-title text-gray-400 uppercase tracking-tighter">
                              <User className="h-3.5 w-3.5" />
                              Por: <span className="text-gray-600">{adv.professor_registrador?.nome_completo || adv.admin_registrador?.nome_completo || 'Sistema'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 px-8 py-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6" />
                <h2 className="font-title text-xl font-black uppercase">Excluir Advertência</h2>
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
                Esta ação é <strong className="text-red-600">permanente e irreversível</strong>.
                Deseja realmente excluir esta advertência?
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
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Registro/Edição */}
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
                  {isEditing ? 'Editar Ocorrência' : 'Nova Advertência'}
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
                    Tipo de Ocorrência
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
                  Descrição dos Fatos
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

              {isEditing && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-gray-500 ml-1 uppercase tracking-wider">
                    Status da Ocorrência
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['pendente', 'resolvida'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s as any })}
                        className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                          formData.status === s
                            ? s === 'resolvida'
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'bg-red-500 border-red-500 text-white'
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        {s === 'resolvida' ? 'Resolvida' : 'Pendente'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                      {isEditing ? 'Atualizar Advertência' : 'Registrar Advertência'}
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
