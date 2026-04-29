-- ==========================================
-- Kpékpé Learnia — Schema Supabase Complet
-- ==========================================

-- Extension vectorielle pour le RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. user_profile
CREATE TABLE IF NOT EXISTS public.user_profile (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    prenom TEXT, nom TEXT, age INTEGER, genre TEXT,
    pays TEXT DEFAULT 'Togo', region TEXT,
    serie TEXT, niveau TEXT,
    type_consultation TEXT,
    personnalite TEXT,
    score_passion INTEGER DEFAULT 0, score_talent INTEGER DEFAULT 0,
    score_besoins INTEGER DEFAULT 0, score_aspiration INTEGER DEFAULT 0,
    competences TEXT[] DEFAULT '{}', centres_interet TEXT[] DEFAULT '{}',
    onboarding_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_select" ON public.user_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_update" ON public.user_profile FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profile_insert" ON public.user_profile FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. sessions_ia
CREATE TABLE IF NOT EXISTS public.sessions_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    synthese TEXT, messages JSONB,
    competences_detectees TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sessions_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_select" ON public.sessions_ia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "session_insert" ON public.sessions_ia FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. documents (RAG avec embeddings vectoriels)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titre TEXT NOT NULL, contenu TEXT NOT NULL,
    categorie TEXT DEFAULT 'info',
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs_public_read" ON public.documents FOR SELECT USING (true);

-- 4. Fonction de recherche vectorielle (RAG)
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding vector(384),
    match_threshold FLOAT DEFAULT 0.3,
    match_count INT DEFAULT 5
) RETURNS TABLE (id UUID, titre TEXT, contenu TEXT, categorie TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.titre, d.contenu, d.categorie,
         1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.documents d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Tables métier : séries, écoles, métiers
CREATE TABLE IF NOT EXISTS public.series_bac (
    id TEXT PRIMARY KEY, name TEXT NOT NULL,
    domain TEXT, description TEXT, keywords TEXT[] DEFAULT '{}'
);
ALTER TABLE public.series_bac ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_read" ON public.series_bac FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.ecoles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, type TEXT, ville TEXT,
    domaines TEXT[] DEFAULT '{}'
);
ALTER TABLE public.ecoles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ecoles_read" ON public.ecoles FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.metiers (
    id TEXT PRIMARY KEY, title TEXT NOT NULL,
    category TEXT, tags TEXT[] DEFAULT '{}',
    profiles TEXT[] DEFAULT '{}', series TEXT[] DEFAULT '{}',
    studies TEXT, description TEXT, salary_indice TEXT
);
ALTER TABLE public.metiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metiers_read" ON public.metiers FOR SELECT USING (true);

-- ==========================================
-- DONNÉES : Séries BAC Togolais
-- ==========================================
INSERT INTO public.series_bac VALUES
('A4','Série A4 (Lettres & Sciences Humaines)','Littéraire','Philosophie, histoire-géographie, langues.','{"littérature","langues","philo","histoire","droit","communication"}'),
('C','Série C (Maths & Physique)','Sciences Dures','Mathématiques et physique-chimie intensives.','{"maths","physique","chimie","logique","ingénierie"}'),
('D','Série D (Maths & SVT)','Sciences Expérimentales','Biologie, médecine, agriculture.','{"biologie","svt","santé","médecine","agriculture"}'),
('G1','Série G1 (Techniques Admin)','Gestion Administrative','Secrétariat, bureautique.','{"administration","bureau","organisation"}'),
('G2','Série G2 (Gestion Quantitative)','Finance & Comptabilité','Comptabilité, finance.','{"comptabilité","finance","économie","banque"}'),
('G3','Série G3 (Techniques Commerciales)','Commerce & Marketing','Marketing, vente, gestion.','{"commerce","marketing","vente","business"}'),
('F1','Série F1 (Génie Mécanique)','Industrie','Mécanique générale.','{"mécanique","industrie","maintenance"}'),
('F2','Série F2 (Électronique)','Électronique','Circuits, robots.','{"électronique","robotique","automatisme"}'),
('F3','Série F3 (Électrotechnique)','Électricité','Installations électriques.','{"électricité","énergie","installation"}'),
('F4','Série F4 (Génie Civil)','BTP','Construction, architecture.','{"construction","btp","architecture"}'),
('E','Série E (Sciences et Techniques)','Sciences Appliquées','Approche généraliste.','{"technologie","innovation","ingénierie"}');

