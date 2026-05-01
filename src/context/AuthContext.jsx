import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Gère uniquement l'auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Gère la création de profil séparément
  useEffect(() => {
    if (!user) return

    const createProfile = async () => {
      try {
        const { data: existingProfile } = await supabase
          .from('user_profile')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          const meta = user.user_metadata || {}
          const fullName = meta.full_name || meta.name || ''
          const nameParts = fullName.trim().split(' ')
          const nom = nameParts[0] || ''
          const prenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nom

          let profileData = {
            id: user.id,
            nom,
            prenom,
            onboarding_complete: false
          }

          const onboardingDataRaw = localStorage.getItem('kpekpe_onboarding_data')
          if (onboardingDataRaw) {
            try {
              const ob = JSON.parse(onboardingDataRaw)
              profileData = {
                ...profileData,
                niveau: ob.formData?.classe || ob.formData?.domaine || '',
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
              localStorage.removeItem('kpekpe_onboarding_data')
            } catch (e) {
              console.error("Erreur parsing onboarding data", e)
            }
          }

          await supabase.from('user_profile').insert(profileData)
        }
      } catch (error) {
        console.error("Erreur création profil:", error)
      }
    }

    createProfile()
  }, [user])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
