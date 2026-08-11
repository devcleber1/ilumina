import { type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import { ShieldAlert, LogOut } from 'lucide-react'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  // Bloqueio Global para Não-Admins (com exceção das telas permitidas)
  const isParentPortal = user.tipo === 'pai' && window.location.pathname.startsWith('/portal')
  const isTeacherPortal =
    user.tipo === 'professor' && window.location.pathname.startsWith('/portal-professor')

  if (user.tipo !== 'admin' && !isParentPortal && !isTeacherPortal) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 overflow-hidden select-none">
        {/* Camada de proteção contra "Inspect Element" tampering */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none" />

        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700 relative z-10">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-red-100 rounded-[40px] animate-pulse" />
            <div className="relative flex items-center justify-center h-full text-red-500">
              <ShieldAlert className="h-16 w-16" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="font-title text-3xl font-black text-gray-900 uppercase tracking-tighter">
              Acesso Bloqueado
            </h1>
            <p className="font-body text-sm text-gray-500 font-medium leading-relaxed px-4">
              Detectamos que sua conta não possui privilégios para acessar a plataforma
              administrativa. Seu acesso é exclusivo para o aplicativo móvel.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
            Tentativas de burlar este bloqueio são monitoradas e podem resultar na suspensão da
            conta.
          </div>

          <button
            onClick={() => logout()}
            className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-[24px] shadow-2xl shadow-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-3 group"
          >
            <span className="uppercase tracking-[0.2em] text-xs">Encerrar Sessão</span>
            <LogOut className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Sistema de Segurança Ilumina v2.0
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Se for admin, renderiza o conteúdo normalmente
  return <>{children}</>
}
