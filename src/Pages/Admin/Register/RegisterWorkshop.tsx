import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronRight,
  GraduationCap,
  Search,
  Wrench,
  Plus,
  Users,
  Clock,
  Calendar,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { api } from '../../../lib/api'

interface OficinaAttributes {
  id?: number
  nome_oficina: string
  descricao?: string
  capacidade_maxima: number
  horario_inicio: string
  horario_fim: string
  dias_semana: string
  status_oficina: 'ativa' | 'inativa'
}

interface ProfessorCard {
  id: number
  nome_completo: string
  formacao: string
}

const schema = yup.object({
  nome_oficina: yup.string().required('Nome da oficina é obrigatório'),
  descricao: yup.string().required('Descrição é obrigatória'),
  capacidade_maxima: yup.number().min(1, 'Mínimo 1 vaga').required('Capacidade é obrigatória'),
  horario_inicio: yup.string().required('Horário de início é obrigatório'),
  horario_fim: yup.string().required('Horário de fim é obrigatório'),
  status_oficina: yup.string().oneOf(['ativa', 'inativa']).required(),
})

const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'

function RegisterWorkshopContent() {
  const { open } = useSidebar()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OficinaAttributes>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      capacidade_maxima: 20,
      horario_inicio: '09:00',
      horario_fim: '10:30',
      status_oficina: 'ativa',
      dias_semana: '',
    },
  })

  const [search, setSearch] = useState('')
  const [teachers, setTeachers] = useState<ProfessorCard[]>([])
  const [selectedTeacher, setSelectedTeacher] = useState<ProfessorCard | null>(null)
  const currentDays = watch('dias_semana')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/professores/find')
      setTeachers(response.data)
    } catch (error) {
      console.error('Erro ao buscar professores:', error)
    }
  }

  const toggleDay = (day: string) => {
    const selectedDays = currentDays ? currentDays.split(',') : []
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter(current => current !== day)
      : [...selectedDays, day]

    setValue('dias_semana', nextDays.join(','))
  }

  const filteredTeachers = teachers.filter(
    teacher =>
      teacher.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      teacher.formacao.toLowerCase().includes(search.toLowerCase())
  )

  const onFormSubmit = async (data: OficinaAttributes) => {
    if (!data.dias_semana) {
      alert('Selecione pelo menos um dia da semana.')
      return
    }

    try {
      const response = await api.post('/oficinas/create', data)
      const oficinaId = response.data.id

      if (selectedTeacher) {
        try {
          await api.post(`/oficinas/${oficinaId}/vincular-professor`, {
            professor_id: selectedTeacher.id,
          })
        } catch (linkError) {
          console.error('Erro ao vincular professor:', linkError)
          alert('Oficina criada, mas houve um erro ao vincular o professor responsável.')
        }
      }

      alert('Oficina criada com sucesso!')
      navigate('/dashboard/oficinas')
    } catch (error: any) {
      console.error('Erro ao criar oficina:', error)
      const message =
        error.response?.data?.message ||
        'Erro ao criar oficina. Verifique os dados e tente novamente.'
      alert(message)
    }
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold uppercase text-gray-900">
            Nova Oficina
          </h1>
          <p className="font-body text-xs text-gray-400">
            Criação de atividades e oficinas — ONG Iluminando o Futuro
          </p>
        </div>
        <NavLink
          to="/dashboard/oficinas"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
          Voltar à listagem
        </NavLink>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="rounded-3xl bg-white p-8 shadow-sm h-fit"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400 text-white shadow-md">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-title text-lg font-extrabold text-gray-900">
                  Informações da Oficina
                </h2>
                <p className="font-body text-xs text-gray-400">
                  Configure os detalhes da atividade
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="space-y-1.5 md:col-span-2">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Wrench className="h-3.5 w-3.5 text-yellow-500" />
                  Nome da Oficina
                </span>
                <input
                  type="text"
                  {...register('nome_oficina')}
                  placeholder="Ex: Oficina de Pintura"
                  className={`${fieldClass} ${errors.nome_oficina ? 'border-red-500' : ''}`}
                />
                {errors.nome_oficina && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.nome_oficina.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Plus className="h-3.5 w-3.5 text-yellow-500" />
                  Descrição (Opcional)
                </span>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  placeholder="Descreva o que será ensinado nesta oficina..."
                  className={fieldClass}
                />
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Users className="h-3.5 w-3.5 text-yellow-500" />
                  Capacidade Máxima
                </span>
                <input type="number" {...register('capacidade_maxima')} className={fieldClass} />
                {errors.capacidade_maxima && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.capacidade_maxima.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Plus className="h-3.5 w-3.5 text-yellow-500" />
                  Status
                </span>
                <select {...register('status_oficina')} className={fieldClass}>
                  <option value="ativa">Ativa</option>
                  <option value="inativa">Inativa</option>
                </select>
              </label>

              <div className="md:col-span-2 space-y-3">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Clock className="h-3.5 w-3.5 text-yellow-500" />
                  Horários
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <input type="time" {...register('horario_inicio')} className={fieldClass} />
                  <input type="time" {...register('horario_fim')} className={fieldClass} />
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5 text-yellow-500" />
                  Dias da Semana
                </span>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                        currentDays?.includes(day)
                          ? 'bg-yellow-400 text-gray-900 shadow-sm'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-yellow-400 px-6 py-4 text-sm font-bold text-gray-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                CRIAR OFICINA
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/oficinas')}
                className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-500 transition hover:bg-gray-50"
              >
                CANCELAR
              </button>
            </div>
          </form>

          <div className="rounded-3xl bg-white p-6 shadow-sm h-fit">
            <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-900">
              <GraduationCap className="h-4 w-4 text-yellow-400" />
              Professor Responsável
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar professor..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-yellow-400"
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {filteredTeachers.map(teacher => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setSelectedTeacher(teacher)}
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      selectedTeacher?.id === teacher.id
                        ? 'border-yellow-400 bg-yellow-50 shadow-sm'
                        : 'border-gray-100 hover:border-yellow-200 hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-900">{teacher.nome_completo}</p>
                    <p className="text-[10px] text-gray-500">{teacher.formacao}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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

export default function RegisterWorkshop() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <RegisterWorkshopContent />
      </div>
    </SidebarProvider>
  )
}
