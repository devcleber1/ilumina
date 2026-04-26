import { SidebarProvider, SidebarTrigger } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 bg-gray-100">
          <SidebarTrigger />
          <h1 className="font-title text-2xl font-extrabold text-gray-900 mt-4">Dashboard</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            Bem-vindo ao painel administrativo.
          </p>
        </main>
      </div>
    </SidebarProvider>
  )
}
