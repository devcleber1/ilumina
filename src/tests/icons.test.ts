import { describe, it, expect } from 'vitest'
import fs from 'fs'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

describe('PWA Icons', () => {
  sizes.forEach(size => {
    it(`ícone ${size}x${size} existe`, () => {
      expect(fs.existsSync(`./public/icons/icon-${size}x${size}.png`)).toBe(true)
    })
  })

  it('apple-touch-icon existe', () => {
    expect(fs.existsSync('./public/apple-touch-icon.png')).toBe(true)
  })

  it('favicon.ico existe', () => {
    expect(fs.existsSync('./public/favicon.ico')).toBe(true)
  })
})
