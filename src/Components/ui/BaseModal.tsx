import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface BaseModalProps {
  isOpen: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  hideCloseButton?: boolean
}

export function BaseModal({ isOpen, onClose, children, className = '', hideCloseButton = false }: BaseModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className={`bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300 relative ${className}`}>
        {!hideCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
