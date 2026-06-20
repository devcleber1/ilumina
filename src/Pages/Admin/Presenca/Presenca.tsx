import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { UserAvatar } from '../../../Components/UserAvatar'
import {
  ChevronLeft,
  Calendar,
  Users as UsersIcon,
  Search,
  Save,
  Loader2,
  Info,
  ChevronRight,
  Clock,
  UserCheck,
  UserX,
  Lock,
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

interface PresencaRecord {
  id?: number
  aluno_id: number
  presente: boolean
  justificativa?: string
  total_edicoes?: number
}

function PresencaContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()

  const [workshops, setWorkshops] = useState<Oficina[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Oficina | null>(null)
  const [students, setStudents] = useState<Aluno[]>([])
  const [attendance, setAttendance] = useState<Record<number, PresencaRecord>>({})
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [view, setView] = useState<'chamada' | 'historico'>('chamada')

  const [studentSearch, setStudentSearch] = useState('')
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyDate, setHistoryDate] = useState('')
  const [historyAttendance, setHistoryAttendance] = useState<Record<number, PresencaRecord>>({})
  const [savingHistory, setSavingHistory] = useState(false)
  const [changedStudents, setChangedStudents] = useState<Set<number>>(new Set())
  const [changedHistoryStudents, setChangedHistoryStudents] = useState<Set<number>>(new Set())
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null)
  const [isRollCallDone, setIsRollCallDone] = useState(false)

  const { user: currentUser } = useAuth()
  const isAdmin =
    currentUser?.tipo === 'admin' ||
    currentUser?.nivel_acesso === 'admin' ||
    currentUser?.nivel_acesso === 'superadmin'
  const isSuperAdmin = currentUser?.tipo === 'admin' && currentUser?.nivel_acesso === 'superadmin'

  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchWorkshops()
  }, [])

  useEffect(() => {
    if (selectedWorkshop) {
      if (view === 'chamada') {
        fetchStudentsAndAttendance()
      } else {
        fetchHistory()
      }
    }
  }, [selectedWorkshop, date, view])

  const fetchWorkshops = async () => {
    try {
      setLoading(true)
      const response = await api.get('/oficinas/find')
      setWorkshops(response.data)
    } catch (error) {
      console.error('Erro ao buscar oficinas:', error)
      showAlert('destructive', 'Erro', 'Não foi possível carregar as oficinas.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentsAndAttendance = async () => {
    if (!selectedWorkshop) return

    try {
      setLoadingStudents(true)
      // 1. Fetch students of the workshop
      const studentsResponse = await api.get(`/oficinas/${selectedWorkshop.id}/alunos`)
      const studentsData = studentsResponse.data.data
      setStudents(studentsData)

      // 2. Fetch existing attendance for this date and workshop
      const attendanceResponse = await api.get('/presencas/listar-presenca', {
        params: {
          oficina_id: selectedWorkshop.id,
          data_inicio: date,
          data_fim: date,
        },
      })

      const existingAttendance = attendanceResponse.data.data
      const attendanceMap: Record<number, PresencaRecord> = {}

      // Initialize with defaults (all present)
      studentsData.forEach((student: Aluno) => {
        attendanceMap[student.id] = {
          aluno_id: student.id,
          presente: true,
          justificativa: '',
        }
      })

      // Override with existing data from DB
      let countExisting = 0
      existingAttendance.forEach((record: any) => {
        countExisting++
        attendanceMap[record.aluno_id] = {
          id: record.id,
          aluno_id: record.aluno_id,
          presente: record.presente,
          justificativa: record.justificativa || '',
          total_edicoes: record.total_edicoes,
        }
      })

      const isDone = countExisting > 0 && countExisting >= studentsData.length
      setIsRollCallDone(isDone)
      if (isDone && view === 'chamada') {
        setView('historico')
      }

      setAttendance(attendanceMap)
    } catch (error) {
      console.error('Erro ao buscar alunos/presença:', error)
      showAlert('destructive', 'Erro', 'Falha ao carregar lista de alunos.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchHistory = async () => {
    if (!selectedWorkshop) return
    try {
      setLoadingHistory(true)
      const response = await api.get('/presencas/listar-presenca', {
        params: { oficina_id: selectedWorkshop.id },
      })

      const grouped = (response.data.data || []).reduce((acc: any, curr: any) => {
        const d = curr.data
        if (!acc[d]) acc[d] = { date: d, present: 0, total: 0 }
        acc[d].total++
        if (curr.presente) acc[d].present++
        return acc
      }, {})

      const historyArray = Object.values(grouped).sort((a: any, b: any) =>
        b.date.localeCompare(a.date)
      )
      setHistory(historyArray)
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      showAlert('destructive', 'Erro', 'Falha ao carregar histórico.')
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchHistoryAttendance = async (targetDate: string) => {
    if (!selectedWorkshop) return
    try {
      setLoadingStudents(true)
      const response = await api.get('/presencas/listar-presenca', {
        params: {
          oficina_id: selectedWorkshop.id,
          data_inicio: targetDate,
          data_fim: targetDate,
        },
      })

      const existingAttendance = response.data.data
      const attendanceMap: Record<number, PresencaRecord> = {}

      // Inicializar com padrões
      students.forEach((student: Aluno) => {
        attendanceMap[student.id] = {
          aluno_id: student.id,
          presente: true,
          justificativa: '',
        }
      })

      // Sobrescrever com dados do banco
      existingAttendance.forEach((record: any) => {
        attendanceMap[record.aluno_id] = {
          id: record.id,
          aluno_id: record.aluno_id,
          presente: record.presente,
          justificativa: record.justificativa || '',
          total_edicoes: record.total_edicoes,
        }
      })

      setHistoryAttendance(attendanceMap)
      setHistoryDate(targetDate)
      setIsHistoryModalOpen(true)
    } catch (error) {
      showAlert('destructive', 'Erro', 'Falha ao carregar dados da data selecionada.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleSaveHistoryAttendance = async () => {
    if (!selectedWorkshop || !historyDate) return

    try {
      setSavingHistory(true)
      const promises = Object.values(historyAttendance)
        .filter(record => changedHistoryStudents.has(record.aluno_id))
        .map(async record => {
          if (record.id) {
            return api.put(`/presencas/atualizar/${record.id}`, {
              presente: record.presente,
              data: historyDate,
              justificativa: record.justificativa,
            })
          } else {
            return api.post('/presencas/registrar', {
              aluno_id: record.aluno_id,
              oficina_id: selectedWorkshop.id,
              data: historyDate,
              presente: record.presente,
              justificativa: record.justificativa,
            })
          }
        })

      if (promises.length === 0) return

      await Promise.all(promises)
      showAlert('success', 'Sucesso', 'Histórico atualizado com sucesso!')
      setChangedHistoryStudents(new Set())
      setIsHistoryModalOpen(false)
      fetchHistory()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao atualizar o histórico.'
      showAlert('destructive', 'Erro', errorMsg)
    } finally {
      setSavingHistory(false)
    }
  }

  const handleSaveSingleHistoryAttendance = async (studentId: number) => {
    if (!selectedWorkshop || !historyDate) return
    const record = historyAttendance[studentId]
    if (!record) return

    try {
      setSavingStudentId(studentId)

      if (record.id) {
        await api.put(`/presencas/atualizar/${record.id}`, {
          presente: record.presente,
          data: historyDate,
          justificativa: record.justificativa,
        })
      } else {
        await api.post('/presencas/registrar', {
          aluno_id: record.aluno_id,
          oficina_id: selectedWorkshop.id,
          data: historyDate,
          presente: record.presente,
          justificativa: record.justificativa,
        })
      }

      showAlert('success', 'Sucesso', 'Registro do histórico salvo!')
      setChangedHistoryStudents(prev => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
      fetchHistory() // Força a recarga da barrinha de porcentagem em tempo real
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Erro ao salvar o registro no histórico.'
      showAlert('destructive', 'Erro', errorMsg)
    } finally {
      setSavingStudentId(null)
    }
  }

  const handleToggleHistoryPresence = (studentId: number, isPresent: boolean) => {
    setHistoryAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        presente: isPresent,
        justificativa: isPresent ? '' : prev[studentId].justificativa,
      },
    }))
    setChangedHistoryStudents(prev => new Set(prev).add(studentId))
  }

  const handleHistoryJustificationChange = (studentId: number, value: string) => {
    setHistoryAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justificativa: value,
      },
    }))
    setChangedHistoryStudents(prev => new Set(prev).add(studentId))
  }

  const handleTogglePresence = (studentId: number, isPresent: boolean) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        presente: isPresent,
        justificativa: isPresent ? '' : prev[studentId].justificativa,
      },
    }))
    setChangedStudents(prev => new Set(prev).add(studentId))
  }

  const handleJustificationChange = (studentId: number, value: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justificativa: value,
      },
    }))
    setChangedStudents(prev => new Set(prev).add(studentId))
  }

  const handleSaveSingleAttendance = async (studentId: number) => {
    if (!selectedWorkshop) return
    const record = attendance[studentId]
    if (!record) return

    try {
      setSavingStudentId(studentId)

      if (record.id) {
        await api.put(`/presencas/atualizar/${record.id}`, {
          presente: record.presente,
          data: date,
          justificativa: record.justificativa,
        })
      } else {
        await api.post('/presencas/registrar', {
          aluno_id: record.aluno_id,
          oficina_id: selectedWorkshop.id,
          data: date,
          presente: record.presente,
          justificativa: record.justificativa,
        })
      }

      showAlert('success', 'Sucesso', 'Presença salva!')
      setChangedStudents(prev => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
      // Recarregar para pegar o novo ID ou total de edições
      fetchStudentsAndAttendance()
    } catch (error: any) {
      console.error('Erro ao salvar presença individual:', error)
      const errorMsg = error.response?.data?.message || 'Erro ao salvar a presença.'
      showAlert('destructive', 'Erro', errorMsg)
    } finally {
      setSavingStudentId(null)
    }
  }

  const handleSaveAttendance = async () => {
    if (!selectedWorkshop) return

    try {
      setSaving(true)

      const promises = Object.values(attendance).map(async record => {
        if (record.id) {
          // Update existing
          return api.put(`/presencas/atualizar/${record.id}`, {
            presente: record.presente,
            data: date,
            justificativa: record.justificativa,
          })
        } else {
          // Create new
          return api.post('/presencas/registrar', {
            aluno_id: record.aluno_id,
            oficina_id: selectedWorkshop.id,
            data: date,
            presente: record.presente,
            justificativa: record.justificativa,
          })
        }
      })

      await Promise.all(promises)
      showAlert('success', 'Sucesso', 'Lista de presença salva com sucesso!')
      setChangedStudents(new Set())
      fetchStudentsAndAttendance()
    } catch (error: any) {
      console.error('Erro ao salvar presença:', error)
      const errorMsg = error.response?.data?.message || 'Erro ao salvar a lista de presença.'
      showAlert('destructive', 'Erro', errorMsg)
    } finally {
      setSaving(false)
    }
  }

  const filteredWorkshops = workshops.filter(w =>
    w.nome_oficina.toLowerCase().includes(search.toLowerCase())
  )

  const filteredStudents = students.filter(
    s =>
      s.nome_completo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.numero_matricula.toLowerCase().includes(studentSearch.toLowerCase())
  )

  if (!selectedWorkshop) {
    return (
      <main
        className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
      >
        <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
          <div>
            <h1 className="font-title text-xl uppercase font-extrabold text-gray-900">
              Controle de Presença
            </h1>
            <p className="font-body text-xs text-gray-400">
              Selecione uma oficina para realizar a chamada
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              <Calendar className="h-4 w-4 text-yellow-500" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold text-gray-700"
              />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center gap-3 border border-gray-100">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar oficina..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
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
                  className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-yellow-200 text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="rounded-2xl bg-yellow-50 p-3 text-yellow-600 transition group-hover:bg-yellow-400 group-hover:text-white">
                      <UsersIcon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-yellow-500 transition-colors" />
                  </div>

                  <div className="mt-4">
                    <h3 className="font-title text-lg font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                      {workshop.nome_oficina}
                    </h3>
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{workshop.dias_semana}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
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
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedWorkshop(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-title text-xl font-extrabold text-gray-900">
              {selectedWorkshop.nome_oficina}
            </h1>
            <p className="font-body text-xs text-gray-400">
              Chamada do dia {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {view === 'chamada' && changedStudents.size > 0 && (
            <button
              onClick={handleSaveAttendance}
              disabled={saving || loadingStudents}
              className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 shadow-md transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Todas ({changedStudents.size})
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white px-6 border-b border-gray-100 sticky top-[73px] z-30">
          <div className="flex gap-8">
            {!isRollCallDone && (
              <button
                onClick={() => {
                  setView('chamada')
                  setStudentSearch('')
                }}
                className={`py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  view === 'chamada'
                    ? 'border-yellow-400 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Realizar Chamada
              </button>
            )}
            <button
              onClick={() => {
                setView('historico')
                setStudentSearch('')
              }}
              className={`py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                view === 'historico'
                  ? 'border-yellow-400 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Histórico de Presenças
            </button>
          </div>
        </div>
      )}

      <div className="p-6 max-w-4xl mx-auto">
        {view === 'chamada' && students.length > 0 && !loadingStudents && (
          <div className="mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 transition-all focus-within:border-yellow-400 focus-within:ring-1 focus-within:ring-yellow-400/20">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou matrícula..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
              {studentSearch && (
                <button
                  onClick={() => setStudentSearch('')}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                >
                  <UserX className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'chamada' ? (
          loadingStudents ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-title text-lg font-bold text-gray-900">
                Nenhum aluno encontrado
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Tente ajustar sua busca por nome ou matrícula.
              </p>
              <button
                onClick={() => setStudentSearch('')}
                className="mt-4 text-yellow-600 text-sm font-bold hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map(student => {
                const record = attendance[student.id] || { presente: true, justificativa: '' }
                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-3xl p-4 border transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden ${
                      record.presente ? 'border-green-100' : 'border-red-100'
                    }`}
                  >
                    {/* Overlay de Bloqueio - 2 Edições (Exceto SuperAdmin) */}
                    {record.total_edicoes !== undefined &&
                      record.total_edicoes >= 2 &&
                      !isSuperAdmin && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
                          <div className="bg-white/90 border border-gray-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
                            <div className="bg-yellow-400 p-1.5 rounded-lg">
                              <Lock className="h-4 w-4 text-gray-900" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                                Registro Bloqueado
                              </span>
                              <span className="text-[9px] text-gray-500 font-medium">
                                Limite de 2 edições atingido
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          src={student.foto_perfil_url}
                          name={student.nome_completo}
                          className="h-12 w-12 rounded-2xl border border-gray-200"
                        />
                        <div>
                          <h4 className="font-title font-bold text-gray-900">
                            {student.nome_completo}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium tracking-wider">
                            MATRÍCULA: {student.numero_matricula}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTogglePresence(student.id, true)}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            record.presente
                              ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <UserCheck className="h-4 w-4" />
                          Presente
                        </button>
                        <button
                          onClick={() => handleTogglePresence(student.id, false)}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !record.presente
                              ? 'bg-red-500 text-white shadow-lg shadow-red-100'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <UserX className="h-4 w-4" />
                          Ausente
                        </button>

                        {changedStudents.has(student.id) && (
                          <button
                            onClick={() => handleSaveSingleAttendance(student.id)}
                            disabled={savingStudentId === student.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-100 hover:bg-yellow-300 transition-all animate-in zoom-in-95 duration-200 cursor-pointer"
                          >
                            {savingStudentId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar
                          </button>
                        )}
                      </div>
                    </div>

                    {!record.presente && (
                      <div className="mt-4 pt-4 border-t border-red-50">
                        <label className="text-[10px] font-bold text-red-400 mb-1.5 block uppercase tracking-wider">
                          Justificativa da Ausência
                        </label>
                        <textarea
                          value={record.justificativa}
                          onChange={e => handleJustificationChange(student.id, e.target.value)}
                          placeholder="Informe o motivo da falta..."
                          className="w-full bg-red-50/50 border border-red-100 rounded-xl p-3 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-200 transition-all resize-none h-20 placeholder:text-red-200"
                        />
                      </div>
                    )}

                    {record.total_edicoes !== undefined && record.total_edicoes > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-[9px] text-gray-400 italic">
                        <Info className="h-3 w-3" />
                        <span>
                          Registro atualizado {record.total_edicoes}{' '}
                          {record.total_edicoes === 1 ? 'vez' : 'vezes'}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* Histórico View */
          <div className="space-y-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="font-title text-lg font-bold text-gray-900">Sem histórico</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Nenhuma chamada foi registrada anteriormente para esta oficina.
                </p>
              </div>
            ) : (
              history.map(item => (
                <div
                  key={item.date}
                  className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-title font-bold text-gray-900">
                        {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(item.present / item.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {item.present} de {item.total} Presentes (
                          {Math.round((item.present / item.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchHistoryAttendance(item.date)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-50 text-gray-600 hover:bg-yellow-400 hover:text-gray-900 transition-all cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    Editar Presenças
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Modal de Edição de Histórico */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-100 w-full max-w-3xl max-h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header do Modal */}
            <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-gray-100">
              <div>
                <h2 className="font-title text-xl font-black text-gray-900 uppercase">
                  Editar Histórico
                </h2>
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(historyDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                      dateStyle: 'full',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {changedHistoryStudents.size > 0 && (
                  <button
                    onClick={handleSaveHistoryAttendance}
                    disabled={savingHistory}
                    className="flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-gray-900 shadow-xl shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:opacity-50"
                  >
                    {savingHistory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar Todos ({changedHistoryStudents.size})
                  </button>
                )}
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  <UserX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {students.map(student => {
                const record = historyAttendance[student.id] || {
                  presente: true,
                  justificativa: '',
                }
                return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-300 shadow-sm relative overflow-hidden ${
                      record.presente ? 'border-green-100' : 'border-red-100'
                    }`}
                  >
                    {/* Overlay de Bloqueio - 2 Edições (Exceto SuperAdmin) no Modal */}
                    {record.total_edicoes !== undefined &&
                      record.total_edicoes >= 2 &&
                      !isSuperAdmin && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center p-4">
                          <div className="bg-white/90 border border-gray-100 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 animate-in zoom-in-95 duration-300">
                            <div className="bg-yellow-400 p-1.5 rounded-lg">
                              <Lock className="h-4 w-4 text-gray-900" />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                                Registro Bloqueado
                              </span>
                              <span className="text-[9px] text-gray-500 font-medium">
                                Limite atingido
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          src={student.foto_perfil_url}
                          name={student.nome_completo}
                          className="h-12 w-12 rounded-2xl border border-gray-200"
                        />
                        <div>
                          <h4 className="font-title font-bold text-gray-900">
                            {student.nome_completo}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-medium tracking-wider">
                            MATRÍCULA: {student.numero_matricula}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleHistoryPresence(student.id, true)}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            record.presente
                              ? 'bg-green-500 text-white shadow-lg shadow-green-100'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <UserCheck className="h-4 w-4" />
                          Presente
                        </button>
                        <button
                          onClick={() => handleToggleHistoryPresence(student.id, false)}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            !record.presente
                              ? 'bg-red-500 text-white shadow-lg shadow-red-100'
                              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          <UserX className="h-4 w-4" />
                          Ausente
                        </button>

                        {changedHistoryStudents.has(student.id) && (
                          <button
                            onClick={() => handleSaveSingleHistoryAttendance(student.id)}
                            disabled={savingStudentId === student.id}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-100 hover:bg-yellow-300 transition-all animate-in zoom-in-95 duration-200 cursor-pointer"
                          >
                            {savingStudentId === student.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Salvar
                          </button>
                        )}
                      </div>
                    </div>

                    {!record.presente && (
                      <div className="mt-4 pt-4 border-t border-red-50">
                        <textarea
                          value={record.justificativa}
                          onChange={e =>
                            handleHistoryJustificationChange(student.id, e.target.value)
                          }
                          placeholder="Informe o motivo da falta..."
                          className="w-full bg-red-50/50 border border-red-100 rounded-2xl p-4 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-red-200 transition-all resize-none h-24 placeholder:text-red-200"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export function Presenca() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <PresencaContent />
      </div>
    </SidebarProvider>
  )
}
