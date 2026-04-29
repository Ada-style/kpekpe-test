import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserProfile } from '../lib/rag'
import { supabase } from '../lib/supabase'

const font = '"Plus Jakarta Sans", sans-serif'

function ProgressBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontWeight: 600, fontSize: 14, color: '#111', width: 90, fontFamily: font }}>{label}</span>
      <div style={{ flex: 1, height: 12, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, transition: 'width 1s ease-out', width: `${value}%`, backgroundColor: color }} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 700, width: 44, textAlign: 'right', color, fontFamily: font }}>{value}%</span>
    </div>
  )
}

export default function SuiviPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    if (user) loadData()
    else setLoading(false)
  }, [user])

  const loadData = async () => {
    try {
      const [profileData, sessionsData] = await Promise.all([
        getUserProfile(user.id),
        supabase.from('sessions_ia').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(profileData)
      setSessions(sessionsData.data || [])
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
  const globalScore = Math.round((passionPct + talentPct + besoinsPct + aspirationPct) / 4)

  // SVG Radar Chart helpers
  const radarSize = 300
  const center = radarSize / 2
  const maxR = 90
  const axes = [
    { label: 'Passion', value: passionPct, angle: -90 },
    { label: 'Talent', value: talentPct, angle: 0 },
    { label: 'Besoins', value: besoinsPct, angle: 90 },
    { label: 'Aspiration', value: aspirationPct, angle: 180 },
  ]

  const getPoint = (angleDeg, radius) => {
    const rad = (angleDeg * Math.PI) / 180
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const dataPoints = axes.map(a => getPoint(a.angle, (a.value / 100) * maxR))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

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
      <div style={{ background: '#009640', padding: '48px 20px 24px 20px', borderRadius: '0 0 32px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Mon Suivi</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Progression IKIGAI & historique des séances</p>
      </div>

      {/* Global score card */}
      <div style={{ padding: '0 20px', marginTop: -16 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 20, display: 'flex', alignItems: 'center', gap: 20, position: 'relative', zIndex: 10 }}>
          {/* Circle score */}
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#D1FAE5" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="#009640" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(globalScore / 100) * 213.6} 213.6`}
                style={{ transition: 'stroke-dasharray 1s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 18, color: '#009640' }}>{globalScore}%</span>
            </div>
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: 0 }}>Score IKIGAI global</h2>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, margin: '2px 0 0 0' }}>
              {sessions.length} séance{sessions.length !== 1 ? 's' : ''} complétée{sessions.length !== 1 ? 's' : ''} · Profil
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: '0' }}>
              {profile?.personnalite || 'Non défini'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#009640' }}>Profil actif</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Radar Chart */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: 0 }}>Profil IKIGAI</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox={`0 0 ${radarSize} ${radarSize}`} width={radarSize} height={radarSize}>
              {/* Grid */}
              {gridLevels.map((level, i) => {
                const r = maxR * level
                const points = axes.map(a => getPoint(a.angle, r))
                const path = points.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
                return <path key={i} d={path} fill="none" stroke="#E5E7EB" strokeWidth="1" />
              })}
              {/* Axes lines */}
              {axes.map((a, i) => {
                const p = getPoint(a.angle, maxR)
                return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#E5E7EB" strokeWidth="1" />
              })}
              {/* Data polygon */}
              <path d={dataPath} fill="rgba(0,150,64,0.15)" stroke="#009640" strokeWidth="2" />
              {/* Data dots */}
              {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#009640" />
              ))}
              {/* Labels */}
              {axes.map((a, i) => {
                const labelR = maxR + 22
                const p = getPoint(a.angle, labelR)
                return (
                  <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: 12, fill: '#111', fontWeight: 500, fontFamily: font }}>
                    {a.label}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ padding: '0 20px', marginTop: 20 }}>
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 16px 0' }}>Progression par pilier</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProgressBar label="Passion" value={passionPct} color="#EF4444" />
            <ProgressBar label="Talent" value={talentPct} color="#3B82F6" />
            <ProgressBar label="Besoins" value={besoinsPct} color="#F97316" />
            <ProgressBar label="Aspiration" value={aspirationPct} color="#2563EB" />
          </div>
        </div>
      </div>

      {/* Session history */}
      <div style={{ padding: '0 20px', marginTop: 20, marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, fontSize: 14, color: '#111', margin: '0 0 12px 0' }}>Historique des séances</h3>
        {sessions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions.map((session) => (
              <div key={session.id} onClick={() => setSelectedSession(session)} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, color: '#111', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.synthese || 'Séance d\'orientation'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {new Date(session.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Aucune séance pour le moment</p>
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 430, height: '85vh', borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>Détail de la séance</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#6B7280' }}>{new Date(selectedSession.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setSelectedSession(null)} style={{ border: 'none', background: '#F3F4F6', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Content - Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16, background: '#F9FAFB' }}>
              {(selectedSession.messages || []).map((msg, i) => (
                <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                    background: msg.role === 'user' ? '#009640' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#111',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Modal Footer */}
            <div style={{ padding: '20px', borderTop: '1px solid #F3F4F6' }}>
              <button onClick={() => setSelectedSession(null)} style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#009640', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
