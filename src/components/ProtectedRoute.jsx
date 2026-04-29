import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Mode démo : bypasse l'auth si ?demo=true dans l'URL
  const searchParams = new URLSearchParams(location.search)
  const isDemo = searchParams.get('demo') === 'true'

  if (isDemo) {
    return children
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #009640', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly) {
    const role = user.user_metadata?.role
    if (role !== 'admin') {
      return <Navigate to="/accueil" replace />
    }
  }

  return children
}
