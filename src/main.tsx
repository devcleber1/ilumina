import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Auth from './Pages/Admin/Dashboard/Dashboard'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth />
  </StrictMode>
)
