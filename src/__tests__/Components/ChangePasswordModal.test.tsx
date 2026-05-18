import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChangePasswordModal } from '../../Components/ChangePasswordModal'
import { AlertProvider } from '../../contexts/AlertContext'


describe('ChangePasswordModal Component', () => {
  it('nao deve renderizar nada se isOpen for false', () => {
    const { container } = render(
      <AlertProvider>
        <ChangePasswordModal isOpen={false} onSuccess={() => {}} />
      </AlertProvider>
    )
    expect(container.firstChild).toBeNull()
  })

  it('deve exibir os inputs de senha se isOpen for true', () => {
    render(
      <AlertProvider>
        <ChangePasswordModal isOpen={true} onSuccess={() => {}} />
      </AlertProvider>
    )

    expect(screen.getByText('Nova Senha')).toBeInTheDocument()
    expect(screen.getByText('Confirmar Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SALVAR NOVA SENHA/i })).toBeInTheDocument()
  })
})
