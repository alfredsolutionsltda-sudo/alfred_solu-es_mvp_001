import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Chama a nova função RPC de performance que processa tudo no banco de dados em lote
    const { error: rpcError } = await supabase
      .rpc('fn_update_all_client_scores', { p_user_id: user.id });
    
    if (rpcError) {
      console.error('RPC Performance Error:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Scores e status atualizados com sucesso via batch processing.' });
  } catch (err: any) {
    console.error('API update-scores crash:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
