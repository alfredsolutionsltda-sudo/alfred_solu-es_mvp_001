import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AlfredBotTrigger from '@/components/dashboard/AlfredBotTrigger'

import ContratosCard from '@/components/dashboard/ContratosCard'
import FaturamentoCard from '@/components/dashboard/FaturamentoCard'
import InadimplenciaCard from '@/components/dashboard/InadimplenciaCard'
import MetricCard from '@/components/dashboard/MetricCard'
import AlfredInsightsCard from '@/components/dashboard/AlfredInsightsCard'
import FilterPeriod from '@/components/dashboard/FilterPeriod'

import {
  getDashboardMetrics,
  getContractsWidget,
  getFaturamentoWidget,
  getInadimplenciaWidget,
  getCobrancasPendentes,
  getClientesAtivos,
  DashboardPeriod
} from '@/lib/data/dashboard'

export const metadata = {
  title: 'Dashboard — Alfred',
  description: 'Visão geral do seu negócio',
}

export default async function DashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const periodVal = searchParams?.period
  const periodStr = typeof periodVal === 'string' ? periodVal : 'mes'
  const validPeriod = ['mes', 'trimestre', 'ano'].includes(periodStr) ? periodStr as DashboardPeriod : 'mes'

  // Busca resumos em paralelo
  const [
    metrics,
    contractsWidget,
    faturamentoWidget,
    inadimplenciaWidget,
    cobrancasWidget,
    clientesWidget
  ] = await Promise.all([
    getDashboardMetrics(user.id, validPeriod),
    getContractsWidget(user.id, validPeriod),
    getFaturamentoWidget(user.id, validPeriod),
    getInadimplenciaWidget(user.id),
    getCobrancasPendentes(user.id, validPeriod),
    getClientesAtivos(user.id, validPeriod)
  ])

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  return (
    <main className="min-h-screen bg-surface pt-6 md:pt-10 pb-24 md:pb-16 px-6 md:px-10 max-w-[1920px] mx-auto">
      {/* Header Standardized */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 md:mb-12 gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-5xl font-headline font-black text-neutral-900 tracking-tight">
            Visão Geral
          </h1>
          <p className="text-neutral-500 font-medium text-base md:text-lg">
            Aqui está o pulso do seu negócio hoje.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <FilterPeriod />
          <AlfredBotTrigger />
        </div>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-stretch pt-2 md:pt-4">
        <ContratosCard data={contractsWidget} />
        <FaturamentoCard data={faturamentoWidget} />

        <MetricCard
          title="Cobranças Pendentes"
          value={formatCurrency(cobrancasWidget.total)}
          subtitle="Em aberto (período selecionado)"
          iconName="calendar"
          colorTheme="green"
          variation={cobrancasWidget.variation}
        />

        <MetricCard
          title="Clientes Ativos"
          value={clientesWidget.totalAtivos.toString()}
          subtitle="Clientes com contrato ativo"
          iconName="trending-up"
          colorTheme="primary"
          variation={clientesWidget.totalAtivos > 0 ? (clientesWidget.novosNoPeriodo / (clientesWidget.totalAtivos - clientesWidget.novosNoPeriodo || 1)) * 100 : 0}
        />

        <InadimplenciaCard data={inadimplenciaWidget} />

        <AlfredInsightsCard 
          userId={user.id} 
          briefingData={null} 
          totalContracts={metrics.activeContracts + contractsWidget.statuses.gerados}
          activeContracts={metrics.activeContracts}
          faturamentoPeriodo={metrics.faturamentoPeriodo}
        />
      </div>
    </main>
  )
}
