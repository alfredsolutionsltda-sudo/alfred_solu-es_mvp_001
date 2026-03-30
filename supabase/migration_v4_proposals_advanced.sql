-- Migração: Propostas Avançadas (Rastreamento e Inteligência)
-- Adiciona campos para leitura, tempo consumido, recusa e follow-up.

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_reading_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0;

-- Função para atualizar tempo de leitura via RPC (evita race conditions)
CREATE OR REPLACE FUNCTION increment_reading_time(p_slug TEXT, p_seconds INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE contracts 
  SET 
    total_reading_time = COALESCE(total_reading_time, 0) + p_seconds,
    read_at = COALESCE(read_at, NOW())
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para rejeitar proposta
CREATE OR REPLACE FUNCTION reject_proposal_by_slug(p_slug TEXT, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE contracts 
  SET 
    status = 'encerrado',
    rejection_reason = p_reason,
    rejected_at = NOW()
  WHERE slug = p_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
