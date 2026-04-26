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

// ── dados mock ──────────────────────────────────────────
const registrationData = [
  { month: 'Jan', alunos: 80 },
  { month: 'Fev', alunos: 110 },
  { month: 'Mar', alunos: 140 },
  { month: 'Abr', alunos: 190 },
  { month: 'Mai', alunos: 120 },
  { month: 'Jun', alunos: 70 },
  { month: 'Jul', alunos: 130 },
  { month: 'Ago', alunos: 160 },
  { month: 'Set', alunos: 145 },
  { month: 'Out', alunos: 125 },
]

const advertencias = [
  {
    nome: 'Lucas Oliveira',
    turma: 'Oficina de Música',
    motivo: 'Falta sem justificativa',
    data: '22/04/2025',
  },
  {
    nome: 'Ana Souza',
    turma: 'Reforço Escolar',
    motivo: 'Comportamento inadequado',
    data: '21/04/2025',
  },
  {
    nome: 'Pedro Lima',
    turma: 'Artes Visuais',
    motivo: 'Falta sem justificativa',
    data: '20/04/2025',
  },
]

const logs = [
  { acao: 'Novo aluno cadastrado', usuario: 'Marisa Queiroz', hora: '10:32' },
  { acao: 'Presença registrada — Oficina de Música', usuario: 'Prof. Carlos', hora: '09:15' },
  { acao: 'Advertência emitida — Lucas Oliveira', usuario: 'Marisa Queiroz', hora: '08:50' },
  { acao: 'Relatório exportado', usuario: 'Admin', hora: '08:10' },
  { acao: 'Senha redefinida — João Mendes', usuario: 'Admin', hora: '07:45' },
]

const presencas = [
  { turma: 'Oficina de Música', percentual: 92 },
  { turma: 'Reforço Escolar', percentual: 87 },
  { turma: 'Artes Visuais', percentual: 78 },
  { turma: 'Esporte e Lazer', percentual: 95 },
  { turma: 'Informática', percentual: 83 },
]

// ── componentes auxiliares ──────────────────────────────
function StatCard({
  icon,
  label,
  value,
  badge,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
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

// ── conteúdo principal ──────────────────────────────────
function DashboardContent() {
  const { open } = useSidebar()

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      {/* Header — ocupa largura total */}
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
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-900 cursor-pointer transition hover:brightness-90"
            style={{ background: '#FFD700' }}
          >
            <Plus className="h-4 w-4" />
            Nova Entrada
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        {/* Cards de totais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Users className="h-5 w-5 text-gray-700" />}
            label="Total de Alunos"
            value="1.250"
            badge="+5.2%"
            sub="vs. mês anterior"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-gray-700" />}
            label="Oficinas Ativas"
            value="42"
            badge="3 iniciando"
            sub="Em andamento este semestre"
          />
          <StatCard
            icon={<GraduationCap className="h-5 w-5 text-gray-700" />}
            label="Professores"
            value="18"
            sub="Ativos no sistema"
          />
        </div>

        {/* Gráfico de registros */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <SectionTitle title="Novos Alunos Registrados" sub="Crescimento ao longo do ano letivo" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={registrationData} barSize={28}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }}
              />
              <Bar dataKey="alunos" radius={[6, 6, 0, 0]}>
                {registrationData.map((entry, index) => (
                  <Cell key={index} fill={entry.month === 'Abr' ? '#FFD700' : '#1f2937'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Presença + Advertências */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Desempenho de Presenças */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <SectionTitle title="Desempenho de Presenças" sub="Por oficina / turma" />
            <div className="flex flex-col gap-3">
              {presencas.map(p => (
                <div key={p.turma}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs text-gray-600">{p.turma}</span>
                    <span className="font-body text-xs font-bold text-gray-900">
                      {p.percentual}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${p.percentual}%`,
                        background:
                          p.percentual >= 90
                            ? '#FFD700'
                            : p.percentual >= 80
                              ? '#fb923c'
                              : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alunos com Advertências */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <SectionTitle title="Alunos com Advertências" sub="Registros recentes" />
            <div className="flex flex-col gap-3">
              {advertencias.map(a => (
                <div
                  key={a.nome}
                  className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-100"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-body text-sm font-semibold text-gray-900">{a.nome}</p>
                    <p className="font-body text-xs text-gray-400">
                      {a.turma} — {a.motivo}
                    </p>
                    <p className="font-body text-xs text-gray-300">{a.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logs + Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logs do sistema */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <SectionTitle title="Logs do Sistema" sub="Atividades recentes" />
            <div className="flex flex-col gap-2">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="font-body text-xs text-gray-700">{log.acao}</p>
                      <p className="font-body text-[11px] text-gray-400">{log.usuario}</p>
                    </div>
                  </div>
                  <span className="font-body text-[11px] text-gray-300 flex-shrink-0">
                    {log.hora}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <SectionTitle title="Ações Rápidas" />
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UserPlus, label: 'Cadastrar Aluno' },
                { icon: TrendingUp, label: 'Exportar Stats' },
                { icon: MessageSquare, label: 'Notificar Pais' },
                { icon: BookOpen, label: 'Nova Oficina' },
              ].map(action => (
                <button
                  key={action.label}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-yellow-400 hover:bg-yellow-500 transition cursor-pointer"
                >
                  <action.icon className="h-5 w-5 text-gray-600" />
                  <span className="font-body text-xs text-gray-600 text-center">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// ── componente de abrir sidebar ──────────────────────────
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

// ── página ───────────────────────────────────────────────
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
