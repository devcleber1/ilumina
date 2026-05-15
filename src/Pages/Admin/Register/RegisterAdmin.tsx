import { useCallback, useRef, useState, useEffect } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { NavLink, useNavigate } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { Camera, ChevronRight, Mail, Shield, User, UserPlus, Lock, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { api } from '../../../lib/api'
import { useAlert } from '../../../contexts/AlertContext'
import { useAuth } from '../../../contexts/AuthContext'

interface AdminAttributes {
  nome_completo: string
  email: string
  senha: string
  confirmarSenha: string
  nivel_acesso: 'admin' | 'superadmin'
  status_admin: 'ativo' | 'inativo' | 'suspenso'
  foto_perfil_url?: string | File | Blob
}

const schema = yup.object({
  nome_completo: yup.string().required('Nome completo é obrigatório').max(100),
  email: yup.string().email('Email inválido').required('Email é obrigatório').max(100),
  senha: yup
    .string()
    .min(12, 'Mínimo 12 caracteres')
    .matches(/[A-Z]/, 'Pelo menos uma letra maiúscula')
    .matches(/[a-z]/, 'Pelo menos uma letra minúscula')
    .matches(/[0-9]/, 'Pelo menos um número')
    .matches(/[!@#$%^&*(),.?":{}|<>]/, 'Pelo menos um caractere especial')
    .required('Senha é obrigatória'),
  confirmarSenha: yup.string().oneOf([yup.ref('senha')], 'As senhas não coincidem').required('Confirmação de senha é obrigatória'),
  nivel_acesso: yup.string().oneOf(['admin', 'superadmin']).required('Nível de acesso é obrigatório'),
  status_admin: yup.string().oneOf(['ativo', 'inativo', 'suspenso']).required('Status é obrigatório'),
})

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  canvas.width = Math.round(pixelCrop.width)
  canvas.height = Math.round(pixelCrop.height)
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas context not available')
  }

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, 'image/jpeg')
  })
}

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'

