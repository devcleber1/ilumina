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
  email: yup.string().email('Email inválido').max(100, 'Tamanho máximo excedido').required('Email é obrigatório'),
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
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      const success = await login(data.email, data.password)
      if (!success) {
        setError('root', { type: 'server', message: 'E-mail ou senha incorretos' })
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      setError('root', { type: 'server', message: 'Erro ao conectar ao servidor' })
    }
  }

  // Monitorar mudança no user após login para abrir o modal se necessário
  useEffect(() => {
    if (user) {
      if (user.precisa_trocar_senha) {
        setIsChangePasswordModalOpen(true)
      } else {
        // Se não precisa trocar e está autenticado, vai para a tela correspondente
        if (user.tipo === 'pai') {
          navigate('/portal')
        } else if (user.tipo === 'professor') {
          navigate('/portal-professor')
        } else {
          navigate('/dashboard')
        }
      }
    }
  }, [user, navigate])

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-8"
      style={{
        background: 'linear-gradient(135deg, #FFEA01 0%, #FBC329 50%, #FBC02D 100%)',
      }}
    >
      <div className="flex flex-col md:flex-row w-full max-w-[860px] min-h-[500px] rounded-[28px] overflow-hidden shadow-2xl">
        {/* Lado esquerdo — imagem (oculta no mobile) */}
        <div className="hidden md:block md:w-[380px] flex-shrink-0">
          <img
            src={kids}
            alt="Crianças da ONG Iluminando o Futuro"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Lado direito — formulário */}
        <div className="flex flex-1 flex-col justify-center px-6 py-10 md:px-10 md:py-12 bg-gray-50">
          <div className="flex flex-col items-center mb-6">
            <img
              src={logo}
              alt="Logo ONG Iluminando o Futuro"
              className="h-16 w-16 rounded-full object-cover shadow-md mb-4"
              style={{ border: '3px solid #FBC329' }}
            />
            <h2 className="font-title text-center text-[17px] font-extrabold text-gray-900">
              Bem-vindo(a) à Plataforma da ONG Iluminando o Futuro
            </h2>
            <p className="font-body mt-1 text-center text-[13px] text-gray-400">
              Faça login para acessar os recursos do sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
              className="font-body flex w-full justify-center rounded-xl px-4 py-3 text-sm tracking-widest text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-90 active:translate-y-0 cursor-pointer"
              style={{ background: '#FFD700' }}
            >
              SIGN IN
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
