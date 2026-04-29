import { supabase } from './supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY

const SYSTEM_PROMPT = `Tu es Kpékpé, conseiller d'orientation de la plateforme Kpékpé Learnia au Togo.
Tu conduis une vraie séance d'orientation comme un conseiller professionnel.
- Tu es chaleureux, bienveillant, comme un grand frère ou une grande sœur
- Tu utilises la méthode Ikigaï : Passion / Talent / Besoins du monde / Aspiration
- IMPORTANT : Prends en compte ce que la personne fait DÉJÀ (sa formation actuelle, son niveau, ses compétences acquises) même si cela semble différent de sa personnalité. L'Ikigaï est l'équilibre entre ce qu'on aime et ce qu'on SAIT FAIRE.
- ADAPTATION : 
  * Si l'utilisateur est un élève (Collégien/Lycéen), recommande en priorité des SÉRIES de lycée (A4, C, D, G1, G2, etc.) et explique pourquoi cette série est la porte d'entrée vers son Ikigaï.
  * Si l'utilisateur est étudiant ou professionnel, recommande des universités (UL, UK, etc.) ou des formations professionnelles.
- Tu poses UNE seule question courte à la fois
- Tu connais les séries du bac togolais, les universités UL et UK, les métiers porteurs au Togo
- Tu fais des recommandations concrètes : 2 ou 3 métiers + filières + établissements au Togo
- Français simple, accessible à un élève de 12 ans, jamais moralisateur
- Jamais "Kpé" — toujours "Kpékpé"
- Intègre naturellement les infos RAG, ne dis jamais "selon le contexte"
- Tu recommandes des écoles RÉELLES du Togo (UL, UK, ESGIS, UCAO, ENSI, EAMAU, etc.)
- Tu mentionnes les métiers porteurs au Togo : numérique, logistique portuaire, agro-industrie, santé, BTP`

// --- Embeddings via Hugging Face ---
async function generateEmbedding(text) {
  try {
    const res = await fetch(
      'https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: text })
      }
    )
    const data = await res.json()
    return Array.isArray(data[0]) ? data[0] : data
  } catch {
    return null
  }
}

// --- RAG : Recherche vectorielle dans documents ---
async function searchDocuments(text, limit = 4) {
  try {
    const embedding = await generateEmbedding(text)
    if (!embedding) return []
    const { data } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: limit
    })
    return data || []
  } catch {
    return []
  }
}

// --- RAG : Recherche métiers par tags ---
async function searchMetiers(keywords = [], personnalite = '') {
  try {
    let query = supabase.from('metiers').select('title, category, tags, profiles, series, studies, description, salary_indice')
    
    if (personnalite) {
      query = query.contains('profiles', [personnalite])
    }
    
    const { data } = await query.limit(50)
    if (!data || data.length === 0) return []

    // Score par matching de tags
    const lowerKw = keywords.map(k => k.toLowerCase())
    const scored = data.map(m => {
      const mTags = (m.tags || []).map(t => t.toLowerCase())
      const score = lowerKw.reduce((s, kw) => s + (mTags.some(t => t.includes(kw) || kw.includes(t)) ? 1 : 0), 0)
      return { ...m, score }
    }).filter(m => m.score > 0)

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, 5)
  } catch {
    return []
  }
}

// --- RAG : Recherche écoles par domaines ---
async function searchEcoles(domaines = []) {
  try {
    const { data } = await supabase.from('ecoles').select('name, type, ville, domaines')
    if (!data || data.length === 0) return []

    const lowerDom = domaines.map(d => d.toLowerCase())
    const matched = data.filter(e => {
      const eDom = (e.domaines || []).map(d => d.toLowerCase())
      return lowerDom.some(d => eDom.some(ed => ed.includes(d) || d.includes(ed)))
    })
    return matched.slice(0, 5)
  } catch {
    return []
  }
}

