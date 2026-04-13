import { requireAuth } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { importClientsFromCSV } from '@/lib/data/clients'
import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting (Estrito: 3 por hora para importação)
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'client-import')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { userId, error } = await requireAuth()
  if (error) return error

  // 4. Lógica de importação
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const text = await file.text()
    const result = Papa.parse(text, { header: true, skipEmptyLines: true })
    
    if (result.errors.length > 0) {
      return NextResponse.json({ error: 'Erro ao parsear CSV' }, { status: 400 })
    }

    const rows = result.data as any[]
    const importResult = await importClientsFromCSV(userId!, rows)

    // 5. Auditoria
    await logAudit({
      userId: userId!,
      action: 'clients_imported',
      resource: 'clients',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { count: rows.length }
    })

    return NextResponse.json(importResult)

  } catch (err) {
    return NextResponse.json({ error: 'Erro interno na importação' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