-- ==========================================
-- DONNÉES : Écoles & Universités du Togo
-- ==========================================
INSERT INTO public.ecoles (name,type,ville,domaines) VALUES
('Université de Lomé (UL)','Public','Lomé','{"Santé","Sciences","Droit","Économie","Ingénierie","Agronomie","Lettres"}'),
('Université de Kara (UK)','Public','Kara','{"Santé","Droit","Gestion","Lettres","Agronomie"}'),
('Université de Datcha','Public','Datcha','{"Sciences","Technologies","Ingénierie"}'),
('ENS Atakpamé','Public','Atakpamé','{"Enseignement","Éducation"}'),
('INFA de Tové','Public','Kpalimé','{"Agriculture","Élevage"}'),
('ENSI (UL)','Public','Lomé','{"Ingénierie","Informatique","Génie Civil"}'),
('FSS (UL)','Public','Lomé','{"Santé","Médecine","Pharmacie"}'),
('EAMAU','Inter-États','Lomé','{"Architecture","Urbanisme"}'),
('ENAM','Public','Lomé','{"Administration","Douane","Impôts"}'),
('UCAO-UUT','Privé','Lomé','{"Droit","Communication","Gestion","Informatique"}'),
('Lomé Business School','Privé','Lomé','{"Management","Audit","Marketing"}'),
('ESGIS','Privé','Lomé','{"Informatique","Gestion","Sciences"}'),
('IPNET','Privé','Lomé','{"Informatique","Technologie"}'),
('FORMATEC','Privé','Lomé','{"Santé","BTP","Technique"}'),
('DEFITECH','Privé','Lomé','{"Informatique","Réseaux","Télécoms"}'),
('ESAG-NDE','Privé','Lomé','{"Gestion","Commerce","Administration"}'),
('ESTABAT','Privé','Lomé','{"BTP","Topographie","Génie Civil"}'),
('ESAMOD','Privé','Lomé','{"Mode","Stylisme","Couture"}'),
('EMARITO','Privé','Lomé','{"Logistique","Maritime","Transit"}'),
('CFBT','Privé','Lomé','{"Banque","Finance"}'),
('ESBAME','Privé','Lomé','{"Mines","Énergie"}'),
('IHERIS','Privé','Lomé','{"Relations Internationales","Diplomatie"}'),
('IAEC','Privé','Lomé','{"Gestion","Commerce","Informatique"}'),
('ISDI','Privé','Lomé','{"Droit","Sciences Politiques"}'),
('ESIBA','Privé','Lomé','{"Gestion","Comptabilité","Marketing"}'),
('ESAM','Privé','Lomé','{"Droit","Gestion","Administration"}'),
('ESA','Privé','Lomé','{"Affaires","Commerce","Management"}'),
('ISMA','Privé','Lomé','{"Audiovisuel","Multimédia","Cinéma"}'),
('ISAGES','Privé','Kpalimé','{"Gestion","Agronomie","Environnement"}'),
('UATM GASA-FORMATION','Privé','Lomé','{"Technologie","Management"}'),
('RUSTA-ISAD','Privé','Lomé','{"Développement","Administration"}'),
('IFOS','Privé','Lomé','{"Sciences Sociales","Éducation"}'),
('SUP-MANAGEMENT','Privé','Lomé','{"Management","Ressources Humaines"}'),
('Institut des Sciences des Médias (ISM)','Privé','Lomé','{"Journalisme","Communication"}'),
('ESEC','Privé','Lomé','{"Économie","Commerce"}'),
('ISG','Privé','Lomé','{"Gestion","Informatique"}'),
('ESTI','Privé','Lomé','{"Technologies","Industrie"}'),
('ESATIC','Privé','Lomé','{"TIC","Numérique"}'),
('ISSEG','Privé','Lomé','{"Économie","Gestion"}'),
('EPIG','Privé','Lomé','{"Ingénierie","Gestion"}'),
('CFMI','Partenariat','Lomé','{"Industrie","Mécanique"}'),
('IFAD Bâtiment','Public/Privé','Lomé','{"BTP","Construction"}'),
('IFAD Aquaculture','Public/Privé','Elavagnon','{"Aquaculture","Pêche"}'),
('IFAD Élevage','Public/Privé','Barkoissi','{"Élevage","Agriculture"}');

