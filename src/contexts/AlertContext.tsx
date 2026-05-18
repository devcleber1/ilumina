import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useCallback } from 'react'

export type AlertType = 'success' | 'warning' | 'destructive' | 'info'

export interface AlertMessage {
  id: string
  type: AlertType
  title: string
  description?: string
  duration?: number
}

interface AlertContextType {
  alerts: AlertMessage[]
  showAlert: (type: AlertType, title: string, description?: string, duration?: number) => void
  removeAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([])

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const showAlert = useCallback((type: AlertType, title: string, description?: string, duration = 5000) => {
    const id = Date.now().toString()
    const alert: AlertMessage = { id, type, title, description, duration }

    setAlerts(prev => [...prev, alert])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }
  }, [removeAlert])

  useEffect(() => {
    let lastAlertTime = 0
    const handleServerDown = () => {
      const now = Date.now()
      // Previne spam de alertas (apenas 1 a cada 5 segundos)
      if (now - lastAlertTime > 5000) {
        lastAlertTime = now
        showAlert('destructive', 'Servidor Indisponível', 'Não foi possível conectar ao servidor. Verifique sua conexão ou tente novamente mais tarde.', 8000)
      }
    }

    window.addEventListener('server-down', handleServerDown)
    return () => {
      window.removeEventListener('server-down', handleServerDown)
    }
  }, [])

  return (
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}
