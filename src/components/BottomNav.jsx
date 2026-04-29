import { NavLink, useLocation } from 'react-router-dom'

const font = '"Plus Jakarta Sans", sans-serif'

const tabs = [
  { path: '/accueil', label: 'Accueil', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#009640' : '#6B7280'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  )},
  { path: '/suivi', label: 'Suivi', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#009640' : '#6B7280'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  )},
  { path: '/kpekpe', label: 'Kpé', isCenter: true, icon: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  )},
  { path: '/learnia', label: 'Learnia', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#009640' : '#6B7280'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
  )},
  { path: '/profil', label: 'Profil', icon: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#009640' : '#6B7280'} strokeWidth={active ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )},
]

export default function BottomNav() {
  const location = useLocation()

  const hiddenPaths = ['/login', '/consultation', '/onboarding', '/admin']
  if (location.pathname === '/' || hiddenPaths.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div style={{ width: '100%', padding: '0 16px 12px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          borderRadius: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '8px 8px', position: 'relative'
        }}>
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path

            if (tab.isCenter) {
              return (
                <NavLink key={tab.path} to={tab.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -24, position: 'relative', textDecoration: 'none' }} id={`nav-${tab.label.toLowerCase()}`}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,150,64,0.3)',
                    background: isActive ? '#007030' : '#009640',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}>
                    {tab.icon(isActive)}
                  </div>
                  <span style={{ fontSize: 10, marginTop: 4, fontWeight: 500, color: isActive ? '#009640' : '#6B7280', fontFamily: font }}>{tab.label}</span>
                </NavLink>
              )
            }

            return (
              <NavLink key={tab.path} to={tab.path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 12px', textDecoration: 'none', position: 'relative' }} id={`nav-${tab.label.toLowerCase()}`}>
                {tab.icon(isActive)}
                <span style={{ fontSize: 10, fontWeight: 500, color: isActive ? '#009640' : '#6B7280', fontFamily: font, transition: 'color 0.2s' }}>{tab.label}</span>
                {isActive && (
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#009640', position: 'absolute', bottom: -2 }} />
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
