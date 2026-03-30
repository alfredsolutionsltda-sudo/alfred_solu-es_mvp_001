'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTaxRegimeAction(userId: string, regime: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ tax_regime: regime })
    .eq('id', userId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/fiscal');
  return { success: true };
}

export async function registerPaymentAction(userId: string, data: any) {
  const supabase = await createClient();
  
  if (data.type === 'faturamento') {
    const { error } = await supabase
      .from('faturamento')
      .insert({
        user_id: userId,
        client_id: data.originType === 'client' ? data.clientId : null,
        amount: data.amount,
        due_date: data.date,
        paid_at: data.status === 'pago' ? data.date : null,
        status: data.status,
        description: data.originType === 'other' && data.customSource 
          ? `${data.customSource}: ${data.description}` 
          : data.description,
        type: data.category === 'honorario_fixo' ? 'honorarios_fixos' : data.category
      });
      
    if (error) return { success: false, error: error.message };
  } else {
    // Se for imposto, insere em obrigacoes_fiscais
    const { error } = await supabase
      .from('obrigacoes_fiscais')
      .insert({
        user_id: userId,
        amount: data.amount,
        due_date: data.date,
        status: data.status,
        name: data.description || 'Imposto Registrado',
        type: 'pagamento',
        year: new Date(data.date).getFullYear()
      });
      
    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/fiscal');
  return { success: true };
}

export async function markObrigacaoAsPaidAction(userId: string, obrigacaoId: string, paidAt: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('obrigacoes_fiscais')
    .update({ 
      status: 'pago',
      paid_at: paidAt,
      completed_at: paidAt
    })
    .eq('id', obrigacaoId)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/fiscal');
  return { success: true };
}

export async function saveSimulationAction(userId: string, data: { regime: string, total: number, month: number, year: number }) {
  const supabase = await createClient();
  
  const dueDate = new Date(data.year, data.month - 1, 20);
  
  const { error } = await supabase
    .from('obrigacoes_fiscais')
    .insert({
      user_id: userId,
      name: `Simulação: ${data.regime}`,
      amount: data.total,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'futuro',
      type: 'simulacao',
      year: data.year
    });

  if (error) return { success: false, error: error.message };
  
  revalidatePath('/fiscal');
  return { success: true };
}