-- ==========================================
-- DONNÉES : Métiers (50)
-- ==========================================
INSERT INTO public.metiers VALUES
-- SANTÉ
('medecin','Médecin Généraliste','Santé','{"santé","biologie","sciences","médecine"}','{"ANALYTIQUE","SOCIAL"}','{"D","C"}','7-8 ans','Diagnostic et soin des patients.','Élevé'),
('pharmacien','Pharmacien','Santé','{"santé","médicament","chimie"}','{"ANALYTIQUE","METHODIQUE"}','{"D","C"}','6 ans','Spécialiste du médicament.','Élevé'),
('infirmier','Infirmier d''État','Santé','{"santé","soin","contact","aider"}','{"SOCIAL","METHODIQUE"}','{"D","A4"}','3 ans','Suivi et soins des patients.','Moyen'),
('sage_femme','Sage-femme','Santé','{"santé","femme","bébé","social"}','{"SOCIAL"}','{"D"}','3 ans','Accompagnement des naissances.','Moyen'),
('dentiste','Chirurgien-Dentiste','Santé','{"santé","dent","soin"}','{"ANALYTIQUE","METHODIQUE"}','{"D","C"}','6 ans','Soin des dents.','Élevé'),
('laborantin','Technicien de Labo','Santé','{"santé","analyse","biologie"}','{"ANALYTIQUE","METHODIQUE"}','{"D","C"}','3 ans','Analyses médicales.','Moyen'),
('veto','Vétérinaire','Santé','{"animaux","santé","bio","soin"}','{"ANALYTIQUE","SOCIAL"}','{"D","C"}','6 ans','Santé animale.','Moyen'),
('kine','Kinésithérapeute','Santé','{"santé","corps","rééducation"}','{"SOCIAL","ANALYTIQUE"}','{"D"}','3-5 ans','Rééducation physique.','Moyen'),
('nutritionniste','Nutritionniste','Santé','{"santé","alimentation","bio"}','{"ANALYTIQUE","SOCIAL"}','{"D"}','3-5 ans','Conseil en alimentation.','Moyen'),
('opticien','Opticien','Santé','{"santé","yeux","vision"}','{"METHODIQUE","ANALYTIQUE"}','{"C","D","F3"}','3 ans','Equipement optique.','Moyen'),
('psychologue','Psychologue','Santé','{"santé","mental","écoute","social"}','{"SOCIAL","ANALYTIQUE"}','{"A4","D"}','5 ans','Accompagnement psychologique.','Moyen'),
('chirurgien','Chirurgien Spécialiste','Santé','{"santé","opération","médecine"}','{"ANALYTIQUE","METHODIQUE"}','{"C","D"}','10+ ans','Opérations chirurgicales.','Très Élevé'),
('pediatre','Pédiatre','Santé','{"santé","enfant","médecine"}','{"ANALYTIQUE","SOCIAL"}','{"D","C"}','10 ans','Médecine pour enfants.','Élevé'),

-- AGRICULTURE & ENVIRONNEMENT
('agronome','Ingénieur Agronome','Agriculture','{"agriculture","nature","terre","sciences"}','{"ANALYTIQUE","METHODIQUE"}','{"D","C"}','5 ans','Modernisation de l''agriculture.','Élevé'),
('environnement','Expert Environnement','Environnement','{"nature","écologie","géographie","climat"}','{"ANALYTIQUE","SOCIAL"}','{"D","C","A4"}','3-5 ans','Protection des ressources.','Moyen'),
('agro_alim','Ingénieur Agroalimentaire','Agriculture','{"nourriture","usine","transformation"}','{"ANALYTIQUE","METHODIQUE"}','{"C","D","E"}','5 ans','Transformation agricole.','Élevé'),
('technicien_agricole','Technicien Agricole','Agriculture','{"terre","champ","culture"}','{"METHODIQUE","ANALYTIQUE"}','{"D"}','3 ans','Suivi des cultures.','Moyen'),
('eleveur','Éleveur Professionnel','Agriculture','{"animaux","ferme","production"}','{"METHODIQUE"}','{"Toutes"}','Formation/CAP','Production animale.','Variable'),
('hydraulicien','Ingénieur Hydraulicien','Environnement','{"eau","canalisation","ingénierie"}','{"ANALYTIQUE","METHODIQUE"}','{"C","E"}','5 ans','Gestion des ressources en eau.','Élevé'),
('meteorologue','Météorologue','Environnement','{"climat","temps","science"}','{"ANALYTIQUE"}','{"C","D"}','5 ans','Analyse météorologique.','Moyen'),
('forestier','Garde Forestier','Environnement','{"forêt","nature","protection"}','{"METHODIQUE","SOCIAL"}','{"Toutes"}','Concours','Protection de la faune/flore.','Moyen'),
('horticulteur','Horticulteur','Agriculture','{"fleur","plante","jardin"}','{"METHODIQUE","CREATIF"}','{"D"}','2 ans','Culture de plantes et fleurs.','Moyen'),

