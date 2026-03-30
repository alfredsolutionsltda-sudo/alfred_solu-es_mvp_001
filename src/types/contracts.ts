// ─────────────────────────────────────────
// Tipos do módulo de Contratos
// ─────────────────────────────────────────

export type ContractStatus = 'ativo' | 'pendente_assinatura' | 'vencendo' | 'expirado'

export interface Contract {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  contract_body: string | null
  value: number | null
  status: string
  start_date: string | null
  end_date: string | null
  slug: string | null
  version: number
  payment_terms: string | null
  service_type: string | null
  signed_at: string | null
  signed_by_name: string | null
  signed_by_document: string | null
  signed_by_ip: string | null
  public_token: string | null
  created_at: string
  updated_at: string
  read_at?: string | null
  total_reading_time?: number
  rejection_reason?: string | null
  rejected_at?: string | null
  last_follow_up_at?: string | null
  follow_up_count?: number
}

export interface ContractWithClient extends Contract {
  client: {
    id: string
    user_id: string
    name: string
    type: string | null
    email: string | null
    phone: string | null
    cpf_cnpj: string | null
    status: string | null
    status_manual: string | null
    company_name: string | null
    cnpj: string | null
    industry: string | null
    notes: string | null
    website: string | null
    created_at: string | null
    updated_at: string | null
    inadimplency_score: number | null
    alfred_context: string | null
  } | null
}

export interface ContractFullPublic extends Contract {
  client: {
    id: string
    name: string
    email: string | null
    cpf_cnpj: string | null
  } | null
  professional: {
    full_name: string | null
    email: string
    company_name: string | null
    phone: string | null
  } | null
}

export interface ContractFormData {
  clientName: string
  clientId?: string
  clientEmail?: string
  serviceType: string
  value: number
  startDate: string
  endDate: string
  paymentTerms: string
  title?: string
  contractBody: string
  description?: string
}

export interface SignatureData {
  name: string
  document: string
  ip: string
  signed_at: string
}

export interface ContractMetrics {
  totalAtivos: number
  pendentesAssinatura: number
  vencendoEm30Dias: number
  valorTotalAtivo: number
  taxaConversao?: number
  totalPropostas?: number
}

export interface ContractFilters {
  status?: string
  search?: string
  dateRange?: {
    start: string
    end: string
  }
  limit?: number
  offset?: number
}
