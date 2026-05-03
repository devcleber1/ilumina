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
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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
  { title: 'Advertencia', icon: AlertTriangle, url: '#' },
  { title: 'Reuniao', icon: GraduationCap, url: '#' },
  {
    title: 'Controle Acesso',
    icon: Shield,
    subItems: [
      { title: 'Editar Usuarios', url: '#' },
      { title: 'Reset de Senha', url: '#' },
      { title: 'Exclusao de Usuarios', url: '#' },
    ],
  },
]

export function AppSidebar() {
  const [openMenus, setOpenMenus] = useState<string[]>(['Cadastros', 'Controle Acesso'])
  const { toggleSidebar } = useSidebar()
  const { logout, user } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => (prev.includes(title) ? prev.filter(m => m !== title) : [...prev, title]))
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
      <a
        href="#"
        className="font-menu flex items-center gap-2 text-sm px-2 py-2 rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-700"
      >
        <Settings className="h-4 w-4" />
        Configuracoes
      </a>
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
                  src={user.foto_perfil_url.startsWith('http') ? user.foto_perfil_url : `http://localhost:3001${user.foto_perfil_url}`} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                />
              ) : (
                <span className="text-xs font-bold text-gray-900">
                  {user?.nome_completo ? user.nome_completo.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AD'}
                </span>
              )}
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {user?.nome_completo || 'Administrador'}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400 text-gray-900 capitalize">
                {user?.tipo || 'Admin'}
              </span>
            </div>
          </div>
          {renderConfigLink()}
          {renderSairLink()}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