-- NUMÉRIQUE
('dev_web','Développeur Full-Stack','Numérique','{"informatique","code","internet","création","web"}','{"ANALYTIQUE","CREATIF"}','{"C","E","F2"}','2-5 ans','Créer des sites et applis.','Élevé'),
('data_analyst','Data Analyst','Numérique','{"données","chiffres","maths","analyse"}','{"ANALYTIQUE","METHODIQUE"}','{"C","E"}','3-5 ans','Analyse des données.','Élevé'),
('cybersecurite','Expert Cyber-sécurité','Numérique','{"sécurité","informatique","code","réseaux"}','{"ANALYTIQUE","METHODIQUE"}','{"C","E"}','5 ans','Protection systèmes.','Élevé'),
('admin_reseaux','Admin Réseaux & Télécoms','Numérique','{"ordinateur","internet","connexion"}','{"METHODIQUE","ANALYTIQUE"}','{"F2","C","E"}','3 ans','Gestion des réseaux.','Moyen'),
('cloud_architect','Architecte Cloud','Numérique','{"serveur","informatique","web"}','{"ANALYTIQUE"}','{"C","E"}','5 ans','Infrastructure cloud.','Élevé'),
('ui_ux','UX/UI Designer','Numérique','{"design","création","interface"}','{"CREATIF","ANALYTIQUE"}','{"Toutes"}','3-5 ans','Design d''interfaces web.','Moyen'),
('dev_mobile','Développeur Mobile','Numérique','{"smartphone","app","code"}','{"ANALYTIQUE","CREATIF"}','{"C","E","F2"}','3-5 ans','Création d''applications Android/iOS.','Élevé'),
('ai_engineer','Ingénieur IA','Numérique','{"ia","intelligence","algorithme"}','{"ANALYTIQUE"}','{"C","E"}','5 ans','Développement IA.','Élevé'),
('game_dev','Développeur de Jeux Vidéo','Numérique','{"jeu","code","création","3d"}','{"CREATIF","ANALYTIQUE"}','{"C","E"}','3-5 ans','Création de jeux vidéos.','Élevé'),

-- BTP & INDUSTRIE
('ing_civil','Ingénieur Génie Civil','BTP','{"construction","chantier","calcul"}','{"ANALYTIQUE","METHODIQUE"}','{"C","E","F4"}','5 ans','Grands projets BTP.','Élevé'),
('architecte','Architecte / Urbaniste','BTP','{"maison","dessin","art","plans"}','{"CREATIF","ANALYTIQUE"}','{"C","D","F4"}','5-6 ans','Conception de bâtiments.','Élevé'),
('geometre','Géomètre Topographe','BTP','{"mesure","terrain","calcul"}','{"METHODIQUE","ANALYTIQUE"}','{"C","F4"}','3 ans','Mesure des terrains.','Moyen'),
('conducteur_travaux','Conducteur de Travaux','BTP','{"chantier","gestion","équipe"}','{"METHODIQUE","SOCIAL"}','{"F4","C"}','3-5 ans','Gestion de chantier.','Élevé'),
('urbaniste','Urbaniste','BTP','{"ville","aménagement","plan"}','{"ANALYTIQUE","CREATIF"}','{"C","D"}','5 ans','Aménagement urbain.','Élevé'),
('dessinateur_bat','Dessinateur Bâtiment','BTP','{"plan","CAO","dessin"}','{"METHODIQUE","CREATIF"}','{"F4"}','2-3 ans','Plans architecturaux.','Moyen'),
('electromeca','Électromécanicien','Industrie','{"machine","usine","moteur"}','{"METHODIQUE","ANALYTIQUE"}','{"F1","F3"}','2-3 ans','Maintenance industrielle.','Moyen'),
('ing_industriel','Ingénieur Industriel','Industrie','{"production","usine","optimisation"}','{"ANALYTIQUE"}','{"C","E"}','5 ans','Gestion de production.','Élevé'),
('qualiticien','Qualiticien','Industrie','{"norme","contrôle","qualité"}','{"METHODIQUE","ANALYTIQUE"}','{"C","D"}','3-5 ans','Contrôle qualité.','Moyen'),
('chef_chantier','Chef de Chantier','BTP','{"construction","terrain","équipe"}','{"METHODIQUE","SOCIAL"}','{"F4"}','3 ans','Supervision des travaux.','Moyen'),

