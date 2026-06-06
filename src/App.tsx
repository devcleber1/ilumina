import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AlertProvider } from './contexts/AlertContext'
import { AlertContainer } from './Components/AlertContainer'
import AppRoutes from './routes'

export default function App() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let refreshing = false

    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker)
              }
            })
          }
        })
      })
      .catch(error => {
        console.warn('Service worker registration failed:', error)
      })

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  const handleUpdate = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
  }

  return (
    <BrowserRouter>
      <AlertProvider>
        <AuthProvider>
          {waitingWorker && (
            <div
              style={{
                padding: '0.75rem',
                background: '#fff9db',
                color: '#333',
                textAlign: 'center',
              }}
            >
              <span>Novo conteúdo disponível.</span>
              <button type="button" onClick={handleUpdate} style={{ marginLeft: '1rem' }}>
                Atualizar
              </button>
            </div>
          )}
          <AppRoutes />
          <AlertContainer />
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  )
}
