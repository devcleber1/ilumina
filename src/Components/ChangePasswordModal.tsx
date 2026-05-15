import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { ShieldCheck, Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAlert } from '../contexts/AlertContext'

const PASSWORD_COMPLEXITY_MESSAGE = {
  min: 'Mínimo 12 caracteres',
  lower: 'Uma letra minúscula',
  upper: 'Uma letra maiúscula',
  number: 'Um número',
  special: 'Um caractere especial (@$!%*?&#)',
}

const schema = yup.object({
  novaSenha: yup
    .string()
    .required('A nova senha é obrigatória')
    .min(12, PASSWORD_COMPLEXITY_MESSAGE.min)
    .matches(/[a-z]/, PASSWORD_COMPLEXITY_MESSAGE.lower)
    .matches(/[A-Z]/, PASSWORD_COMPLEXITY_MESSAGE.upper)
    .matches(/[0-9]/, PASSWORD_COMPLEXITY_MESSAGE.number)
    .matches(/[@$!%*?&#]/, PASSWORD_COMPLEXITY_MESSAGE.special),
  confirmarSenha: yup
    .string()
    .required('A confirmação da senha é obrigatória')
    .oneOf([yup.ref('novaSenha')], 'As senhas não coincidem'),
})

type FormData = yup.InferType<typeof schema>

interface ChangePasswordModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export function ChangePasswordModal({ isOpen, onSuccess }: ChangePasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showAlert } = useAlert()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const novaSenhaValue = watch('novaSenha', '')

  const passwordRules = [
    { label: PASSWORD_COMPLEXITY_MESSAGE.min, met: novaSenhaValue.length >= 12 },
    { label: PASSWORD_COMPLEXITY_MESSAGE.lower, met: /[a-z]/.test(novaSenhaValue) },
    { label: PASSWORD_COMPLEXITY_MESSAGE.upper, met: /[A-Z]/.test(novaSenhaValue) },
    { label: PASSWORD_COMPLEXITY_MESSAGE.number, met: /[0-9]/.test(novaSenhaValue) },
    { label: PASSWORD_COMPLEXITY_MESSAGE.special, met: /[@$!%*?&#]/.test(novaSenhaValue) },
  ]

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      // O endpoint no backend é /auth/trocar-senha
      await api.post('/auth/trocar-senha', {
        novaSenha: data.novaSenha,
      })

      showAlert('success', 'Senha alterada!', 'Sua senha foi atualizada com sucesso. Por favor, faça login novamente.')
      onSuccess()
    } catch (error: any) {
      console.error('Erro ao trocar senha:', error)
      const message = error.response?.data?.message || 'Não foi possível alterar sua senha.'
      showAlert('destructive', 'Erro', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-8 py-10 text-center relative overflow-hidden">
           {/* Decorative elements */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-full -ml-12 -mb-12 blur-xl" />
           
           <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-yellow-600 mb-6 shadow-xl shadow-yellow-600/20 transform rotate-3">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h2 className="font-title text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Segurança da Conta</h2>
              <p className="font-body text-gray-800 text-sm font-bold opacity-80 uppercase tracking-widest">Defina sua nova senha</p>
           </div>
        </div>

        <div className="p-8 md:p-10 space-y-8 bg-gray-50/50">
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-3 items-start">
             <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
             <p className="text-xs text-yellow-800 font-medium leading-relaxed">
               Este é seu primeiro acesso ou sua senha precisa ser atualizada. Por favor, escolha uma senha forte para continuar.
             </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Nova Senha */}
              <div className="space-y-1.5">
                <label className="font-body block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nova Senha</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors">
                     <Lock className="h-4 w-4" />
                  </div>
                  <input
                    {...register('novaSenha')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className={`font-body block w-full rounded-2xl border bg-white pl-11 pr-12 py-4 text-sm text-gray-800 outline-none transition-all ${
                      errors.novaSenha ? 'border-red-500 ring-4 ring-red-50' : 'border-gray-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.novaSenha && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 flex items-center gap-1 uppercase tracking-tighter"><AlertCircle className="h-3 w-3" /> {errors.novaSenha.message}</p>}
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-1.5">
                <label className="font-body block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Confirmar Senha</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors">
                     <Lock className="h-4 w-4" />
                  </div>
                  <input
                    {...register('confirmarSenha')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className={`font-body block w-full rounded-2xl border bg-white pl-11 pr-4 py-4 text-sm text-gray-800 outline-none transition-all ${
                      errors.confirmarSenha ? 'border-red-500 ring-4 ring-red-50' : 'border-gray-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100'
                    }`}
                  />
                </div>
                {errors.confirmarSenha && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 flex items-center gap-1 uppercase tracking-tighter"><AlertCircle className="h-3 w-3" /> {errors.confirmarSenha.message}</p>}
              </div>
            </div>

            {/* Password Strength Rules */}
            <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Requisitos de Segurança</p>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                 {passwordRules.map((rule, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                     {rule.met ? (
                       <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                     ) : (
                       <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-100 shrink-0" />
                     )}
                     <span className={`text-[10px] font-bold ${rule.met ? 'text-gray-900' : 'text-gray-400'} transition-colors`}>{rule.label}</span>
                   </div>
                 ))}
               </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-[20px] shadow-xl transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-yellow-400 translate-y-[100%] group-hover/btn:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 uppercase tracking-[0.2em] text-xs group-hover/btn:text-gray-900">
                {isSubmitting ? 'Atualizando...' : 'SALVAR NOVA SENHA'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
