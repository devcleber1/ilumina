import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { UserAvatar, getInitials, getImageUrl } from '../../Components/UserAvatar'

// Mock da API Axios para baseURL
vi.mock('../../lib/api', () => ({
  api: {
    defaults: {
      baseURL: 'http://localhost:3001/api',
    },
  },
}))

describe('UserAvatar Component', () => {
  it('should render correct initials when name is provided', () => {
    expect(getInitials('Ana Maria Costa')).toBe('AC')
    expect(getInitials('  lucas   ')).toBe('L')
    expect(getInitials('')).toBe('U')
  })

  it('should format URL correctly using getImageUrl', () => {
    expect(getImageUrl('https://cloudinary.com/pic.jpg')).toBe('https://cloudinary.com/pic.jpg')
    expect(getImageUrl('/uploads/foto.jpg')).toBe('http://localhost:3001/uploads/foto.jpg')
  })

  it('should render fallback with initials if src is not provided', () => {
    render(<UserAvatar name="João Silva" />)
    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('JS')
  })

  it('should render image if valid src is provided', () => {
    render(<UserAvatar src="https://cloudinary.com/pic.jpg" name="João Silva" />)
    const image = screen.getByTestId('avatar-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://cloudinary.com/pic.jpg')
  })

  it('should switch to fallback if image loading fails (onError)', () => {
    render(<UserAvatar src="invalid-url.jpg" name="Maria Souza" />)
    const image = screen.getByTestId('avatar-image')
    expect(image).toBeInTheDocument()

    // Dispara o evento de erro na imagem
    fireEvent.error(image)

    // Agora o fallback deve ser exibido
    const fallback = screen.getByTestId('avatar-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('MS')
  })
})
