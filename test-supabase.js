import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envFile = fs.readFileSync('/Users/apple/Documents/securitycash (1)/securitycash/.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Iniciando teste...");
  
  // 1. Tentar fazer signIn ou criar usuario anonimo
  const email = "teste.debug" + Date.now() + "@gmail.com";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password: "password123"
  });
  
  if (authErr && authErr.message.includes('already registered')) {
     await supabase.auth.signInWithPassword({ email, password: "password123" });
  }
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    console.log("Erro ao logar", authErr);
    return;
  }
  
  const userId = user.user.id;
  console.log("Logado como:", userId);
  
  // 2. Inserir categoria mockada
  const catId = "cat_alimentacao"; // Testar ID estatico igual do SEED
  console.log("Testando UPSERT da categoria", catId);
  const { data: upsertData, error: upsertErr } = await supabase
    .from('categories')
    .upsert({
      id: catId,
      name: "Alimentação Editada",
      kind: "despesa",
      user_id: userId
    })
    .select();
    
  if (upsertErr) {
    console.error("ERRO NO UPSERT:", upsertErr);
  } else {
    console.log("UPSERT SUCESSO:", upsertData);
  }
}

test();
