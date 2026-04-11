require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAuthorized() {
  console.log('Listando usurios autorizados...');
  const { data, error } = await supabase
    .from('profiles')
    .select('email, is_authorized, plan')
    .eq('is_authorized', true);

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Usurios encontrados:', JSON.stringify(data, null, 2));
  }
}

listAuthorized();
