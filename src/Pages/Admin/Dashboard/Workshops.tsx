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
  Calendar
} from 'lucide-react'
import { api } from '../../../lib/api'

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
  const [workshops, setWorkshops] = useState<Oficina[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta oficina?')) return

    try {
      await api.delete(`/oficinas/delete/${id}`)
      setWorkshops(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Erro ao deletar oficina:', error)
      alert('Erro ao deletar oficina.')
    }
  }

  const filteredWorkshops = workshops.filter(w => 
    w.nome_oficina.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900">Oficinas</h1>
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
              <div key={workshop.id} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-500">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(workshop.id)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-title text-lg font-bold text-gray-900 mb-2">{workshop.nome_oficina}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{workshop.descricao}</p>

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
                    Capacidade: {workshop.capacidade_maxima} alunos
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
