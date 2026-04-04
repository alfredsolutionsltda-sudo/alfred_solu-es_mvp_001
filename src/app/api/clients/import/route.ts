import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { importClientsFromCSV } from '@/lib/data/clients';
import Papa from 'papaparse';
import { ClientFormData } from '@/types/clients';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    
    if (result.errors.length > 0) {
      return NextResponse.json({ error: 'Erro ao parsear CSV' }, { status: 400 });
    }

    const rows: ClientFormData[] = result.data.map((row: any) => {
      let tipo: 'pessoa_fisica' | 'pessoa_juridica' = 'pessoa_fisica';
      if (row.tipo && row.tipo.toLowerCase().includes('juridica')) {
        tipo = 'pessoa_juridica';
      } else if (row.documento && row.documento.length > 14) {
        tipo = 'pessoa_juridica';
      }

      const profAndEst = `Profissão/Segmento: ${row.profissao || ''}\nEstado: ${row.estado || ''}`;

      return {
        name: row.nome || 'Sem Nome',
        cpf_cnpj: row.documento || null,
        email: row.email || null,
        phone: row.telefone || null,
        type: tipo,
        notes: profAndEst,
      };
    });

    const importResult = await importClientsFromCSV(user.id, rows);
    return NextResponse.json(importResult);

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
