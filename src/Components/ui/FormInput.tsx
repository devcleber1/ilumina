import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  isPassword?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, isPassword, className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const type = isPassword ? (showPassword ? 'text' : 'password') : props.type || 'text'

    return (
      <div className="space-y-1.5 w-full">
        <label className="font-body block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
          {label}
        </label>
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-yellow-500 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`font-body block w-full rounded-2xl border bg-white ${
              icon ? 'pl-11' : 'pl-4'
            } ${isPassword ? 'pr-12' : 'pr-4'} py-3.5 text-sm text-gray-800 outline-none transition-all ${
              error
                ? 'border-red-500 ring-4 ring-red-50'
                : 'border-gray-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100'
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 flex items-center gap-1 uppercase tracking-tighter">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>
    )
  }
)
FormInput.displayName = 'FormInput'
