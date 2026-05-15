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
import EditUsers from '../Pages/Admin/Users/EditUsers'
import ResetPassword from '../Pages/Admin/Users/ResetPassword'
import RegisterAdmin from '../Pages/Admin/Register/RegisterAdmin'
import Meetings from '../Pages/Admin/Meetings/Meetings'
import { AuthGuard } from '../Components/AuthGuard'
import PortalResponsavel from '../Pages/Parent/Portal'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />
      <Route path="/portal" element={<AuthGuard><PortalResponsavel /></AuthGuard>} />
      
      {/* Rotas Protegidas */}
      <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
      <Route path="/dashboard/cadastro-pais" element={<AuthGuard><RegisterParent /></AuthGuard>} />
      <Route path="/dashboard/cadastro-alunos" element={<AuthGuard><RegisterStudent /></AuthGuard>} />
      <Route path="/dashboard/cadastro-professores" element={<AuthGuard><RegisterTeacher /></AuthGuard>} />
      <Route path="/dashboard/cadastro-oficinas" element={<AuthGuard><RegisterWorkshop /></AuthGuard>} />
      <Route path="/dashboard/oficinas" element={<AuthGuard><Workshops /></AuthGuard>} />
      <Route path="/dashboard/presenca" element={<AuthGuard><Presenca /></AuthGuard>} />
      <Route path="/dashboard/advertencia" element={<AuthGuard><Advertencia /></AuthGuard>} />
      <Route path="/dashboard/editar-usuarios" element={<AuthGuard><EditUsers /></AuthGuard>} />
      <Route path="/dashboard/reset-senha" element={<AuthGuard><ResetPassword /></AuthGuard>} />
      <Route path="/dashboard/cadastro-admin" element={<AuthGuard><RegisterAdmin /></AuthGuard>} />
      <Route path="/dashboard/reuniao" element={<AuthGuard><Meetings /></AuthGuard>} />
    </Routes>
  )
}
