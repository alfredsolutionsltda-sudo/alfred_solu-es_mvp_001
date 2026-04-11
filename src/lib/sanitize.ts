import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(input: string): string {
  if (!input) return ''
  // Remove HTML completamente — contratos são texto puro
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim()
}

export function sanitizeHtml(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em'],
    ALLOWED_ATTR: [],
  })
}
