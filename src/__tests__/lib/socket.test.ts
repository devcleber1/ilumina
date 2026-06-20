import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSocket } from '../../lib/socket'
import { io } from 'socket.io-client'

vi.mock('socket.io-client', () => {
  const mSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  }
  return {
    io: vi.fn(() => mSocket),
  }
})

describe('socket client utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar uma conexao Socket com transports websocket e polling', () => {
    const socket = getSocket()
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
      })
    )
    expect(socket).toBeDefined()
  })
})