function RegisterAdminContent() {
  const { open } = useSidebar()
  const navigate = useNavigate()
  const { showAlert } = useAlert()
  const { user } = useAuth()
  const [photoError, setPhotoError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (user && user.nivel_acesso !== 'superadmin') {
      showAlert('destructive', 'Acesso Negado', 'Apenas super administradores podem acessar esta página.')
      navigate('/dashboard')
    }
  }, [user, navigate, showAlert])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AdminAttributes>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      nivel_acesso: 'admin',
      status_admin: 'ativo',
    },
  })

  const passwordValue = watch('senha', '')

  const passwordRequirements = [
    { label: 'Mínimo 12 caracteres', test: (val: string) => val.length >= 12 },
    { label: 'Letra maiúscula', test: (val: string) => /[A-Z]/.test(val) },
    { label: 'Letra minúscula', test: (val: string) => /[a-z]/.test(val) },
    { label: 'Um número', test: (val: string) => /[0-9]/.test(val) },
    { label: 'Caractere especial (!@#$...)', test: (val: string) => /[!@#$%^&*(),.?":{}|<>]/.test(val) },
  ]

  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string | null>(null)
  const [profilePhotoBlob, setProfilePhotoBlob] = useState<Blob | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)

  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleProfilePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhotoSrc(reader.result)
        setProfilePhotoBlob(null)
        setProfilePhotoPreview(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setIsCropModalOpen(true)
        setPhotoError('')
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!profilePhotoSrc || !croppedAreaPixels) return
    try {
      const blob = await getCroppedImage(profilePhotoSrc, croppedAreaPixels)
      setProfilePhotoBlob(blob)
      setProfilePhotoPreview(URL.createObjectURL(blob))
      setIsCropModalOpen(false)
    } catch (error) {
      console.error('Error cropping image:', error)
    }
  }, [profilePhotoSrc, croppedAreaPixels])

  const onFormSubmit = async (data: AdminAttributes) => {
    try {
      const formData = new FormData()

      formData.append('nome_completo', data.nome_completo)
      formData.append('email', data.email)
      formData.append('senha', data.senha)
      formData.append('nivel_acesso', data.nivel_acesso)
      formData.append('status_admin', data.status_admin)

      if (profilePhotoBlob) {
        formData.append('foto_perfil_url', profilePhotoBlob, 'profile.jpg')
      }

      await api.post('/admins/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      showAlert('success', 'Sucesso', 'Administrador cadastrado com sucesso!')
      navigate('/dashboard/editar-usuarios')
    } catch (error: any) {
      console.error('Erro ao salvar admin:', error)
      const message =
        error.response?.data?.message ||
        'Erro ao cadastrar administrador. Verifique os dados e tente novamente.'
      showAlert('destructive', 'Erro', message)
    }
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold uppercase text-gray-900">
            Cadastro de Administradores
          </h1>
          <p className="font-body text-xs text-gray-400">
            Criação de novos gestores — ONG Iluminando o Futuro
          </p>
        </div>
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-yellow-400 hover:bg-yellow-50"
        >
          <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
          Voltar ao dashboard
        </NavLink>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm h-fit">
            <h2 className="font-title mb-3 text-base font-extrabold text-gray-900">
              Foto de Perfil
            </h2>
            <div
              onClick={handleProfilePhotoClick}
              className={`group relative mx-auto h-48 w-48 cursor-pointer overflow-hidden rounded-full border-4 bg-gray-50 shadow-inner transition hover:border-yellow-200 ${photoError ? 'border-red-500' : 'border-yellow-50'}`}
            >
              {profilePhotoPreview ? (
                <img
                  src={profilePhotoPreview}
                  alt="Perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <Camera className="mb-2 h-10 w-10 text-gray-300 transition group-hover:text-yellow-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-tight">
                    Clique para selecionar (Opcional)
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>

            {isCropModalOpen && profilePhotoSrc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                  <div className="border-b border-gray-100 p-6">
                    <h3 className="font-title text-lg font-extrabold text-gray-900">
                      Ajustar Imagem
                    </h3>
                  </div>
                  <div className="relative h-80 w-full bg-gray-100">
                    <Cropper
                      image={profilePhotoSrc}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={applyCrop}
                        className="flex-1 rounded-2xl bg-yellow-400 py-3 text-sm font-bold text-gray-900 transition hover:bg-yellow-500"
                      >
                        APLICAR CORTE
                      </button>
                      <button
                        onClick={() => setIsCropModalOpen(false)}
                        className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-500 transition hover:bg-gray-50"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit(onFormSubmit)}
            className="rounded-3xl bg-white p-8 shadow-sm"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400 text-white shadow-md">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-title text-lg font-extrabold text-gray-900">
                  Dados do Administrador
                </h2>
                <p className="font-body text-xs text-gray-400">Informe as credenciais de acesso</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="space-y-1.5 md:col-span-2">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <User className="h-3.5 w-3.5 text-yellow-500" />
                  Nome Completo
                </span>
                <input
                  type="text"
                  {...register('nome_completo')}
                  placeholder="Ex: Ana Maria Silva"
                  className={`${fieldClass} ${errors.nome_completo ? 'border-red-500' : ''}`}
                />
                {errors.nome_completo && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.nome_completo.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5 md:col-span-2">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-yellow-500" />
                  E-mail
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="admin@email.com"
                  className={`${fieldClass} ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.email.message}
                  </p>
                )}
              </label>

              <div className="space-y-4 md:col-span-2 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      <Lock className="h-3.5 w-3.5 text-yellow-500" />
                      Senha
                    </span>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('senha')}
                        placeholder="********"
                        className={`${fieldClass} pr-12 ${errors.senha ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                      <Lock className="h-3.5 w-3.5 text-yellow-500" />
                      Confirmar Senha
                    </span>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirmarSenha')}
                        placeholder="********"
                        className={`${fieldClass} pr-12 ${errors.confirmarSenha ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.confirmarSenha && (
                      <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                        {errors.confirmarSenha.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Requisitos da Senha</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {passwordRequirements.map((req, idx) => {
                      const isMet = req.test(passwordValue)
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          {isMet ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-gray-300" />
                          )}
                          <span className={`text-[11px] font-medium transition-colors ${isMet ? 'text-green-600' : 'text-gray-500'}`}>
                            {req.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5 text-yellow-500" />
                  Nível de Acesso
                </span>
                <select {...register('nivel_acesso')} className={fieldClass}>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Administrador</option>
                </select>
                {errors.nivel_acesso && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.nivel_acesso.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5 text-yellow-500" />
                  Status
                </span>
                <select {...register('status_admin')} className={fieldClass}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                </select>
                {errors.status_admin && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.status_admin.message}
                  </p>
                )}
              </label>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-yellow-400 px-6 py-4 text-sm font-bold text-gray-900 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                FINALIZAR CADASTRO
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm font-bold text-gray-500 transition hover:bg-gray-50"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>
      </div>
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

export default function RegisterAdmin() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <RegisterAdminContent />
      </div>
    </SidebarProvider>
  )
}
