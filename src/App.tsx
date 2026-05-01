import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AlertProvider } from './contexts/AlertContext'
import { AlertContainer } from './Components/AlertContainer'
import AppRoutes from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <AlertProvider>
        <AuthProvider>
          <AppRoutes />
          <AlertContainer />
        </AuthProvider>
      </AlertProvider>
    </BrowserRouter>
  )
}
