-- ============================================================
-- Alfred — Migration: Adiciona campos para módulo de contratos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Adiciona campos extras à tabela contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_body text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS slug text unique;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS version integer default 1;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_name text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_document text;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS signed_by_ip text;

-- Atualiza o status check para incluir novos status
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_status_check
  CHECK (status IN ('rascunho', 'enviado', 'assinado', 'ativo', 'encerrado', 'expirado', 'pendente_assinatura', 'vencendo'));

-- Index no slug para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_contracts_slug ON public.contracts(slug);

-- Função SECURITY DEFINER para buscar contrato por slug (sem auth)
CREATE OR REPLACE FUNCTION public.get_contract_by_slug(p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', c.id,
    'title', c.title,
    'description', c.description,
    'contract_body', c.contract_body,
    'value', c.value,
    'status', c.status,
    'start_date', c.start_date,
    'end_date', c.end_date,
    'slug', c.slug,
    'version', c.version,
    'payment_terms', c.payment_terms,
    'service_type', c.service_type,
    'signed_at', c.signed_at,
    'signed_by_name', c.signed_by_name,
    'signed_by_document', c.signed_by_document,
    'signed_by_ip', c.signed_by_ip,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'client', CASE WHEN cl.id IS NOT NULL THEN json_build_object(
      'id', cl.id,
      'name', cl.name,
      'email', cl.email,
      'cpf_cnpj', cl.cpf_cnpj
    ) ELSE NULL END,
    'professional', json_build_object(
      'full_name', p.full_name,
      'email', p.email,
      'company_name', p.company_name,
      'phone', p.phone
    )
  ) INTO result
  FROM public.contracts c
  LEFT JOIN public.clients cl ON c.client_id = cl.id
  LEFT JOIN public.profiles p ON c.user_id = p.id
  WHERE c.slug = p_slug;

  RETURN result;
END;
$$;

-- Função SECURITY DEFINER para assinar contrato por slug (sem auth)
CREATE OR REPLACE FUNCTION public.sign_contract_by_slug(
  p_slug text,
  p_signed_by_name text,
  p_signed_by_document text,
  p_signed_by_ip text,
  p_signed_at timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  UPDATE public.contracts
  SET
    signed_by_name = p_signed_by_name,
    signed_by_document = p_signed_by_document,
    signed_by_ip = p_signed_by_ip,
    signed_at = p_signed_at,
    status = 'ativo',
    updated_at = now()
  WHERE slug = p_slug
    AND status = 'pendente_assinatura';

  SELECT json_build_object(
    'id', c.id,
    'title', c.title,
    'slug', c.slug,
    'status', c.status,
    'signed_at', c.signed_at,
    'signed_by_name', c.signed_by_name,
    'user_id', c.user_id,
    'client_id', c.client_id,
    'client', CASE WHEN cl.id IS NOT NULL THEN json_build_object(
      'name', cl.name,
      'email', cl.email
    ) ELSE NULL END,
    'professional_email', p.email,
    'professional_name', p.full_name
  ) INTO result
  FROM public.contracts c
  LEFT JOIN public.clients cl ON c.client_id = cl.id
  LEFT JOIN public.profiles p ON c.user_id = p.id
  WHERE c.slug = p_slug;

  RETURN result;
END;
$$;
