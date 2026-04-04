-- ============================================================
-- Alfred — Schema SQL Supabase
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Habilita extensão UUID
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- TABELA: profiles
-- ─────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  company_name text,
  cnpj text,
  phone text,
  onboarding_completed boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Usuário vê o próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuário atualiza o próprio perfil" on public.profiles
  for update using (auth.uid() = id);

create policy "Usuário insere o próprio perfil" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger: cria profile automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- TABELA: clients
-- ─────────────────────────────────────────
create table if not exists public.clients (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  cpf_cnpj text,
  type text check (type in ('pessoa_fisica', 'pessoa_juridica')) default 'pessoa_fisica',
  status text check (status in ('ativo', 'inativo', 'prospecto')) default 'ativo',
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.clients enable row level security;

create policy "Usuário gerencia os próprios clientes" on public.clients
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- TABELA: contracts
-- ─────────────────────────────────────────
create table if not exists public.contracts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  value numeric(12, 2),
  status text check (status in ('rascunho', 'enviado', 'assinado', 'ativo', 'encerrado', 'expirado')) default 'rascunho',
  start_date date,
  end_date date,
  signed_at timestamptz,
  public_token uuid default uuid_generate_v4() unique, -- token para acesso público
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.contracts enable row level security;

create policy "Usuário gerencia os próprios contratos" on public.contracts
  for all using (auth.uid() = user_id);

-- Função pública para visualização de contrato via token (sem autenticação)
create or replace function public.get_contract_by_token(p_token uuid)
returns table (
  id uuid,
  title text,
  description text,
  value numeric,
  status text,
  start_date date,
  end_date date
)
language sql
security definer
set search_path = public
as $$
  select id, title, description, value, status, start_date, end_date
  from public.contracts
  where public_token = p_token
    and status in ('enviado', 'assinado', 'ativo');
$$;

-- ─────────────────────────────────────────
-- TABELA: proposals
-- ─────────────────────────────────────────
create table if not exists public.proposals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  value numeric(12, 2),
  status text check (status in ('rascunho', 'enviada', 'aprovada', 'rejeitada', 'expirada')) default 'rascunho',
  valid_until date,
  public_token uuid default uuid_generate_v4() unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.proposals enable row level security;

create policy "Usuário gerencia as próprias propostas" on public.proposals
  for all using (auth.uid() = user_id);

-- Função pública para visualização de proposta via token
create or replace function public.get_proposal_by_token(p_token uuid)
returns table (
  id uuid,
  title text,
  description text,
  value numeric,
  status text,
  valid_until date
)
language sql
security definer
set search_path = public
as $$
  select id, title, description, value, status, valid_until
  from public.proposals
  where public_token = p_token
    and status in ('enviada', 'aprovada');
$$;

-- ─────────────────────────────────────────
-- TABELA: faturamento
-- ─────────────────────────────────────────
create table if not exists public.faturamento (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  type text check (type in ('honorarios_fixos', 'por_demanda', 'reembolso', 'outro')) default 'honorarios_fixos',
  status text check (status in ('pendente', 'pago', 'atrasado', 'cancelado')) default 'pendente',
  due_date date,
  paid_at timestamptz,
  reference_month text, -- ex: "2025-03"
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.faturamento enable row level security;

create policy "Usuário gerencia o próprio faturamento" on public.faturamento
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- TABELA: obrigacoes_fiscais
-- ─────────────────────────────────────────
create table if not exists public.obrigacoes_fiscais (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  description text,
  type text check (type in ('declaracao', 'pagamento', 'entrega', 'outro')) default 'declaracao',
  status text check (status in ('pendente', 'em_andamento', 'concluida', 'atrasada')) default 'pendente',
  due_date date,
  completed_at timestamptz,
  recorrente boolean default false,
  recorrencia text check (recorrencia in ('mensal', 'trimestral', 'semestral', 'anual')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.obrigacoes_fiscais enable row level security;

create policy "Usuário gerencia as próprias obrigações fiscais" on public.obrigacoes_fiscais
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Trigger updated_at universal
-- ─────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create or replace trigger clients_updated_at before update on public.clients
  for each row execute procedure public.handle_updated_at();
create or replace trigger contracts_updated_at before update on public.contracts
  for each row execute procedure public.handle_updated_at();
create or replace trigger proposals_updated_at before update on public.proposals
  for each row execute procedure public.handle_updated_at();
create or replace trigger faturamento_updated_at before update on public.faturamento
  for each row execute procedure public.handle_updated_at();
create or replace trigger obrigacoes_fiscais_updated_at before update on public.obrigacoes_fiscais
  for each row execute procedure public.handle_updated_at();

-- ─────────────────────────────────────────
-- TABELA: audit_logs
-- ─────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  resource text not null,
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now() not null
);

alter table public.audit_logs enable row level security;

create policy "Acesso restrito a audit logs" on public.audit_logs
  for select using (false);

