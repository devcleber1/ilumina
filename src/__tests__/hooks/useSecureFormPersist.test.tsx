import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { useSecureFormPersist } from '../../hooks/useSecureFormPersist'
import * as secureStorage from '../../lib/secureFormStorage'

vi.mock('../../lib/secureFormStorage', () => ({
  saveFormDraft: vi.fn().mockResolvedValue(undefined),
  getFormDraft: vi.fn().mockResolvedValue({ nome: 'Teste Rascunho' }),
  clearFormDraft: vi.fn().mockResolvedValue(undefined),
}))

describe('useSecureFormPersist Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve restaurar os dados do rascunho criptografado ao inicializar o formulário', async () => {
    const { result } = renderHook(() => {
      const form = useForm({ defaultValues: { nome: '', email: '' } })
      useSecureFormPersist('test_form', form)
      return form
    })

    await waitFor(() => {
      expect(secureStorage.getFormDraft).toHaveBeenCalledWith('test_form')
      expect(result.current.getValues('nome')).toBe('Teste Rascunho')
    })
  })

  it('deve invocar a limpeza do rascunho quando clearDraft for chamado', async () => {
    const { result } = renderHook(() => {
      const form = useForm({ defaultValues: { nome: '' } })
      const { clearDraft } = useSecureFormPersist('test_form', form)
      return { clearDraft }
    })

    result.current.clearDraft()
    expect(secureStorage.clearFormDraft).toHaveBeenCalledWith('test_form')
  })
})
