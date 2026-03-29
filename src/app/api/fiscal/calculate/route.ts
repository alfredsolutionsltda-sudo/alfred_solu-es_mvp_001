import { NextResponse } from 'next/server';
import { compareRegimes } from '@/lib/fiscal/tax-calculator';

export async function POST(request: Request) {
  try {
    const { monthlyRevenue, annualRevenue, activityType } = await request.json();

    if (!monthlyRevenue) {
      return NextResponse.json({ error: 'Faturamento mensal é obrigatório' }, { status: 400 });
    }

    const results = compareRegimes(
      Number(monthlyRevenue), 
      Number(annualRevenue || monthlyRevenue * 12), 
      activityType || 'Serviços'
    );

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in fiscal calculation:', error);
    return NextResponse.json({ error: 'Erro ao calcular impostos' }, { status: 500 });
  }
}
