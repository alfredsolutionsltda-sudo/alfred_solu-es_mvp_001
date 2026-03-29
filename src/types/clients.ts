export type ClientStatus = 'ativo' | 'inativo' | 'inadimplente' | 'prospecto';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  type: 'pessoa_fisica' | 'pessoa_juridica';
  status: ClientStatus;
  status_manual: ClientStatus | null;
  inadimplency_score: number;
  company_name: string | null;
  cnpj: string | null;
  industry: string | null;
  website: string | null;
  alfred_context: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithMetrics extends Client {
  total_billed: number;
  total_pending: number;
  active_contracts: number;
  next_due_date: string | null;
  faturamento?: any[];
  contracts?: any[];
}

export interface ClientFormData {
  name: string;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  type: 'pessoa_fisica' | 'pessoa_juridica';
  notes: string | null;
}
