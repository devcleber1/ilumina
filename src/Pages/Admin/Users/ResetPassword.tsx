import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  Search,
  Users as UsersIcon,
  Shield,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  RotateCcw,
  X,
  AlertCircle
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import { useAuth } from '../../../contexts/AuthContext'

type UserRole = 'superadmin' | 'admin' | 'aluno' | 'professor' | 'pai'

interface BaseUser {
  id: number
  role: UserRole
  name: string
  email: string
  birthDate?: string
  photo?: string
  raw: any
}

function ResetPasswordContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<BaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos')
  const [userToReset, setUserToReset] = useState<BaseUser | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    fetchAllUsers(true)
    const interval = setInterval(() => fetchAllUsers(false), 3000)
    return () => clearInterval(interval)
  }, [])

  const formatDateBr = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = dateStr.split('T')[0]
      const [year, month, day] = d.split('-')
      if (year && month && day) return `${day}/${month}/${year}`
      return dateStr
    } catch {
      return dateStr
    }
  }

  const fetchAllUsers = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const [resAdmins, resProfs, resPais] = await Promise.all([
        api.get('/admins/find').catch(() => ({ data: [] })),
        api.get('/professores/find').catch(() => ({ data: [] })),
        api.get('/pais/find').catch(() => ({ data: [] }))
      ])

      const admins: BaseUser[] = (resAdmins.data || []).map((u: any) => ({
        id: u.id,
        role: u.nivel_acesso === 'superadmin' ? 'superadmin' : 'admin',
        name: u.nome_completo || 'Admin Sem Nome',
        email: u.email,
        photo: u.foto_perfil_url,
        raw: u
      }))

      const profs: BaseUser[] = (resProfs.data || []).map((u: any) => ({
        id: u.id,
        role: 'professor',
        name: u.nome_completo || 'Professor Sem Nome',
        email: u.email,
        birthDate: formatDateBr(u.data_nascimento),
        photo: u.foto_perfil_url,
        raw: u
      }))

      const pais: BaseUser[] = (resPais.data || []).map((u: any) => ({
        id: u.id,
        role: 'pai',
        name: u.nome_completo || 'Pai Sem Nome',
        email: u.email,
        birthDate: formatDateBr(u.data_nascimento),
        photo: u.foto_perfil_url,
        raw: u
      }))

      const allUsers = [...admins, ...profs, ...pais].filter(u => u.role !== 'aluno')
      setUsers(allUsers)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!userToReset) return
    setIsResetting(true)

    try {
      let defaultPassword = ''
      
      if (userToReset.birthDate) {
        // Remove barras para padrão ddmmyyyy
        defaultPassword = userToReset.birthDate.replace(/\//g, '')
      } else {
        // Fallback para administradores que não possuem data de nascimento no sistema
        defaultPassword = 'ilumina@123'
      }

      let endpoint = ''
      const updatePayload = { senha: defaultPassword }

      if (userToReset.role === 'admin' || userToReset.role === 'superadmin') {
        endpoint = `/admins/update/${userToReset.id}`
      } else if (userToReset.role === 'aluno') {
        endpoint = `/alunos/update/${userToReset.id}`
      } else if (userToReset.role === 'professor') {
        endpoint = `/professores/update/${userToReset.id}`
      } else if (userToReset.role === 'pai') {
        endpoint = `/pais/update/${userToReset.id}`
      }

      await api.put(endpoint, updatePayload)

      showAlert('success', 'Sucesso', `Senha de ${userToReset.name} resetada para: ${defaultPassword}`)
      setUserToReset(null)
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error)
      const msg = error.response?.data?.message || 'Erro ao resetar senha.'
      showAlert('destructive', 'Erro', msg)
    } finally {
      setIsResetting(false)
    }
  }

  const filteredUsers = users.filter(u => {
    // SuperAdmin não deve resetar sua própria senha por aqui (usa Editar Perfil)
    const isCurrentUser = u.id === currentUser?.id && (u.role === 'admin' || u.role === 'superadmin')
    if (isCurrentUser) return false
    
    // Admins não podem resetar senha de SuperAdmins
    if (currentUser?.nivel_acesso !== 'superadmin' && u.role === 'superadmin') return false

    const userName = u.name || ''
    const matchName = userName.toLowerCase().includes(search.toLowerCase())
    
    let matchRole = false
    if (filterRole === 'todos') {
      matchRole = true
    } else if (filterRole === 'admin') {
      matchRole = u.role === 'admin' || u.role === 'superadmin'
    } else {
      matchRole = u.role === filterRole
    }

    return matchName && matchRole
  })

  const getImageUrl = (url?: string) => {
    if (!url) return undefined
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
    const baseUrl = api.defaults.baseURL || 'http://localhost:3001'
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return <Shield className="h-4 w-4 text-red-500" />
      case 'admin': return <Shield className="h-4 w-4 text-purple-500" />
      case 'aluno': return <GraduationCap className="h-4 w-4 text-blue-500" />
      case 'professor': return <Briefcase className="h-4 w-4 text-yellow-500" />
      case 'pai': return <UserIcon className="h-4 w-4 text-green-500" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'superadmin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'aluno': return 'Aluno'
      case 'professor': return 'Professor'
      case 'pai': return 'Pai/Responsável'
    }
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 relative ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl uppercase font-extrabold text-gray-900">Reset de Senha</h1>
          <p className="font-body text-xs text-gray-400">
            Redefina senhas de usuários para o padrão (Data de Nascimento)
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm">
          <div className="flex-1 flex items-center gap-3 w-full">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuário..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
          <div className="w-full sm:w-auto">
            <select
              className="w-full sm:w-48 bg-gray-50 border-none outline-none text-sm text-gray-700 py-2 px-3 rounded-xl font-medium"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
            >
              <option value="todos">Todos os Papéis</option>
              <option value="professor">Professores</option>
              <option value="pai">Pais/Responsáveis</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm text-center">
            <UsersIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum usuário encontrado</h3>
            <p className="text-sm text-gray-500">Tente ajustar seus filtros.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map(user => (
              <div
                key={`${user.role}-${user.id}`}
                className="rounded-3xl bg-white p-5 shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-2 items-center bg-gray-50 px-3 py-1.5 rounded-full">
                    {getRoleIcon(user.role)}
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <button
                    onClick={() => setUserToReset(user)}
                    className="p-2 rounded-xl hover:bg-yellow-50 text-yellow-600 transition cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Resetar Senha"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <div className="h-16 w-16 rounded-full overflow-hidden mb-3 border-2 border-gray-100 shadow-sm">
                    {user.photo ? (
                      <img src={getImageUrl(user.photo)} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-title text-center text-sm font-bold text-gray-900 line-clamp-1 px-2">
                    {user.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 mb-2">{user.email}</p>
                  
                  {user.birthDate && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 rounded-lg text-blue-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Padrão: {user.birthDate}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Reset */}
      {userToReset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-6">
              <RotateCcw className="h-8 w-8" />
            </div>
            
            <h2 className="font-title text-xl font-bold text-gray-900 mb-2">Confirmar Reset?</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Deseja resetar a senha de <span className="font-bold text-gray-900">{userToReset.name}</span>? 
              <br/>
              A nova senha será: <span className="font-bold text-blue-600">{userToReset.birthDate ? userToReset.birthDate : 'ilumina@123'}</span>
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-200 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isResetting ? (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                ) : (
                  'Sim, Resetar Senha'
                )}
              </button>
              <button
                onClick={() => setUserToReset(null)}
                disabled={isResetting}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold py-3 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ResetPassword() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <ResetPasswordContent />
      </div>
    </SidebarProvider>
  )
}
