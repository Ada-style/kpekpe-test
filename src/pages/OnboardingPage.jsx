import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Monitor, Heart, Leaf, TrendingUp, Palette, Scale, HardHat, Radio, Eye, EyeOff, Mail, Briefcase, Scissors, Cpu, Users, DollarSign } from 'lucide-react'

// Constants
const MATIERES_COLLEGE = ['Mathématiques', 'Français', 'Anglais', 'Histoire-Géographie', 'Éducation Civique et Morale', 'SVT', 'Physique-Chimie', 'EPS']
const SERIES = ['A4', 'C', 'D', 'G1', 'G2', 'G3', 'F1', 'F2', 'F3', 'F4', 'E', 'TI-1']
const REGIONS = ['Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes']
const DOMAINES = ['Commerce', 'Informatique', 'Artisanat', 'Santé', 'Éducation', 'Autre']
const DUREES = ['Moins d\'1 an', '1 à 3 ans', 'Plus de 3 ans']
const POINTS_FORTS = ['Calcul', 'Écriture', 'Dessin', 'Parler en public', 'Informatique', 'Travail manuel', 'Organisation', 'Contact humain', 'Langues', 'Analyse', 'Créativité', 'Leadership']

const UNIVERS = [
  { id: 'technologie', label: 'Technologie', icon: Monitor },
  { id: 'sante', label: 'Santé', icon: Heart },
  { id: 'agriculture', label: 'Agriculture', icon: Leaf },
  { id: 'commerce', label: 'Commerce', icon: TrendingUp },
  { id: 'arts', label: 'Arts et Création', icon: Palette },
  { id: 'droit', label: 'Droit', icon: Scale },
  { id: 'btp', label: 'BTP', icon: HardHat },
  { id: 'communication', label: 'Communication', icon: Radio },
  { id: 'transport', label: 'Transport & Logistique', icon: Briefcase },
  { id: 'mode', label: 'Mode & Stylisme', icon: Scissors },
  { id: 'industrie', label: 'Industrie & Technique', icon: Cpu },
  { id: 'enseignement', label: 'Enseignement & Formation', icon: Users },
  { id: 'finance', label: 'Finance & Banque', icon: DollarSign },
]

const STATEMENTS = [
  { text: "Les maths et les sciences, c'est mon truc", axes: { talent: 2 } },
  { text: "J'aime aider les gens autour de moi", axes: { passion: 2, besoins: 2 } },
  { text: "Je préfère créer plutôt que suivre des règles", axes: { passion: 2 } },
  { text: "Je suis organisé(e) et j'aime que tout soit en ordre", axes: { aspiration: 2 } },
  { text: "Les ordinateurs et la tech m'attirent", axes: { talent: 2 } },
  { text: "Je préfère travailler dehors qu'dans un bureau", axes: { besoins: 2 } },
  { text: "Les chiffres et l'argent m'intéressent", axes: { talent: 2, aspiration: 2 } },
  { text: "J'aime m'exprimer, raconter, convaincre", axes: { passion: 2 } },
]

const FLOWS = {
  choix_serie: ['CLASSE_MATIERE', 'UNIVERS', 'POINTS_FORTS', 'QUIZ'],
  orientation_scolaire: ['SERIE_REGION', 'UNIVERS', 'POINTS_FORTS', 'QUIZ'],
  choix_formation: ['ETUDES_DUREE_REGION', 'UNIVERS', 'POINTS_FORTS', 'QUIZ'],
  reconversion: ['ETUDES_DUREE_REGION', 'UNIVERS', 'POINTS_FORTS', 'QUIZ'],
}

function Chip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 24px',
        borderRadius: '999px',
        transition: 'all 0.2s',
        fontSize: '15px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        border: selected ? '2px solid #009640' : '1px solid #E5E7EB',
        backgroundColor: selected ? '#ffed00' : '#ffffff',
        color: selected ? '#000000' : '#111827',
        fontWeight: selected ? 'bold' : '500',
        cursor: 'pointer',
        boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
      }}
    >
      {label}
    </button>
  )
}

