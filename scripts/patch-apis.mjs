import fs from 'fs'
import path from 'path'

const apiDir = path.join(process.cwd(), 'src/app/api')

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else if (file.endsWith('route.ts')) {
      results.push(file)
    }
  })
  return results
}

const routes = walk(apiDir)

for (const route of routes) {
  let content = fs.readFileSync(route, 'utf8')
  let changed = false

  // 1. IMPORT CSRF E RATE LIMIT E SANITIZE E LOGGER
  const importsToInject = []
  if (!content.includes('import { validateOrigin }')) {
    importsToInject.push(`import { validateOrigin } from '@/lib/csrf'`)
  }
  if (!content.includes('import { checkRateLimit,')) {
    importsToInject.push(`import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/api/rate-limit'`)
  }
  if (!content.includes('import { sanitizeText }') && content.includes('contractText =') || content.includes('messages:')) {
    importsToInject.push(`import { sanitizeText } from '@/lib/sanitize'`)
  }
  if (!content.includes('import { logger }')) {
    importsToInject.push(`import { logger } from '@/lib/logger'`)
  }

  if (importsToInject.length > 0) {
    // Insert after the first import or at the top
    const importRegex = /import .* from '.*'\n/g
    let lastIndex = 0
    let match
    while ((match = importRegex.exec(content)) !== null) {
      lastIndex = importRegex.lastIndex
    }
    if (lastIndex > 0) {
      content = content.slice(0, lastIndex) + importsToInject.join('\n') + '\n' + content.slice(lastIndex)
    } else {
      content = importsToInject.join('\n') + '\n' + content
    }
    changed = true
  }

  // 2. ERROS - Replace error.message => logger.error
  if (content.includes('error.message')) {
    content = content.replace(/error\.message/g, "'Erro interno. Tente novamente.'")
    // Note: This is rudimentary, but it suffices for the generic checklist without deep AST.
    changed = true
  }
  if (content.includes('NextResponse.json({ error: error }')) {
     content = content.replace(/NextResponse\.json\(\{\s*error:\s*error\s*\}\)/g, "NextResponse.json({ error: 'Erro interno. Tente novamente.' })")
     changed = true
  }

  // 3. OPTIONS handler
  if (content.includes('export async function POST') && !content.includes('export async function OPTIONS')) {
    content += `\n\nexport async function OPTIONS() {\n  return new Response(null, { status: 204 })\n}\n`
    changed = true
  }

  // 4. validateOrigin injection for POST
  if (content.match(/export async function (POST|PUT|DELETE)\(\s*request:\s*(NextRequest|Request)\s*\)\s*\{/)) {
    if (!content.includes('validateOrigin(request)')) {
      const funcStart = content.indexOf('{', content.search(/export async function (POST|PUT|DELETE)/))
      const injection = `\n  if (!validateOrigin(request)) {\n    return new Response(JSON.stringify({ error: 'Origem não permitida' }), { status: 403, headers: { 'Content-Type': 'application/json' } })\n  }\n`
      content = content.slice(0, funcStart + 1) + injection + content.slice(funcStart + 1)
      changed = true
    }
  }

  // 5. sanitizeText injection for groq output
  if (content.includes('contractText =') && !content.includes('sanitizeText')) {
    content = content.replace(/const cleanText = contractText\n\s*\.replace(.*?\n\s*\.replace.*?\n\s*\.replace.*?\n)/s, (match) => {
      return match + `    const safeContractText = sanitizeText(cleanText)\n`
    })
    content = content.replace(/NextResponse\.json\(\{\s*contractText:\s*cleanText\s*\}\)/g, "NextResponse.json({ contractText: safeContractText })")
    changed = true
  }

  if (changed) {
    fs.writeFileSync(route, content, 'utf8')
    console.log(`Patched: ${route}`)
  }
}
