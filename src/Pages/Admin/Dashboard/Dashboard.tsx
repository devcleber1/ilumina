import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { ChevronRight } from 'lucide-react'

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

function DashboardContent() {
  const { open } = useSidebar()

  return (
    <main className={`flex-1 p-6 bg-gray-100 transition-all duration-300 ${!open ? 'pl-8' : ''}`}>
      <h1 className="font-title text-2xl font-extrabold text-gray-900 mt-4">Dashboard</h1>
      <p className="font-body text-sm text-gray-500 mt-1">Bem-vindo ao painel administrativo.</p>
    </main>
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
