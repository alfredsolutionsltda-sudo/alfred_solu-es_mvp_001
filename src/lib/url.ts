export function buildUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '')
    .trim()           // remove espaços
    .replace(/\/$/, '') // remove barra final
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${base}${cleanPath}`
}
