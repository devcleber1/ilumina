import {
  AlertTriangle,
  CalendarCheck,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Settings,
  Shield,
  Users,
  Wrench,
  User as UserIcon,
  Edit,
  X,
  Save,
  Camera
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAlert } from '../contexts/AlertContext'
import { api } from '../lib/api'
import * as yup from 'yup'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

import logo from '../assets/logo.png'

interface SubItem {
  title: string
  url: string
}

interface MenuItem {
  title: string
  icon: React.ElementType
  url?: string
  subItems?: SubItem[]
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
  {
    title: 'Cadastros',
    icon: Users,
    subItems: [
      { title: 'Pais', url: '/dashboard/cadastro-pais' },
      { title: 'Alunos', url: '/dashboard/cadastro-alunos' },
      { title: 'Professores', url: '/dashboard/cadastro-professores' },
      { title: 'Oficinas', url: '/dashboard/cadastro-oficinas' },
    ],
  },
  { title: 'Oficinas', icon: Wrench, url: '/dashboard/oficinas' },
  { title: 'Presenca', icon: CalendarCheck, url: '/dashboard/presenca' },
  { title: 'Advertencia', icon: AlertTriangle, url: '/dashboard/advertencia' },
  { title: 'Reuniao', icon: GraduationCap, url: '#' },
  {
    title: 'Controle Acesso',
    icon: Shield,
    subItems: [
      { title: 'Editar Usuários', url: '/dashboard/editar-usuarios' },
      { title: 'Reset de Senha', url: '/dashboard/reset-senha' },
    ],
  },
]

