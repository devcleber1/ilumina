import { useEffect, useState } from 'react'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import {
  ChevronRight,
  Edit,
  Search,
  Users as UsersIcon,
  Shield,
  GraduationCap,
  Briefcase,
  User as UserIcon,
  X,
  FileText,
  Trash2
} from 'lucide-react'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import { useAuth } from '../../../contexts/AuthContext'
import { formatCPF, formatCNH, formatPhone } from '../../../utils/formatters'
import * as yup from 'yup'

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

type UserRole = 'superadmin' | 'admin' | 'aluno' | 'professor' | 'pai'

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
  formacao?: string
  profissao?: string
  recebe_beneficio_social?: boolean
  numero_matricula?: string
  raw: any
}

function EditUsersContent() {
  const { open } = useSidebar()
  const { showAlert } = useAlert()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<BaseUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'todos'>('todos')
  const [selectedUser, setSelectedUser] = useState<BaseUser | null>(null)
  const [editData, setEditData] = useState<Partial<BaseUser>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<BaseUser | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      setIsDeleting(true)
      let endpoint = ''
      if (userToDelete.role === 'admin' || userToDelete.role === 'superadmin') endpoint = `/admins/delete/${userToDelete.id}`
      else if (userToDelete.role === 'aluno') endpoint = `/alunos/delete/${userToDelete.id}`
      else if (userToDelete.role === 'professor') endpoint = `/professores/delete/${userToDelete.id}`
      else if (userToDelete.role === 'pai') endpoint = `/pais/delete/${userToDelete.id}`

      await api.delete(endpoint)
      showAlert('success', 'Sucesso', 'Usuário excluído com sucesso!')
      await fetchAllUsers()
      setShowDeleteModal(false)
      setUserToDelete(null)
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error)
      const msg = error.response?.data?.message || 'Erro ao excluir usuário.'
      showAlert('destructive', 'Erro', msg)
    } finally {
      setIsDeleting(false)
    }
  }

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
        role: u.nivel_acesso === 'superadmin' ? 'superadmin' : 'admin',
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
        numero_matricula: u.numero_matricula,
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
        formacao: u.formacao,
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
        profissao: u.profissao,
        recebe_beneficio_social: u.recebe_beneficio_social,
        raw: u
      }))

      setUsers([...admins, ...alunos, ...profs, ...pais])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }


  const getValidationSchema = (role: UserRole, documentType: string) => {
    return yup.object().shape({
      name: yup.string().required('Nome completo é obrigatório'),
      email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
      ...(role !== 'admin' && role !== 'superadmin' && {
        phone: yup.string().required('Telefone é obrigatório').min(14, 'Telefone incompleto'),
        birthDate: yup.string().required('Data de nascimento é obrigatória').length(10, 'Data incompleta'),
        document: yup.string()
          .required('Documento é obrigatório')
          .test('doc-valid', 'Documento inválido', (val) => {
             if (!val) return false
             if (role === 'pai' && documentType === 'CNH') return val.replace(/\D/g, '').length === 11
             return val.replace(/\D/g, '').length === 11 
          })
      }),
      ...(role === 'professor' && {
        formacao: yup.string().required('Formação é obrigatória')
      }),
      ...(role === 'pai' && {
        profissao: yup.string().required('Profissão é obrigatória'),
        recebe_beneficio_social: yup.boolean().required('Informação sobre benefício é obrigatória')
      }),
      ...(role === 'aluno' && {
        numero_matricula: yup.string().optional()
      })
    })
  }

  const canEdit = (targetUser: BaseUser) => {
    if (currentUser?.nivel_acesso === 'superadmin') return true
    if (targetUser.role === 'superadmin') return false // admin não pode editar superadmin
    return true
  }

  const confirmSave = async () => {
    if (!selectedUser) return
    setIsSaving(true)
    setErrors({})

    let hasMediaErrors = false
    const newErrors: Record<string, string> = {}

    if (!editData.photo && !selectedUser.photo && !(editData as any).newPhotoFile) {
      newErrors.photo = 'Foto de perfil é obrigatória'
      hasMediaErrors = true
    }
    if (selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin') {
      if (!editData.documentPhoto && !selectedUser.documentPhoto && !(editData as any).newDocFile) {
        newErrors.documentPhoto = 'Documento frente é obrigatório'
        hasMediaErrors = true
      }
      if (!editData.documentBackPhoto && !selectedUser.documentBackPhoto && !(editData as any).newDocBackFile) {
        newErrors.documentBackPhoto = 'Documento verso é obrigatório'
        hasMediaErrors = true
      }
    }

    try {
      const schema = getValidationSchema(selectedUser.role, editData.documentType || selectedUser.documentType || 'CPF')
      
      // Sanitizar dados para validação
      const dataToValidate = {
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
        birthDate: editData.birthDate,
        document: editData.document,
        formacao: editData.formacao,
        profissao: editData.profissao,
        recebe_beneficio_social: editData.recebe_beneficio_social,
        numero_matricula: editData.numero_matricula
      }
      
      await schema.validate(dataToValidate, { abortEarly: false })
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        err.inner.forEach((e) => {
          if (e.path) newErrors[e.path] = e.message
        })
      }
      setErrors(newErrors)
      setShowSaveModal(false)
      setIsSaving(false)
      showAlert('destructive', 'Erro de validação', 'Verifique os campos em vermelho.')
      return
    }

    if (hasMediaErrors) {
      setErrors(newErrors)
      setShowSaveModal(false)
      setIsSaving(false)
      showAlert('destructive', 'Erro de validação', 'Verifique os campos de imagem obrigatórios.')
      return
    }

    try {
      let endpoint = ''
      const formData = new FormData()

      if ((editData as any).newPhotoFile) {
        formData.append('foto_perfil_url', (editData as any).newPhotoFile)
      }
      
      if ((editData as any).newDocFile) {
        formData.append('documento_frente_url', (editData as any).newDocFile)
      }

      if ((editData as any).newDocBackFile) {
        formData.append('documento_verso_url', (editData as any).newDocBackFile)
      }

      if (selectedUser.role === 'admin' || selectedUser.role === 'superadmin') {
        endpoint = `/admins/update/${selectedUser.id}`
        formData.append('nome_completo', editData.name || '')
        formData.append('email', editData.email || '')
      } else if (selectedUser.role === 'aluno') {
        endpoint = `/alunos/update/${selectedUser.id}`
        formData.append('nome_completo', editData.name || '')
        formData.append('email', editData.email || '')
        formData.append('cpf', editData.document || '')
        formData.append('telefone', editData.phone || '')
        formData.append('data_nascimento', editData.birthDate || '')
        formData.append('status_aluno', 'ativo')
        if (editData.numero_matricula) formData.append('numero_matricula', editData.numero_matricula)
      } else if (selectedUser.role === 'professor') {
        endpoint = `/professores/update/${selectedUser.id}`
        formData.append('nome_completo', editData.name || '')
        formData.append('email', editData.email || '')
        formData.append('cpf', editData.document || '')
        formData.append('telefone', editData.phone || '')
        formData.append('data_nascimento', editData.birthDate || '')
        formData.append('status_professor', 'ativo')
        if (editData.formacao) formData.append('formacao', editData.formacao)
      } else if (selectedUser.role === 'pai') {
        endpoint = `/pais/update/${selectedUser.id}`
        formData.append('nome_completo', editData.name || '')
        formData.append('email', editData.email || '')
        formData.append('documento', editData.document || '')
        formData.append('tipo_documento', editData.documentType || 'CPF')
        formData.append('telefone', editData.phone || '')
        formData.append('data_nascimento', editData.birthDate || '')
        if (editData.profissao) formData.append('profissao', editData.profissao)
        formData.append('recebe_beneficio_social', String(!!editData.recebe_beneficio_social))
      }

      await api.put(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      await fetchAllUsers()
      
      setSelectedUser(null)
      setShowSaveModal(false)
      showAlert('success', 'Sucesso', 'Dados salvos com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar dados:', error)
      const msg = error.response?.data?.message || 'Erro ao salvar dados do usuário.'
      if (msg.toLowerCase().includes('cpf já cadastrado') || msg.toLowerCase().includes('documento já cadastrado')) {
        setErrors(prev => ({ ...prev, document: 'CPF já cadastrado' }))
        showAlert('destructive', 'Erro de Validação', 'CPF já cadastrado no sistema!')
      } else if (msg.toLowerCase().includes('e-mail já cadastrado')) {
        setErrors(prev => ({ ...prev, email: 'E-mail já cadastrado' }))
        showAlert('destructive', 'Erro de Validação', 'E-mail já cadastrado no sistema!')
      } else {
        showAlert('destructive', 'Erro', msg)
      }
      setShowSaveModal(false)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    // Remove o próprio usuário logado da listagem
    if (u.id === currentUser?.id && (u.role === 'admin' || u.role === 'superadmin')) {
      return false
    }

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
                    {canEdit(user) && (
                      <>
                          <button
                            onClick={() => {
                              setSelectedUser(user)
                              setEditData({ ...user })
                              setErrors({})
                            }}
                            className="p-2 rounded-xl hover:bg-yellow-50 text-yellow-600 transition cursor-pointer"
                            title="Ver Perfil"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {currentUser?.nivel_acesso === 'superadmin' && (
                            <button
                              onClick={() => {
                                setUserToDelete(user)
                                setShowDeleteModal(true)
                              }}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-600 transition cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </>
                    )}
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
                  <div className={`relative group rounded-3xl overflow-hidden cursor-pointer ${errors.photo ? 'ring-2 ring-red-500' : ''}`}>
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
                          setErrors(prev => ({ ...prev, photo: '' }))
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
                      placeholder="Obrigatório"
                      className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                      value={editData.name || ''}
                      onChange={(e) => {
                        setEditData({ ...editData, name: e.target.value })
                        setErrors(prev => ({ ...prev, name: '' }))
                      }}
                    />
                    {errors.name && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.name}</span>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">E-mail</label>
                    <input
                      type="email"
                      placeholder="Obrigatório"
                      className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                      value={editData.email || ''}
                      onChange={(e) => {
                        setEditData({ ...editData, email: e.target.value })
                        setErrors(prev => ({ ...prev, email: '' }))
                      }}
                    />
                    {errors.email && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.email}</span>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin' && (
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
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Obrigatório"
                              className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.document ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                              value={editData.document || ''}
                              onChange={(e) => {
                                const val = e.target.value
                                const isCNH = selectedUser.role === 'pai' && editData.documentType === 'CNH'
                                setEditData({ ...editData, document: isCNH ? formatCNH(val) : formatCPF(val) })
                                setErrors(prev => ({ ...prev, document: '' }))
                              }}
                            />
                          </div>
                        </div>
                        {errors.document && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.document}</span>}
                      </div>
                    )}
                    {selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Telefone</label>
                        <input
                          type="text"
                          placeholder="Obrigatório"
                          className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                          value={editData.phone || ''}
                          onChange={(e) => {
                            setEditData({ ...editData, phone: formatPhone(e.target.value) })
                            setErrors(prev => ({ ...prev, phone: '' }))
                          }}
                        />
                        {errors.phone && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.phone}</span>}
                      </div>
                    )}
                    {selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Data de Nascimento</label>
                        <input
                          type="text"
                          placeholder="DD/MM/AAAA"
                          className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.birthDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                          value={editData.birthDate || ''}
                          onChange={(e) => {
                            setEditData({ ...editData, birthDate: formatDateInput(e.target.value) })
                            setErrors(prev => ({ ...prev, birthDate: '' }))
                          }}
                        />
                        {errors.birthDate && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.birthDate}</span>}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedUser.role === 'professor' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Formação</label>
                        <input
                          type="text"
                          placeholder="Obrigatório"
                          className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.formacao ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                          value={editData.formacao || ''}
                          onChange={(e) => {
                            setEditData({ ...editData, formacao: e.target.value })
                            setErrors(prev => ({ ...prev, formacao: '' }))
                          }}
                        />
                        {errors.formacao && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.formacao}</span>}
                      </div>
                    )}
                    {selectedUser.role === 'pai' && (
                      <>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Profissão</label>
                          <input
                            type="text"
                            placeholder="Obrigatório"
                            className={`w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border outline-none focus:ring-1 transition ${errors.profissao ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 focus:border-yellow-500 focus:ring-yellow-500'}`}
                            value={editData.profissao || ''}
                            onChange={(e) => {
                              setEditData({ ...editData, profissao: e.target.value })
                              setErrors(prev => ({ ...prev, profissao: '' }))
                            }}
                          />
                          {errors.profissao && <span className="text-xs text-red-500 font-medium mt-1 block">{errors.profissao}</span>}
                        </div>
                        <div className="flex flex-col justify-center pt-5">
                           <label className="flex items-center gap-3 cursor-pointer group">
                             <div className="relative">
                               <input
                                 type="checkbox"
                                 className="sr-only"
                                 checked={!!editData.recebe_beneficio_social}
                                 onChange={(e) => setEditData({ ...editData, recebe_beneficio_social: e.target.checked })}
                               />
                               <div className={`block w-10 h-6 rounded-full transition ${editData.recebe_beneficio_social ? 'bg-yellow-400' : 'bg-gray-300'}`}></div>
                               <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${editData.recebe_beneficio_social ? 'transform translate-x-4' : ''}`}></div>
                             </div>
                             <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Recebe Benefício Social</span>
                           </label>
                        </div>
                      </>
                    )}
                    {selectedUser.role === 'aluno' && (
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Número de Matrícula</label>
                        <input
                          type="text"
                          placeholder="Opcional"
                          className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium text-gray-900 border border-gray-200 outline-none focus:border-yellow-500 transition"
                          value={editData.numero_matricula || ''}
                          onChange={(e) => setEditData({ ...editData, numero_matricula: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>


                {selectedUser.role !== 'admin' && selectedUser.role !== 'superadmin' && (
                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <h3 className="font-title text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-500" />
                      Documentos Anexados
                    </h3>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Frente</span>
                        <div className={`relative inline-block rounded-3xl overflow-hidden border group cursor-pointer ${errors.documentPhoto ? 'border-red-500 ring-2 ring-red-500/50' : 'border-gray-200'}`}>
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
                                setErrors(prev => ({ ...prev, documentPhoto: '' }))
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Verso</span>
                        <div className={`relative inline-block rounded-3xl overflow-hidden border group cursor-pointer ${errors.documentBackPhoto ? 'border-red-500 ring-2 ring-red-500/50' : 'border-gray-200'}`}>
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
                                setErrors(prev => ({ ...prev, documentBackPhoto: '' }))
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

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-title text-lg font-bold text-gray-900 mb-2">Excluir Usuário</h3>
            <p className="text-sm text-gray-500 mb-6">
              Deseja realmente excluir <strong>{userToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
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
