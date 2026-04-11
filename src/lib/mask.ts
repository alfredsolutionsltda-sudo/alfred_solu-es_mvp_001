export function maskCPF(cpf: string): string {
  // Exibe: ***.***.XXX-XX
  if (!cpf || cpf.length < 11) return '***'
  const clean = cpf.replace(/\D/g, '')
  if (clean.length < 11) return '***'
  return `***.***.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
}

export function maskCNPJ(cnpj: string): string {
  if (!cnpj || cnpj.length < 14) return '***'
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length < 14) return '***'
  return `**.***.${clean.slice(5, 8)}/${clean.slice(8, 12)}-**`
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [user, domain] = email.split('@')
  if (!user || !domain) return '***'
  const visible = user.slice(0, 2)
  return `${visible}***@${domain}`
}

export function maskIP(ip: string): string {
  if (!ip) return '***'
  const parts = ip.split('.')
  if (parts.length !== 4) return '***'
  return `${parts[0]}.${parts[1]}.***.***`
}
