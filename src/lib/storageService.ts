import CryptoJS from 'crypto-js'

/**
 * Deriva uma chave única baseada em propriedades do dispositivo/navegador.
 * IMPORTANTE: Essa chave nunca é armazenada no localStorage/sessionStorage.
 * Em um cenário 100% seguro contra leitura local avançada, o frontend não armazena
 * dados sensíveis e conta apenas com cookies HttpOnly. Aqui, o frontend usa como UX.
 */
const getEncryptionKey = (): string => {
  // Usamos propriedades de ambiente estáveis para evitar incompatibilidade
  // de chaves e falso-positivos de decodificação no PWA do iOS (onde o userAgent do standalone difere do Safari).
  const fingerprint = `${navigator.language}-${screen.colorDepth}-${window.location.origin}`
  // Mistura com uma variável de ambiente (se existir) para maior entropia
  const salt = import.meta.env.VITE_STORAGE_SALT || 'ilumina-frontend-secure-salt-2026'
  return CryptoJS.SHA256(fingerprint + salt).toString()
}

const SECRET_KEY = getEncryptionKey()

export const storageService = {
  /**
   * Criptografa e armazena um valor.
   * O frontend serve apenas como UX — o backend é a fonte da verdade para controle de acesso.
   */
  setItem(key: string, value: string | object, isSession = false): void {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      const encryptedValue = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString()
      const storage = isSession ? sessionStorage : localStorage
      storage.setItem(key, encryptedValue)
    } catch (error) {
      console.error('Falha ao salvar no storage seguro', error)
    }
  },

  /**
   * Recupera e descriptografa um valor armazenado.
   * Valida se a descriptografia falhou (ex: adulteração de chave ou dado corrompido).
   */
  getItem<T = string>(key: string, isSession = false): T | null {
    try {
      const storage = isSession ? sessionStorage : localStorage
      const encryptedValue = storage.getItem(key)

      if (!encryptedValue) return null

      const bytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY)
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8)

      // Se não for possível decodificar, o dado está corrompido/adulterado
      if (!decryptedString) {
        throw new Error('Dado corrompido ou chave inválida')
      }

      // Tenta fazer o parse para JSON (caso seja um objeto, como os dados do usuário e roles)
      try {
        return JSON.parse(decryptedString) as T
      } catch {
        return decryptedString as unknown as T
      }
    } catch (error) {
      // Sanitização de dados: Em caso de falha de decriptação, limpa os storages e força o logout
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
      return null
    }
  },

  removeItem(key: string, isSession = false): void {
    const storage = isSession ? sessionStorage : localStorage
    storage.removeItem(key)
  },

  clear(isSession = false): void {
    const storage = isSession ? sessionStorage : localStorage
    storage.clear()
  },

  /**
   * Limpa a sessão global do usuário
   */
  clearAll(): void {
    localStorage.clear()
    sessionStorage.clear()
  },
}
