import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'

let content = ''

beforeAll(() => {
  content = fs.readFileSync('./index.html', 'utf-8')
})

describe('index.html PWA tags', () => {
  it('tem link para manifest.json', () => {
    expect(content).toContain('rel="manifest"')
  })

  it('tem meta theme-color #FFD700', () => {
    expect(content).toContain('#FFD700')
  })

  it('tem meta apple-mobile-web-app-capable', () => {
    expect(content).toContain('apple-mobile-web-app-capable')
  })

  it('tem apple-touch-icon', () => {
    expect(content).toContain('apple-touch-icon')
  })


  it('tem worker-src no CSP', () => {
    expect(content).toContain("worker-src 'self'")
  })
})