export function AppSidebar() {
  const [openMenus, setOpenMenus] = useState<string[]>(['Cadastros', 'Controle Acesso'])
  const { toggleSidebar } = useSidebar()
  const { logout, user } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileData, setProfileData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    foto_perfil_url: ''
  })
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => (prev.includes(title) ? prev.filter(m => m !== title) : [...prev, title]))
  }

  const handleOpenProfileModal = () => {
    setProfileData({
      nome_completo: user?.nome_completo || '',
      email: user?.email || '',
      senha: '',
      confirmarSenha: '',
      foto_perfil_url: user?.foto_perfil_url || ''
    })
    setNewPhotoFile(null)
    setErrors({})
    setIsProfileModalOpen(true)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setErrors({})

    try {
      const schema = yup.object().shape({
        nome_completo: yup.string().required('Nome completo é obrigatório'),
        email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
        senha: yup.string().transform(v => v === '' ? null : v).nullable().min(6, 'A senha deve ter pelo menos 6 caracteres'),
        confirmarSenha: yup.string().transform(v => v === '' ? null : v).nullable().oneOf([yup.ref('senha'), null], 'As senhas não coincidem')
      })

      await schema.validate(profileData, { abortEarly: false })

      const formData = new FormData()
      formData.append('nome_completo', profileData.nome_completo)
      formData.append('email', profileData.email)
      if (profileData.senha) {
        formData.append('senha', profileData.senha)
      }
      if (newPhotoFile) {
        formData.append('foto_perfil_url', newPhotoFile)
      }

      await api.put(`/admins/update/${user?.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showAlert('success', 'Sucesso', 'Perfil atualizado com sucesso! Faça login novamente para ver as alterações se necessário.')
      setIsProfileModalOpen(false)
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const newErrors: Record<string, string> = {}
        err.inner.forEach(e => { if (e.path) newErrors[e.path] = e.message })
        setErrors(newErrors)
      } else {
        console.error('Erro ao atualizar perfil:', err)
        showAlert('destructive', 'Erro', 'Não foi possível atualizar o perfil.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const renderSubItem = (sub: SubItem) => {
    if (sub.url?.startsWith('/')) {
      return (
        <NavLink
          key={sub.title}
          to={sub.url}
          className={({ isActive }) =>
            `font-menu text-sm px-3 py-1.5 rounded-lg transition cursor-pointer ${
              isActive
                ? 'text-white font-semibold'
                : 'text-gray-900 hover:bg-yellow-300 hover:text-white'
            }`
          }
        >
          {sub.title}
        </NavLink>
      )
    }

    return (
      <a
        key={sub.title}
        href={sub.url}
        className="font-menu text-sm px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition cursor-pointer text-gray-900"
      >
        {sub.title}
      </a>
    )
  }

  const renderConfigLink = () => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="font-menu flex items-center gap-2 text-sm px-2 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-700 w-full text-left outline-none">
            <Settings className="h-4 w-4" />
            <span className="flex-1">Configurações</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-48 p-2 rounded-xl shadow-xl border-none animate-in fade-in zoom-in-95 duration-200 bg-[#FFD700]">
          <DropdownMenuItem 
            onClick={handleOpenProfileModal}
            className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-gray-900 hover:bg-[#FBC329] hover:text-white focus:bg-[#FBC329] focus:text-white outline-none transition-colors"
          >
            <UserIcon className="h-4 w-4" />
            <span className="text-sm font-bold">Editar Perfil</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderSairLink = () => {
    const handleLogout = () => {
      logout()
      navigate('/')
    }

    return (
      <button
        onClick={handleLogout}
        className="font-menu flex items-center gap-2 text-sm px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer w-full text-left"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    )
  }

  return (
    <>
      {/* Modal de Edição de Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-title text-lg font-bold text-gray-900">Meu Perfil</h2>
                  <p className="text-xs text-gray-500 font-medium">Gerencie suas informações</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className={`h-24 w-24 rounded-full overflow-hidden border-4 ${errors.foto ? 'border-red-500' : 'border-yellow-400'} shadow-md`}>
                    {profileData.foto_perfil_url ? (
                      <img 
                        src={profileData.foto_perfil_url.startsWith('blob') ? profileData.foto_perfil_url : `http://localhost:3001${profileData.foto_perfil_url}`} 
                        alt="Perfil" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <UserIcon className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-yellow-400 rounded-full shadow-lg cursor-pointer hover:scale-110 transition border-2 border-white">
                    <Camera className="h-4 w-4 text-gray-900" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewPhotoFile(file)
                          setProfileData({ ...profileData, foto_perfil_url: URL.createObjectURL(file) })
                        }
                      }}
                    />
                  </label>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alterar Foto</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nome Completo</label>
                  <input
                    type="text"
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.nome_completo ? 'border-red-500' : 'border-gray-200 focus:border-yellow-400'}`}
                    value={profileData.nome_completo}
                    onChange={(e) => setProfileData({ ...profileData, nome_completo: e.target.value })}
                  />
                  {errors.nome_completo && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.nome_completo}</span>}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">E-mail</label>
                  <input
                    type="email"
                    className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-yellow-400'}`}
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                  {errors.email && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.email}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nova Senha</label>
                    <input
                      type="password"
                      placeholder="Opcional"
                      className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.senha ? 'border-red-500' : 'border-gray-200 focus:border-yellow-400'}`}
                      value={profileData.senha}
                      onChange={(e) => setProfileData({ ...profileData, senha: e.target.value })}
                    />
                    {errors.senha && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.senha}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Confirmar</label>
                    <input
                      type="password"
                      placeholder="Opcional"
                      className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.confirmarSenha ? 'border-red-500' : 'border-gray-200 focus:border-yellow-400'}`}
                      value={profileData.confirmarSenha}
                      onChange={(e) => setProfileData({ ...profileData, confirmarSenha: e.target.value })}
                    />
                    {errors.confirmarSenha && <span className="text-[10px] text-red-500 font-bold mt-1 block">{errors.confirmarSenha}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-200 transition transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin h-5 w-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between px-3 py-4">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Logo ONG"
                className="h-10 w-10 rounded-full object-cover"
                style={{ border: '2px solid #FBC329' }}
              />
              <p className="font-title text-sm font-extrabold uppercase tracking-wide text-gray-900">
                Iluminando o Futuro
              </p>
            </div>

            <button
              onClick={toggleSidebar}
              className="cursor-pointer p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
              title="Fechar menu"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    {item.subItems ? (
                      <>
                        <SidebarMenuButton
                          onClick={() => toggleMenu(item.title)}
                          className="font-menu w-full text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              openMenus.includes(item.title) ? 'rotate-180' : ''
                            }`}
                          />
                        </SidebarMenuButton>

                        {openMenus.includes(item.title) && (
                          <div
                            className="ml-2 mt-1 mb-2 flex flex-col gap-1 rounded-xl px-2 py-2"
                            style={{ background: '#FFD700' }}
                          >
                            {item.subItems.map(sub => renderSubItem(sub))}
                          </div>
                        )}
                      </>
                    ) : item.url?.startsWith('/') ? (
                      <NavLink
                        to={item.url}
                        end
                        className={({ isActive }) =>
                          `font-menu flex items-center gap-2 w-full rounded-md px-2 py-2 text-sm transition ${
                            isActive
                              ? 'text-[#FBC329] font-semibold'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    ) : (
                      <a
                        href={item.url}
                        className="flex items-center gap-2 w-full text-gray-700 hover:bg-gray-100 rounded-md px-2 py-2"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="px-3 py-2 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-yellow-400 flex items-center justify-center overflow-hidden border border-gray-200">
                {user?.foto_perfil_url ? (
                  <img
                    src={
                      user.foto_perfil_url.startsWith('http')
                        ? user.foto_perfil_url
                        : `http://localhost:3001${user.foto_perfil_url}`
                    }
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-900">
                    {user?.nome_completo
                      ? user.nome_completo
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)
                      : 'AD'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                  {user?.nome_completo || 'Administrador'}
                </p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-gray-900 capitalize">
                  {user?.nivel_acesso === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
            {renderConfigLink()}
            {renderSairLink()}
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
