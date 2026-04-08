-- Tabela para guardar quem pagou mas ainda não se cadastrou
CREATE TABLE IF NOT EXISTS pending_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  plan text NOT NULL CHECK (plan IN ('builder', 'founder')),
  whop_member_id text,
  whop_order_id text,
  purchased_at timestamptz DEFAULT now(),
  used_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS: apenas service_role acessa
ALTER TABLE pending_authorizations ENABLE ROW LEVEL SECURITY;
-- Sem policies públicas — apenas service_role

-- Index
CREATE INDEX IF NOT EXISTS idx_pending_auth_email 
  ON pending_authorizations(email);

-- Trigger: quando usuário se cadastra, verifica se tem 
-- pré-autorização pendente e aplica o plano automaticamente
CREATE OR REPLACE FUNCTION apply_pending_authorization()
RETURNS TRIGGER AS $$
DECLARE
  pending_auth pending_authorizations%ROWTYPE;
BEGIN
  -- Busca pré-autorização pelo e-mail
  SELECT * INTO pending_auth
  FROM pending_authorizations
  WHERE email = LOWER(NEW.email)
  AND used_at IS NULL
  LIMIT 1;

  -- Se encontrou, aplica o plano
  IF FOUND THEN
    NEW.plan := pending_auth.plan;
    NEW.is_authorized := true;
    NEW.whop_member_id := pending_auth.whop_member_id;
    NEW.whop_order_id := pending_auth.whop_order_id;
    NEW.plan_purchased_at := pending_auth.purchased_at;

    -- Marca a pré-autorização como usada
    UPDATE pending_authorizations
    SET used_at = now()
    WHERE email = LOWER(NEW.email);
    
    RAISE LOG 'Plano % aplicado automaticamente para %', 
      pending_auth.plan, NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplica o trigger ao inserir novo profile
-- Nota: O trigger handle_new_user() cria o perfil após o auth.user ser criado.
-- Esse trigger deve rodar NO MOMENTO DA INSERÇÃO do profile.
DROP TRIGGER IF EXISTS trigger_apply_pending_auth ON profiles;
CREATE TRIGGER trigger_apply_pending_auth
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION apply_pending_authorization();
