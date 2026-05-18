import { describe, it, expect, beforeEach } from 'vitest'
import { api } from '../../lib/api'
import { storageService } from '../../lib/storageService'

describe('api client (Axios Hardening)', () => {
  beforeEach(() => {
    storageService.clearAll()
  })

  it('deve conter as configuracoes base de seguranca', () => {
    expect(api.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest')
    expect(api.defaults.headers.common['Content-Type']).toBe('application/json')
    expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || 'http://localhost:3001')
  })
})
