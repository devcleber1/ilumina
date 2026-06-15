import { io, Socket } from 'socket.io-client'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
)

const DEFAULT_API_URL = isLocalhost 
  ? 'http://localhost:3001' 
  : 'https://back-end-ilumina-production.up.railway.app'

const SOCKET_URL = import.meta.env.VITE_API_URL === '/api' 
  ? '/' 
  : (import.meta.env.VITE_API_URL || DEFAULT_API_URL)

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })
  }
  return socket
}
