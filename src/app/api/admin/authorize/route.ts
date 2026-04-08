import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Verifica chave de admin
    const adminKey = request.headers.get('x-admin-key')
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { email, plan } = await request.json()

    if (!email || !plan) {
      return NextResponse.json(
        { error: 'email e plan são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['builder', 'founder', 'team'].includes(plan)) {
      return NextResponse.json(
        { error: 'plan deve ser: builder, founder ou team' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Tenta atualizar o profile existente
    const { data: profile, error } = await adminClient
      .from('profiles')
      .update({
        plan,
        is_authorized: true,
        plan_purchased_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail)
      .select()
      .single()

    if (error || !profile) {
      // Usuário ainda não tem conta — cria pré-autorização
      await adminClient
        .from('pending_authorizations')
        .upsert({
          email: normalizedEmail,
          plan,
          whop_member_id: 'manual',
          purchased_at: new Date().toISOString(),
        }, { onConflict: 'email' })

      return NextResponse.json({
        success: true,
        message: `Pré-autorização criada para ${email}. Plano ${plan} será aplicado ao se cadastrar.`,
        status: 'pending'
      })
    }

    return NextResponse.json({
      success: true,
      message: `Usuário ${email} autorizado com plano ${plan}`,
      status: 'activated',
      profile
    })

  } catch (error) {
    console.error('[Admin Authorize] Erro:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}
