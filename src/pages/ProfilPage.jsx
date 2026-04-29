import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserProfile } from '../lib/rag'
import { supabase } from '../lib/supabase'

const font = '"Plus Jakarta Sans", sans-serif'

export default function ProfilPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    telephone: '',
    ecole: '',
    region: '',
    niveau: ''
  })

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    try {
      const [profileData, sessionsData] = await Promise.all([
        getUserProfile(user.id),
        supabase.from('sessions_ia').select('id').eq('user_id', user.id),
      ])
      setProfile(profileData)
      setSessions(sessionsData.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const openEditModal = () => {
    setFormData({
      telephone: profile?.telephone || '',
      ecole: profile?.ecole || '',
      region: profile?.region || '',
      niveau: profile?.niveau || ''
    })
    setIsEditing(true)
  }

  const handleMenuClick = (label) => {
    if (label === 'Mes informations') {
      openEditModal()
    } else if (label === 'Historique des tests') {
      alert("Votre historique des tests sera bientôt détaillé ici.")
    } else if (label === 'Mes favoris') {
      alert("La gestion de vos favoris (écoles, formations) arrive bientôt !")
    } else if (label === 'Notifications' || label === 'Mot de passe') {
      alert("Cette fonctionnalité est en cours de développement.")
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profile')
        .update(formData)
        .eq('id', user.id)
      
      if (!error) {
        setProfile({ ...profile, ...formData })
        setIsEditing(false)
      } else {
        alert("Erreur lors de la sauvegarde du profil.")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const prenom = profile?.prenom || ''
  const nom = profile?.nom || ''
  const fullName = `${nom.toUpperCase()} ${prenom}`
  const initial = (prenom || nom || 'U').charAt(0).toUpperCase()
  const email = user?.email || ''

  const maxScore = 8
  const passionPct = profile ? Math.round((profile.score_passion / maxScore) * 100) : 0
  const talentPct = profile ? Math.round((profile.score_talent / maxScore) * 100) : 0
  const besoinsPct = profile ? Math.round((profile.score_besoins / maxScore) * 100) : 0
  const aspirationPct = profile ? Math.round((profile.score_aspiration / maxScore) * 100) : 0
  const ikigaiScore = Math.round((passionPct + talentPct + besoinsPct + aspirationPct) / 4)

  const testsCount = sessions.length
  const xpLearnia = sessions.length * 280

  const menuItems = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      ),
      label: 'Mes informations',
      sub: 'Modifier mon profil',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ),
      label: 'Historique des tests',
      sub: `${testsCount} test${testsCount !== 1 ? 's' : ''} réalisé${testsCount !== 1 ? 's' : ''}`,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      ),
      label: 'Mes favoris',
      sub: `${(profile?.centres_interet || []).length} centres d'intérêt`,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      ),
      label: 'Notifications',
      sub: 'Gérer les alertes',
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      ),
      label: 'Mot de passe',
      sub: 'Modifier la sécurité',
    },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', maxWidth: 430, margin: '0 auto', fontFamily: font }}>
        <div style={{ width: 40, height: 40, border: '3px solid #009640', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', paddingBottom: 100, maxWidth: 430, margin: '0 auto', fontFamily: font }}>
      {/* Green header */}
      <div style={{ background: 'linear-gradient(135deg, #009640 0%, #007030 100%)', padding: '48px 20px 60px 20px', borderRadius: '0 0 32px 32px', position: 'relative', textAlign: 'center' }}>
        {/* Settings icon */}
        <button style={{ position: 'absolute', top: 48, right: 20, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>

        {/* Avatar */}
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{initial}</span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{fullName.trim() || 'Mon Profil'}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '4px 0 0 0' }}>{email}</p>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 12px', marginTop: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>Compte Gratuit</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px', marginTop: -24 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', zIndex: 10 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{testsCount}</p>
            <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>Tests passés</p>
          </div>
          <div style={{ width: 1, height: 32, background: '#E5E7EB' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{ikigaiScore}%</p>
            <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>IKIGAI Score</p>
          </div>
          <div style={{ width: 1, height: 32, background: '#E5E7EB' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{xpLearnia}</p>
            <p style={{ fontSize: 10, color: '#6B7280', margin: 0 }}>XP Learnia</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {menuItems.map((item, i) => (
            <div key={i} onClick={() => handleMenuClick(item.label)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 16px', borderBottom: i < menuItems.length - 1 ? '1px solid #F3F4F6' : 'none', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0 0' }}>{item.sub}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      </div>

      {/* Pass to Pro + Logout */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <button style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: 'linear-gradient(90deg, #FFED00, #FFD000)', border: 'none', fontWeight: 700, fontSize: 14, color: '#111', cursor: 'pointer', fontFamily: font, marginBottom: 12 }}>
          ⭐ Passer à Premium
        </button>
        <button onClick={handleLogout} style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: '#FEE2E2', border: 'none', fontWeight: 600, fontSize: 14, color: '#EF4444', cursor: 'pointer', fontFamily: font }}>
          Se déconnecter
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px 0', color: '#111' }}>Mes informations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Nom Complet</label>
                <input disabled value={fullName} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#9CA3AF', marginTop: 4, fontFamily: font, fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Téléphone</label>
                <input value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4, fontFamily: font, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>École / Université</label>
                <input value={formData.ecole} onChange={e => setFormData({...formData, ecole: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4, fontFamily: font, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Région</label>
                <input value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4, fontFamily: font, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>Niveau / Classe</label>
                <input value={formData.niveau} onChange={e => setFormData({...formData, niveau: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #E5E7EB', marginTop: 4, fontFamily: font, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#F3F4F6', color: '#4B5563', border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: font }}>Annuler</button>
              <button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#009640', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: font, opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
