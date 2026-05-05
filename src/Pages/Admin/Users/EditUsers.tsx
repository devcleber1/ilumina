import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronRight,
  Edit,
  Search,
  Trash2,
  Users as UsersIcon,
  Shield,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  X,
  FileText
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import { formatCPF, formatCNH, formatPhone } from '../../../utils/formatters'

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

const formatDateInput = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 10)
}

type UserRole = 'admin' | 'aluno' | 'professor' | 'pai'

interface BaseUser {
  id: number
  role: UserRole
  name: string
  email: string
  document?: string
  documentType?: 'CPF' | 'CNH'
  birthDate?: string
  phone?: string
  photo?: string
  documentPhoto?: string
  documentBackPhoto?: string
  raw: any
}

function EditUsersContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()
  const [users, setUsers] = useState<BaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos')
  const [selectedUser, setSelectedUser] = useState<BaseUser | null>(null)
  const [editData, setEditData] = useState<Partial<BaseUser>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [userToDelete, setUserToDelete] = useState<BaseUser | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const [resAdmins, resAlunos, resProfs, resPais] = await Promise.all([
        api.get('/admins/find').catch(() => ({ data: [] })),
        api.get('/alunos/find').catch(() => ({ data: [] })),
        api.get('/professores/find').catch(() => ({ data: [] })),
        api.get('/pais/find').catch(() => ({ data: [] }))
      ])

      const admins: BaseUser[] = (resAdmins.data || []).map((u: any) => ({
        id: u.id,
        role: 'admin',
        name: u.nome_completo || 'Admin Sem Nome',
        email: u.email,
        photo: u.foto_perfil_url,
        raw: u
      }))

      const alunos: BaseUser[] = (resAlunos.data || []).map((u: any) => ({
        id: u.id,
        role: 'aluno',
        name: u.nome_completo || 'Aluno Sem Nome',
        email: u.email,
        document: u.cpf,
        phone: u.telefone,
        photo: u.foto_perfil_url,
        documentPhoto: u.documento_frente_url,
        documentBackPhoto: u.documento_verso_url,
        birthDate: formatDateBr(u.data_nascimento),
        raw: u
      }))

      const profs: BaseUser[] = (resProfs.data || []).map((u: any) => ({
        id: u.id,
        role: 'professor',
        name: u.nome_completo || 'Professor Sem Nome',
        email: u.email,
        document: u.cpf,
        phone: u.telefone,
        photo: u.foto_perfil_url,
        documentPhoto: u.documento_frente_url,
        documentBackPhoto: u.documento_verso_url,
        birthDate: formatDateBr(u.data_nascimento),
        raw: u
      }))

      const pais: BaseUser[] = (resPais.data || []).map((u: any) => ({
        id: u.id,
        role: 'pai',
        name: u.nome_completo || 'Pai Sem Nome',
        email: u.email,
        document: u.documento,
        documentType: u.tipo_documento,
        phone: u.telefone,
        photo: u.foto_perfil_url,
        documentPhoto: u.documento_frente_url,
        documentBackPhoto: u.documento_verso_url,
        birthDate: formatDateBr(u.data_nascimento),
        raw: u
      }))

      setUsers([...admins, ...alunos, ...profs, ...pais])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestDelete = (user: BaseUser) => {
    setUserToDelete(user)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      let endpoint = ''
      if (userToDelete.role === 'admin') endpoint = `/admins/delete/${userToDelete.id}`
      if (userToDelete.role === 'aluno') endpoint = `/alunos/delete/${userToDelete.id}`
      if (userToDelete.role === 'professor') endpoint = `/professores/delete/${userToDelete.id}`
      if (userToDelete.role === 'pai') endpoint = `/pais/delete/${userToDelete.id}`

      await api.delete(endpoint)
      setUsers(prev => prev.filter(u => !(u.id === userToDelete.id && u.role === userToDelete.role)))
      if (selectedUser?.id === userToDelete.id && selectedUser?.role === userToDelete.role) {
        setSelectedUser(null)
      }
      showAlert('success', 'Sucesso', 'Usuário excluído com sucesso.')
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      showAlert('destructive', 'Erro', 'Erro ao excluir usuário. Verifique se ele possui vínculos.')
    } finally {
      setUserToDelete(null)
    }
  }

  const confirmSave = async () => {
    if (!selectedUser) return
    setIsSaving(true)

    try {
      let endpoint = ''
      const formData = new FormData()

      if (editData.name) formData.append('nome_completo', editData.name)
      if (editData.email) formData.append('email', editData.email)
      if (editData.birthDate) formData.append('data_nascimento', editData.birthDate)

      if ((editData as any).newPhotoFile) {
        formData.append('foto_perfil_url', (editData as any).newPhotoFile)
      }
      
      if ((editData as any).newDocFile) {
        formData.append('documento_frente_url', (editData as any).newDocFile)
      }

      if ((editData as any).newDocBackFile) {
        formData.append('documento_verso_url', (editData as any).newDocBackFile)
      }

      if (selectedUser.role === 'admin') {
        endpoint = `/admins/update/${selectedUser.id}`
      } else if (selectedUser.role === 'aluno') {
        endpoint = `/alunos/update/${selectedUser.id}`
        if (editData.document) formData.append('cpf', editData.document)
        if (editData.phone) formData.append('telefone', editData.phone)
      } else if (selectedUser.role === 'professor') {
        endpoint = `/professores/update/${selectedUser.id}`
        if (editData.document) formData.append('cpf', editData.document)
        if (editData.phone) formData.append('telefone', editData.phone)
      } else if (selectedUser.role === 'pai') {
        endpoint = `/pais/update/${selectedUser.id}`
        if (editData.document) formData.append('documento', editData.document)
        if (editData.documentType) formData.append('tipo_documento', editData.documentType)
        if (editData.phone) formData.append('telefone', editData.phone)
      }

      await api.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Atualiza a lista inteira para pegar as URLs de fotos reais que o servidor gerou
      await fetchAllUsers()
      
      setSelectedUser(null)
      setShowSaveModal(false)
      showAlert('success', 'Sucesso', 'Dados salvos com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar dados:', error)
      showAlert('destructive', 'Erro', 'Erro ao salvar dados do usuário.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const userName = u.name || ''
    const matchName = userName.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'todos' || u.role === filterRole
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
      case 'admin': return <Shield className="h-4 w-4 text-purple-500" />
      case 'aluno': return <GraduationCap className="h-4 w-4 text-blue-500" />
      case 'professor': return <Briefcase className="h-4 w-4 text-yellow-500" />
      case 'pai': return <UserIcon className="h-4 w-4 text-green-500" />
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
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
          <h1 className="font-title text-xl uppercase font-extrabold text-gray-900">Gerenciar Usuários</h1>
          <p className="font-body text-xs text-gray-400">
            Listagem e edição de alunos, professores, pais e administradores
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-3xl shadow-sm">
          <div className="flex-1 flex items-center gap-3 w-full">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
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
              <option value="aluno">Alunos</option>
              <option value="professor">Professores</option>
              <option value="pai">Pais/Responsáveis</option>
              <option value="admin">Administradores</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-3xl bg-white animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 shadow-sm text-center">
            <UsersIcon className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">Nenhum usuário encontrado</h3>
            <p className="text-sm text-gray-500">Tente ajustar seus filtros ou termos de busca.</p>
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
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        setSelectedUser(user)
                        setEditData({ ...user })
                      }}
                      className="p-2 rounded-xl hover:bg-yellow-50 text-yellow-600 transition cursor-pointer"
                      title="Ver Perfil"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => requestDelete(user)}
                      className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center mb-4">
                  {user.photo ? (
                    <img src={getImageUrl(user.photo)} alt={user.name} className="h-16 w-16 rounded-full object-cover mb-3 shadow-sm" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <h3 className="font-title text-center text-sm font-bold text-gray-900 line-clamp-1">
                    {user.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Perfil Completo */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-xl text-yellow-600">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div>
                  <h2 className="font-title text-xl font-bold text-gray-900">Perfil do Usuário</h2>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{getRoleLabel(selectedUser.role)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-8 items-start mb-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="relative group rounded-3xl overflow-hidden cursor-pointer">
                    {editData.photo || selectedUser.photo ? (
                      <img src={getImageUrl(editData.photo || selectedUser.photo)} alt="Perfil" className="h-32 w-32 object-cover shadow-sm transition group-hover:brightness-75" />
                    ) : (
                      <div className="h-32 w-32 bg-gray-100 flex items-center justify-center transition group-hover:brightness-95">
                        <UserIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditData({ ...editData, newPhotoFile: file, photo: URL.createObjectURL(file) } as any)
                        }
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase">Foto de Perfil</span>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nome Completo</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">E-mail</label>
                    <input
                      type="email"
                      className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.role !== 'admin' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                          {selectedUser.role === 'pai' ? 'Documento (CPF/CNH)' : 'CPF'}
                        </label>
                        <div className="flex gap-2">
                          {selectedUser.role === 'pai' && (
                            <select
                              className="bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 transition"
                              value={editData.documentType || 'CPF'}
                              onChange={(e) => setEditData({ ...editData, documentType: e.target.value as 'CPF' | 'CNH' })}
                            >
                              <option value="CPF">CPF</option>
                              <option value="CNH">CNH</option>
                            </select>
                          )}
                          <input
                            type="text"
                            className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                            value={editData.document || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              const isCNH = selectedUser.role === 'pai' && editData.documentType === 'CNH'
                              setEditData({ ...editData, document: isCNH ? formatCNH(val) : formatCPF(val) })
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {selectedUser.role !== 'admin' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Telefone</label>
                        <input
                          type="text"
                          className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: formatPhone(e.target.value) })}
                        />
                      </div>
                    )}
                    {selectedUser.role !== 'admin' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Data de Nascimento</label>
                        <input
                          type="text"
                          placeholder="DD/MM/AAAA"
                          className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
                          value={editData.birthDate || ''}
                          onChange={(e) => setEditData({ ...editData, birthDate: formatDateInput(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedUser.role !== 'admin' && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="font-title text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-500" />
                    Documentos Anexados
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Frente</span>
                      <div className="relative inline-block rounded-3xl overflow-hidden border border-gray-200 group cursor-pointer">
                        {editData.documentPhoto || selectedUser.documentPhoto ? (
                          <img 
                            src={getImageUrl(editData.documentPhoto || selectedUser.documentPhoto)} 
                            alt="Documento Frente" 
                            className="h-32 w-48 object-cover bg-gray-50 transition group-hover:brightness-75"
                          />
                        ) : (
                          <div className="h-32 w-48 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-bold uppercase transition group-hover:brightness-95">
                            Nenhum documento
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/10">
                          <Edit className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setEditData({ ...editData, newDocFile: file, documentPhoto: URL.createObjectURL(file) } as any)
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Verso</span>
                      <div className="relative inline-block rounded-3xl overflow-hidden border border-gray-200 group cursor-pointer">
                        {editData.documentBackPhoto || selectedUser.documentBackPhoto ? (
                          <img 
                            src={getImageUrl(editData.documentBackPhoto || selectedUser.documentBackPhoto)} 
                            alt="Documento Verso" 
                            className="h-32 w-48 object-cover bg-gray-50 transition group-hover:brightness-75"
                          />
                        ) : (
                          <div className="h-32 w-48 bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-bold uppercase transition group-hover:brightness-95">
                            Nenhum documento
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/10">
                          <Edit className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              setEditData({ ...editData, newDocBackFile: file, documentBackPhoto: URL.createObjectURL(file) } as any)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-3xl">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition disabled:opacity-50 flex items-center justify-center min-w-[120px]"
              >
                Salvar Dados
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 mb-2">Excluir Usuário</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tem certeza que deseja excluir <strong>{userToDelete.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-500 hover:bg-red-600 transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Salvamento */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
              <Edit className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 mb-2">Salvar Alterações</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deseja salvar as alterações feitas neste perfil?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-300 transition disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function OpenSidebarButton() {
  const { toggleSidebar, open } = useSidebar()

  if (open) return null

  return (
    <button
      onClick={toggleSidebar}
      className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex h-8 w-6 items-center justify-center rounded-r-lg bg-white border border-l-0 border-gray-200 shadow-md cursor-pointer hover:bg-gray-50 transition"
      title="Abrir menu"
    >
      <ChevronRight className="h-4 w-4 text-gray-600" />
    </button>
  )
}

export default function EditUsers() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <EditUsersContent />
      </div>
    </SidebarProvider>
  )
}
