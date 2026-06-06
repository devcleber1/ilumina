import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Service Worker', () => {
  it('arquivo sw.js existe em /public', async () => {
    expect(fs.existsSync('./public/sw.js')).toBe(true)
  })

  it('sw.js contém lógica de cache (Cache First nativo)', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toContain('caches.match')
    expect(content).toContain('caches.open')
  })

  it('sw.js contém estratégia Network Only para API', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toContain('API_PATH')
    expect(content).toContain('fetch(event.request)')
  })

  it('sw.js contém fallback offline', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toContain('offline.html')
  })

  it('sw.js tem versionamento de cache', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toMatch(/ilumina-cache-v\d+/)
  })
})
