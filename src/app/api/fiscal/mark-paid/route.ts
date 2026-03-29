import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markObrigacaoAsPaid } from '@/lib/data/fiscal';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { obrigacaoId, paidAt } = await request.json();

    if (!obrigacaoId) {
      return NextResponse.json({ error: 'ID da obrigação é obrigatório' }, { status: 400 });
    }

    const updated = await markObrigacaoAsPaid(session.user.id, obrigacaoId, paidAt ? new Date(paidAt) : undefined);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error marking obligation as paid:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 });
  }
}
