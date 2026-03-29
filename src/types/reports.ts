export type ReportPeriod = 'month' | 'quarter' | 'year';

export interface ReportMetrics {
  grossRevenue: number;
  received: number;
  delinquency: number;
  taxesPaid: number;
  netMargin: number;
  variations: {
    grossRevenue: number;
    received: number;
    delinquency: number;
    taxesPaid: number;
    netMargin: number;
  };
}

export interface RevenueByMonth {
  month: string;
  year: number;
  billed: number;
  received: number;
}

export interface RevenueBreakdown {
  type: 'honorario_fixo' | 'por_demanda' | 'reembolso';
  value: number;
  percent: number;
}

export interface ClientPerformance {
  clientId: string;
  clientName: string;
  volume: number;
  punctuality: number;
  trend: 'up' | 'stable' | 'down';
}

export interface FunnelStep {
  label: string;
  value: number;
  conversion: number;
}

export interface FunnelData {
  sent: number;
  accepted: number;
  paid: number;
  conversionRates: {
    sentToAccepted: number;
    acceptedToPaid: number;
  };
}

export interface Projection {
  pessimistic: number;
  base: number;
  optimistic: number;
}

export interface ConversionByService {
  serviceType: string;
  proposals: number;
  accepted: number;
  conversionRate: number;
}

export interface AlfredBriefingData {
  metrics: ReportMetrics;
  revenueByMonth: RevenueByMonth[];
  breakdown: RevenueBreakdown[];
  clients: ClientPerformance[];
  funnel: FunnelData;
  serviceConversion: ConversionByService[];
  projection: Projection;
}