-- GESTION, FINANCE & COMMERCE
('comptable','Comptable / Auditeur','Gestion','{"chiffres","argent","gestion","rigueur"}','{"METHODIQUE","ANALYTIQUE"}','{"G2","C"}','2-5 ans','Gestion des finances.','Moyen'),
('commercial','Responsable Commercial','Commerce','{"vente","négociation","client"}','{"SOCIAL","ANALYTIQUE"}','{"G3","A4"}','3 ans','Développement ventes.','Moyen'),
('rh','Responsable RH','Gestion','{"social","recrutement","humain"}','{"SOCIAL","METHODIQUE"}','{"A4","G1"}','3-5 ans','Gestion du personnel.','Moyen'),
('banquier','Gestionnaire de Compte','Banque','{"argent","client","banque","finance"}','{"SOCIAL","METHODIQUE"}','{"G2","C","A4"}','3 ans','Conseils financiers.','Moyen'),
('controleur_gestion','Contrôleur de Gestion','Gestion','{"analyse","budget","optimisation"}','{"ANALYTIQUE","METHODIQUE"}','{"G2","C"}','5 ans','Optimisation financière.','Élevé'),
('actuaire','Actuaire','Finance','{"statistique","risque","maths"}','{"ANALYTIQUE"}','{"C"}','5 ans','Calcul des risques (assurance).','Élevé'),
('assureur','Agent d''Assurance','Finance','{"contrat","risque","client"}','{"SOCIAL","METHODIQUE"}','{"G3","A4"}','2-3 ans','Vente d''assurances.','Moyen'),
('acheteur','Acheteur Pro','Commerce','{"négociation","fournisseur","prix"}','{"SOCIAL","METHODIQUE"}','{"G3"}','3-5 ans','Achat pour entreprise.','Moyen'),
('marketing_mgr','Directeur Marketing','Commerce','{"stratégie","pub","vente"}','{"CREATIF","ANALYTIQUE"}','{"G3","A4"}','5 ans','Stratégie commerciale.','Élevé'),
('assistant_dir','Assistant(e) de Direction','Administration','{"bureau","organisation","gestion"}','{"METHODIQUE"}','{"G1"}','2-3 ans','Appui administratif.','Moyen'),

-- LOGISTIQUE & TRANSPORT
('logisticien','Expert Logistique Maritime','Transport','{"port","marchandise","organisation"}','{"METHODIQUE","ANALYTIQUE"}','{"G3","C"}','3-5 ans','Gestion flux portuaires.','Élevé'),
('douane','Agent Douane','Administration','{"port","loi","argent","frontière"}','{"METHODIQUE","ANALYTIQUE"}','{"A4","D","G2"}','Concours OTR','Contrôle marchandises.','Élevé'),
('transitaire','Déclarant en Douane','Transport','{"port","documents","logistique"}','{"METHODIQUE","ANALYTIQUE"}','{"G3","G2","A4"}','2-3 ans','Formalités douanières.','Moyen'),
('supply_chain','Supply Chain Manager','Logistique','{"flux","stock","optimisation"}','{"ANALYTIQUE","METHODIQUE"}','{"G3","C"}','5 ans','Gestion chaîne logistique.','Élevé'),
('pilote','Pilote d''Avion','Transport','{"vol","avion","voyage"}','{"ANALYTIQUE","METHODIQUE"}','{"C"}','Formation Spécialisée','Pilotage.','Élevé'),
('controleur_aerien','Contrôleur Aérien','Transport','{"radar","avion","sécurité"}','{"ANALYTIQUE"}','{"C"}','Concours ASECNA','Gestion du trafic aérien.','Élevé'),
('chef_gare','Chef de Gare/Port','Transport','{"gestion","transport","équipe"}','{"METHODIQUE"}','{"Toutes"}','3 ans','Gestion d''infrastructure.','Moyen'),
('chauffeur_poids_lourd','Chauffeur Poids Lourd','Transport','{"route","camion","marchandise"}','{"METHODIQUE"}','{"Toutes"}','Permis Spécial','Transport routier.','Variable'),

-- DROIT & SÉCURITÉ
('avocat','Avocat / Juriste','Droit','{"loi","défendre","parler","justice"}','{"ANALYTIQUE","SOCIAL"}','{"A4"}','5 ans','Défense juridique.','Élevé'),
('notaire','Notaire','Droit','{"loi","contrat","authentification"}','{"METHODIQUE","ANALYTIQUE"}','{"A4"}','7 ans','Actes juridiques.','Élevé'),
('magistrat','Magistrat / Juge','Droit','{"justice","loi","tribunal"}','{"ANALYTIQUE"}','{"A4"}','Concours (ENAM)','Rendre la justice.','Élevé'),
('policier','Officier de Police','Sécurité','{"ordre","loi","protection"}','{"SOCIAL","METHODIQUE"}','{"Toutes"}','Concours','Maintien de l''ordre.','Moyen'),
('militaire','Officier Militaire','Sécurité','{"défense","armée","stratégie"}','{"METHODIQUE","ANALYTIQUE"}','{"Toutes"}','Concours (EFOFAT)','Défense nationale.','Moyen'),
('huissier','Huissier de Justice','Droit','{"loi","constat","recouvrement"}','{"METHODIQUE"}','{"A4"}','5 ans','Exécution des décisions de justice.','Élevé'),
('expert_comptable_judiciaire','Expert Judiciaire','Droit','{"enquête","analyse","preuve"}','{"ANALYTIQUE"}','{"C","A4"}','5+ ans','Expertise pour tribunaux.','Élevé'),

