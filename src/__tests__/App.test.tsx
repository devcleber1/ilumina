import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <div data-testid="auth-provider">{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    logout: vi.fn(),
  }),
}))

vi.mock('../contexts/AlertContext', () => ({
  AlertProvider: ({ children }: any) => <div data-testid="alert-provider">{children}</div>,
  useAlert: () => ({ showAlert: vi.fn() }),
}))

vi.mock('../Components/AlertContainer', () => ({
  AlertContainer: () => <div data-testid="alert-container">Alert Container</div>,
}))

vi.mock('../routes', () => {
  return {
    default: () => <div data-testid="app-routes">App Routes Content</div>,
  }
})

// Mock do window.matchMedia para evitar crash do shadcn/radix ui
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // depreciado
    removeListener: vi.fn(), // depreciado
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('App Component', () => {
  it('deve renderizar a arvore de provedores e rotas sem travar', async () => {
    await act(async () => {
      render(<App />)
    })

    expect(screen.getByTestId('alert-provider')).toBeInTheDocument()
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument()
    expect(screen.getByTestId('app-routes')).toBeInTheDocument()
    expect(screen.getByTestId('alert-container')).toBeInTheDocument()
  })
})
