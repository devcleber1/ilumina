import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Auth from './Pages/Auth/Auth'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth />
  </StrictMode>
)