// --- Construction du contexte RAG enrichi ---
async function buildRAGContext(userMessage, userProfile) {
  const docs = await searchDocuments(userMessage)

  // Extraire des mots-clés du message + profil
  const keywords = [
    ...userMessage.split(/\s+/).filter(w => w.length > 3),
    ...(userProfile?.centres_interet || []),
    ...(userProfile?.competences || [])
  ]

  const metiers = await searchMetiers(keywords, userProfile?.personnalite || '')
  
  // Domaines depuis les métiers trouvés
  const domaines = metiers.flatMap(m => [m.category, ...m.tags]).filter(Boolean)
  const ecoles = await searchEcoles(domaines)

  let context = ''

  if (docs.length > 0) {
    context += '\n\n[INFOS TOGO]\n'
    context += docs.map(d => `• ${d.titre}: ${d.contenu}`).join('\n')
    context += '\n[FIN INFOS]'
  }

  if (metiers.length > 0) {
    context += '\n\n[MÉTIERS RECOMMANDÉS]\n'
    context += metiers.map(m =>
      `• ${m.title} (${m.category}) — Études: ${m.studies}, Salaire: ${m.salary_indice}. Séries: ${(m.series||[]).join(',')}. ${m.description}`
    ).join('\n')
    context += '\n[FIN MÉTIERS]'
  }

  if (ecoles.length > 0) {
    context += '\n\n[ÉCOLES AU TOGO]\n'
    context += ecoles.map(e =>
      `• ${e.name} (${e.type}, ${e.ville}) — Domaines: ${(e.domaines||[]).join(', ')}`
    ).join('\n')
    context += '\n[FIN ÉCOLES]'
  }

  return context
}

// --- Fonction principale : Demander à Kpékpé ---
export async function askKpekpe(messages, userProfile = null) {
  const lastMsg = [...messages].reverse().find(m => m.role === 'user')?.content || ''

  const ragContext = await buildRAGContext(lastMsg, userProfile)

  const userContext = userProfile
    ? `\n\n[PROFIL UTILISATEUR]\nPrénom: ${userProfile.prenom || ''}\nNom: ${userProfile.nom || ''}\nÂge: ${userProfile.age || ''}\nNiveau/Formation Actuelle: ${userProfile.niveau || ''}\nSérie BAC: ${userProfile.serie || ''}\nRégion: ${userProfile.region || ''}\nPersonnalité: ${userProfile.personnalite || ''}\nCentres d'intérêt: ${(userProfile.centres_interet || []).join(', ')}\nCompétences: ${(userProfile.competences || []).join(', ')}\nType consultation: ${userProfile.type_consultation || ''}\nScores IKIGAI — Passion: ${userProfile.score_passion || 0}/8, Talent: ${userProfile.score_talent || 0}/8, Besoins: ${userProfile.score_besoins || 0}/8, Aspiration: ${userProfile.score_aspiration || 0}/8\n[FIN PROFIL]`
    : ''

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + userContext + ragContext },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    return `Erreur API: ${res.status} - ${errText}`
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'Désolé, réponse vide.'
}

// --- Récupérer le profil utilisateur ---
export async function getUserProfile(userId) {
  const { data } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

// --- Sauvegarder une session ---
export async function saveSession(userId, messages, sessionId = null) {
  if (!userId) return null
  const synthese = [...messages].reverse().find(m => m.role === 'assistant')?.content?.slice(0, 500) || ''
  
  const payload = {
    user_id: userId,
    messages,
    synthese,
    competences_detectees: []
  }

  if (sessionId) {
    payload.id = sessionId
  }

  const { data, error } = await supabase
    .from('sessions_ia')
    .upsert(payload)
    .select()
    .single()

  if (error) {
    console.error("Erreur sauvegarde session:", error)
    return sessionId
  }
  
  return data.id
}

// --- Générer les embeddings pour tous les documents (à appeler une fois) ---
export async function generateAllEmbeddings() {
  const { data: docs } = await supabase
    .from('documents')
    .select('id, titre, contenu')
    .is('embedding', null)

  if (!docs || docs.length === 0) {
    console.log('Tous les documents ont déjà des embeddings.')
    return
  }

  console.log(`Génération d'embeddings pour ${docs.length} documents...`)

  for (const doc of docs) {
    const text = `${doc.titre} ${doc.contenu}`
    const embedding = await generateEmbedding(text)
    if (embedding) {
      await supabase
        .from('documents')
        .update({ embedding })
        .eq('id', doc.id)
      console.log(`✅ Embedding généré pour: ${doc.titre}`)
    } else {
      console.log(`❌ Échec embedding: ${doc.titre}`)
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 500))
  }

  console.log('Génération des embeddings terminée !')
}
