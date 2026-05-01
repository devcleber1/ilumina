import { Routes, Route } from 'react-router-dom'
import Auth from '../Pages/Auth/Auth'
import Dashboard from '../Pages/Admin/Dashboard/Dashboard'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
