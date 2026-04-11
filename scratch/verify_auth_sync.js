require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const email = 'valtventuresco@gmail.com';

async function verifySync() {
  console.log(`Verificando sincronizao para ${email}...`);
  
  // 1. Busca na tabela de Auth (via admin)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);
  
  if (!authUser) {
    console.error('Erro: Usurio no encontrado no Auth.');
    return;
  }
  
  console.log(`Auth User ID: ${authUser.id}`);
  
  // 2. Busca na tabela de Profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();
    
  if (profileError) {
    console.error('Erro ao buscar perfil pelo ID:', profileError);
    
    // 3. Tenta buscar pelo email e ver o ID
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
      
    if (profileByEmail) {
      console.log(`Ateno: Perfil encontrado pelo email tem ID DIFERENTE (${profileByEmail.id}).`);
      console.log('Resolvendo: Sincronizando o ID do perfil com o ID do Auth...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ id: authUser.id })
        .eq('email', email);
        
      if (updateError) {
        console.error('Erro ao sincronizar:', updateError);
      } else {
        console.log('Sucesso: ID do perfil sincronizado com o Auth.');
      }
    } else {
        console.log('Perfil no encontrado nem pelo email.');
    }
  } else {
    console.log('O perfil est sincronizado corretamente.');
    console.log('Plano:', profile.plan);
    console.log('Autorizado:', profile.is_authorized);
  }
}

verifySync();
