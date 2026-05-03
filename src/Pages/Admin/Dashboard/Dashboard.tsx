import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Plus,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { api } from '../../../lib/api'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'

interface Stats {
  summary: {
    totalAlunos: number
    totalProfessores: number
    totalOficinas: number
    totalPais: number
  }
  chartData: { month: string; alunos: number }[]
  ultimasAdvertencias: any[]
  presencasPorOficina: { turma: string; percentual: number }[]
}

interface Log {
  acao: string
  usuario_nome: string
  usuario_foto_url?: string
  timestamp: string
}

function StatCard({
  icon,
  label,
  value,
  badge,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  badge?: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-xl bg-gray-100">{icon}</div>
        {badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-gray-900">
            {badge}
          </span>
        )}
      </div>
      <p className="font-body text-xs text-gray-400">{label}</p>
      <p className="font-title text-3xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="font-body text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-title text-base font-extrabold text-gray-900">{title}</h2>
      {sub && <p className="font-body text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function DashboardContent() {
  const { open } = useSidebar()
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentLogs, setRecentLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Carregar estatísticas
      try {
        const statsRes = await api.get('/stats/dashboard')
        setStats(statsRes.data)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }

      // Carregar logs
      try {
        const logsRes = await api.get('/logs?limite=5')
        setRecentLogs(logsRes.data.logs || [])
      } catch (error) {
        console.error('Erro ao carregar logs:', error)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900">Dashboard Overview</h1>
          <p className="font-body text-xs text-gray-400">
            Painel administrativo — ONG Iluminando o Futuro
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <NavLink
            to="/dashboard/cadastro-alunos"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 cursor-pointer transition hover:brightness-90"
            style={{ background: '#FFD700' }}
          >
            <Plus className="h-4 w-4" />
            Novo Aluno
          </NavLink>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-gray-700" />}
            label="Total de Alunos"
            value={stats?.summary.totalAlunos || 0}
            badge="Ativos"
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5 text-gray-700" />}
            label="Professores"
            value={stats?.summary.totalProfessores || 0}
            sub="Corpo docente"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-gray-700" />}
            label="Oficinas Ativas"
            value={stats?.summary.totalOficinas || 0}
            sub="Atividades em curso"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-gray-700" />}
            label="Responsáveis"
            value={stats?.summary.totalPais || 0}
            sub="Famílias cadastradas"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <SectionTitle title="Crescimento de Alunos" sub="Matrículas nos últimos meses" />
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  Alunos
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                      dy={10}
                    />
                    <Tooltip
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar dataKey="alunos" radius={[6, 6, 0, 0]} barSize={32}>
                      {(stats?.chartData || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === (stats?.chartData.length || 0) - 1 ? '#FFD700' : '#E5E7EB'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <SectionTitle title="Advertências Recentes" sub="Últimas ocorrências registradas" />
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th className="pb-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats?.ultimasAdvertencias.map((adv, idx) => (
                      <tr key={idx} className="group">
                        <td className="py-4">
                          <p className="text-xs font-bold text-gray-900">
                            {adv.aluno?.nome_completo || 'N/A'}
                          </p>
                        </td>
                        <td className="py-4">
                          <p className="text-xs text-gray-500">{adv.tipo_advertencia}</p>
                        </td>
                        <td className="py-4 text-right">
                          <p className="text-xs font-mono text-gray-400">
                            {new Date(adv.data_advertencia).toLocaleDateString('pt-BR')}
                          </p>
                        </td>
                      </tr>
                    ))}
                    {stats?.ultimasAdvertencias.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-xs text-gray-400">
                          Nenhuma advertência recente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle title="Logs de Atividade" sub="Monitoramento em tempo real" />
                <button className="text-[10px] font-bold text-yellow-500 hover:underline uppercase tracking-wider">
                  Ver Tudo
                </button>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-0 top-0.5 h-7 w-7 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                       {log.usuario_foto_url ? (
                         <img 
                           src={log.usuario_foto_url.startsWith('http') ? log.usuario_foto_url : `http://localhost:3001${log.usuario_foto_url}`} 
                           alt="Avatar" 
                           className="h-full w-full object-cover" 
                         />
                       ) : (
                         <span className="text-[8px] font-bold text-gray-900">
                           {log.usuario_nome ? log.usuario_nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'SY'}
                         </span>
                       )}
                    </div>
                    <div className="absolute left-[24px] top-[20px] h-2.5 w-2.5 rounded-full border-2 border-white bg-yellow-400 shadow-sm" />
                    
                    <p className="text-xs font-bold text-gray-900 leading-tight mb-0.5">
                      {log.acao}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="font-medium">{log.usuario_nome || 'Sistema'}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <SectionTitle title="Ações Rápidas" sub="Acesso facilitado" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <NavLink
                  to="/dashboard/cadastro-alunos"
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 transition border border-gray-100 group"
                >
                  <UserPlus className="h-6 w-6 text-gray-600 group-hover:text-yellow-600 mb-2" />
                  <span className="text-[10px] font-bold text-gray-700">Novo Aluno</span>
                </NavLink>
                <NavLink
                  to="/dashboard/cadastro-oficinas"
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 transition border border-gray-100 group"
                >
                  <Plus className="h-6 w-6 text-gray-600 group-hover:text-yellow-600 mb-2" />
                  <span className="text-[10px] font-bold text-gray-700">Nova Oficina</span>
                </NavLink>
                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 transition border border-gray-100 group cursor-pointer">
                  <ClipboardList className="h-6 w-6 text-gray-600 group-hover:text-yellow-600 mb-2" />
                  <span className="text-[10px] font-bold text-gray-700">Presenças</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-yellow-50 transition border border-gray-100 group cursor-pointer">
                  <AlertTriangle className="h-6 w-6 text-gray-600 group-hover:text-yellow-600 mb-2" />
                  <span className="text-[10px] font-bold text-gray-700">Advertência</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <SectionTitle title="Média de Presença" sub="Frequência por oficina" />
              <div className="space-y-4 mt-4">
                {stats?.presencasPorOficina.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gray-700 uppercase">{p.turma}</span>
                      <span className="text-[10px] font-mono font-bold text-yellow-600">{p.percentual}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-1000" 
                        style={{ width: `${p.percentual}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(!stats?.presencasPorOficina || stats.presencasPorOficina.length === 0) && (
                  <p className="text-center text-xs text-gray-400 py-4">Sem dados de presença.</p>
                )}
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

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <DashboardContent />
      </div>
    </SidebarProvider>
  )
}
