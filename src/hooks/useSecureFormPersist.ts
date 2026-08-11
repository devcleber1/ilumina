import { useEffect, useRef, useCallback } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { saveFormDraft, getFormDraft, clearFormDraft } from '../lib/secureFormStorage'

const DEBOUNCE_MS = 800

/**
 * Hook reutilizável que persiste rascunhos de formulários react-hook-form
 * no IndexedDB criptografado (AES). Restaura automaticamente no F5.
 *
 * @param formId - Identificador único do formulário (ex: 'register_student')
 * @param form - Instância do useForm do react-hook-form
 * @param excludeFields - Campos sensíveis a excluir da persistência (ex: ['senha'])
 */
export function useSecureFormPersist<T extends Record<string, any>>(
  formId: string,
  form: UseFormReturn<T>,
  excludeFields: string[] = []
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredRef = useRef(false)

  const filterFields = useCallback(
    (data: Record<string, any>) => {
      if (!excludeFields.length) return data
      const filtered = { ...data }
      for (const field of excludeFields) {
        delete filtered[field]
      }
      return filtered
    },
    [excludeFields]
  )

  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const draft = await getFormDraft<Partial<T>>(formId)
        if (draft && Object.keys(draft).length > 0) {
          form.reset({ ...form.getValues(), ...draft } as T)
        }
      } catch {
        /* silencioso */
      } finally {
        restoredRef.current = true
      }
    }
    restoreDraft()
  }, [formId, form])

  useEffect(() => {
    if (!restoredRef.current) return

    const subscription = form.watch(values => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const filtered = filterFields(values as Record<string, any>)
        saveFormDraft(formId, filtered)
      }, DEBOUNCE_MS)
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [formId, form, filterFields])

  const clearDraft = useCallback(() => {
    clearFormDraft(formId)
  }, [formId])

  return { clearDraft }
}
