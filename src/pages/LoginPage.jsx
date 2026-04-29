import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Mail, Lock, ArrowRight, User, Phone, GraduationCap, School, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const fromOnboarding = location.state?.fromOnboarding || false
  const [tab, setTab] = useState(fromOnboarding ? 'inscription' : 'connexion')
  
  // Champs Inscription & Connexion
  const [nomComplet, setNomComplet] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [classe, setClasse] = useState('')
  const [ecole, setEcole] = useState('')
  
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) navigate('/accueil', { replace: true })
  }, [user, navigate])

  const handleLogin = async () => {
    setError('')
    if (!email || !password) {
      setError('Remplis tous les champs obligatoires')
      return
    }
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
      navigate('/accueil', { replace: true })
    } catch (err) {
      setError(err.message || 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setError('')
    if (!nomComplet || !email || !password) {
      setError('Le nom, l\'email et le mot de passe sont obligatoires')
      return
    }
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (userId) {
        // Récupération des données d'onboarding si présentes
        const onboardingDataRaw = localStorage.getItem('kpekpe_onboarding_data')
        const nameParts = nomComplet.trim().split(' ')
        const parsedNom = nameParts[0]
        const parsedPrenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : parsedNom

        let profileData = {
          id: userId,
          nom: parsedNom,
          prenom: parsedPrenom,
          telephone: telephone || null,
          niveau: classe || '',
          ecole: ecole || '',
          onboarding_complete: false
        }

        if (onboardingDataRaw) {
          try {
            const ob = JSON.parse(onboardingDataRaw)
            profileData = {
              ...profileData,
              niveau: classe || ob.formData?.classe || ob.formData?.domaine || '',
              serie: ob.formData?.serie || null,
              region: ob.formData?.region || '',
              type_consultation: ob.typeConsultation || '',
              centres_interet: ob.formData?.univers ? [ob.formData.univers] : [],
              competences: ob.formData?.points_forts || [],
              score_passion: ob.scores?.passion || 0,
              score_talent: ob.scores?.talent || 0,
              score_besoins: ob.scores?.besoins || 0,
              score_aspiration: ob.scores?.aspiration || 0,
              personnalite: ob.personnalite || '',
              onboarding_complete: true
            }
            // On nettoie le localStorage
            localStorage.removeItem('kpekpe_onboarding_data')
          } catch(e) {
            console.error("Erreur parsing onboarding data", e)
          }
        }

        const { error: profileError } = await supabase.from('user_profile').insert(profileData)
        if (profileError) {
          console.error("Erreur insertion profil:", profileError)
          alert(`Erreur d'insertion dans la base de données : ${profileError.message || JSON.stringify(profileError)}`)
        }
      }

      navigate('/accueil', { replace: true })
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  const containerStyle = {
    width: '100%',
    maxWidth: '393px',
    minHeight: '100vh',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={containerStyle}>
        
        {/* Header Vert */}
        <div style={{ 
          backgroundColor: '#00b050', // Vert un peu plus vif comme sur la maquette
          borderBottomLeftRadius: '32px', 
          borderBottomRightRadius: '32px', 
          padding: '48px 24px 48px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Logo icon */}
          <div style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '16px',
            backdropFilter: 'blur(4px)'
          }}>
            <img src="/icons/icon-192.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '26px', fontWeight: 'bold', color: '#ffffff', margin: '0 0 4px 0' }}>
            {tab === 'connexion' ? 'Bon retour !' : 'Rejoins Kpékpé'}
          </h1>
          <p style={{ fontFamily: '"Be Vietnam Pro", sans-serif', color: 'rgba(255,255,255,0.8)', fontSize: '15px', margin: 0 }}>
            {tab === 'connexion' ? 'Connecte-toi pour continuer' : 'Crée ton compte gratuitement'}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ 
          margin: '-24px 24px 24px 24px', 
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
          display: 'flex', 
          padding: '4px',
          zIndex: 10,
          position: 'relative'
        }}>
          <button
            onClick={() => { setTab('connexion'); setError('') }}
            style={{ 
              flex: 1, 
              padding: '14px 0', 
              borderRadius: '12px', 
              fontFamily: '"Plus Jakarta Sans", sans-serif', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              border: 'none', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: tab === 'connexion' ? '#009640' : 'transparent',
              color: tab === 'connexion' ? '#ffffff' : '#6B7280'
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => { setTab('inscription'); setError('') }}
            style={{ 
              flex: 1, 
              padding: '14px 0', 
              borderRadius: '12px', 
              fontFamily: '"Plus Jakarta Sans", sans-serif', 
              fontWeight: 'bold', 
              fontSize: '15px', 
              border: 'none', 
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: tab === 'inscription' ? '#009640' : 'transparent',
              color: tab === 'inscription' ? '#ffffff' : '#6B7280'
            }}
          >
            Inscription
          </button>
        </div>

        {/* Form Container */}
        <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {error && (
            <div style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '14px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tab === 'inscription' && (
              <>
                <div style={{ position: 'relative' }}>
                  <User size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Nom complet" value={nomComplet} onChange={e => setNomComplet(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ position: 'relative' }}>
                  <Phone size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="tel" placeholder="Numéro de téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            <div style={{ position: 'relative' }}>
              <Mail size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="email" placeholder="Adresse email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ position: 'relative' }}>
              <Lock size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            </div>

            {tab === 'inscription' && (
              <>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Classe (ex: Terminale D)" value={classe} onChange={e => setClasse(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ position: 'relative' }}>
                  <School size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Établissement scolaire" value={ecole} onChange={e => setEcole(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            {tab === 'connexion' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', padding: '0 4px' }}>
                <button type="button" onClick={() => setRememberMe(!rememberMe)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', fontFamily: '"Be Vietnam Pro", sans-serif', fontSize: '13px' }}>
                  <CheckCircle2 size={18} color={rememberMe ? '#009640' : '#D1D5DB'} fill={rememberMe ? '#e9f5ed' : 'none'} />
                  Se souvenir de moi
                </button>
                <button type="button" style={{ color: '#009640', fontWeight: 'bold', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Mot de passe oublié ?
                </button>
              </div>
            )}
          </div>

          <button
            onClick={tab === 'connexion' ? handleLogin : handleSignup}
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              backgroundColor: '#009640',
              color: '#ffffff',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 'bold',
              fontSize: '16px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '24px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Chargement...' : tab === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
            {!loading && <ArrowRight size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span style={{ color: '#9CA3AF', fontSize: '13px', fontFamily: '"Be Vietnam Pro", sans-serif' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          <button
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #E5E7EB',
              color: '#111827',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '32px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', fontFamily: '"Be Vietnam Pro", sans-serif', color: '#6B7280', paddingBottom: '32px' }}>
            {tab === 'connexion' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
            <button 
              onClick={() => setTab(tab === 'connexion' ? 'inscription' : 'connexion')} 
              style={{ background: 'none', border: 'none', color: '#009640', fontWeight: 'bold', fontFamily: '"Plus Jakarta Sans", sans-serif', cursor: 'pointer', padding: 0 }}
            >
              {tab === 'connexion' ? 'Inscris-toi' : 'Connecte-toi'}
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '16px 16px 16px 48px',
  borderRadius: '16px',
  border: '1px solid #F3F4F6',
  backgroundColor: '#ffffff',
  fontSize: '15px',
  fontFamily: '"Be Vietnam Pro", sans-serif',
  outline: 'none',
  color: '#111827',
  boxSizing: 'border-box',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}