-- ÉDUCATION & SOCIAL
('enseignant','Enseignant / Professeur','Éducation','{"école","transmettre","aider","savoir"}','{"SOCIAL","METHODIQUE"}','{"Toutes"}','3-5 ans','Formation des jeunes.','Moyen'),
('prof_universite','Professeur d''Université','Éducation','{"recherche","enseignement","savoir"}','{"ANALYTIQUE","SOCIAL"}','{"Toutes"}','Doctorat (8 ans)','Enseignement supérieur.','Élevé'),
('educateur_spe','Éducateur Spécialisé','Social','{"aide","enfant","social"}','{"SOCIAL"}','{"A4"}','3 ans','Aide aux personnes en difficulté.','Moyen'),
('assistant_social','Assistant(e) Social(e)','Social','{"aide","famille","soutien"}','{"SOCIAL","METHODIQUE"}','{"A4"}','3 ans','Accompagnement social.','Moyen'),
('traducteur','Traducteur / Interprète','Langues','{"langue","anglais","traduction"}','{"ANALYTIQUE","CREATIF"}','{"A4"}','5 ans','Traduction de textes/discours.','Moyen'),
('guide_touristique','Guide Touristique','Tourisme','{"voyage","culture","langue"}','{"SOCIAL"}','{"A4"}','2-3 ans','Accompagnement touristes.','Variable'),
('gestionnaire_projet','Chef de Projet ONG','Social','{"projet","humanitaire","gestion"}','{"METHODIQUE","SOCIAL"}','{"Toutes"}','5 ans','Gestion de projets de développement.','Moyen'),

-- ARTS, MÉDIAS & COMMUNICATION
('journaliste','Journaliste','Média','{"parler","écriture","reportage"}','{"CREATIF","SOCIAL"}','{"A4"}','3 ans','Informer le public.','Moyen'),
('cm','Community Manager','Média','{"internet","communication","réseaux sociaux"}','{"CREATIF","SOCIAL"}','{"A4","G3"}','2 ans','Gestion image web.','Moyen'),
('styliste','Styliste / Designer Mode','Arts','{"mode","vêtement","dessin","création"}','{"CREATIF","METHODIQUE"}','{"Toutes"}','2-3 ans','Création de collections.','Variable'),
('graphiste','Graphiste / Directeur Artistique','Numérique','{"dessin","ordinateur","image","création"}','{"CREATIF","METHODIQUE"}','{"Toutes"}','2-5 ans','Communication visuelle.','Moyen'),
('photographe','Photographe Pro','Arts','{"image","photo","art","voyage"}','{"CREATIF","SOCIAL"}','{"Toutes"}','Formation','Capture d''images.','Variable'),
('musicien','Musicien / Producteur','Arts','{"musique","son","art","spectacle"}','{"CREATIF","SOCIAL"}','{"Toutes"}','Conservatoire','Création musicale.','Variable'),
('realisateur','Réalisateur Vidéo','Média','{"cinéma","vidéo","caméra"}','{"CREATIF","METHODIQUE"}','{"A4","F2"}','3 ans','Production audiovisuelle.','Moyen'),
('animateur_tv','Animateur Radio/TV','Média','{"voix","public","divertissement"}','{"SOCIAL","CREATIF"}','{"Toutes"}','Formation','Animation d''émissions.','Variable'),
('redacteur_web','Rédacteur Web','Média','{"écriture","internet","seo"}','{"ANALYTIQUE","CREATIF"}','{"A4"}','2 ans','Création de contenu écrit.','Moyen'),

-- ARTISANAT & TECHNIQUE
('menuisier','Menuisier / Ébéniste','Artisanat','{"bois","manuel","meuble"}','{"METHODIQUE","CREATIF"}','{"F4"}','Apprentissage','Travail du bois.','Variable'),
('electricien','Électricien Bâtiment/Industriel','Technique','{"électricité","courant","manuel"}','{"METHODIQUE","ANALYTIQUE"}','{"F3"}','BT/BTS','Installations électriques.','Moyen'),
('mecanicien','Mécanicien Auto/Moto','Technique','{"voiture","moteur","réparation"}','{"METHODIQUE","ANALYTIQUE"}','{"F1"}','Apprentissage','Entretien véhicules.','Moyen'),
('cuisinier','Cuisinier / Chef','Artisanat','{"cuisine","nourriture","restaurant"}','{"CREATIF","METHODIQUE"}','{"Toutes"}','CAP/Hôtellerie','Gastronomie.','Moyen'),
('soudeur','Soudeur','Artisanat','{"métal","feu","manuel"}','{"METHODIQUE"}','{"F1","TI"}','Apprentissage','Assemblage de métaux.','Moyen'),
('plombier','Plombier','Artisanat','{"eau","tuyau","réparation"}','{"METHODIQUE"}','{"Sans Bac"}','Apprentissage','Installations sanitaires.','Moyen'),
('couturier','Couturier / Tailleur','Artisanat','{"tissu","mode","machine"}','{"CREATIF","METHODIQUE"}','{"Sans Bac"}','Apprentissage','Confection de vêtements.','Variable'),
('boulanger','Boulanger / Pâtissier','Artisanat','{"pain","nourriture","four"}','{"METHODIQUE","CREATIF"}','{"Sans Bac"}','Apprentissage','Fabrication de pain et pâtisseries.','Variable'),
('estheticienne','Esthéticienne','Artisanat','{"beauté","soin","corps"}','{"SOCIAL","CREATIF"}','{"Sans Bac"}','Formation','Soins de beauté.','Variable'),
('coiffeur','Coiffeur','Artisanat','{"cheveux","beauté","ciseaux"}','{"CREATIF","SOCIAL"}','{"Sans Bac"}','Apprentissage','Soins capillaires.','Variable'),
('bijoutier','Bijoutier','Artisanat','{"or","argent","minutieux"}','{"CREATIF","METHODIQUE"}','{"Sans Bac"}','Apprentissage','Création de bijoux.','Variable'),
('froid_climatisation','Technicien Froid & Clim','Technique','{"froid","climatisation","réparation"}','{"METHODIQUE","ANALYTIQUE"}','{"F3"}','BT/BTS','Installation climatiseurs.','Moyen');

