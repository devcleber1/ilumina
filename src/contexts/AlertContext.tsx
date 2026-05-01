import { createContext, useContext, useState, type ReactNode } from 'react'

export type AlertType = 'success' | 'warning' | 'destructive'

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

  const showAlert = (type: AlertType, title: string, description?: string, duration = 5000) => {
    const id = Date.now().toString()
    const alert: AlertMessage = { id, type, title, description, duration }

    setAlerts(prev => [...prev, alert])

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }
  }

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

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
