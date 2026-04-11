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

async function checkUser() {
  console.log(`Buscando perfil para ${email}...`);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email);

  if (error) {
    console.error('Erro ao buscar perfil:', error);
  } else {
    console.log('Perfil encontrado:', JSON.stringify(data, null, 2));
  }
}

checkUser();
