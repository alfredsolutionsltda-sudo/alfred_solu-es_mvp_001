-- ============================================================
-- Alfred — Migração de Consolidação de Esquema (v2)
-- Execute este script no SQL Editor do seu Supabase
-- ============================================================

-- 1. Tabela: profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_regime text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document text; 
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS services text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_ticket numeric(12, 2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_profile text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_tone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS special_clauses text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alfred_context text;

-- 2. Tabela: clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS alfred_context text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS inadimplency_score integer DEFAULT 100;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status_manual text;

-- Garantir que a constraint de status esteja atualizada
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check 
  CHECK (status IN ('ativo', 'inativo', 'prospecto', 'inadimplente'));

-- 3. Tabela: obrigacoes_fiscais
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS amount numeric(12, 2);
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Garantir que a constraint de status esteja atualizada
ALTER TABLE public.obrigacoes_fiscais DROP CONSTRAINT IF EXISTS obrigacoes_fiscais_status_check;
ALTER TABLE public.obrigacoes_fiscais ADD CONSTRAINT obrigacoes_fiscais_status_check
  CHECK (status IN ('pendente', 'pago', 'atrasado', 'futuro'));

-- 4. Tabela: contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_body text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_name text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_document text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_ip text;

-- 5. Tabela: proposals
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS value numeric(12, 2);

-- Garantir que a constraint de status esteja atualizada
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('rascunho', 'enviado', 'assinado', 'ativo', 'encerrado', 'expirado', 'pendente_assinatura', 'vencendo'));

-- Criar índice único no slug se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_slug_unique') THEN
        CREATE UNIQUE INDEX idx_contracts_slug_unique ON public.contracts(slug);
    END IF;
END $$;
