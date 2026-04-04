import DOMPurify from 'isomorphic-dompurify'

export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim()
}
