import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlertProvider, useAlert } from '../../contexts/AlertContext'
import React from 'react'

const TestComponent = () => {
  const { alerts, showAlert, removeAlert } = useAlert()
  return (
    <div>
      <button onClick={() => showAlert('success', 'Sucesso!', 'Operacao realizada', 100)}>
        Show Alert
      </button>
      <div data-testid="alerts-count">{alerts.length}</div>
      {alerts.map(a => (
        <div key={a.id} data-testid="alert-item">
          <span>{a.title}</span> - <span>{a.description}</span>
          <button onClick={() => removeAlert(a.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  )
}

describe('AlertContext', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('deve exibir um alerta corretamente e remove-lo apos o timeout', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    )

    const btn = screen.getByText('Show Alert')
    act(() => {
      btn.click()
    })

    expect(screen.getByTestId('alerts-count')).toHaveTextContent('1')
    expect(screen.getByText('Sucesso!')).toBeInTheDocument()

    // Avança o tempo
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(screen.getByTestId('alerts-count')).toHaveTextContent('0')
  })

  it('deve fechar o alerta imediatamente ao acionar o dismiss manual', () => {
    render(
      <AlertProvider>
        <TestComponent />
      </AlertProvider>
    )

    const btn = screen.getByText('Show Alert')
    act(() => {
      btn.click()
    })

    const dismissBtn = screen.getByText('Dismiss')
    act(() => {
      dismissBtn.click()
    })

    expect(screen.getByTestId('alerts-count')).toHaveTextContent('0')
  })
})
