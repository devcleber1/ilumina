import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FormInput } from '../../../Components/ui/FormInput'

describe('FormInput Component', () => {
  it('renderiza o label e o input corretamente', () => {
    render(<FormInput label="Email" placeholder="Digite seu email" />)

    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite seu email')).toBeInTheDocument()
  })

  it('renderiza o erro de validação (yup) corretamente', () => {
    render(<FormInput label="Email" error="Email é obrigatório" />)

    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument()
  })

  it('alterna a visibilidade da senha no FormInput isPassword', () => {
    render(<FormInput label="Senha" isPassword placeholder="senha_placeholder" />)

    const input = screen.getByPlaceholderText('senha_placeholder')
    expect(input).toHaveAttribute('type', 'password')

    // Clica no botão de mostrar senha
    const toggleBtn = screen.getByRole('button')
    fireEvent.click(toggleBtn)

    expect(input).toHaveAttribute('type', 'text')

    // Clica para esconder
    fireEvent.click(toggleBtn)
    expect(input).toHaveAttribute('type', 'password')
  })
})
