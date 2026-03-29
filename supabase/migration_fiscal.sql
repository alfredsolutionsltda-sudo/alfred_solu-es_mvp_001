-- ============================================================
-- Alfred — Migration: Módulo Fiscal & Prazos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Atualiza a tabela profiles com campos necessários para o módulo fiscal (se não existirem)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS document text; -- CPF/CNPJ
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text; -- UF
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_regime text; -- MEI, Simples Nacional, etc
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS services text[]; -- Lista de serviços
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_ticket numeric(12, 2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_profile text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contract_tone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS special_clauses text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alfred_context text;

-- 2. Atualiza a tabela obrigacoes_fiscais
-- Adiciona campo de ano para facilitar filtragem
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
-- Adiciona campo de valor da obrigação
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS amount numeric(12, 2);
-- Adiciona campo paid_at (sincronizado com completed_at, mas preferencial para pagamentos)
ALTER TABLE public.obrigacoes_fiscais ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Atualiza a constraint de status para os novos valores solicitados
ALTER TABLE public.obrigacoes_fiscais DROP CONSTRAINT IF EXISTS obrigacoes_fiscais_status_check;
ALTER TABLE public.obrigacoes_fiscais ADD CONSTRAINT obrigacoes_fiscais_status_check
  CHECK (status IN ('pendente', 'pago', 'atrasado', 'futuro'));

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_obrigacoes_fiscais_user_year ON public.obrigacoes_fiscais(user_id, year);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_fiscais_due_date ON public.obrigacoes_fiscais(due_date);
