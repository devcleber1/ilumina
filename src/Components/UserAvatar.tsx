import React, { useState } from 'react'
import { api } from '../lib/api'

interface UserAvatarProps {
  src?: string
  name?: string
  className?: string
}

const cleanBaseUrl = (url: string): string => {
  return url.replace(/\/api\/?$/, '')
}

export const getImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url
  const baseUrl = api.defaults.baseURL || 'http://localhost:3001'
  const base = cleanBaseUrl(baseUrl)
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

export const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(' ')
  if (parts.length === 0 || !parts[0]) return 'U'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return (first + last).toUpperCase()
}

export const getBackgroundColor = (fullName: string): string => {
  const colors = [
    'bg-blue-500 text-white',
    'bg-purple-500 text-white',
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-pink-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white',
    'bg-teal-500 text-white',
  ]
  let hash = 0
  for (let i = 0; i < fullName.length; i++) {
    hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export const UserAvatar = ({ src, name = 'Usuário', className = 'h-10 w-10' }: UserAvatarProps) => {
  const [hasError, setHasError] = useState(false)
  const cleanSrc = getImageUrl(src)

  if (!cleanSrc || hasError) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center font-bold text-xs shadow-sm select-none shrink-0 ${getBackgroundColor(name)} ${className}`}
        data-testid="avatar-fallback"
      >
        {getInitials(name)}
      </div>
    )
  }

  return (
    <img
      src={cleanSrc}
      alt={name}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover shadow-sm shrink-0 ${className}`}
      data-testid="avatar-image"
    />
  )
}
