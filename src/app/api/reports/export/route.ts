import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAlfredBriefingData } from '@/lib/data/reports';
import { ReportPeriod } from '@/types/reports';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as ReportPeriod) || 'month';
    const format = searchParams.get('format') || 'csv';
    const userId = session.user.id;

    const data = await getAlfredBriefingData(userId, period);

    if (format === 'csv') {
      const csvRows = [
        ['Métrica', 'Valor'],
        ['Faturamento Bruto', data.metrics.grossRevenue],
        ['Recebido', data.metrics.received],
        ['Inadimplência', data.metrics.delinquency],
        ['Impostos Pagos', data.metrics.taxesPaid],
        ['Margem Líquida (%)', data.metrics.netMargin],
        [],
        ['Composição da Receita', 'Valor', 'Percentual'],
        ...data.breakdown.map(b => [b.type, b.value, `${b.percent.toFixed(2)}%`]),
        [],
        ['Performance por Cliente', 'Volume', 'Pontualidade (%)'],
        ...data.clients.map(c => [c.clientName, c.volume, `${c.punctuality.toFixed(2)}%`]),
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      const response = new NextResponse(csvContent);
      response.headers.set('Content-Type', 'text/csv; charset=utf-8');
      response.headers.set('Content-Disposition', `attachment; filename="relatorio_alfred_${period}_${new Date().toISOString().slice(0, 10)}.csv"`);
      return response;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error exporting report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
