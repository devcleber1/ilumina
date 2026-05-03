import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
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
      fetchStudentsAndAttendance()
    }
  }, [selectedWorkshop, date])

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
      existingAttendance.forEach((record: any) => {
        attendanceMap[record.aluno_id] = {
          id: record.id,
          aluno_id: record.aluno_id,
          presente: record.presente,
          justificativa: record.justificativa || '',
          total_edicoes: record.total_edicoes,
        }
      })

      setAttendance(attendanceMap)
    } catch (error) {
      console.error('Erro ao buscar alunos/presença:', error)
      showAlert('destructive', 'Erro', 'Falha ao carregar lista de alunos.')
    } finally {
      setLoadingStudents(false)
    }
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
  }

  const handleJustificationChange = (studentId: number, value: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justificativa: value,
      },
    }))
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
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loadingStudents}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-gray-900 shadow-md transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Chamada
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        {loadingStudents ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900">Nenhum aluno vinculado</h3>
            <p className="text-gray-400 text-sm mt-2">
              Esta oficina ainda não possui alunos matriculados.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map(student => {
              const record = attendance[student.id] || { presente: true, justificativa: '' }
              return (
                <div
                  key={student.id}
                  className={`bg-white rounded-3xl p-4 border transition-all duration-300 shadow-sm hover:shadow-md relative overflow-hidden ${
                    record.presente ? 'border-green-100' : 'border-red-100'
                  }`}
                >
                  {/* Overlay de Bloqueio - 2 Edições */}
                  {record.total_edicoes !== undefined && record.total_edicoes >= 2 && (
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
                      <div className="h-12 w-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                        {student.foto_perfil_url ? (
                          <img
                            src={`http://localhost:3001${student.foto_perfil_url}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-yellow-50 text-yellow-600 font-bold text-lg">
                            {student.nome_completo.charAt(0)}
                          </div>
                        )}
                      </div>
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
        )}
      </div>
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
