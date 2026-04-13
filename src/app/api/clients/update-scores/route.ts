import { requireAuth } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'clients-update-scores')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { userId, error } = await requireAuth()
  if (error) return error

  // 4. Lógica protegida
  try {
    const supabase = await createClient()
    const { error: rpcError } = await supabase
      .rpc('fn_update_all_client_scores', { p_user_id: userId })
    
    if (rpcError) {
      return NextResponse.json({ error: 'Erro ao processar scores' }, { status: 500 })
    }

    // 5. Auditoria
    await logAudit({
      userId: userId!,
      action: 'clients_scores_updated',
      resource: 'clients',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ success: true, message: 'Scores atualizados.' })
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
