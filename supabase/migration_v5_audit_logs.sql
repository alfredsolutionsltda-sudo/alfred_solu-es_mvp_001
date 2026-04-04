-- ─────────────────────────────────────────
-- TABELA: audit_logs
-- ─────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null, -- ex: 'login', 'create_contract', 'sign_contract'
  resource text not null, -- ex: 'contracts', 'auth', 'fiscal'
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now() not null
);

alter table public.audit_logs enable row level security;

-- Apenas o sistema (service_role) ou o próprio usuário (em alguns casos) deve ler?
-- Por segurança total, apenas service_role por enquanto.
create policy "Acesso restrito a audit logs" on public.audit_logs
  for select using (false); 
