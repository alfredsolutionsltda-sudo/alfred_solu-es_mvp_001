import { TaxCalculationResult, TaxRegime } from '@/types/fiscal';

/**
 * Cálculos Fiscais Alfred — Tabelas 2024/2025
 * Baseado nas regras fornecidas pelo usuário.
 */

export function calculateMEI(monthlyRevenue: number, activityType: 'Serviços' | 'Comércio+Indústria'): TaxCalculationResult {
  const dasValue = activityType === 'Serviços' ? 71.60 : 76.90;
  
  return {
    regime: 'MEI',
    monthlyRevenue,
    breakdown: [
      { label: 'DAS Mensal (INSS + ISS/ICMS)', amount: dasValue },
      { label: 'IRPF sobre Pró-labore', amount: 0 },
    ],
    total: dasValue,
    isIdeal: monthlyRevenue <= (81000 / 12)
  };
}

export function calculateSimplesNacional(monthlyRevenue: number, annualRevenue: number): TaxCalculationResult {
  // Anexo III — Serviços
  const faixas = [
    { limite: 180000, aliq: 0.06, pd: 0 },
    { limite: 360000, aliq: 0.112, pd: 9360 },
    { limite: 720000, aliq: 0.135, pd: 17640 },
    { limite: 1800000, aliq: 0.16, pd: 35640 },
    { limite: 3600000, aliq: 0.21, pd: 125640 },
    { limite: 4800000, aliq: 0.33, pd: 648000 },
  ];

  const rbt12 = annualRevenue > 0 ? annualRevenue : monthlyRevenue * 12;
  const faixa = faixas.find(f => rbt12 <= f.limite) || faixas[faixas.length - 1];
  
  // Alíquota Efetiva = (RBT12 * aliq - PD) / RBT12
  const aliqEfetiva = ((rbt12 * faixa.aliq) - faixa.pd) / rbt12;
  const total = monthlyRevenue * aliqEfetiva;

  return {
    regime: 'Simples Nacional',
    monthlyRevenue,
    breakdown: [
      { label: `DAS Simples (Aliq. Efetiva: ${(aliqEfetiva * 100).toFixed(2)}%)`, amount: total },
    ],
    total,
  };
}

export function calculateLucroPresumido(monthlyRevenue: number): TaxCalculationResult {
  const irpj = monthlyRevenue * 0.32 * 0.15;
  const csll = monthlyRevenue * 0.32 * 0.09;
  const pis = monthlyRevenue * 0.0065;
  const cofins = monthlyRevenue * 0.03;
  const iss = monthlyRevenue * 0.03; // Padrão 3%

  const total = irpj + csll + pis + cofins + iss;

  return {
    regime: 'Lucro Presumido',
    monthlyRevenue,
    breakdown: [
      { label: 'IRPJ (15% sobre 32%)', amount: irpj },
      { label: 'CSLL (9% sobre 32%)', amount: csll },
      { label: 'PIS (0.65%)', amount: pis },
      { label: 'COFINS (3.0%)', amount: cofins },
      { label: 'ISS (Est. 3%)', amount: iss },
    ],
    total,
  };
}

export function calculateCarneLeao(monthlyRevenue: number): TaxCalculationResult {
  // Tabela IRPF 2024
  const faixas = [
    { limite: 2259.20, aliq: 0, deducao: 0 },
    { limite: 2826.65, aliq: 0.075, deducao: 169.44 },
    { limite: 3751.05, aliq: 0.15, deducao: 381.44 },
    { limite: 4664.68, aliq: 0.225, deducao: 662.77 },
    { limite: Infinity, aliq: 0.275, deducao: 896.00 },
  ];

  const inss = Math.min(monthlyRevenue * 0.11, 908.85); // 11% sobre SM ou teto
  const baseCalculo = monthlyRevenue - inss;
  
  const faixa = faixas.find(f => baseCalculo <= f.limite) || faixas[faixas.length - 1];
  const irpf = Math.max(0, (baseCalculo * faixa.aliq) - faixa.deducao);

  return {
    regime: 'Autônomo/Carnê-Leão',
    monthlyRevenue,
    breakdown: [
      { label: 'INSS Autônomo (11%)', amount: inss },
      { label: 'IRPF Carnê-Leão', amount: irpf },
    ],
    total: inss + irpf,
  };
}

export function getBestRegime(monthlyRevenue: number, annualRevenue: number, activityType: 'Serviços' | 'Comércio+Indústria'): TaxRegime {
  const annual = annualRevenue > 0 ? annualRevenue : monthlyRevenue * 12;
  
  // MEI é limitado a 81k
  if (annual <= 81000) return 'MEI';

  const results = compareRegimes(monthlyRevenue, annualRevenue, activityType);
  return results.reduce((prev, curr) => prev.total < curr.total ? prev : curr).regime;
}

export function compareRegimes(monthlyRevenue: number, annualRevenue: number, activityType: 'Serviços' | 'Comércio+Indústria' = 'Serviços'): TaxCalculationResult[] {
  const results: TaxCalculationResult[] = [];

  // Só inclui MEI se estiver no limite (com margem de segurança de 20%)
  if (annualRevenue <= 81000 * 1.2 || (monthlyRevenue * 12) <= 81000 * 1.2) {
    results.push(calculateMEI(monthlyRevenue, activityType));
  }

  results.push(calculateSimplesNacional(monthlyRevenue, annualRevenue));
  results.push(calculateLucroPresumido(monthlyRevenue));
  results.push(calculateCarneLeao(monthlyRevenue));

  const minTotal = Math.min(...results.map(r => r.total));
  
  return results.map(r => ({
    ...r,
    isIdeal: r.total === minTotal
  }));
}
