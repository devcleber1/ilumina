import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { ChangePasswordModal } from '../../Components/ChangePasswordModal'
import { FormInput } from '../../Components/ui/FormInput'
import logo from '../../assets/logo.png'
import kids from '../../assets/kidsL.png'

const schema = yup.object({
  email: yup
    .string()
    .email('Email inválido')
    .max(100, 'Tamanho máximo excedido')
    .required('Email é obrigatório'),
  password: yup.string().max(255, 'Tamanho máximo excedido').required('Senha é obrigatória'),
})

type FormData = {
  email: string
  password: string
}

export default function Auth() {
  const { login, user, logout } = useAuth()
  const navigate = useNavigate()
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authUserName, setAuthUserName] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const success = await login(data.email, data.password)
      if (success) {
        setIsAuthenticating(true)
      } else {
        setError('root', { type: 'server', message: 'E-mail ou senha incorretos' })
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      setError('root', { type: 'server', message: 'Erro ao conectar ao servidor' })
    }
  }

  // Monitorar mudança no user após login para abrir o modal ou redirecionar com animação
  useEffect(() => {
    if (user) {
      setAuthUserName(user.nome || user.tipo)
      if (user.precisa_trocar_senha) {
        setIsChangePasswordModalOpen(true)
        setIsAuthenticating(false)
      } else {
        setIsAuthenticating(true)
        const timer = setTimeout(() => {
          if (user.tipo === 'pai') {
            navigate('/portal')
          } else if (user.tipo === 'professor') {
            navigate('/portal-professor')
          } else {
            navigate('/dashboard')
          }
        }, 900)
        return () => clearTimeout(timer)
      }
    }
  }, [user, navigate])

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center p-3 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #FFEA01 0%, #FBC329 50%, #FBC02D 100%)',
      }}
    >
      {/* Overlay Animado Pós-Login */}
      {isAuthenticating && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping duration-1000" />
            <img
              src={logo}
              alt="Logo ONG Ilumina"
              className="h-24 w-24 rounded-full object-cover shadow-2xl border-4 border-yellow-400 relative z-10 animate-bounce"
            />
          </div>
          <div className="space-y-2 text-center">
            <h3 className="font-title text-2xl font-black text-white tracking-wide uppercase">
              {authUserName ? `Seja bem-vindo(a)!` : 'Autenticando...'}
            </h3>
            <p className="font-body text-sm font-semibold text-yellow-300 animate-pulse">
              Carregando seu portal com segurança...
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce" />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row w-full max-w-[860px] min-h-0 md:min-h-[500px] rounded-[24px] md:rounded-[28px] overflow-hidden shadow-2xl">
        {/* Lado esquerdo — imagem (oculta no mobile) */}
        <div className="hidden md:block md:w-[380px] flex-shrink-0">
          <img
            src={kids}
            alt="Crianças da ONG Iluminando o Futuro"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Lado direito — formulário */}
        <div className="flex flex-1 flex-col justify-center px-5 py-7 md:px-10 md:py-12 bg-gray-50">
          <div className="flex flex-col items-center mb-4 md:mb-6">
            <img
              src={logo}
              alt="Logo ONG Iluminando o Futuro"
              className="h-14 w-14 md:h-16 md:w-16 rounded-full object-cover shadow-md mb-3 md:mb-4"
              style={{ border: '3px solid #FBC329' }}
            />
            <h2 className="font-title text-center text-[15px] md:text-[17px] font-extrabold text-gray-900 leading-tight">
              Bem-vindo(a) à Plataforma da ONG Iluminando o Futuro
            </h2>
            <p className="font-body mt-1 text-center text-[11px] md:text-[13px] text-gray-400">
              Faça login para acessar os recursos do sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <FormInput
                label="Email"
                type="email"
                placeholder="seu.email@exemplo.com"
                error={errors.email?.message || errors.root?.message}
                {...register('email')}
              />
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <FormInput
                label="Senha"
                isPassword
                placeholder="Digite sua senha"
                error={errors.password?.message || errors.root?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1 px-1">
                <a
                  href="#"
                  className="font-body text-[11px] font-bold text-gray-400 hover:text-yellow-500 transition"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              disabled={isSubmitting || isAuthenticating}
              className="font-body flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm tracking-widest text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-90 active:translate-y-0 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: '#FFD700' }}
            >
              {isSubmitting || isAuthenticating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>ENTRANDO...</span>
                </>
              ) : (
                <span>SIGN IN</span>
              )}
            </button>
          </form>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onSuccess={() => {
          setIsChangePasswordModalOpen(false)
          logout() // Força logout após trocar senha conforme regra do backend
        }}
      />
    </div>
  )
}
