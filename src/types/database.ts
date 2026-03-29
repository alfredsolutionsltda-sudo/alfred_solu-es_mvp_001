export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  company_name: string | null
  cnpj: string | null
  phone: string | null
  onboarding_completed: boolean
  preferred_name: string | null
  profession: string | null
  specialty: string | null
  registration_number: string | null
  document: string | null
  state: string | null
  tax_regime: string | null
  services: string[] | null
  average_ticket: number | null
  payment_terms: string | null
  client_profile: string | null
  contract_tone: string | null
  special_clauses: string | null
  alfred_context: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  cpf_cnpj: string | null
  type: 'pessoa_fisica' | 'pessoa_juridica'
  status: 'ativo' | 'inativo' | 'prospecto' | 'inadimplente'
  status_manual: string | null
  inadimplency_score: number
  company_name: string | null
  cnpj: string | null
  industry: string | null
  website: string | null
  alfred_context: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  value: number | null
  status: 'rascunho' | 'enviado' | 'assinado' | 'ativo' | 'encerrado' | 'expirado'
  start_date: string | null
  end_date: string | null
  signed_at: string | null
  public_token: string | null
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  user_id: string
  client_id: string | null
  title: string
  description: string | null
  value: number | null
  status: 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'expirada'
  valid_until: string | null
  public_token: string | null
  created_at: string
  updated_at: string
}

export interface Faturamento {
  id: string
  user_id: string
  client_id: string | null
  contract_id: string | null
  description: string
  amount: number
  type: 'honorarios_fixos' | 'por_demanda' | 'reembolso' | 'outro'
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  due_date: string | null
  paid_at: string | null
  reference_month: string | null
  created_at: string
  updated_at: string
}

export interface ObrigacaoFiscal {
  id: string
  user_id: string
  client_id: string | null
  name: string
  description: string | null
  type: 'declaracao' | 'pagamento' | 'entrega' | 'outro'
  status: 'pendente' | 'pago' | 'atrasado' | 'futuro'
  due_date: string | null
  completed_at: string | null
  paid_at: string | null
  amount: number | null
  year: number
  recorrente: boolean
  recorrencia: 'mensal' | 'trimestral' | 'semestral' | 'anual' | null
  created_at: string
  updated_at: string
}
