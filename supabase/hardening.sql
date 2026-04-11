-- ==========================================
-- ALFRED BACKEND HARDENING - SQL SCRIPT
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. CRIAÇÃO DA TABELA DE AUDITORIA (Se não existir)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política: Apenas o sistema (service_role) pode ler/escrever logs globais
-- Ou o próprio usuário pode ver seus próprios logs (opcional)
CREATE POLICY "Users can only view their own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can do everything on audit logs"
ON public.audit_logs TO service_role
USING (true)
WITH CHECK (true);


-- 2. HABILITAR RLS EM TODAS AS TABELAS DO SCHEMA PUBLIC
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;


-- 3. PADRONIZAÇÃO DE POLÍTICAS DE PROPRIETÁRIO (Owner-Only)
-- Este bloco recria políticas básicas para garantir que usuários só vejam seus próprios dados.

-- Perfis (Profiles)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can only update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Clientes (Clients)
DROP POLICY IF EXISTS "Users can only access their own clients" ON public.clients;
CREATE POLICY "Users can only access their own clients"
ON public.clients FOR ALL
USING (auth.uid() = user_id);

-- Contratos (Contracts)
DROP POLICY IF EXISTS "Users can only access their own contracts" ON public.contracts;
CREATE POLICY "Users can only access their own contracts"
ON public.contracts FOR ALL
USING (auth.uid() = user_id);

-- Propostas (Proposals)
DROP POLICY IF EXISTS "Users can only access their own proposals" ON public.proposals;
CREATE POLICY "Users can only access their own proposals"
ON public.proposals FOR ALL
USING (auth.uid() = user_id);

-- Obrigações Fiscais (Obligations)
DROP POLICY IF EXISTS "Users can only access their own obligations" ON public.obrigacoes_fiscais;
CREATE POLICY "Users can only access their own obligations"
ON public.obrigacoes_fiscais FOR ALL
USING (auth.uid() = user_id);


-- 4. PROTEÇÃO DO SERVICE_ROLE
-- Garante que o service_role tenha acesso total para bypassar RLS em jobs de backend
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 5. AUDITORIA INICIAL
INSERT INTO public.audit_logs (action, resource, metadata)
VALUES ('security_hardening_applied', 'database', '{"version": "1.0", "description": "RLS enforced and audit logging initialized"}');
