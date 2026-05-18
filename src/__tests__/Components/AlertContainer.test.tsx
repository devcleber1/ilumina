import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AlertContainer } from '../../Components/AlertContainer'
import { useAlert } from '../../contexts/AlertContext'


vi.mock('../../contexts/AlertContext', () => ({
  useAlert: vi.fn(),
}))

describe('AlertContainer Component', () => {
  it('nao deve renderizar nada se nao houver alertas', () => {
    vi.mocked(useAlert).mockReturnValue({
      alerts: [],
      removeAlert: vi.fn(),
      showAlert: vi.fn(),
    })

    const { container } = render(<AlertContainer />)
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar a pilha de alertas ativos do AlertContext', () => {
    vi.mocked(useAlert).mockReturnValue({
      alerts: [
        { id: '1', type: 'success', title: 'Sucesso', description: 'Tudo OK' },
        { id: '2', type: 'destructive', title: 'Erro grave', description: 'Falhou algo' },
      ],
      removeAlert: vi.fn(),
      showAlert: vi.fn(),
    })

    render(<AlertContainer />)

    expect(screen.getByText('Sucesso')).toBeInTheDocument()
    expect(screen.getByText('Tudo OK')).toBeInTheDocument()
    expect(screen.getByText('Erro grave')).toBeInTheDocument()
    expect(screen.getByText('Falhou algo')).toBeInTheDocument()
  })
})
