import { useCallback, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { NavLink } from 'react-router-dom'
import { SidebarProvider, useSidebar } from '../../../Components/ui/sidebar'
import { AppSidebar } from '../../../Components/AppSidebar'
import { Camera, ChevronRight, FileText, Mail, Shield, User, UserPlus } from 'lucide-react'

interface ProfessorAttributes {
  id?: number
  nome_completo: string
  cpf: string
  email: string
  telefone: string
  formacao: string
  status_professor?: 'ativo' | 'inativo' | 'licenca'
  foto_perfil_url?: string
  documento_frente_url?: string
  documento_verso_url?: string
  data_nascimento: Date
  senha?: string
  senha_hash?: string
  precisa_trocar_senha?: boolean
  data_cadastro?: Date
  data_atualizacao?: Date
}

type ProfessorFormAttributes = Omit<
  ProfessorAttributes,
  'data_nascimento' | 'data_cadastro' | 'data_atualizacao'
> & {
  data_nascimento: string
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

function RegisterTeacherContent() {
  const { open } = useSidebar()
  const [form, setForm] = useState<ProfessorFormAttributes>({
    nome_completo: '',
    cpf: '',
    email: '',
    telefone: '',
    formacao: '',
    status_professor: 'ativo',
    data_nascimento: '',
    senha: '',
    senha_hash: '',
    precisa_trocar_senha: false,
  })
  const [profilePhotoSrc, setProfilePhotoSrc] = useState<string | null>(null)
  const [profilePhotoCroppedUrl, setProfilePhotoCroppedUrl] = useState<string | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [documentFrontUrl, setDocumentFrontUrl] = useState<string | null>(null)
  const [documentBackUrl, setDocumentBackUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = (field: keyof ProfessorFormAttributes, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

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
        setProfilePhotoCroppedUrl(null)
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
    setter: (url: string) => void
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setter(URL.createObjectURL(file))
    event.target.value = ''
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixelsValue: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsValue)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!profilePhotoSrc || !croppedAreaPixels) return
    const cropped = await getCroppedImage(profilePhotoSrc, croppedAreaPixels)
    setProfilePhotoCroppedUrl(cropped)
    setIsCropModalOpen(false)
  }, [profilePhotoSrc, croppedAreaPixels])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      ...form,
      foto_perfil_url: profilePhotoCroppedUrl ?? profilePhotoSrc ?? undefined,
      documento_frente_url: documentFrontUrl ?? undefined,
      documento_verso_url: documentBackUrl ?? undefined,
    }
    console.log('Salvar professor:', payload)
    alert('Cadastro de professor salvo localmente. Implementar envio ao backend.')
  }

  return (
    <main
      className={`flex-1 bg-gray-100 min-h-screen transition-all duration-300 ${!open ? 'pl-8' : ''}`}
    >
      <div className="flex w-full items-center justify-between px-6 py-4 bg-white shadow-sm sticky top-0 z-40">
        <div className="flex-1">
          <h1 className="font-title text-xl font-extrabold text-gray-900">
            Cadastro de Professores
          </h1>
          <p className="font-body text-xs text-gray-400">
            Cadastro de professor — ONG Iluminando o Futuro
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
              <div
                className="group relative mx-auto flex h-44 w-44 cursor-pointer items-center justify-center overflow-hidden rounded-full border-4 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-yellow-400"
                onClick={handleProfilePhotoClick}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                {profilePhotoCroppedUrl || profilePhotoSrc ? (
                  <>
                    <img
                      src={profilePhotoCroppedUrl ?? profilePhotoSrc ?? ''}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/30 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        Ajustar foto
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                      <Camera className="h-7 w-7" />
                    </span>
                    <div>
                      <p className="font-body text-sm font-semibold text-gray-700">
                        Clique para enviar
                      </p>
                      <p className="font-body text-xs text-gray-400">Foto de perfil quadrada</p>
                    </div>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-full bg-gradient-to-t from-black/40 to-transparent py-2 text-center opacity-0 transition group-hover:opacity-100">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                    Clique para trocar
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-center text-sm text-gray-500">
                  {profilePhotoCroppedUrl ? (
                    <p className="font-body text-sm text-gray-700">
                      Imagem selecionada. Clique na foto para trocar ou editar o corte.
                    </p>
                  ) : profilePhotoSrc ? (
                    <p className="font-body text-sm text-gray-700">
                      Imagem carregada. Clique na foto para editar o corte.
                    </p>
                  ) : (
                    <>
                      <p className="font-body text-sm font-semibold text-gray-700">
                        Clique na imagem para iniciar o upload.
                      </p>
                      <p className="font-body text-xs text-gray-400">
                        JPEG ou PNG com o rosto centralizado.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {isCropModalOpen && profilePhotoSrc && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                      <h3 className="font-title text-lg font-extrabold text-gray-900">
                        Ajustar foto de perfil
                      </h3>
                      <p className="font-body text-sm text-gray-500">
                        Posicione e redimensione a imagem antes de salvar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCropModalOpen(false)}
                      className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-100"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="relative h-72 w-full overflow-hidden rounded-3xl bg-gray-100">
                      <Cropper
                        image={profilePhotoSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        showGrid={false}
                      />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
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
                        Salvar corte
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                      <span>Clique na foto se quiser enviar outra imagem.</span>
                      <button
                        type="button"
                        onClick={handleOpenFilePicker}
                        className="font-semibold text-yellow-500 hover:text-yellow-600"
                      >
                        Trocar arquivo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                <span className="font-body text-sm font-semibold text-gray-700">CPF</span>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={event => handleChange('cpf', event.target.value)}
                  className={fieldClass}
                  placeholder="000.000.000-00"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="font-body text-sm font-semibold text-gray-700">Formação</span>
                <input
                  type="text"
                  value={form.formacao}
                  onChange={event => handleChange('formacao', event.target.value)}
                  className={fieldClass}
                  placeholder="Pedagogia, História, Matemática"
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
                <span className="font-body text-sm font-semibold text-gray-700">
                  Status do professor
                </span>
                <select
                  value={form.status_professor}
                  onChange={event =>
                    handleChange(
                      'status_professor',
                      event.target.value as 'ativo' | 'inativo' | 'licenca'
                    )
                  }
                  className={fieldClass}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="licenca">Licença</option>
                </select>
              </label>
              <div className="rounded-3xl border border-gray-200 bg-white p-6 lg:col-span-2 shadow-sm">
                <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-gray-700">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  Dados de acesso opcional
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <label className="space-y-2">
                    <span className="font-body text-sm font-semibold text-gray-700">
                      Senha virtual
                    </span>
                    <input
                      type="password"
                      value={form.senha ?? ''}
                      onChange={event => handleChange('senha', event.target.value)}
                      className={fieldClass}
                      placeholder="Digite uma senha segura"
                    />
                  </label>
                  <label className="space-y-2 lg:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-body text-sm font-semibold text-gray-700">
                        Forçar troca no primeiro login
                      </span>
                      <input
                        type="checkbox"
                        checked={form.precisa_trocar_senha ?? false}
                        onChange={event =>
                          handleChange('precisa_trocar_senha', event.target.checked)
                        }
                        className="h-4 w-4 accent-yellow-400"
                      />
                    </div>
                  </label>
                </div>
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
                Salvar professor
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="font-title mb-3 text-base font-extrabold text-gray-900">Documentos</h2>
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
                {documentFrontUrl ? (
                  <label className="relative block h-40 w-full cursor-pointer overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white transition hover:border-yellow-400">
                    <img
                      src={documentFrontUrl}
                      alt="Documento frente"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900">
                        Clique para trocar a frente
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentFrontUrl)}
                      className="sr-only"
                    />
                  </label>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-4 text-center text-sm font-semibold text-gray-500 transition hover:border-yellow-400 hover:text-gray-900">
                    Selecionar frente do documento
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentFrontUrl)}
                      className="sr-only"
                    />
                  </label>
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
                {documentBackUrl ? (
                  <label className="relative block h-40 w-full cursor-pointer overflow-hidden rounded-3xl border border-dashed border-gray-300 bg-white transition hover:border-yellow-400">
                    <img
                      src={documentBackUrl}
                      alt="Documento verso"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900">
                        Clique para trocar o verso
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentBackUrl)}
                      className="sr-only"
                    />
                  </label>
                ) : (
                  <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-white px-4 text-center text-sm font-semibold text-gray-500 transition hover:border-yellow-400 hover:text-gray-900">
                    Selecionar verso do documento
                    <input
                      type="file"
                      accept="image/*"
                      onChange={event => handleDocumentUpload(event, setDocumentBackUrl)}
                      className="sr-only"
                    />
                  </label>
                )}
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
                  {form.nome_completo || 'Nome do professor ainda não preenchido'}
                </p>
                <p className="font-body text-sm text-gray-500">{form.cpf || 'CPF pendente'}</p>
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
                  {form.status_professor === 'ativo'
                    ? 'Ativo'
                    : form.status_professor === 'inativo'
                      ? 'Inativo'
                      : 'Licença'}
                </p>
                <p className="font-body text-sm text-gray-500">
                  Formação: {form.formacao || 'Não informada'}
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
