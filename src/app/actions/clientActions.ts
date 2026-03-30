"use server";

import { createClient } from "@/lib/data/clients";
import { ClientFormData } from "@/types/clients";
import { revalidatePath } from "next/cache";

export async function createClientAction(userId: string, data: ClientFormData) {
  try {
    const newClient = await createClient(userId, data);
    revalidatePath("/clientes");
    return { success: true, client: newClient };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function updateClientStatusAction(userId: string, clientId: string, status: string) {
  try {
    const { updateClient } = await import("@/lib/data/clients");
    const updated = await updateClient(userId, clientId, { 
      status: status as any,
      status_manual: status as any 
    });
    revalidatePath("/clientes");
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, client: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function getClientsAction(userId: string) {
  try {
    const { getClients } = await import("@/lib/data/clients");
    const clients = await getClients(userId);
    return { success: true, clients };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
