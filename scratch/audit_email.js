require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const email = 'valtventuresco@gmail.com';

async function auditEmail() {
  console.log(`Auditoria para ${email}...`);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email);

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log(`Encontrados ${data.length} perfis:`);
    data.forEach((p, i) => {
      console.log(`--- Perfil ${i+1} ---`);
      console.log(`ID: ${p.id}`);
      console.log(`Autorizado: ${p.is_authorized}`);
      console.log(`Plano: ${p.plan}`);
    });
  }
}

auditEmail();
