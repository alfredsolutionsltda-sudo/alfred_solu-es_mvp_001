import { requireAuth } from '@/lib/api/auth'
import { validateOrigin } from '@/lib/csrf'
import { checkRateLimit } from '@/lib/api/rate-limit'
import { logAudit } from '@/lib/audit'
import { getAlfredBriefingData } from '@/lib/data/reports'
import { ReportPeriod } from '@/types/reports'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 1. Valida origem
  if (!await validateOrigin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 2. Rate limiting (Estrito: 10 por hora para exportação)
  const ip = request.headers.get('x-forwarded-for') 
    ?? request.headers.get('x-real-ip') 
    ?? 'unknown'
  const rl = await checkRateLimit(ip, 'report-export')
  if (!rl.allowed) return rl.response!

  // 3. Autenticação
  const { userId, error } = await requireAuth()
  if (error) return error

  // 4. Lógica protegida
  try {
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') as ReportPeriod) || 'month'
    const format = searchParams.get('format') || 'csv'

    const data = await getAlfredBriefingData(userId!, period)

    // 5. Auditoria
    await logAudit({
      userId: userId!,
      action: 'report_exported',
      resource: 'reports',
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { period, format }
    })

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
      ]

      const csvContent = csvRows.map(row => row.join(',')).join('\n')
      const response = new NextResponse(csvContent)
      response.headers.set('Content-Type', 'text/csv; charset=utf-8')
      response.headers.set('Content-Disposition', `attachment; filename="relatorio_alfred_${period}_${new Date().toISOString().slice(0, 10)}.csv"`)
      return response
    }

    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: 'Erro interno na exportação' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
