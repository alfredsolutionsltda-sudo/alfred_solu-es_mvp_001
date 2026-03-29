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
      .from('faturamentos')
      .insert({
        user_id: userId,
        amount: data.amount,
        date: data.date,
        status: data.status,
        description: data.description,
        type: data.category
      });
      
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('impostos')
      .insert({
        user_id: userId,
        amount: data.amount,
        due_date: data.date,
        status: data.status,
        name: data.description
      });
      
    if (error) return { success: false, error: error.message };
  }

  revalidatePath('/fiscal');
  return { success: true };
}
