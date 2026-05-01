import { Routes, Route } from 'react-router-dom'
import Auth from '../Pages/Auth/Auth'
import Dashboard from '../Pages/Admin/Dashboard/Dashboard'
import RegisterParent from '../Pages/Admin/Dashboard/RegisterParent'
import RegisterStudent from '../Pages/Admin/Dashboard/RegisterStudent'
import RegisterTeacher from '../Pages/Admin/Dashboard/RegisterTeacher'
import RegisterWorkshop from '../Pages/Admin/Dashboard/RegisterWorkshop'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/cadastro-pais" element={<RegisterParent />} />
      <Route path="/dashboard/cadastro-alunos" element={<RegisterStudent />} />
      <Route path="/dashboard/cadastro-professores" element={<RegisterTeacher />} />
      <Route path="/dashboard/cadastro-oficinas" element={<RegisterWorkshop />} />
    </Routes>
  )
}
