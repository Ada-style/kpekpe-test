import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import BottomNav from './components/BottomNav'

import WelcomePage from './pages/WelcomePage'
import ConsultationPage from './pages/ConsultationPage'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import AccueilPage from './pages/AccueilPage'
import KpekpePage from './pages/KpekpePage'
import LearniaPage from './pages/LearniaPage'
import SuiviPage from './pages/SuiviPage'
import ProfilPage from './pages/ProfilPage'
import AdminPage from './pages/AdminPage'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-body text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center w-full">
      <div className="w-full max-w-[430px] bg-surface relative shadow-2xl flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-[90px]">
          <Routes>
            {/* Public routes - redirect to /accueil if logged in */}
            <Route path="/" element={user ? <Navigate to="/accueil" replace /> : <WelcomePage />} />
            <Route path="/consultation" element={user ? <Navigate to="/accueil" replace /> : <ConsultationPage />} />
            <Route path="/onboarding" element={user ? <Navigate to="/accueil" replace /> : <OnboardingPage />} />
            <Route path="/login" element={user ? <Navigate to="/accueil" replace /> : <LoginPage />} />

            {/* Protected routes */}
            <Route path="/accueil" element={<ProtectedRoute><AccueilPage /></ProtectedRoute>} />
            <Route path="/kpekpe" element={<ProtectedRoute><KpekpePage /></ProtectedRoute>} />
            <Route path="/learnia" element={<ProtectedRoute><LearniaPage /></ProtectedRoute>} />
            <Route path="/suivi" element={<ProtectedRoute><SuiviPage /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><ProfilPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
