import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronRight,
  Users,
  Construction,
  Timer,
  Calendar,
  ClipboardList,
  Menu,
} from 'lucide-react'

function MeetingsContent() {
  const { open, isMobile, toggleSidebar } = useSidebar()

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen md:h-screen flex flex-col transition-all duration-300 ${!open && !isMobile ? 'pl-8' : ''}`}
    >
      {/* Header padronizado */}
      <div className="flex w-full items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm shrink-0 z-40">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition cursor-pointer shrink-0"
              title="Abrir menu"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="font-title text-base sm:text-xl font-black text-gray-900 uppercase truncate">
              Gestão de Reuniões
            </h1>
            <p className="font-body text-[10px] sm:text-xs text-gray-400 font-bold mt-0.5 truncate">
              Assembleias e Convocações — ONG Ilumina
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black text-gray-900 cursor-pointer transition hover:brightness-90 uppercase tracking-tighter shadow-sm"
            style={{ background: '#FFD700' }}
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 rotate-180" />
            Voltar
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 flex-1 flex items-center justify-center overflow-y-auto min-h-0">
        <div className="max-w-2xl w-full bg-white rounded-3xl sm:rounded-[48px] p-6 sm:p-12 shadow-2xl border border-white/20 relative overflow-hidden group">
          {/* Decorative gradients */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl group-hover:bg-[#FFD700]/20 transition-all duration-700" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gray-100 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Animated Icon Container */}
            <div className="relative mb-6 sm:mb-10">
              <div className="absolute inset-0 bg-[#FFD700] blur-2xl opacity-20 animate-pulse rounded-full" />
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-[#FFD700] to-[#FBC329] rounded-[24px] sm:rounded-[32px] flex items-center justify-center text-gray-900 shadow-xl transform group-hover:rotate-6 transition-transform duration-500">
                <Users className="h-10 w-10 sm:h-12 sm:w-12" />
              </div>
              <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-gray-50">
                <Timer className="h-4 w-4 sm:h-5 sm:w-5 text-[#FBC329]" />
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-900 rounded-full border border-gray-800 shadow-inner">
                <Construction className="h-3.5 w-3.5 text-[#FFD700]" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-[#FFD700]">
                  Em Construção
                </span>
              </div>

              <h2 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tighter leading-none">
                EM BREVE
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <p className="font-body text-gray-500 text-xs sm:text-base leading-relaxed font-medium">
                  Estamos desenvolvendo um módulo robusto para que você possa agendar, gerenciar e
                  documentar todas as reuniões da nossa ONG em um só lugar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-2 sm:py-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:border-[#FFD700]/30">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      Agendamentos
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-colors group-hover:border-[#FFD700]/30">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                      <ClipboardList className="h-4 w-4 text-gray-400" />
                    </div>
                    <span className="text-[10px] font-black text-gray-500 uppercase">
                      Atas Digitais
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 w-full pt-6 sm:pt-8 border-t border-gray-50">
              <NavLink
                to="/dashboard"
                className="group/btn relative inline-flex items-center justify-center w-full px-6 py-3.5 sm:px-8 sm:py-5 bg-gray-900 hover:bg-black text-white rounded-2xl sm:rounded-[24px] transition-all duration-300 overflow-hidden shadow-xl"
              >
                <div className="absolute inset-0 bg-[#FFD700] translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 font-black text-xs sm:text-sm uppercase tracking-widest group-hover/btn:text-gray-900 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 rotate-180 group-hover/btn:-translate-x-1 transition-transform" />
                  Voltar para o Início
                </span>
              </NavLink>

              <p className="mt-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
                ONG ILUMINANDO O FUTURO • 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function OpenSidebarButton() {
  const { toggleSidebar, open, isMobile } = useSidebar()
  if (open || isMobile) return null
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

export default function Meetings() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <MeetingsContent />
      </div>
    </SidebarProvider>
  )
}
