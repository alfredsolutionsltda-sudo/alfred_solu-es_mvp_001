-- 1. Adicionar colunas de plano na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan text 
  CHECK (plan IN ('builder', 'founder', 'team')) DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS plan_purchased_at timestamptz DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whop_member_id text DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whop_order_id text DEFAULT NULL;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_authorized boolean DEFAULT false;

-- 2. Index para busca por whop_member_id
CREATE INDEX IF NOT EXISTS idx_profiles_whop_member_id 
  ON profiles(whop_member_id);

CREATE INDEX IF NOT EXISTS idx_profiles_is_authorized 
  ON profiles(is_authorized);

CREATE INDEX IF NOT EXISTS idx_profiles_plan 
  ON profiles(plan);

-- 3. Verificar resultado
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
  'plan', 'plan_purchased_at', 'whop_member_id', 
  'whop_order_id', 'is_authorized'
);
