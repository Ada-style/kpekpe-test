import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserProfile } from '../lib/rag'
import { supabase } from '../lib/supabase'

const font = '"Plus Jakarta Sans", sans-serif'

export default function AccueilPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    try {
      const [profileData, sessionsData, docsData] = await Promise.all([
        getUserProfile(user.id),
        supabase.from('sessions_ia').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('documents').select('id, titre, contenu, categorie').limit(6),
      ])
      setProfile(profileData)
      setSessions(sessionsData.data || [])
      setDocuments(docsData.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const maxScore = 8
  const passionPct = profile ? Math.round((profile.score_passion / maxScore) * 100) : 0
  const talentPct = profile ? Math.round((profile.score_talent / maxScore) * 100) : 0
  const besoinsPct = profile ? Math.round((profile.score_besoins / maxScore) * 100) : 0
  const aspirationPct = profile ? Math.round((profile.score_aspiration / maxScore) * 100) : 0
  const totalScore = Math.round((passionPct + talentPct + besoinsPct + aspirationPct) / 4)

  const prenom = profile?.prenom || 'Ami(e)'
  const nom = profile?.nom || ''
  const initial = prenom.charAt(0).toUpperCase()
  const personnalite = profile?.personnalite || ''

  const lastSession = sessions.length > 0 ? sessions[0] : null

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', maxWidth: 430, margin: '0 auto', fontFamily: font }}>
        <div style={{ width: 40, height: 40, border: '3px solid #009640', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', paddingBottom: 100, maxWidth: 430, margin: '0 auto', fontFamily: font }}>
      {/* Header */}
      <div style={{ padding: '48px 20px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Bonjour</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '2px 0 0 0' }}>{prenom} {nom ? nom.charAt(0).toUpperCase() : initial}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Notification bell */}
            <button style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }} id="btn-notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {/* Avatar */}
            <button onClick={() => navigate('/profil')} style={{ width: 40, height: 40, borderRadius: '50%', background: '#009640', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} id="btn-profile-avatar">
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: font }}>{initial}</span>
            </button>
          </div>
        </div>
      </div>

      {/* IKIGAI Profile Card */}
      <div style={{ padding: '0 20px', marginBottom: 16 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Mini Venn Diagram */}
          <div style={{ width: 56, height: 56, flexShrink: 0, position: 'relative' }}>
            <svg viewBox="0 0 56 56" width="56" height="56">
              <circle cx="20" cy="20" r="14" fill="#FF6B6B" opacity="0.6" />
              <circle cx="36" cy="20" r="14" fill="#4ECDC4" opacity="0.6" />
              <circle cx="20" cy="36" r="14" fill="#45B7D1" opacity="0.6" />
              <circle cx="36" cy="36" r="14" fill="#FFA07A" opacity="0.6" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>Ton profil IKIGAI</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {personnalite || 'Non défini'}
              </p>
              {personnalite && (
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#009640', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <div style={{ flex: 1, height: 8, background: '#E5E7EB', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#009640', borderRadius: 999, transition: 'width 0.7s', width: `${totalScore}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#009640', flexShrink: 0 }}>{totalScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Scroll — dynamique depuis le profil */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {/* "Toi" button always first */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280' }}>Toi</span>
          </div>
          {/* Dynamic centres d'intérêt */}
          {(profile?.centres_interet || []).map((centre, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F0FDF4', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{centre}</span>
            </div>
          ))}
          {/* Competences */}
          {(profile?.competences || []).slice(0, 3).map((comp, i) => (
            <div key={`c${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F0FDF4', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#6B7280', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{comp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue session banner */}
      {lastSession && (
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <div style={{ background: '#FFED00', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>Continue ta séance</p>
              <p style={{ fontSize: 12, color: '#444', marginTop: 4, margin: '4px 0 0 0' }}>
                {lastSession.synthese ? lastSession.synthese.slice(0, 30) + '...' : 'Séance d\'orientation'}
              </p>
            </div>
            <button onClick={() => navigate('/kpekpe')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 999, padding: '8px 16px', border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }} id="btn-resume-session">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#009640"><polygon points="5,3 19,12 5,21" /></svg>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#009640', fontFamily: font }}>Reprendre</span>
            </button>
          </div>
        </div>
      )}

      {/* Recommendations — dynamique */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: '0 0 12px 0' }}>Tes recommandations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Métiers */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>Métiers</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: '2px 0 0 0' }}>
              {profile?.competences?.length || 0} pour toi
            </p>
          </div>
          {/* Écoles */}
          <div style={{ background: '#FFFDE7', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,237,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>Écoles</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: '2px 0 0 0' }}>
              {profile?.region ? `au ${profile.region}` : 'Voir tout'}
            </p>
          </div>
          {/* Habitudes */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>Habitudes</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: '2px 0 0 0' }}>
              {sessions.length} clés
            </p>
          </div>
          {/* Learnia */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>Learnia</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: '2px 0 0 0' }}>
              {documents.length} cours
            </p>
          </div>
        </div>
      </div>

      {/* Actualités — dynamique */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: '0 0 12px 0' }}>Actualités</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {documents.slice(0, 3).map((doc) => (
            <div key={doc.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.titre}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    {doc.categorie || 'Info'}
                  </span>
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
          {documents.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Aucune actualité pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
