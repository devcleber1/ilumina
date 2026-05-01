import { useState, type FormEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { ChevronRight, GraduationCap, Search, Wrench } from 'lucide-react'

interface OficinaAttributes {
  id?: number
  nome_oficina: string
  descricao?: string
  capacidade_maxima: number
  horario_inicio: string
  horario_fim: string
  dias_semana: string
  status_oficina: 'ativa' | 'inativa'
  data_cadastro?: Date
  data_atualizacao?: Date
}

interface ProfessorCard {
  id: number
  nome: string
  disciplina: string
  experiencia: string
}

type WorkshopForm = Omit<OficinaAttributes, 'data_cadastro' | 'data_atualizacao'> & {
  professor_responsavel?: ProfessorCard | null
}

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'

const daysOfWeek = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const suggestedTeachers: ProfessorCard[] = [
  { id: 1, nome: 'Ana Souza', disciplina: 'Matemática', experiencia: '8 anos' },
  { id: 2, nome: 'Carlos Pereira', disciplina: 'Artes', experiencia: '6 anos' },
  { id: 3, nome: 'Mariana Silva', disciplina: 'Ciências', experiencia: '10 anos' },
]

function RegisterWorkshopContent() {
  const { open } = useSidebar()
  const [form, setForm] = useState<WorkshopForm>({
    nome_oficina: '',
    descricao: '',
    capacidade_maxima: 20,
    horario_inicio: '09:00',
    horario_fim: '10:30',
    dias_semana: '',
    status_oficina: 'ativa',
    professor_responsavel: null,
  })
  const [search, setSearch] = useState('')

  const handleChange = (field: keyof WorkshopForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleDay = (day: string) => {
    const selectedDays = form.dias_semana ? form.dias_semana.split(',') : []
    const nextDays = selectedDays.includes(day)
      ? selectedDays.filter(current => current !== day)
      : [...selectedDays, day]

    setForm(prev => ({ ...prev, dias_semana: nextDays.join(',') }))
  }

  const filteredTeachers = suggestedTeachers.filter(
    teacher =>
      teacher.nome.toLowerCase().includes(search.toLowerCase()) ||
      teacher.disciplina.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectProfessor = (teacher: ProfessorCard) => {
    setForm(prev => ({ ...prev, professor_responsavel: teacher }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = {
      ...form,
      professor_responsavel: form.professor_responsavel,
    }
    console.log('Salvar oficina:', payload)
    alert('Cadastro de oficina salvo localmente. Implementar envio ao backend.')
  }

  const selectedDays = form.dias_semana ? form.dias_semana.split(',') : []

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900">Cadastro de Oficinas</h1>
          <p className="font-body text-xs text-gray-400">
            Cadastro de oficina — ONG Iluminando o Futuro
          </p>
        </div>
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
          Voltar ao dashboard
        </NavLink>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-900">
            <Wrench className="h-4 w-4 text-yellow-400" />
            Dados da oficina
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2 lg:col-span-2">
              <span className="font-body text-sm font-semibold text-gray-700">Nome da oficina</span>
              <input
                type="text"
                value={form.nome_oficina}
                onChange={event => handleChange('nome_oficina', event.target.value)}
                className={fieldClass}
                placeholder="Ex: Oficina de Robótica"
                required
              />
            </label>

            <label className="space-y-2 lg:col-span-2">
              <span className="font-body text-sm font-semibold text-gray-700">Descrição</span>
              <textarea
                value={form.descricao ?? ''}
                onChange={event => handleChange('descricao', event.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200"
                placeholder="Descrição breve da oficina"
              />
            </label>

            <label className="space-y-2">
              <span className="font-body text-sm font-semibold text-gray-700">
                Capacidade máxima
              </span>
              <input
                type="number"
                value={form.capacidade_maxima}
                onChange={event => handleChange('capacidade_maxima', Number(event.target.value))}
                className={fieldClass}
                min={1}
                placeholder="25"
                required
              />
            </label>

            <label className="space-y-2">
              <span className="font-body text-sm font-semibold text-gray-700">
                Status da oficina
              </span>
              <select
                value={form.status_oficina}
                onChange={event =>
                  handleChange('status_oficina', event.target.value as 'ativa' | 'inativa')
                }
                className={fieldClass}
              >
                <option value="ativa">Ativa</option>
                <option value="inativa">Inativa</option>
              </select>
            </label>

            <div className="space-y-2 lg:col-span-2">
              <span className="font-body text-sm font-semibold text-gray-700">Dias da semana</span>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map(day => {
                  const isSelected = selectedDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
                        isSelected
                          ? 'border-yellow-400 bg-yellow-400 text-gray-900'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-yellow-400 hover:bg-yellow-50 hover:text-gray-900'
                      } cursor-pointer`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400">
                Selecione os dias em que a oficina acontecerá.
              </p>
            </div>

            <label className="space-y-2">
              <span className="font-body text-sm font-semibold text-gray-700">
                Horário de início
              </span>
              <input
                type="time"
                value={form.horario_inicio}
                onChange={event => handleChange('horario_inicio', event.target.value)}
                className={fieldClass}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="font-body text-sm font-semibold text-gray-700">
                Horário de término
              </span>
              <input
                type="time"
                value={form.horario_fim}
                onChange={event => handleChange('horario_fim', event.target.value)}
                className={fieldClass}
                required
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-900">
            <GraduationCap className="h-4 w-4 text-yellow-400" />
            Professor responsável
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Search className="h-4 w-4" />
                <input
                  type="text"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  placeholder="Buscar por nome, disciplina ou ID"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Sugestões de professores</p>
              <p className="text-xs text-gray-500">
                Selecione um professor para vincular à oficina.
              </p>
            </div>

            <div className="grid gap-3">
              {filteredTeachers.map(teacher => {
                const isSelected = form.professor_responsavel?.id === teacher.id
                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => handleSelectProfessor(teacher)}
                    className={`rounded-3xl border px-4 py-4 text-left transition ${
                      isSelected
                        ? 'border-black bg-yellow-400 text-gray-900'
                        : 'border-gray-200  text-gray-900 hover:border-yellow-300 hover:bg-yellow-400'
                    } cursor-pointer`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-semibold text-gray-900">
                          {teacher.nome}
                        </p>
                        <p className="text-xs text-gray-500">{teacher.disciplina}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">
                        {teacher.experiencia}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:brightness-95"
          >
            Criar Oficina
          </button>
        </div>
      </form>
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
