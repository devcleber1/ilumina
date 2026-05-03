export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '') // remove não números
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1') // limita a 14 caracteres (incluindo pontos e traço)
}

export const formatCNH = (value: string) => {
  return value
    .replace(/\D/g, '') // remove não números
    .slice(0, 11) // limita a 11 dígitos
}

export const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, '') // remove não números
    .replace(/^(\d{2})(\d)/g, '($1) $2') // adiciona parênteses no DDD
    .replace(/(\d)(\d{4})$/, '$1-$2') // adiciona traço nos últimos 4 dígitos
    .slice(0, 15) // limita o tamanho para (99) 99999-9999
}