-- ==========================================
-- DONNÉES : Documents RAG (orientation Togo)
-- ==========================================
INSERT INTO public.documents (titre, contenu, categorie) VALUES
('Le système éducatif togolais','Le système éducatif au Togo comprend l''enseignement primaire (6 ans), le secondaire (7 ans divisé en collège et lycée), et le supérieur. Le baccalauréat est organisé en séries générales (A4, C, D) et techniques (G1, G2, G3, F1-F4, E, TI). L''Université de Lomé et l''Université de Kara sont les deux universités publiques principales.','info'),
('Université de Lomé — Filières','L''Université de Lomé (UL) propose des formations en Sciences de la Santé (FSS), Sciences (FDS), Droit (FDD), Économie et Gestion (FASEG), Lettres (FLESH), Agronomie (ESA), et Ingénierie (ENSI). L''admission se fait via le baccalauréat togolais. Les frais sont d''environ 15 000 à 25 000 FCFA par an pour les nationaux.','ecole'),
('Métiers porteurs au Togo 2025-2030','Les secteurs les plus porteurs au Togo incluent : le numérique (développeurs, data analysts, cybersécurité), l''agro-industrie (transformation agricole, export), la logistique portuaire (le Port Autonome de Lomé est un hub régional), les énergies renouvelables, le BTP (grands chantiers PND), la santé (manque de personnel médical), et le tourisme.','info'),
('La méthode IKIGAI pour l''orientation','L''IKIGAI est une méthode japonaise qui aide à trouver sa voie en croisant 4 dimensions : Ce que tu AIMES (Passion), Ce dans quoi tu es BON (Talent), Ce dont le MONDE a besoin (Besoins), et Ce pour quoi tu peux être PAYÉ (Aspiration). En combinant ces 4 piliers, tu trouves ton ikigai — ta raison d''être professionnelle.','info'),
('Port Autonome de Lomé — Opportunités','Le Port Autonome de Lomé (PAL) est le seul port en eau profonde de la côte ouest-africaine. Il génère des milliers d''emplois dans la logistique, le transit, la douane, le commerce international et la manutention. Les formations en logistique maritime (EMARITO) et en transit sont très demandées.','info'),
('Bourses et aides pour étudiants togolais','Le gouvernement togolais offre des bourses via le FAIEJ (Fonds d''Appui aux Initiatives Économiques des Jeunes). Des bourses internationales sont aussi accessibles : bourses de la CEDEAO, bourses françaises (Campus France), bourses turques (Türkiye Bursları), et programmes de l''Union Africaine.','info'),
('Série C — Débouchés et parcours','La série C (Mathématiques et Sciences Physiques) ouvre les portes des écoles d''ingénieurs (ENSI, Polytechnique), de médecine (FSS), d''informatique (ESGIS, IPNET), de l''architecture (EAMAU), et des sciences fondamentales. C''est la série la plus polyvalente pour les filières scientifiques.','formation'),
('Série D — Débouchés et parcours','La série D (Sciences de la Vie et de la Terre) est idéale pour la médecine, la pharmacie, l''agronomie, la biologie et les sciences de l''environnement. Les principaux débouchés mènent à la FSS (UL), l''ESA (UL), INFA de Tové, et les écoles de santé paramédicales.','formation'),
('Série A4 — Débouchés et parcours','La série A4 (Lettres et Sciences Humaines) mène au droit, à la communication, au journalisme, à l''enseignement, aux ressources humaines, aux relations internationales (IHERIS) et à la diplomatie. Les débouchés incluent la FDD (UL), UCAO-UUT, et les concours de la fonction publique.','formation'),
('Séries G — Débouchés techniques','Les séries G1 (administration), G2 (comptabilité-finance) et G3 (commerce-marketing) mènent directement au monde de l''entreprise. G2 ouvre vers la banque (Ecobank, Orabank, BOAD), la comptabilité et l''audit. G3 prépare au commerce, marketing et transit. Les écoles comme Lomé Business School, ESAG-NDE et CFBT sont recommandées.','formation'),
('Le numérique au Togo — Écosystème','Le Togo développe un écosystème tech dynamique : le programme Togo Digital 2025, des incubateurs comme Woelab et Cube, des entreprises comme Gozem, Semoa et Café Informatique. Les métiers recherchés incluent développeur web/mobile, data analyst, community manager et expert cybersécurité.','info'),
('EAMAU — Architecture au Togo','L''EAMAU (École Africaine des Métiers de l''Architecture et de l''Urbanisme) est une institution inter-États basée à Lomé. Elle forme des architectes et urbanistes pour toute l''Afrique. Admission sur concours après le bac C, D ou F4. Formation de 5 à 6 ans menant au diplôme d''architecte.','ecole'),
('Conseils pour choisir sa filière','Pour bien choisir ta filière après le bac : 1) Identifie tes matières fortes et tes centres d''intérêt. 2) Renseigne-toi sur les débouchés réels au Togo. 3) Visite les campus et parle aux étudiants. 4) Considère tes contraintes financières. 5) N''hésite pas à consulter un conseiller d''orientation.','info'),
('Entrepreneuriat jeune au Togo','Le FAIEJ et le PAEIJ proposent des financements pour les jeunes entrepreneurs togolais. Les secteurs porteurs pour l''entrepreneuriat incluent l''agro-transformation, les services numériques, la mode (ESAMOD forme des stylistes), l''énergie solaire et la restauration. Le programme Togo Start-up propose un accompagnement complet.','info'),
('Formation professionnelle au Togo','Les IFAD (Instituts de Formation en Alternance pour le Développement) offrent des formations pratiques : IFAD Building (bâtiment), IFAD Elavagnon (aquaculture), IFAD Barkoissi (élevage). Le CFMI forme aux métiers de l''industrie. Ces formations sont accessibles sans le bac et offrent d''excellents débouchés.','formation');

