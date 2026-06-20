import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '../../lib/storageService'

describe('storageService', () => {
  beforeEach(() => {
    storageService.clearAll()
  })

  it('deve encriptar o valor ao salvar no localStorage e descriptografar corretamente', () => {
    storageService.setItem('test_key', 'test_value')
    const rawStorage = localStorage.getItem('test_key')

    expect(rawStorage).not.toBe('test_value')
    expect(rawStorage).toContain('U2FsdGVkX1') // Prefixo comum do CryptoJS AES

    const retrieved = storageService.getItem<string>('test_key')
    expect(retrieved).toBe('test_value')
  })

  it('deve remover o item corretamente do storage', () => {
    storageService.setItem('remove_key', 'val')
    expect(storageService.getItem('remove_key')).toBe('val')

    storageService.removeItem('remove_key')
    expect(storageService.getItem('remove_key')).toBeNull()
  })

  it('deve limpar tudo em caso de tampering / dado corrompido', () => {
    localStorage.setItem('corrupted_key', 'not-a-valid-encrypted-string')
    const value = storageService.getItem('corrupted_key')

    expect(value).toBeNull()
    expect(localStorage.length).toBe(0)
  })
})
