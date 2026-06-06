import { describe, it, expect } from 'vitest'
import fs from 'fs'

describe('Service Worker', () => {
  it('arquivo sw.js existe em /public', async () => {
    expect(fs.existsSync('./public/sw.js')).toBe(true)
  })

  it('sw.js contém estratégia Cache First', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toContain('cache')
    expect(content).toContain('CacheFirst')
  })

  it('sw.js contém estratégia Network First para API', async () => {
    const content = fs.readFileSync('./public/sw.js', 'utf-8')
    expect(content).toContain('/api/')
    expect(content).toContain('NetworkFirst')
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
