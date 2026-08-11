const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]

/**
 * Verifica se um arquivo possui um formato de imagem válido.
 */
export function isValidImageType(file: File): boolean {
  if (!file || !file.type) return false
  return ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())
}

/**
 * Valida o arquivo de imagem e, se for de formato inválido, aciona o Toast de erro.
 * Retorna true se a imagem for válida e false caso contrário.
 */
export function validateImageFile(
  file: File,
  showAlert?: (type: 'destructive', title: string, description?: string) => void
): boolean {
  if (!isValidImageType(file)) {
    if (showAlert) {
      showAlert(
        'destructive',
        'Tipo de imagem não aceito',
        'Por favor, selecione apenas arquivos de imagem nos formatos JPG, PNG, WEBP ou GIF.'
      )
    }
    return false
  }
  return true
}
