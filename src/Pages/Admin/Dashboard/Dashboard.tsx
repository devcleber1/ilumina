import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  Bell,
  Plus,
  Users,
  GraduationCap,
  BookOpen,
  UserPlus,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  X,
  ShieldAlert,
  Calendar,
  User,
  Activity,
  BarChart3
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
  value: number | string
  badge?: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
        {badge && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-600">
            {badge}
          </span>
        )}
      </div>
      <p className="font-body text-xs text-gray-400 font-bold uppercase tracking-wide">{label}</p>
      <p className="font-title text-2xl font-black text-gray-900 leading-none mt-1">{value}</p>
      {sub && <p className="font-body text-[10px] text-gray-400 truncate mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ title, sub, icon: Icon }: { title: string; sub?: string; icon?: any }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <h2 className="font-title text-base font-black text-gray-900 uppercase tracking-tight">{title}</h2>
      </div>
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
  const [selectedAdv, setSelectedAdv] = useState<any | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const statsRes = await api.get('/stats/dashboard')
        setStats(statsRes.data)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
      try {
        const logsRes = await api.get('/logs?limite=10')
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
      <div className="flex-1 flex items-center justify-center bg-gray-100 h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <main
      className={`flex-1 bg-gray-100 h-screen flex flex-col transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      {/* Header */}
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm shrink-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-black text-gray-900 uppercase">Dashboard Overview</h1>
          <p className="font-body text-xs text-gray-400 font-bold">Monitoramento em Tempo Real — ONG Ilumina</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition cursor-pointer">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
          </button>
          <NavLink
            to="/dashboard/cadastro-alunos"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-gray-900 cursor-pointer transition hover:brightness-90 uppercase tracking-tighter shadow-sm"
            style={{ background: '#FFD700' }}
          >
            <Plus className="h-4 w-4" />
            Novo Aluno
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
        {/* StatCards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 shrink-0">
          <StatCard
            icon={<Users className="h-5 w-5 text-gray-700" />}
            label="Alunos"
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
            label="Oficinas"
            value={stats?.summary.totalOficinas || 0}
            sub="Atividades ativas"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5 text-gray-700" />}
            label="Famílias"
            value={stats?.summary.totalPais || 0}
            sub="Responsáveis"
          />
        </div>

        {/* Dynamic Grid Layout */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 overflow-hidden">
          {/* Main Column (Left) */}
          <div className="flex flex-col gap-6 overflow-hidden">
            {/* Chart Area */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm h-[48%] flex flex-col border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle title="Crescimento Mensal" sub="Matrículas nos últimos meses" icon={Activity} />
                <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-wider">
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  Alunos
                </div>
              </div>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#F9FAFB' }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="alunos" radius={[6, 6, 0, 0]} barSize={32}>
                      {(stats?.chartData || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === (stats?.chartData.length || 0) - 1 ? '#FFD700' : '#F3F4F6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm h-[52%] flex flex-col overflow-hidden border border-gray-100">
              <SectionTitle title="Ocorrências Recentes" sub="Clique para ver detalhes" icon={AlertTriangle} />
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-gray-50">
                      <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest">Aluno</th>
                      <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest">Oficina</th>
                      <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest">Registrado por</th>
                      <th className="pb-3 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(stats?.ultimasAdvertencias || []).map((adv, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setSelectedAdv(adv)}
                        className="group hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3">
                           <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                                 {adv.aluno?.foto_perfil_url ? (
                                   <img src={`http://localhost:3001${adv.aluno.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                                 ) : (
                                   <div className="h-full w-full flex items-center justify-center bg-yellow-50 text-yellow-600 text-[8px] font-black">{adv.aluno?.nome_completo?.charAt(0)}</div>
                                 )}
                              </div>
                              <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{adv.aluno?.nome_completo}</span>
                           </div>
                        </td>
                        <td className="py-3 text-xs text-gray-500 truncate max-w-[120px]">
                          {adv.oficina?.nome_oficina || 'Geral'}
                        </td>
                        <td className="py-3">
                           <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-gray-50 overflow-hidden shrink-0 border border-gray-100">
                                 {adv.professor_registrador?.foto_perfil_url ? (
                                   <img src={`http://localhost:3001${adv.professor_registrador.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                                 ) : adv.admin_registrador?.foto_perfil_url ? (
                                   <img src={`http://localhost:3001${adv.admin_registrador.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                                 ) : (
                                   <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400 text-[7px] font-bold">
                                      {(adv.professor_registrador?.nome_completo || adv.admin_registrador?.nome_completo || '?').charAt(0)}
                                   </div>
                                 )}
                              </div>
                              <span className="text-[10px] font-medium text-gray-600">
                                 {adv.professor_registrador?.nome_completo || adv.admin_registrador?.nome_completo || 'Sistema'}
                              </span>
                           </div>
                        </td>
                        <td className="py-3 text-right text-xs font-mono font-bold text-gray-400">
                          {new Date(adv.data_advertencia).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                    {(!stats?.ultimasAdvertencias || stats.ultimasAdvertencias.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-xs text-gray-400 font-bold italic">Nenhuma ocorrência registrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Side Column (Right) */}
          <div className="flex flex-col gap-6 overflow-hidden h-full">
            {/* Logs Area */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm flex-1 min-h-[200px] overflow-hidden border border-gray-100 flex flex-col">
              <SectionTitle title="Atividades" sub="Fluxo de ações do sistema" icon={Activity} />
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 pt-3">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="relative pl-11 pb-2">
                    <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
                       {log.usuario_foto_url ? (
                         <img 
                           src={log.usuario_foto_url.startsWith('http') ? log.usuario_foto_url : `http://localhost:3001${log.usuario_foto_url}`} 
                           alt="" 
                           className="h-full w-full object-cover" 
                         />
                       ) : (
                         <span className="text-[10px] font-black text-gray-900 uppercase">
                           {log.usuario_nome?.substring(0, 2) || 'SY'}
                         </span>
                       )}
                    </div>
                    <p className="text-xs font-black text-gray-900 leading-tight mb-1">{log.acao}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                      <span>{log.usuario_nome?.split(' ')[0] || 'Sistema'}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-10 font-bold italic">Sem atividades recentes.</p>
                )}
              </div>
            </div>

            {/* Attendance Summary (Promoted to Main Side Section) */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm flex-[2] min-h-[350px] overflow-hidden border border-gray-100 flex flex-col">
              <SectionTitle title="Frequência por Oficina" sub="Média de participação acadêmica" icon={BarChart3} />
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pt-4">
                {(stats?.presencasPorOficina || []).map((p, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <div className="flex justify-between items-end">
                      <div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Oficina</span>
                         <span className="text-sm font-black text-gray-800 uppercase leading-none">{p.turma}</span>
                      </div>
                      <div className="text-right">
                         <span className="text-xl font-black text-gray-900 leading-none">{p.percentual}%</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 shadow-sm ${
                           p.percentual > 80 ? 'bg-green-400' : p.percentual > 50 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${p.percentual}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black text-gray-300 uppercase tracking-tighter">
                       <span>Crítico</span>
                       <span>Atenção</span>
                       <span>Excelente</span>
                    </div>
                  </div>
                ))}
                {(!stats?.presencasPorOficina || stats.presencasPorOficina.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                     <BarChart3 className="h-12 w-12 mb-2" />
                     <p className="text-xs font-black uppercase">Sem dados estatísticos</p>
                  </div>
                )}
              </div>
              
              {/* Total Stats Footer */}
              <div className="mt-6 pt-6 border-t border-gray-50 grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase">Média Geral</p>
                    <p className="text-lg font-black text-gray-900">
                       {stats?.presencasPorOficina.length 
                          ? Math.round(stats.presencasPorOficina.reduce((acc, curr) => acc + curr.percentual, 0) / stats.presencasPorOficina.length)
                          : 0}%
                    </p>
                 </div>
                 <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-100">
                    <p className="text-[8px] font-black text-yellow-600 uppercase">Engajamento</p>
                    <p className="text-lg font-black text-yellow-700 uppercase">Alto</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Advertência */}
      {selectedAdv && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
               <div className="bg-red-500 px-8 py-6 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="h-6 w-6" />
                     <h2 className="font-title text-xl font-black uppercase">Detalhes da Ocorrência</h2>
                  </div>
                  <button onClick={() => setSelectedAdv(null)} className="p-2 hover:bg-black/10 rounded-full transition-colors cursor-pointer">
                     <X className="h-5 w-5" />
                  </button>
               </div>

               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-gray-200">
                        {selectedAdv.aluno?.foto_perfil_url ? (
                          <img src={`http://localhost:3001${selectedAdv.aluno.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-red-50 text-red-600 font-black text-lg">
                             {selectedAdv.aluno?.nome_completo?.charAt(0)}
                          </div>
                        )}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">ALUNO</p>
                        <p className="text-base font-black text-gray-900">{selectedAdv.aluno?.nome_completo}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5"><BookOpen className="h-3 w-3" /> Oficina</p>
                        <p className="text-sm font-bold text-gray-800">{selectedAdv.oficina?.nome_oficina || 'Geral'}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Data</p>
                        <p className="text-sm font-bold text-gray-800">{new Date(selectedAdv.data_advertencia).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-gray-400 uppercase">Motivo e Descrição</p>
                     <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                        <p className="text-xs font-black text-red-600 uppercase mb-1">{selectedAdv.tipo_advertencia}</p>
                        <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedAdv.descricao}"</p>
                     </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                     <div className="h-10 w-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {selectedAdv.professor_registrador?.foto_perfil_url ? (
                          <img src={`http://localhost:3001${selectedAdv.professor_registrador.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                        ) : selectedAdv.admin_registrador?.foto_perfil_url ? (
                          <img src={`http://localhost:3001${selectedAdv.admin_registrador.foto_perfil_url}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400"><User className="h-5 w-5" /></div>
                        )}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Registrado por</p>
                        <p className="text-xs font-bold text-gray-800">
                           {selectedAdv.professor_registrador?.nome_completo || selectedAdv.admin_registrador?.nome_completo || 'Sistema'}
                        </p>
                     </div>
                     <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                           selectedAdv.gravidade === 'alta' ? 'bg-red-100 text-red-600' : 
                           selectedAdv.gravidade === 'media' ? 'bg-yellow-100 text-yellow-600' : 
                           'bg-green-100 text-green-600'
                        }`}>
                           Gravidade: {selectedAdv.gravidade}
                        </span>
                     </div>
                  </div>
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
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex h-10 w-8 items-center justify-center rounded-r-xl bg-white border border-l-0 border-gray-200 shadow-lg cursor-pointer hover:bg-gray-50 transition"
      title="Abrir menu"
    >
      <ChevronRight className="h-5 w-5 text-gray-600" />
    </button>
  )
}

export function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full font-body overflow-hidden">
        <AppSidebar />
        <OpenSidebarButton />
        <DashboardContent />
      </div>
    </SidebarProvider>
  )
}
