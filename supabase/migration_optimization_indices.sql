-- Índices para queries mais frequentes e otimização de performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_user_id ON faturamento(user_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_status ON faturamento(status);
CREATE INDEX IF NOT EXISTS idx_faturamento_due_date ON faturamento(due_date);
CREATE INDEX IF NOT EXISTS idx_faturamento_created_at ON faturamento(created_at);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_user_id ON obrigacoes_fiscais(user_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_due_date ON obrigacoes_fiscais(due_date);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_year ON obrigacoes_fiscais(year);