function UniversCard({ item, selected, onClick }) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 4px',
        borderRadius: '20px',
        transition: 'all 0.2s',
        aspectRatio: '1 / 1',
        border: selected ? '2px solid #009640' : '1px solid #E5E7EB',
        backgroundColor: selected ? '#ffed00' : '#ffffff',
        cursor: 'pointer',
        boxShadow: selected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
        width: '100%',
        minWidth: 0
      }}
    >
      <div style={{ marginBottom: '8px', color: selected ? '#009640' : '#4B5563', flexShrink: 0 }}>
        <Icon size={28} strokeWidth={selected ? 2 : 1.5} />
      </div>
      <span 
        style={{ 
          textAlign: 'center', 
          fontSize: '12px', 
          lineHeight: '1.2',
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          color: selected ? '#000000' : '#111827',
          fontWeight: selected ? 'bold' : '600',
          width: '100%',
          wordWrap: 'break-word',
          hyphens: 'auto'
        }}
      >
        {item.label}
      </span>
    </button>
  )
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const typeConsultation = location.state?.type_consultation || 'choix_serie'
  const flow = FLOWS[typeConsultation] || FLOWS['choix_serie']

  const [currentIndex, setCurrentIndex] = useState(0)
  const [quizIndex, setQuizIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Form Data
  const [formData, setFormData] = useState({
    classe: '',
    matieres: [],
    serie: '',
    region: '',
    domaine: '',
    duree: '',
    univers: '',
    points_forts: [],
  })

  // Quiz Scores
  const [scores, setScores] = useState({ passion: 0, talent: 0, besoins: 0, aspiration: 0 })

  // Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (user) navigate('/accueil', { replace: true })
  }, [user, navigate])

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleQuizAnswer = (answer) => {
    const statement = STATEMENTS[quizIndex]
    const multiplier = answer === 'oui' ? 1 : answer === 'bof' ? 0.5 : 0

    const newScores = { ...scores }
    Object.entries(statement.axes).forEach(([axis, points]) => {
      newScores[axis] += (points * multiplier)
    })
    setScores(newScores)

    if (quizIndex < STATEMENTS.length - 1) {
      setQuizIndex(quizIndex + 1)
    } else {
      // Fin du quiz : on calcule la personnalité et on navigue avec newScores
      const map = { passion: 'CREATIF', talent: 'ANALYTIQUE', besoins: 'SOCIAL', aspiration: 'METHODIQUE' }
      const entries = Object.entries(newScores)
      entries.sort((a, b) => b[1] - a[1])
      const top = entries[0][0]
      const finalPersonnalite = map[top] || 'ANALYTIQUE'

      localStorage.setItem('kpekpe_onboarding_data', JSON.stringify({
        formData,
        scores: newScores,
        typeConsultation,
        personnalite: finalPersonnalite
      }));
      navigate('/login', { state: { fromOnboarding: true } });
    }
  }

  const getPersonnalite = () => {
    const entries = Object.entries(scores)
    entries.sort((a, b) => b[1] - a[1])
    const top = entries[0][0]
    const map = { passion: 'CREATIF', talent: 'ANALYTIQUE', besoins: 'SOCIAL', aspiration: 'METHODIQUE' }
    return map[top] || 'ANALYTIQUE'
  }

  const handleSubmitAccount = async () => {
    setError('')
    if (!email || !password) {
      setError('Remplis tous les champs')
      return
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const userId = authData.user?.id
      if (userId) {
        const personnalite = getPersonnalite()
        await supabase.from('user_profile').insert({
          id: userId,
          prenom: 'Nouveau User',
          niveau: formData.classe || formData.domaine || '',
          serie: formData.serie || null,
          region: formData.region || '',
          type_consultation: typeConsultation,
          centres_interet: formData.univers ? [formData.univers] : [],
          competences: formData.points_forts,
          score_passion: scores.passion,
          score_talent: scores.talent,
          score_besoins: scores.besoins,
          score_aspiration: scores.aspiration,
          personnalite,
          onboarding_complete: true,
        })
      }

      navigate('/accueil', { replace: true })
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const currentScreen = flow[currentIndex]

  const canContinue = () => {
    switch (currentScreen) {
      case 'CLASSE_MATIERE': return formData.classe && formData.matieres.length > 0;
      case 'SERIE_REGION': return formData.serie && formData.region;
      case 'ETUDES_DUREE_REGION': return formData.domaine && formData.duree && formData.region;
      case 'UNIVERS': return !!formData.univers;
      case 'POINTS_FORTS': return formData.points_forts.length > 0;
      case 'ACCOUNT': return email && password && confirmPassword;
      default: return true;
    }
  }

  const handleNext = () => {
    if (currentIndex < flow.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const renderScreen = () => {
    const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 24px' }
    const titleStyle = { fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '26px', fontWeight: 'bold', color: '#000000', margin: '0 0 16px 0', lineHeight: '1.2' }
    const subtitleStyle = { fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '15px', color: '#6B7280', margin: '-12px 0 16px 0' }
    const chipContainerStyle = { display: 'flex', flexWrap: 'wrap', gap: '12px' }

    switch (currentScreen) {
      case 'CLASSE_MATIERE':
        return (
          <div style={sectionStyle}>
            <div>
              <h2 style={titleStyle}>Tu es en quelle classe ?</h2>
              <div style={chipContainerStyle}>
                {['3ème', '2nde redoublant'].map(opt => (
                  <Chip key={opt} label={opt} selected={formData.classe === opt} onClick={() => updateField('classe', opt)} />
                ))}
              </div>
            </div>
            <div>
              <h2 style={titleStyle}>Tes matières préférées ?</h2>
              <p style={subtitleStyle}>Choisis jusqu'à 3</p>
              <div style={chipContainerStyle}>
                {MATIERES_COLLEGE.map(opt => {
                  const selected = formData.matieres.includes(opt)
                  return (
                    <Chip 
                      key={opt} 
                      label={opt} 
                      selected={selected} 
                      onClick={() => {
                        if (selected) {
                          updateField('matieres', formData.matieres.filter(m => m !== opt))
                        } else if (formData.matieres.length < 3) {
                          updateField('matieres', [...formData.matieres, opt])
                        }
                      }} 
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      case 'SERIE_REGION':
        return (
          <div style={sectionStyle}>
            <div>
              <h2 style={titleStyle}>Tu es en quelle série ?</h2>
              <div style={chipContainerStyle}>
                {SERIES.map(opt => (
                  <Chip key={opt} label={opt} selected={formData.serie === opt} onClick={() => updateField('serie', opt)} />
                ))}
              </div>
            </div>
            <div>
              <h2 style={titleStyle}>Ta région ?</h2>
              <div style={chipContainerStyle}>
                {REGIONS.map(opt => (
                  <Chip key={opt} label={opt} selected={formData.region === opt} onClick={() => updateField('region', opt)} />
                ))}
              </div>
            </div>
          </div>
        )
      case 'ETUDES_DUREE_REGION':
        return (
          <div style={sectionStyle}>
             <div>
              <h2 style={titleStyle}>Tu étudies quoi actuellement ?</h2>
              <input
                type="text"
                placeholder="Ex: Informatique, Médecine..."
                value={formData.domaine}
                onChange={(e) => updateField('domaine', e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#ffffff',
                  fontSize: '15px',
                  fontFamily: '"Be Vietnam Pro", sans-serif',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <h2 style={titleStyle}>Depuis combien de temps ?</h2>
              <div style={chipContainerStyle}>
                {DUREES.map(opt => (
                  <Chip key={opt} label={opt} selected={formData.duree === opt} onClick={() => updateField('duree', opt)} />
                ))}
              </div>
            </div>
            <div>
              <h2 style={titleStyle}>Ta région ?</h2>
              <div style={chipContainerStyle}>
                {REGIONS.map(opt => (
                  <Chip key={opt} label={opt} selected={formData.region === opt} onClick={() => updateField('region', opt)} />
                ))}
              </div>
            </div>
          </div>
        )
      case 'UNIVERS':
        return (
          <div style={sectionStyle}>
            <div>
              <h2 style={titleStyle}>C'est quoi ton univers ?</h2>
              <p style={subtitleStyle}>Choisis ce qui t'attire</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {UNIVERS.map(item => (
                  <UniversCard 
                    key={item.id} 
                    item={item} 
                    selected={formData.univers === item.id} 
                    onClick={() => updateField('univers', item.id)} 
                  />
                ))}
              </div>
            </div>
          </div>
        )
      case 'POINTS_FORTS':
        return (
          <div style={sectionStyle}>
            <div>
              <h2 style={titleStyle}>C'est quoi tes points forts ?</h2>
              <p style={subtitleStyle}>Choisis ce qui te ressemble</p>
              <div style={chipContainerStyle}>
                {POINTS_FORTS.map(opt => {
                  const selected = formData.points_forts.includes(opt)
                  return (
                    <Chip 
                      key={opt} 
                      label={opt} 
                      selected={selected} 
                      onClick={() => {
                        if (selected) {
                          updateField('points_forts', formData.points_forts.filter(p => p !== opt))
                        } else {
                          updateField('points_forts', [...formData.points_forts, opt])
                        }
                      }} 
                    />
                  )
                })}
              </div>
            </div>
          </div>
        )
      case 'QUIZ':
        const statement = STATEMENTS[quizIndex]
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 24px', flex: 1 }}>
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '32px' }}>
              <span style={{ color: '#6B7280', fontSize: '15px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
                {quizIndex + 1} / {STATEMENTS.length}
              </span>
            </div>

            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '24px', 
              border: '1px solid #F3F4F6', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', 
              padding: '32px', 
              width: '100%', 
              minHeight: '180px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              textAlign: 'center', 
              marginBottom: 'auto' 
            }}>
              <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 'bold', fontSize: '24px', color: '#000000', lineHeight: '1.4', margin: 0 }}>
                {statement.text}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', paddingBottom: '32px', marginTop: '40px' }}>
              <button
                onClick={() => handleQuizAnswer('oui')}
                style={{ width: '100%', height: '56px', borderRadius: '999px', backgroundColor: '#009640', color: '#ffffff', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Oui
              </button>
              <button
                onClick={() => handleQuizAnswer('bof')}
                style={{ width: '100%', height: '56px', borderRadius: '999px', backgroundColor: '#E5E7EB', color: '#111827', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Bof
              </button>
              <button
                onClick={() => handleQuizAnswer('non')}
                style={{ width: '100%', height: '56px', borderRadius: '999px', backgroundColor: '#ffffff', border: '2px solid #111827', color: '#111827', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                Non
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Calculate progress bar info (4 main segments up to QUIZ)
  const totalMacroSteps = flow.indexOf('QUIZ') >= 0 ? 4 : flow.length
  let currentMacroStep = currentIndex
  if (currentScreen === 'QUIZ') currentMacroStep = 3

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', justifyContent: 'center' }}>
      <div 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          width: '100%', 
          maxWidth: '393px', 
          height: '100vh', 
          backgroundColor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        
        {/* ProgressBar Top */}
          <div style={{ display: 'flex', gap: '6px', padding: '0 24px', marginTop: '32px', marginBottom: '24px', flexShrink: 0 }}>
            {Array.from({ length: totalMacroSteps }).map((_, i) => (
              <div 
                key={i} 
                style={{ 
                  flex: 1, 
                  height: '6px', 
                  borderRadius: '999px', 
                  backgroundColor: i <= currentMacroStep ? '#009640' : '#E5E7EB' 
                }} 
              />
            ))}
          </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}>
          {renderScreen()}
        </div>

        {/* Footer Button (not on QUIZ) */}
        {currentScreen !== 'QUIZ' && (
          <div style={{ padding: '16px 24px 32px 24px', width: '100%', backgroundColor: '#ffffff', flexShrink: 0, marginTop: 'auto' }}>
            <button
              onClick={handleNext}
              disabled={loading || !canContinue()}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '999px',
                fontWeight: 'bold',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                border: 'none',
                cursor: (loading || !canContinue()) ? 'not-allowed' : 'pointer',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                backgroundColor: (loading || !canContinue()) ? '#E5E7EB' : '#009640',
                color: (loading || !canContinue()) ? '#9CA3AF' : '#ffffff'
              }}
            >
              {loading ? (
                <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Continuer'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
