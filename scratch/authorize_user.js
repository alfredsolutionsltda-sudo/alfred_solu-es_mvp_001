require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const email = 'valtventuresco@gmail.com';
const plan = 'founder'; // Atribuindo o plano founder como sugerido

async function authorizeUser() {
  console.log(`Autorizando ${email} com o plano ${plan}...`);

  try {
    // 1. Tenta atualizar o perfil se o usuário já existir
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        plan,
        is_authorized: true,
        plan_purchased_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase().trim())
      .select()
      .single();

    if (profile) {
      console.log(`Sucesso: Perfil de usuário existente atualizado para ${email}.`);
      return;
    }

    // 2. Se não existir, cria ou atualiza pré-autorização
    const { error: pendingError } = await supabase
      .from('pending_authorizations')
      .upsert({
        email: email.toLowerCase().trim(),
        plan,
        whop_member_id: 'manual_antigravity',
        purchased_at: new Date().toISOString(),
      }, { onConflict: 'email' });

    if (pendingError) {
      console.error('Erro ao criar pré-autorização:', pendingError);
    } else {
      console.log(`Sucesso: Pré-autorização criada para ${email}. Acesso será liberado no primeiro acesso.`);
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

authorizeUser();