-- ==========================================
-- DONNÉES ENRICHIES (Recherches Internet 2026)
-- ==========================================
INSERT INTO public.documents (titre, contenu, categorie) VALUES
('IFAD Togo — Alternance et Bac Pro', 'Gérés par l''Agence Éducation-Développement (AED), les IFAD forment professionnellement les jeunes togolais via l''alternance (Bac Pro en 3 ans). Il existe l''IFAD-Aquaculture (Elavagnon), l''IFAD-Élevage (Barkoissi) et l''IFAD-Bâtiment (Lomé-Adidogomé). L''objectif est l''insertion directe sur le marché du travail togolais.', 'formation'),
('Marché de l''emploi au Togo en 2026', 'Les secteurs qui recrutent massivement incluent : le numérique (cybersécurité, développement web), l''agriculture moderne et l''agro-industrie (grâce aux nouvelles agropoles), ainsi que la logistique et les transports (liés à l''expansion continue du Port Autonome de Lomé).', 'info'),
('Togo Digital 2025 et opportunités', 'Le programme Togo Digital 2025 vise à numériser l''économie nationale. Cela crée une très forte demande pour les ingénieurs logiciels, les data analysts et les experts en marketing digital. Des incubateurs comme Nunya Lab et Cube soutiennent activement les start-ups technologiques à Lomé.', 'info'),
('Filière Agriculture et Agropoles', 'L''agriculture représente 40% du PIB togolais. La tendance est à la modernisation avec le projet des agropoles (comme l''agropole de Kara). On recherche urgemment des ingénieurs agronomes, des techniciens en mécanisation agricole et des experts en transformation agroalimentaire.', 'formation'),
('Lomé, Hub Financier et Bancaire', 'Lomé abrite les sièges de grandes institutions comme Ecobank, Orabank, la BOAD et la BIDC. Ce positionnement génère des opportunités en or pour les diplômés (souvent issus de la série G2 ou C) en finance, audit, comptabilité OHADA et gestion des risques.', 'info'),
('Bâtiment et Travaux Publics (BTP)', 'Soutenu par les grands projets d''infrastructures routières et immobilières de l''État, le Togo a un besoin constant d''ingénieurs en génie civil (formés à l''ENSI ou FORMATEC), d''architectes (EAMAU), de géomètres et de conducteurs de travaux.', 'info');
