import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes em .env.local");
  process.exit(1);
}

// Inicializa o cliente do Supabase ignorando RLS com a chave service_role
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = process.argv[2] && process.argv[2].length > 10 ? process.argv[2] : "db476b5d-99fa-4d53-b479-4186d5a5fc9e";

const C_NAMES = [
  { name: 'Tech Solutions Corp', email: 'contato@techsolutions.corp', type: 'pessoa_juridica', status: 'ativo' },
  { name: 'Cafeteria Aroma', email: 'financeiro@cafearoma.com', type: 'pessoa_juridica', status: 'ativo' },
  { name: 'Dr. Roberto Andrade', email: 'roberto.adv@email.com', type: 'pessoa_fisica', status: 'ativo' },
  { name: 'Padaria Pão Nosso', email: 'admin@paonosso.com', type: 'pessoa_juridica', status: 'prospecto' },
  { name: 'Marina Leme Arquitetura', email: 'marina@leme.arq', type: 'pessoa_fisica', status: 'ativo' },
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
}

async function seed() {
  console.log(`\n🚀 Iniciando geração de dados fakes para o usuário (tenant): ${USER_ID}\n`);

  // 1. Verificar se o perfil existe
  const { data: profile } = await supabase.from('profiles').select('id, email').eq('id', USER_ID).single();
  if (!profile) {
    console.log("⚠ Aviso: O perfil especificado não foi encontrado na tabela 'profiles'.");
    console.log("Certifique-se de que o ID pertence a um usuário válido do Auth antes de continuar.");
    // Dependendo do ambiente, você pode decidir cancelar o insert se bater na constraint de chave estrangeira
  } else {
    console.log(`✅ Perfil encontrado: ${profile.email}`);
  }

  // 2. Inserir Clientes
  console.log('⏳ Gerando Clientes...');
  const novosClientes = C_NAMES.map(c => ({
    user_id: USER_ID,
    ...c,
    phone: `11999${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
    cpf_cnpj: c.type === 'pessoa_fisica' ? `123.${Math.floor(Math.random()*999)}.789-00` : `11.${Math.floor(Math.random()*999)}.${Math.floor(Math.random()*999)}/0001-44`,
    notes: 'Cliente gerado automaticamente via Seed Script'
  }));

  const { data: clts, error: errClts } = await supabase.from('clients').insert(novosClientes).select();
  if (errClts) throw errClts;
  console.log(`✔ ${clts.length} Clientes inseridos.`);

  // 3. Inserir Contratos, Propostas e Faturas para cada cliente
  console.log('⏳ Gerando Propostas, Contratos e Faturas para os clientes criados...');
  let ctcCount = 0;
  let propCount = 0;
  let fatCount = 0;
  let fiscCount = 0;

  for (const cliente of clts) {
    const isAtivo = cliente.status === 'ativo';
    
    // Proposta
    const propStatus = isAtivo ? 'aprovada' : 'enviada';
    const { data: prop, error: errProp } = await supabase.from('proposals').insert({
      user_id: USER_ID,
      client_id: cliente.id,
      title: `Proposta Comercial - ${cliente.name}`,
      description: 'Prestação de serviços contábeis e financeiros mensais.',
      value: Math.floor(Math.random() * 5000) + 1500,
      status: propStatus,
      valid_until: randomDate(new Date(), new Date(2026, 11, 31))
    }).select().single();
    if (errProp) throw errProp;
    propCount++;

    if (isAtivo) {
        // Contrato
        const { data: cont, error: errCont } = await supabase.from('contracts').insert({
            user_id: USER_ID,
            client_id: cliente.id,
            title: `Contrato de Retenção - ${cliente.name}`,
            description: 'Serviços de consultoria fiscal e BPO.',
            value: prop.value,
            status: 'ativo',
            start_date: randomDate(new Date(2023, 0, 1), new Date()),
            end_date: randomDate(new Date(), new Date(2026, 11, 31))
        }).select().single();
        if (errCont) throw errCont;
        ctcCount++;

        // Faturas (3 pendentes, 2 pagas por contrato)
        const fatItems = [];
        for (let i = 0; i < 5; i++) {
        fatItems.push({
            user_id: USER_ID,
            client_id: cliente.id,
            contract_id: cont.id,
            description: `Mensalidade - ${i + 1}`,
            amount: cont.value,
            type: 'honorarios_fixos',
            status: i < 2 ? 'pago' : 'pendente',
            due_date: randomDate(new Date(), new Date(2026, 11, 31)),
            reference_month: `2025-0${(i % 9) + 1}`
        });
        }
        const { error: errFat } = await supabase.from('faturamento').insert(fatItems);
        if (errFat) throw errFat;
        fatCount += fatItems.length;

        // Obrigações
        const obsItems = [
            { user_id: USER_ID, client_id: cliente.id, name: 'Declaração IR', type: 'declaracao', status: 'pendente', due_date: '2026-05-31', recorrente: true, recorrencia: 'anual' },
            { user_id: USER_ID, client_id: cliente.id, name: 'Pagamento Simples Nacional', type: 'pagamento', status: 'pendente', due_date: randomDate(new Date(), new Date(2026, 11, 31)), recorrente: true, recorrencia: 'mensal' }
        ];
        const { error: errObs } = await supabase.from('obrigacoes_fiscais').insert(obsItems);
        if (errObs) throw errObs;
        fiscCount += obsItems.length;
    }
  }

  console.log(`✔ ${propCount} Propostas inseridas.`);
  console.log(`✔ ${ctcCount} Contratos inseridos.`);
  console.log(`✔ ${fatCount} Faturas inseridas.`);
  console.log(`✔ ${fiscCount} Obrigações Fiscais inseridas.`);

  console.log(`\n🎉 Processo de seeding concluído com sucesso para o usuário!`);
}

seed().catch(err => {
  console.error("X Falha ao rodar o seed:", err);
  process.exit(1);
});
