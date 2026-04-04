const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log("Checking tables...");
  const { data: tables, error: e1 } = await supabase.rpc('get_tables'); 
  // Wait, RPC might not exist. Let's query something safe.
  
  // Let's test if proposals exists by doing a small select:
  const { error: e2 } = await supabase.from('proposals').select('id').limit(1);
  if (e2 && e2.code === 'PGRST205') {
    console.log("TABLE PROPOSALS DOES NOT EXIST");
  } else if (e2) {
    console.log("ERROR accessing proposals:", e2);
  } else {
    console.log("TABLE PROPOSALS EXISTS");
  }

  const { error: e3 } = await supabase.from('contracts').select('service_type').limit(1);
  if (e3 && e3.code === 'PGRST200') { // PGRST200 is column not found or relation error
    console.log("COLUMN service_type DOES NOT EXIST IN CONTRACTS", e3);
  } else if (e3) {
    console.log("ERROR accessing contracts:", e3);
  } else {
    console.log("COLUMN service_type EXISTS IN CONTRACTS");
  }

  // audit_logs
  const { error: e4 } = await supabase.from('audit_logs').select('id').limit(1);
  if (e4 && e4.code === 'PGRST205') {
    console.log("TABLE AUDIT_LOGS DOES NOT EXIST");
  } else if(e4) {
    console.log("ERROR accessing audit_logs:", e4);
  } else {
    console.log("TABLE AUDIT_LOGS EXISTS");
  }
}
check();
