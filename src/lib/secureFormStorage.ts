import CryptoJS from 'crypto-js'

const DB_NAME = 'IluminaSecureDB'
const STORE_NAME = 'form_drafts'
const DB_VERSION = 1
const SECRET_SALT = 'ILUMINA_SECURE_DRAFT_KEY_2026'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'formId' })
      }
    }
  })
}

/**
 * Criptografa e salva o estado parcial de um formulário no IndexedDB.
 */
export async function saveFormDraft(formId: string, data: any): Promise<void> {
  try {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) return
    const db = await openDB()
    const jsonStr = JSON.stringify(data)
    const encryptedData = CryptoJS.AES.encrypt(jsonStr, SECRET_SALT).toString()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ formId, payload: encryptedData, updatedAt: Date.now() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao salvar rascunho de formulário criptografado:', error)
  }
}

/**
 * Descriptografa e recupera o rascunho de um formulário do IndexedDB.
 */
export async function getFormDraft<T = any>(formId: string): Promise<T | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(formId)

      request.onsuccess = () => {
        const result = request.result
        if (!result || !result.payload) {
          resolve(null)
          return
        }

        try {
          const bytes = CryptoJS.AES.decrypt(result.payload, SECRET_SALT)
          const decryptedJson = bytes.toString(CryptoJS.enc.Utf8)
          if (!decryptedJson) {
            resolve(null)
            return
          }
          resolve(JSON.parse(decryptedJson))
        } catch {
          resolve(null)
        }
      }

      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao recuperar rascunho de formulário criptografado:', error)
    return null
  }
}

/**
 * Remove permanentemente o rascunho do formulário do IndexedDB.
 */
export async function clearFormDraft(formId: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(formId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.warn('Erro ao limpar rascunho de formulário:', error)
  }
}
