import { useState } from 'react'
import logo from '../../assets/logo.png'
import kids from '../../assets/kidsL.png'

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false)

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

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="font-body block text-xs font-bold text-gray-600 mb-1.5 tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                required
                className="font-body block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
              />
            </div>

            {/* Senha */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="font-body text-xs font-bold text-gray-600 tracking-wide"
                >
                  Senha
                </label>
                <a
                  href="#"
                  className="font-body text-xs font-semibold text-yellow-500 hover:text-yellow-600 transition"
                >
                  Esqueceu sua senha?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  required
                  className="font-body block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-11 text-sm text-gray-800 outline-none placeholder:text-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="button"
              className="font-body flex w-full justify-center rounded-xl px-4 py-3 text-sm tracking-widest text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg hover:brightness-90 active:translate-y-0 cursor-pointer"
              style={{ background: '#FFD700' }}
            >
              SIGN IN
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
