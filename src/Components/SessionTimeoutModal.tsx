import { useState, useEffect } from 'react'
import { Clock, RefreshCw, LogOut, ShieldAlert, X } from 'lucide-react'

interface SessionTimeoutModalProps {
  isOpen: boolean
  onRenew: () => Promise<void>
  onLogout: () => void
  onClose?: () => void
  expiresInSeconds: number
}

export function SessionTimeoutModal({ isOpen, onRenew, onLogout, onClose, expiresInSeconds }: SessionTimeoutModalProps) {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds)
  const [isRenewing, setIsRenewing] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(expiresInSeconds)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, expiresInSeconds, onLogout])

  if (!isOpen) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleRenew = async () => {
    setIsRenewing(true)
    try {
      await onRenew()
    } finally {
      setIsRenewing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <div className="flex flex-col items-center text-center">
          <div className="bg-yellow-50 p-4 rounded-3xl mb-6 relative">
             <Clock className="h-10 w-10 text-yellow-500 animate-pulse" />
             <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-white">
                <ShieldAlert className="h-4 w-4" />
             </div>
          </div>
          
          <h2 className="font-title text-2xl font-black text-gray-900 mb-2">Sua sessão vai expirar!</h2>
          <p className="font-body text-sm text-gray-500 mb-8 px-4">
            Por segurança, sua conexão será encerrada em breve. Deseja continuar logado no sistema?
          </p>

          <div className="bg-gray-50 w-full py-4 rounded-2xl mb-8 flex flex-col items-center">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tempo restante</span>
             <span className={`font-title text-3xl font-black tabular-nums ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
             </span>
          </div>

          <div className="flex flex-col w-full gap-3">
             <button
              onClick={handleRenew}
              disabled={isRenewing}
              className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-yellow-100 cursor-pointer disabled:opacity-50"
             >
               {isRenewing ? (
                 <RefreshCw className="h-5 w-5 animate-spin" />
               ) : (
                 <RefreshCw className="h-5 w-5" />
               )}
               Permanecer Logado
             </button>
             
             <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-400 font-semibold py-3 rounded-2xl transition-all cursor-pointer"
             >
               <LogOut className="h-4 w-4" />
               Sair agora
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
