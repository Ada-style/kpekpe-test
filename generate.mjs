import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Lecture manuelle du fichier .env
const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim();
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;
const hfKey = env.VITE_HF_API_KEY;

if (!supabaseUrl || !supabaseKey || !hfKey) {
  console.error("Clés manquantes dans le fichier .env !");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text) {
  try {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    )
    const data = await res.json()
    return Array.isArray(data[0]) ? data[0] : data
  } catch (err) {
    console.error(err);
    return null
  }
}

async function main() {
  console.log('Connexion à Supabase...', supabaseUrl);
  
  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, titre, contenu')
    .is('embedding', null);

  if (error) {
    console.error("Erreur de récupération des documents:", error);
    return;
  }

  if (!docs || docs.length === 0) {
    console.log('Tous les documents ont déjà des embeddings.');
    return;
  }

  console.log(`Génération d'embeddings pour ${docs.length} documents...`);

  for (const doc of docs) {
    const text = `${doc.titre} ${doc.contenu}`;
    const embedding = await generateEmbedding(text);
    if (embedding && embedding.length > 0) {
      const { error: updateError } = await supabase
        .from('documents')
        .update({ embedding })
        .eq('id', doc.id);
        
      if (updateError) {
          console.error(`❌ Erreur d'enregistrement pour ${doc.titre}:`, updateError);
      } else {
          console.log(`✅ Embedding généré pour: ${doc.titre}`);
      }
    } else {
      console.log(`❌ Échec embedding (HuggingFace): ${doc.titre}`);
    }
    // Pause pour ne pas saturer l'API HuggingFace
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Génération terminée avec succès !');
}

main();
