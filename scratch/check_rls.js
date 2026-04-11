require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLS() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'profiles' });
  
  if (error) {
    // Se a RPC no existir, tentamos via query direta na pg_policies
    console.log('RPC get_policies no encontrada. Tentando via SQL direto...');
    const { data: policies, error: sqlError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (sqlError) {
       console.error('Erro ao buscar polticas:', sqlError);
    } else {
       console.log('Polticas encontradas:', JSON.stringify(policies, null, 2));
    }
  } else {
    console.log('Polticas (via RPC):', JSON.stringify(data, null, 2));
  }
}

checkRLS();
