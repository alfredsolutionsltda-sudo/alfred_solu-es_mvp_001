import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function logAudit(data: {
  userId: string
  action: string
  resource: string
  resourceId?: string
  ip?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await adminClient.from('audit_logs').insert({
      user_id: data.userId,
      action: data.action,
      resource: data.resource,
      resource_id: data.resourceId,
      ip_address: data.ip,
      metadata: data.metadata,
    })
  } catch {
    // Não interrompe o fluxo principal
  }
}
