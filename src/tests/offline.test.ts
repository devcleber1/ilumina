import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Offline Page', () => {
  it('offline.html existe', () => {
    expect(fs.existsSync('./public/offline.html')).toBe(true)
  })

  it('offline.html contém nome do sistema', () => {
    const content = fs.readFileSync('./public/offline.html', 'utf-8')
    expect(content).toContain('Ilumina')
  })

  it('offline.html usa cor primária #FFD700', () => {
    const content = fs.readFileSync('./public/offline.html', 'utf-8')
    expect(content).toContain('#FFD700')
  })

  it('offline.html usa fonte Poppins', () => {
    const content = fs.readFileSync('./public/offline.html', 'utf-8')
    expect(content).toContain('Poppins')
  })

  it('offline.html tem botão de retry', () => {
    const content = fs.readFileSync('./public/offline.html', 'utf-8')
    expect(content).toContain('reload')
  })

  it('offline.html não tem dependências externas de script', () => {
    const content = fs.readFileSync('./public/offline.html', 'utf-8')
    expect(content).not.toContain('<script')
  })
})
