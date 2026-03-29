-- ============================================================
-- Alfred — Migration: Adiciona campos para módulo de clientes
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adiciona campos extras à tabela clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS inadimplency_score integer default 100;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status_manual text check (status_manual in ('ativo', 'inativo', 'inadimplente', 'prospecto'));

-- Atualiza o status check para incluir novos status (inadimplente)
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('ativo', 'inativo', 'prospecto', 'inadimplente'));
