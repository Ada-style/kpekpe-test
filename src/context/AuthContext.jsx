import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch((error) => {
        console.error("Erreur getSession:", error)
      })
      .finally(() => {
        setLoading(false) // ✅ toujours appelé, même en cas d'erreur
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)

        if (currentUser && (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED')) {
          try {
            const { data: existingProfile } = await supabase
              .from('user_profile')
              .select('id')
              .eq('id', currentUser.id) // ✅ corrigé
              .single()

            if (!existingProfile) {
              const meta = currentUser.user_metadata || {}
              const fullName = meta.full_name || meta.name || '' // ✅ corrigé
              const nameParts = fullName.trim().split(' ')
              const nom = nameParts[0] || ''
              const prenom = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nom

              let profileData = {
                id: currentUser.id, // ✅ corrigé
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
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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
