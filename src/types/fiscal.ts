import { ObrigacaoFiscal } from './database';

export type TaxRegime = 'MEI' | 'Simples Nacional' | 'Lucro Presumido' | 'Autônomo/Carnê-Leão';

export type ObrigacaoStatus = 'pendente' | 'pago' | 'atrasado' | 'futuro';

export interface TaxCalculationResult {
  regime: TaxRegime;
  monthlyRevenue: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
  total: number;
  isIdeal?: boolean;
}

export interface FiscalMetrics {
  currentMonthTax: {
    value: number;
    status: ObrigacaoStatus;
    label: string;
    dueDate: string | null;
  };
  totalPaidYear: {
    value: number;
    variation: number; // vs ano anterior
  };
  nextObligation: {
    daysRemaining: number;
    isUrgent: boolean;
    name: string;
  };
  annualProjection: {
    estimatedTotal: number;
    isBasedOnReal: boolean;
  };
  meiLimitPercent?: number; // 0 to 100
}

export interface MonthlyProjection {
  month: string; // "Jan", "Fev"...
  value: number;
  status: 'concluido' | 'atual' | 'futuro';
  isPaid: boolean;
}
