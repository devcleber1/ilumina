import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { Camera, ChevronRight, FileText, Mail, ShieldCheck, User, UserPlus } from 'lucide-react'

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
  foto_perfil_url?: string
  documento_frente_url?: string
  documento_verso_url?: string
  senha?: string
  senha_hash?: string
  precisa_trocar_senha?: boolean
  data_cadastro?: string
  data_atualizacao?: string
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

const getCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
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

  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) {
        resolve('')
        return
      }
      const croppedUrl = URL.createObjectURL(blob)
      resolve(croppedUrl)
    }, 'image/jpeg')
  })
}

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200'

function PhotoCropper({
  imageSrc,
  crop,
  zoom,
  onCropChange,
  onZoomChange,
  onCropComplete,
}: {
  imageSrc: string
  crop: { x: number; y: number }
  zoom: number
  onCropChange: (crop: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void
}) {
  return (
    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-100">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        showGrid={false}
      />
    </div>
  )
}

function RegisterParentContent() {
  const { open } = useSidebar()
  const [form, setForm] = useState<PaiAttributes>({
    nome_completo: '',
    documento: '',
    tipo_documento: 'CPF',
    email: '',
    telefone: '',
    data_nascimento: '',
    profissao: '',
    recebe_beneficio_social: false,
  })
  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string | null>(null)
  const [profilePhotoCroppedUrl, setProfilePhotoCroppedUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string | null>(null)
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = (field: keyof PaiAttributes, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhotoSrc(reader.result)
        setProfilePhotoCroppedUrl(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDocumentUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setter(URL.createObjectURL(file))
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!profilePhotoSrc || !croppedAreaPixels) return
    const cropped = await getCroppedImage(profilePhotoSrc, croppedAreaPixels)
    setProfilePhotoCroppedUrl(cropped)
  }, [profilePhotoSrc, croppedAreaPixels])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      ...form,
      foto_perfil_url: profilePhotoCroppedUrl ?? profilePhotoSrc ?? undefined,
      documento_frente_url: documentFrontUrl ?? undefined,
      documento_verso_url: documentBackUrl ?? undefined,
    }
    console.log('Salvar pai:', payload)
    alert('Cadastro de pai salvo localmente. Implementar envio ao backend.')
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900">Cadastro de Pais</h1>
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
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-title mb-3 text-base font-extrabold text-gray-900">
              Foto de Perfil
            </h2>
            <p className="font-body mb-4 text-sm text-gray-400">
              Faça upload e ajuste a foto de perfil antes de salvar.
            </p>

            <div className="flex flex-col gap-4">
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                {profilePhotoCroppedUrl ? (
                  <img
                    src={profilePhotoCroppedUrl}
                    alt="Foto de perfil cortada"
                    className="mx-auto h-40 w-40 rounded-full object-cover"
                  />
                ) : profilePhotoSrc ? (
                  <img
                    src={profilePhotoSrc}
                    alt="Foto de perfil"
                    className="mx-auto h-40 w-40 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-white text-gray-400">
                    <Camera className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-4 text-left shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-sm font-semibold text-gray-700">Upload da foto</p>
                    <p className="font-body text-xs text-gray-400">
                      Selecione uma imagem de rosto e ajuste o corte antes de salvar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
                  >
                    Selecionar arquivo
                  </button>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <div className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  {profilePhotoSrc ? (
                    <p className="font-body text-sm text-gray-700">
                      Imagem carregada. Ajuste o corte abaixo.
                    </p>
                  ) : (
                    <>
                      <p className="font-body text-sm font-semibold text-gray-700">
                        Arraste e solte ou selecione
                      </p>
                      <p className="font-body text-xs text-gray-400">
                        JPEG, PNG — melhor com rosto centralizado.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {profilePhotoSrc && (
                <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                  <PhotoCropper
                    imageSrc={profilePhotoSrc}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={event => setZoom(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-yellow-400"
                    />
                    <button
                      type="button"
                      onClick={applyCrop}
                      className="rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
                    >
                      Aplicar corte
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">Nome completo</span>
                <input
                  type="text"
                  value={form.nome_completo}
                  onChange={event => handleChange('nome_completo', event.target.value)}
                  className={fieldClass}
                  placeholder="Maria Souza"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">
                  Tipo de documento
                </span>
                <select
                  value={form.tipo_documento}
                  onChange={event =>
                    handleChange('tipo_documento', event.target.value as 'CPF' | 'CNH')
                  }
                  className={fieldClass}
                >
                  <option value="CPF">CPF</option>
                  <option value="CNH">CNH</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">Documento</span>
                <input
                  type="text"
                  value={form.documento}
                  onChange={event => handleChange('documento', event.target.value)}
                  className={fieldClass}
                  placeholder="000.000.000-00"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">
                  Data de nascimento
                </span>
                <input
                  type="date"
                  value={form.data_nascimento}
                  onChange={event => handleChange('data_nascimento', event.target.value)}
                  className={fieldClass}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={event => handleChange('email', event.target.value)}
                  className={fieldClass}
                  placeholder="maria@exemplo.com"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">Telefone</span>
                <input
                  type="tel"
                  value={form.telefone}
                  onChange={event => handleChange('telefone', event.target.value)}
                  className={fieldClass}
                  placeholder="(11) 99999-9999"
                  required
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className="font-body text-sm font-semibold text-gray-700">Profissão</span>
                <input
                  type="text"
                  value={form.profissao}
                  onChange={event => handleChange('profissao', event.target.value)}
                  className={fieldClass}
                  placeholder="Professor, motorista, comerciário"
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className="font-body text-sm font-semibold text-gray-700">
                  Recebe benefício social?
                </span>
                <div className="inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleChange('recebe_beneficio_social', false)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.recebe_beneficio_social
                        ? 'text-gray-600 hover:text-gray-900'
                        : 'bg-yellow-400 text-gray-900'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('recebe_beneficio_social', true)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      form.recebe_beneficio_social
                        ? 'bg-yellow-400 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </label>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-700">
                <ShieldCheck className="h-4 w-4 text-yellow-500" />
                Dados de acesso opcional
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="space-y-2">
                  <span className="font-body text-sm text-gray-700">Senha virtual</span>
                  <input
                    type="password"
                    value={form.senha ?? ''}
                    onChange={event => handleChange('senha', event.target.value)}
                    className={fieldClass}
                    placeholder="Digite uma senha segura"
                  />
                </label>
                <label className="space-y-2">
                  <span className="font-body text-sm text-gray-700">
                    Forçar troca no primeiro login
                  </span>
                  <input
                    type="checkbox"
                    checked={form.precisa_trocar_senha ?? false}
                    onChange={event => handleChange('precisa_trocar_senha', event.target.checked)}
                    className="h-4 w-4 accent-yellow-400"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
              >
                Salvar pai
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-title mb-3 text-base font-extrabold text-gray-900">Documentos</h2>
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-left shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-body text-sm font-semibold text-gray-700">
                        Frente do documento
                      </p>
                      <p className="font-body text-xs text-gray-400">
                        Tire uma foto nítida da frente do CPF/CNH.
                      </p>
                    </div>
                  </div>
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-4 text-center text-sm font-semibold text-gray-500 transition hover:border-yellow-400 hover:text-gray-900">
                    Selecionar frente do documento
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentFrontUrl)}
                      className="sr-only"
                    />
                  </label>
                  {documentFrontUrl && (
                    <img
                      src={documentFrontUrl}
                      alt="Documento frente"
                      className="mt-4 h-40 w-full rounded-3xl object-cover"
                    />
                  )}
                </div>
                <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-left shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-500 shadow-sm">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-body text-sm font-semibold text-gray-700">
                        Verso do documento
                      </p>
                      <p className="font-body text-xs text-gray-400">
                        Envie a parte de trás do documento para validação.
                      </p>
                    </div>
                  </div>
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-4 text-center text-sm font-semibold text-gray-500 transition hover:border-yellow-400 hover:text-gray-900">
                    Selecionar verso do documento
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentBackUrl)}
                      className="sr-only"
                    />
                  </label>
                  {documentBackUrl && (
                    <img
                      src={documentBackUrl}
                      alt="Documento verso"
                      className="mt-4 h-40 w-full rounded-3xl object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <UserPlus className="h-5 w-5 text-yellow-400" />
              <div>
                <h2 className="font-title text-base font-extrabold text-gray-900">Resumo</h2>
                <p className="font-body text-xs text-gray-400">Confira os dados antes de salvar.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User className="h-4 w-4 text-gray-500" />
                  Identificação
                </div>
                <p className="font-body text-sm text-gray-600">
                  {form.nome_completo || 'Nome do pai ainda não preenchido'}
                </p>
                <p className="font-body text-sm text-gray-500">
                  {form.documento || 'Documento pendente'}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Contato
                </div>
                <p className="font-body text-sm text-gray-600">{form.email || 'Email pendente'}</p>
                <p className="font-body text-sm text-gray-500">
                  {form.telefone || 'Telefone pendente'}
                </p>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Situação
                </div>
                <p className="font-body text-sm text-gray-600">
                  {form.tipo_documento} • {form.profissao || 'Profissão não informada'}
                </p>
                <p className="font-body text-sm text-gray-500">
                  {form.recebe_beneficio_social
                    ? 'Recebe benefício social'
                    : 'Não recebe benefício social'}
                </p>
              </div>
            </div>
          </div>
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
