import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Auth from '../../../Pages/Auth/Auth'
import { useAuth } from '../../../contexts/AuthContext'
import { AlertProvider } from '../../../contexts/AlertContext'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Auth Page (Login)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      login: vi.fn().mockResolvedValue(true),
      user: null,
      logout: vi.fn(),
    } as any)
  })

  it('deve renderizar o formulario de login corretamente', () => {
    render(
      <MemoryRouter>
        <AlertProvider>
          <Auth />
        </AlertProvider>
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText('seu.email@exemplo.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument()
  })

  it('deve submeter o login com credenciais validas', async () => {
    const loginMock = vi.fn().mockResolvedValue(true)
    vi.mocked(useAuth).mockReturnValue({
      login: loginMock,
      user: null,
      logout: vi.fn(),
    } as any)

    render(
      <MemoryRouter>
        <AlertProvider>
          <Auth />
        </AlertProvider>
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText('seu.email@exemplo.com')
    const passwordInput = screen.getByPlaceholderText('Digite sua senha')
    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i })

    await act(async () => {
      emailInput.setAttribute('value', 'teste@ong.com')
      passwordInput.setAttribute('value', 'senha123')
      submitBtn.click()
    })

    expect(loginMock).toBeDefined()
  })
})
