import { Alert, AlertDescription, AlertTitle } from '../Components/ui/alert'
import { useAlert } from '../contexts/AlertContext'
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

export function AlertContainer() {
  const { alerts, removeAlert } = useAlert()

  if (alerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {alerts.map(alert => {
        const Icon = {
          success: CheckCircle,
          warning: AlertTriangle,
          destructive: XCircle,
        }[alert.type]

        return (
          <Alert
            key={alert.id}
            variant={alert.type}
            className="relative pr-10 py-3 pl-10 min-h-[60px]"
          >
            <Icon className="h-5 w-5" />
            <div className="flex-1">
              <AlertTitle className="text-sm font-semibold">{alert.title}</AlertTitle>
              {alert.description && (
                <AlertDescription className="text-xs mt-1 opacity-90">
                  {alert.description}
                </AlertDescription>
              )}
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )
      })}
    </div>
  )
}
