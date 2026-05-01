import { Routes, Route } from 'react-router-dom'
import Auth from '../Pages/Auth/Auth'
import Dashboard from '../Pages/Admin/Dashboard/Dashboard'
import RegisterParent from '../Pages/Admin/Dashboard/RegisterParent'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/cadastro-pais" element={<RegisterParent />} />
    </Routes>
  )
}
