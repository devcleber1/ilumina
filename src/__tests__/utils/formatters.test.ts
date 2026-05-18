import { describe, it, expect } from 'vitest'
import { formatCPF, formatCNH, formatPhone } from '../../utils/formatters'

describe('Formatters Utils', () => {
  it('deve formatar CPF corretamente', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00')
    expect(formatCPF('123')).toBe('123')
    expect(formatCPF('123456')).toBe('123.456')
    expect(formatCPF('123456789')).toBe('123.456.789')
  })

  it('deve formatar CNH limitando a 11 digitos', () => {
    expect(formatCNH('12345678901234')).toBe('12345678901')
  })

  it('deve formatar telefone celular e fixo corretamente', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
})
