import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateInadimplencyScore } from '@/lib/data/clients';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Busca todos os clientes, faturamentos pendentes, e contratos ativos ou recentes
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id, 
        status, 
        status_manual,
        faturamento ( amount, status, due_date ),
        contracts ( id, status, end_date )
      `)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const hoje = new Date();
    const results = [];

    for (const client of clients || []) {
      // 1. Atualiza Score
      const newScore = await updateInadimplencyScore(client.id);

      // 2. Avalia novo Status Automático (apenas se status_manual for null)
      if (client.status_manual === null) {
        let newStatus = 'ativo';

        // Checa faturamento > 30 dias atrasado/pendente
        let hasLongPending = false;
        if (client.faturamento) {
          for (const fat of client.faturamento as any[]) {
            if (fat.status === 'pendente' || fat.status === 'atrasado') {
              const due = new Date(fat.due_date);
              const diffDays = Math.floor((hoje.getTime() - due.getTime()) / (1000 * 3600 * 24));
              if (diffDays > 30) {
                hasLongPending = true;
                break;
              }
            }
          }
        }

        // Checa contratos
        let hasActiveOrRecentContracts = false;
        if (client.contracts && (client.contracts as any[]).length > 0) {
          for (const con of client.contracts as any[]) {
            if (con.status === 'ativo') {
              hasActiveOrRecentContracts = true;
              break;
            }
            if (con.end_date) {
              const end = new Date(con.end_date);
              const inactiveDays = Math.floor((hoje.getTime() - end.getTime()) / (1000 * 3600 * 24));
              if (inactiveDays <= 60) {
                hasActiveOrRecentContracts = true;
                break;
              }
            }
          }
        } else {
          // Prospecto ou Inativo permanente
          hasActiveOrRecentContracts = false;
        }

        if (hasLongPending) {
          newStatus = 'inadimplente';
        } else if (!hasActiveOrRecentContracts) {
          newStatus = 'inativo';
        }

        // Se prospecto e não tem nada, mantem prospecto (opcional, vamos assumir Inativo ou seguir lógica rígida)
        if (client.status === 'prospecto' && !client.contracts?.length) {
          newStatus = 'prospecto';
        }

        if (newStatus !== client.status) {
          await supabase.from('clients').update({ status: newStatus }).eq('id', client.id);
        }
      }

      results.push({ id: client.id, score: newScore });
    }

    return NextResponse.json({ success: true, updated: results.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
