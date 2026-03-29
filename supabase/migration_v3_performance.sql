-- ============================================================
-- Alfred — Migração de Performance & Escalabilidade (v3)
-- Alvo: 100+ usuários simultâneos no Plano Free
-- ============================================================

-- 1. Habilitar extensões de busca
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Índices GIN (Busca por Texto nos Clientes)
-- Permite que buscas ilike '%nome%' sejam indexadas e rápidas
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON public.clients USING gin (name gin_trgm_ops);

-- 3. Índices B-Tree (Filtros Comuns e Chaves Estrangeiras)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_user_id ON public.faturamento(user_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_client_id ON public.faturamento(client_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_status ON public.faturamento(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_due_date ON public.faturamento(due_date);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);

-- 4. Função RPC: Atualização de Scores e Statuses em Massa
-- Esta função substitui centenas de chamadas API/HTTP por um único comando no banco.
CREATE OR REPLACE FUNCTION public.fn_update_all_client_scores(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hoje date := CURRENT_DATE;
BEGIN
  -- A. Atualiza inadimplency_score baseado no histórico de faturamento
  WITH client_scores AS (
    SELECT 
      c.id as client_id,
      GREATEST(0, LEAST(100, 
        100 
        -- Penalidade por atrasados atuais (-20)
        - (COUNT(f.id) FILTER (WHERE f.status = 'atrasado') * 20)
        -- Penalidade por pendentes > 15 dias (-10)
        - (COUNT(f.id) FILTER (WHERE f.status = 'pendente' AND (v_hoje - f.due_date) > 15) * 10)
        -- Bônus por pagamentos antecipados (+5)
        + (COUNT(f.id) FILTER (WHERE f.status = 'pago' AND f.paid_at < f.due_date) * 5)
      )) as new_score
    FROM public.clients c
    LEFT JOIN public.faturamento f ON c.id = f.client_id
    WHERE c.user_id = p_user_id
    GROUP BY c.id
  )
  UPDATE public.clients
  SET inadimplency_score = s.new_score
  FROM client_scores s
  WHERE public.clients.id = s.client_id;

  -- B. Atualiza status automático (apenas se status_manual for null)
  UPDATE public.clients c
  SET status = CASE
    -- 1. Regra Inadimplente (> 30 dias de atraso/pendente)
    WHEN EXISTS (
      SELECT 1 FROM public.faturamento f 
      WHERE f.client_id = c.id 
        AND (f.status = 'atrasado' OR f.status = 'pendente') 
        AND (v_hoje - f.due_date) > 30
    ) THEN 'inadimplente'
    
    -- 2. Regra Inativo (Sem contrato ativo ou encerrado a > 60 dias)
    WHEN NOT EXISTS (
      SELECT 1 FROM public.contracts con 
      WHERE con.client_id = c.id 
        AND (con.status = 'ativo' OR (con.end_date IS NOT NULL AND (v_hoje - con.end_date) <= 60))
    ) AND c.status != 'prospecto' THEN 'inativo'
    
    -- 3. Regra Ativo (Possui contrato ativo)
    WHEN EXISTS (
      SELECT 1 FROM public.contracts con 
      WHERE con.client_id = c.id AND con.status = 'ativo'
    ) THEN 'ativo'
    
    ELSE c.status -- Mantém status atual (ex: prospecto sem contrato)
  END
  WHERE c.user_id = p_user_id 
    AND c.status_manual IS NULL;
END;
$$;
