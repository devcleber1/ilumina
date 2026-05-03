import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { NavLink, useNavigate } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { Camera, ChevronRight, FileText, Mail, Shield, User, UserPlus, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { api } from '../../../lib/api'

interface ProfessorAttributes {
  id?: number
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  formacao: string
  status_professor: 'ativo' | 'inativo' | 'licenca'
  data_nascimento: string
  foto_perfil_url?: string | File | Blob
  documento_frente_url?: string | File
  documento_verso_url?: string | File
}

const schema = yup.object({
  nome_completo: yup.string().required('Nome completo é obrigatório'),
  cpf: yup.string().required('CPF é obrigatório'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  formacao: yup.string().required('Formação é obrigatória'),
  status_professor: yup.string().oneOf(['ativo', 'inativo', 'licenca']).required(),
  data_nascimento: yup.string().required('Data de nascimento é obrigatória'),
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

function RegisterTeacherContent() {
  const { open } = useSidebar()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfessorAttributes>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      status_professor: 'ativo',
    },
  })

  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string | null>(null)
  const [profilePhotoBlob, setProfilePhotoBlob] = useState<Blob | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)

  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const [documentFrontFile, setDocumentFrontFile] = useState<File | null>(null)
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null)
  const [documentFrontPreview, setDocumentFrontPreview] = useState<string | null>(null)
  const [documentBackPreview, setDocumentBackPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleProfilePhotoClick = () => {
    if (profilePhotoSrc) {
      setIsCropModalOpen(true)
      return
    }
    handleOpenFilePicker()
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
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleDocumentUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File) => void,
    setPreview: (url: string) => void
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFile(file)
    setPreview(URL.createObjectURL(file))
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

  const onFormSubmit = async (data: ProfessorAttributes) => {
    try {
      const formData = new FormData()

      // Formatar CPF para incluir pontos e hífen (backend exige 14 caracteres: 000.000.000-00)
      let formattedCpf = data.cpf.replace(/\D/g, '')
      if (formattedCpf.length === 11) {
        formattedCpf = formattedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }

      // Adicionar campos de texto
      formData.append('nome_completo', data.nome_completo)
      formData.append('cpf', formattedCpf)
      formData.append('email', data.email)
      formData.append('telefone', data.telefone)
      formData.append('formacao', data.formacao)
      formData.append('status_professor', data.status_professor)
      formData.append('data_nascimento', data.data_nascimento) // Já está em YYYY-MM-DD (formato esperado)

      // Adicionar arquivos
      if (profilePhotoBlob) {
        formData.append('foto_perfil_url', profilePhotoBlob, 'profile.jpg')
      }
      if (documentFrontFile) {
        formData.append('documento_frente_url', documentFrontFile)
      }
      if (documentBackFile) {
        formData.append('documento_verso_url', documentBackFile)
      }

      await api.post('/professores/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      alert('Professor cadastrado com sucesso!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error)
      const message =
        error.response?.data?.message ||
        'Erro ao cadastrar professor. Verifique os dados e tente novamente.'
      alert(message)
    }
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold uppercase text-gray-900">
            Cadastro de Professores
          </h1>
          <p className="font-body text-xs text-gray-400">
            Cadastro de docentes — ONG Iluminando o Futuro
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
              className="group relative mx-auto h-48 w-48 cursor-pointer overflow-hidden rounded-full border-4 border-yellow-50 bg-gray-50 shadow-inner transition hover:border-yellow-200"
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
                    Clique para selecionar
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
                  Dados do Professor
                </h2>
                <p className="font-body text-xs text-gray-400">Informe os dados cadastrais</p>
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
                  placeholder="Ex: Carlos Alberto"
                  className={`${fieldClass} ${errors.nome_completo ? 'border-red-500' : ''}`}
                />
                {errors.nome_completo && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.nome_completo.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5 text-yellow-500" />
                  CPF
                </span>
                <input
                  type="text"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  className={`${fieldClass} ${errors.cpf ? 'border-red-500' : ''}`}
                />
                {errors.cpf && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.cpf.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-yellow-500" />
                  E-mail
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="professor@email.com"
                  className={`${fieldClass} ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.email.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <User className="h-3.5 w-3.5 text-yellow-500" />
                  Telefone
                </span>
                <input
                  type="tel"
                  {...register('telefone')}
                  placeholder="(00) 00000-0000"
                  className={`${fieldClass} ${errors.telefone ? 'border-red-500' : ''}`}
                />
                {errors.telefone && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.telefone.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <User className="h-3.5 w-3.5 text-yellow-500" />
                  Nascimento
                </span>
                <input
                  type="date"
                  {...register('data_nascimento')}
                  className={`${fieldClass} ${errors.data_nascimento ? 'border-red-500' : ''}`}
                />
                {errors.data_nascimento && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.data_nascimento.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <User className="h-3.5 w-3.5 text-yellow-500" />
                  Formação
                </span>
                <input
                  type="text"
                  {...register('formacao')}
                  placeholder="Ex: Graduação em Educação Física"
                  className={`${fieldClass} ${errors.formacao ? 'border-red-500' : ''}`}
                />
                {errors.formacao && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.formacao.message}
                  </p>
                )}
              </label>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Shield className="h-3.5 w-3.5 text-yellow-500" />
                  Status
                </span>
                <select {...register('status_professor')} className={fieldClass}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="licenca">Licença</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-gray-100 pt-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5 text-yellow-500" />
                  Documento (Frente)
                </div>
                <div
                  onClick={() => document.getElementById('doc-frente')?.click()}
                  className="relative h-40 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-yellow-400 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {documentFrontPreview ? (
                    <img
                      src={documentFrontPreview}
                      alt="Frente"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="h-6 w-6 text-gray-300" />
                  )}
                  <input
                    id="doc-frente"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e =>
                      handleDocumentUpload(e, setDocumentFrontFile, setDocumentFrontPreview)
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5 text-yellow-500" />
                  Documento (Verso)
                </div>
                <div
                  onClick={() => document.getElementById('doc-verso')?.click()}
                  className="relative h-40 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-yellow-400 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {documentBackPreview ? (
                    <img
                      src={documentBackPreview}
                      alt="Verso"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="h-6 w-6 text-gray-300" />
                  )}
                  <input
                    id="doc-verso"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={e =>
                      handleDocumentUpload(e, setDocumentBackFile, setDocumentBackPreview)
                    }
                  />
                </div>
              </div>
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

export default function RegisterTeacher() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <RegisterTeacherContent />
      </div>
    </SidebarProvider>
  )
}
