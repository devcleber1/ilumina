import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useIsMobile } from '../../hooks/use-mobile'

describe('useIsMobile hook', () => {
  it('deve retornar isMobile true se window.innerWidth < 768', () => {
    window.innerWidth = 500

    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('deve retornar isMobile false se window.innerWidth >= 768', () => {
    window.innerWidth = 1024

    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
