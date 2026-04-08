import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verifica a assinatura do webhook do Whop
function verifyWhopSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return hmac === signature
}

// Mapeia o plan_id do Whop para o plano do Alfred
function getPlanFromWhopId(whopPlanId: string): 'builder' | 'founder' | null {
  const map: Record<string, 'builder' | 'founder'> = {
    'plan_9qGXr34qVl3AL': 'builder',
    'plan_SOKfgq0PkSnOl': 'founder',
  }
  return map[whopPlanId] || null
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('whop-signature') || ''
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET!

    if (!webhookSecret) {
      console.warn('[Whop Webhook] WHOP_WEBHOOK_SECRET não definida')
    }

    // 1. Verifica autenticidade do webhook
    if (!verifyWhopSignature(payload, signature, webhookSecret)) {
      console.error('[Whop Webhook] Assinatura inválida')
      return NextResponse.json(
        { error: 'Assinatura inválida' },
        { status: 401 }
      )
    }

    const event = JSON.parse(payload)
    console.log('[Whop Webhook] Evento recebido:', event.action)

    // 2. Processa apenas eventos de compra concluída
    if (event.action !== 'membership.went_valid') {
      return NextResponse.json({ received: true })
    }

    const membership = event.data
    const whopPlanId = membership?.plan?.id
    const memberEmail = membership?.user?.email
    const memberId = membership?.id
    const orderId = membership?.checkout_session?.id

    if (!memberEmail || !whopPlanId) {
      console.error('[Whop Webhook] Dados incompletos:', { memberEmail, whopPlanId })
      return NextResponse.json({ received: true })
    }

    // 3. Identifica o plano comprado
    const plan = getPlanFromWhopId(whopPlanId)
    if (!plan) {
      console.error('[Whop Webhook] Plano não reconhecido:', whopPlanId)
      return NextResponse.json({ received: true })
    }

    console.log(`[Whop Webhook] ${memberEmail} comprou plano ${plan}`)

    // 4. Verifica se o usuário já tem conta na plataforma
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email, plan')
      .eq('email', memberEmail.toLowerCase().trim())
      .single()

    if (existingProfile) {
      // Usuário já tem conta — atualiza o plano
      await adminClient
        .from('profiles')
        .update({
          plan,
          is_authorized: true,
          whop_member_id: memberId,
          whop_order_id: orderId,
          plan_purchased_at: new Date().toISOString(),
        })
        .eq('email', memberEmail.toLowerCase().trim())

      console.log(`[Whop Webhook] Plano atualizado para usuário existente: ${memberEmail}`)
    } else {
      // Usuário ainda não tem conta — cria um registro de pré-autorização
      // Quando ele se cadastrar, o trigger vai pegar esses dados
      await adminClient
        .from('pending_authorizations')
        .upsert({
          email: memberEmail.toLowerCase().trim(),
          plan,
          whop_member_id: memberId,
          whop_order_id: orderId,
          purchased_at: new Date().toISOString(),
        }, {
          onConflict: 'email'
        })

      console.log(`[Whop Webhook] Pré-autorização criada para: ${memberEmail}`)
    }

    return NextResponse.json({ received: true, plan })

  } catch (error) {
    console.error('[Whop Webhook] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
