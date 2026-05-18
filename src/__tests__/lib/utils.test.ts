import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/utils'

describe('cn utility', () => {
  it('deve combinar classes CSS corretamente (happy path)', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('deve resolver conflitos de classes Tailwind com twMerge', () => {
    expect(cn('px-2 py-1', 'p-4')).toBe('p-4')
  })

  it('deve ignorar valores booleanos, nulos e undefined', () => {
    expect(cn('btn', null, undefined, false && 'active', true && 'enabled')).toBe('btn enabled')
  })

  it('deve lidar corretamente com arrays e strings vazias', () => {
    expect(cn('', [], 'flex')).toBe('flex')
  })
})
