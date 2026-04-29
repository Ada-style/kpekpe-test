import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const font = '"Plus Jakarta Sans", sans-serif'

export default function LearniaPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [ecoles, setEcoles] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [docsRes, ecolesRes, profileRes] = await Promise.all([
        supabase.from('documents').select('id, titre, contenu, categorie').order('created_at', { ascending: false }),
        supabase.from('ecoles').select('*'),
        user ? supabase.from('user_profile').select('*').eq('id', user.id).single() : { data: null }
      ])
      
      setDocuments(docsRes.data || [])
      setEcoles(ecolesRes.data || [])
      setUserProfile(profileRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Count by category dynamically
  const categories = documents.reduce((acc, doc) => {
    const cat = doc.categorie || 'Autre'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  const categoryCards = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      ),
      label: 'Formations',
      count: categories['formation'] || categories['Formation'] || documents.length,
      bg: '#F0FDF4',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>
      ),
      label: 'Écoles & Universités',
      count: categories['ecole'] || categories['Ecole'] || 0,
      bg: '#F0FDF4',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      ),
      label: 'Tutoriels',
      count: categories['tutoriel'] || categories['Tutoriel'] || 0,
      bg: '#F0FDF4',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      ),
      label: 'Centres de formation',
      count: categories['centre'] || categories['Centre'] || 0,
      bg: '#F0FDF4',
    },
  ]

  // Filter documents
  const filtered = searchQuery.trim()
    ? documents.filter(d =>
        d.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.contenu?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Learnia</h1>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px 0' }}>Formations, écoles, tutoriels pour ton orientation</p>
        {/* Search bar */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chercher une formation, école..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: font }}
            id="search-learnia"
          />
        </div>
      </div>

      {/* Category cards */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {categoryCards.map((card, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {card.icon}
              </div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0 }}>{card.label}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '2px 0 0 0' }}>{card.count > 0 ? card.count : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formations populaires — horizontal scroll */}
      <div style={{ padding: '20px 0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20, marginBottom: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: 0 }}>Formations populaires</h2>
          <span style={{ fontSize: 13, color: '#009640', fontWeight: 600, cursor: 'pointer' }}>Voir tout</span>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingRight: 20, paddingBottom: 4 }}>
          {filtered.length > 0 ? filtered.slice(0, 6).map((doc) => (
            <div key={doc.id} style={{ minWidth: 200, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, flexShrink: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.titre}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span style={{ fontSize: 11, color: '#6B7280' }}>{doc.categorie || 'Info'}</span>
              </div>
              {doc.categorie && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#009640', background: '#F0FDF4', borderRadius: 6, padding: '2px 8px' }}>{doc.categorie}</span>
                </div>
              )}
            </div>
          )) : (
            <div style={{ minWidth: 200, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Aucune formation disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Écoles Recommandées */}
      <div style={{ padding: '20px 0 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20, marginBottom: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: 0 }}>Écoles recommandées pour vous</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingRight: 20, paddingBottom: 4 }}>
          {ecoles.length > 0 ? (() => {
            const interests = userProfile?.centres_interet?.map(i => i.toLowerCase()) || []
            const sortedEcoles = [...ecoles].sort((a, b) => {
              const aDom = (a.domaines || []).map(d => d.toLowerCase())
              const bDom = (b.domaines || []).map(d => d.toLowerCase())
              const aMatch = interests.filter(i => aDom.some(d => d.includes(i) || i.includes(d))).length
              const bMatch = interests.filter(i => bDom.some(d => d.includes(i) || i.includes(d))).length
              return bMatch - aMatch
            })

            return sortedEcoles.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((ecole) => (
              <div key={ecole.id} style={{ minWidth: 220, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, flexShrink: 0, border: interests.length > 0 && interests.some(i => (ecole.domaines||[]).join(' ').toLowerCase().includes(i)) ? '1px solid #009640' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 12 3 12 0v-5"/></svg>
                  </div>
                  {interests.length > 0 && interests.some(i => (ecole.domaines||[]).join(' ').toLowerCase().includes(i)) && (
                    <span style={{ fontSize: 10, background: '#009640', color: 'white', padding: '2px 6px', borderRadius: 8, fontWeight: 600 }}>100% Match</span>
                  )}
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ecole.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ fontSize: 11, color: '#6B7280' }}>{ecole.ville} • {ecole.type}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(ecole.domaines || []).slice(0, 2).map((dom, idx) => (
                    <span key={idx} style={{ fontSize: 10, color: '#2563EB', background: '#DBEAFE', borderRadius: 4, padding: '2px 6px' }}>{dom}</span>
                  ))}
                </div>
              </div>
            ))
          })() : null}
        </div>
      </div>

      {/* Tutoriels & Infos */}
      <div style={{ padding: '20px 20px 0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111', margin: 0 }}>Tutoriels & Infos utiles</h2>
          <span style={{ fontSize: 13, color: '#009640', fontWeight: 600, cursor: 'pointer' }}>Voir tout</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.slice(0, 4).map((doc) => (
            <div key={doc.id} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009640" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.titre}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.contenu?.slice(0, 60) || ''}
                </p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
          {documents.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>Aucun contenu pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
