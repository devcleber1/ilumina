import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SessionTimeoutModal } from '../../Components/SessionTimeoutModal'
import React from 'react'

describe('SessionTimeoutModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('deve exibir o modal com o tempo regressivo correto', () => {
    render(
      <SessionTimeoutModal
        isOpen={true}
        onRenew={async () => {}}
        onLogout={() => {}}
        expiresInSeconds={10}
      />
    )

    expect(screen.getByText('Sua sessão vai expirar!')).toBeInTheDocument()
    expect(screen.getByText('00:10')).toBeInTheDocument()
  })

  it('deve decrementar o tempo a cada segundo e acionar onLogout quando o tempo expira', () => {
    const logoutMock = vi.fn()
    render(
      <SessionTimeoutModal
        isOpen={true}
        onRenew={async () => {}}
        onLogout={logoutMock}
        expiresInSeconds={3}
      />
    )

    expect(screen.getByText('00:03')).toBeInTheDocument()

    // Avança 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('00:01')).toBeInTheDocument()
    expect(logoutMock).not.toHaveBeenCalled()

    // Avança o último segundo
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(logoutMock).toHaveBeenCalled()
  })

  it('deve chamar onRenew ao clicar em permanecer logado', async () => {
    const renewMock = vi.fn().mockResolvedValue(undefined)
    render(
      <SessionTimeoutModal
        isOpen={true}
        onRenew={renewMock}
        onLogout={() => {}}
        expiresInSeconds={30}
      />
    )

    const renewBtn = screen.getByText('Permanecer Logado')
    await act(async () => {
      renewBtn.click()
    })

    expect(renewMock).toHaveBeenCalled()
  })
})
