import { Routes, Route } from 'react-router-dom'
import Auth from '../Pages/Auth/Auth'
import { Dashboard } from '../Pages/Admin/Dashboard/Dashboard'
import RegisterParent from '../Pages/Admin/Register/RegisterParent'
import RegisterStudent from '../Pages/Admin/Register/RegisterStudent'
import RegisterTeacher from '../Pages/Admin/Register/RegisterTeacher'
import RegisterWorkshop from '../Pages/Admin/Register/RegisterWorkshop'
import Workshops from '../Pages/Admin/Workshops/Workshops'
import { Presenca } from '../Pages/Admin/Presenca/Presenca'
import { Advertencia } from '../Pages/Admin/Advertencia/Advertencia'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/cadastro-pais" element={<RegisterParent />} />
      <Route path="/dashboard/cadastro-alunos" element={<RegisterStudent />} />
      <Route path="/dashboard/cadastro-professores" element={<RegisterTeacher />} />
      <Route path="/dashboard/cadastro-oficinas" element={<RegisterWorkshop />} />
      <Route path="/dashboard/oficinas" element={<Workshops />} />
      <Route path="/dashboard/presenca" element={<Presenca />} />
      <Route path="/dashboard/advertencia" element={<Advertencia />} />
    </Routes>
  )
}
