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
import { formatCPF, formatCNH, formatPhone } from '../../../utils/formatters'

interface PaiAttributes {
  id?: number
  nome_completo: string
  documento: string
  tipo_documento: 'CPF' | 'CNH'
  email: string
  telefone: string
  data_nascimento: string
  profissao: string
  recebe_beneficio_social: boolean
  foto_perfil_url?: string | File | Blob
  documento_frente_url?: string | File
  documento_verso_url?: string | File
  senha?: string
}

const schema = yup.object({
  nome_completo: yup.string().required('Nome completo é obrigatório'),
  documento: yup.string().required('Documento é obrigatório'),
  tipo_documento: yup.string().oneOf(['CPF', 'CNH']).required(),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  data_nascimento: yup.string().required('Data de nascimento é obrigatória'),
  profissao: yup.string().required('Profissão é obrigatória'),
  recebe_beneficio_social: yup.boolean().required(),
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

function RegisterParentContent() {
  const { open } = useSidebar()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PaiAttributes>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      tipo_documento: 'CPF',
      recebe_beneficio_social: false,
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

  const onFormSubmit = async (data: PaiAttributes) => {
    try {
      const formData = new FormData()

      // Formatar documento para incluir pontos e hífen se for CPF
      let formattedDoc = data.documento.replace(/\D/g, '')
      if (data.tipo_documento === 'CPF' && formattedDoc.length === 11) {
        formattedDoc = formattedDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }

      // Adicionar campos de texto
      formData.append('nome_completo', data.nome_completo)
      formData.append('tipo_documento', data.tipo_documento)
      formData.append('documento', formattedDoc)
      formData.append('email', data.email)
      formData.append('telefone', data.telefone)
      formData.append('profissao', data.profissao)
      formData.append('recebe_beneficio_social', String(data.recebe_beneficio_social))
      formData.append('data_nascimento', data.data_nascimento) // Já em YYYY-MM-DD

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

      await api.post('/pais/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      alert('Pai cadastrado com sucesso!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Erro ao salvar pai:', error)
      const message =
        error.response?.data?.message ||
        'Erro ao cadastrar pai. Verifique os dados e tente novamente.'
      alert(message)
    }
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900 uppercase">
            Cadastro de Pais
          </h1>
          <p className="font-body text-xs text-gray-400">
            Cadastro de responsável familiar — ONG Iluminando o Futuro
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
            <p className="font-body mb-4 text-sm text-gray-400">
              Clique na foto para selecionar e ajustar o corte.
            </p>

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

            {profilePhotoPreview && (
              <p
                className="text-center mt-4 text-[11px] font-bold text-yellow-600 uppercase cursor-pointer hover:underline"
                onClick={handleProfilePhotoClick}
              >
                Ajustar ou Trocar
              </p>
            )}

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
                <h2 className="font-title text-lg font-extrabold text-gray-900">Dados Pessoais</h2>
                <p className="font-body text-xs text-gray-400">Informe os dados do responsável</p>
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
                  placeholder="Ex: João da Silva"
                  className={`${fieldClass} ${errors.nome_completo ? 'border-red-500' : ''}`}
                />
                {errors.nome_completo && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.nome_completo.message}
                  </p>
                )}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 md:col-span-2">
                <label className="space-y-1.5">
                  <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                    <Shield className="h-3.5 w-3.5 text-yellow-500" />
                    Tipo
                  </span>
                  <select {...register('tipo_documento')} className={fieldClass}>
                    <option value="CPF">CPF</option>
                    <option value="CNH">CNH</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide text-transparent">
                    .
                  </span>
                  <input
                    type="text"
                    {...register('documento', {
                      onChange: (e) => {
                        const tipo = watch('tipo_documento')
                        e.target.value = tipo === 'CPF' ? formatCPF(e.target.value) : formatCNH(e.target.value)
                      }
                    })}
                    placeholder={
                      watch('tipo_documento') === 'CPF' ? '000.000.000-00' : '00000000000'
                    }
                    className={`${fieldClass} ${errors.documento ? 'border-red-500' : ''}`}
                  />
                  {errors.documento && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                      {errors.documento.message}
                    </p>
                  )}
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="font-body flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <Mail className="h-3.5 w-3.5 text-yellow-500" />
                  E-mail
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="exemplo@email.com"
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
                  type="text"
                  {...register('telefone', {
                    onChange: (e) => {
                      e.target.value = formatPhone(e.target.value)
                    }
                  })}
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
                  Profissão
                </span>
                <input
                  type="text"
                  {...register('profissao')}
                  placeholder="Ex: Professor"
                  className={`${fieldClass} ${errors.profissao ? 'border-red-500' : ''}`}
                />
                {errors.profissao && (
                  <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">
                    {errors.profissao.message}
                  </p>
                )}
              </label>

              <div className="md:col-span-2 p-4 rounded-2xl bg-gray-50 border border-gray-100 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      {...register('recebe_beneficio_social')}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-yellow-400 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
                  </div>
                  <span className="font-body text-sm font-semibold text-gray-700">
                    Recebe benefício social?
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 border-t border-gray-100 pt-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5 text-yellow-500" />
                  Documento (Frente)
                </div>

                <div
                  onClick={() => document.getElementById('doc-frente')?.click()}
                  className="relative h-48 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-yellow-400 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {documentFrontPreview ? (
                    <img
                      src={documentFrontPreview}
                      alt="Frente"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Enviar Frente
                      </span>
                    </div>
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
                  className="relative h-48 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition hover:border-yellow-400 cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {documentBackPreview ? (
                    <img
                      src={documentBackPreview}
                      alt="Verso"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Plus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        Enviar Verso
                      </span>
                    </div>
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

export default function RegisterParent() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <OpenSidebarButton />
        <RegisterParentContent />
      </div>
    </SidebarProvider>
  )
}
