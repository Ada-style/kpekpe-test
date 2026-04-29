import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Compass, GraduationCap, RefreshCw } from 'lucide-react'

const consultationTypes = [
  {
    id: 'choix_serie',
    label: 'Choix de série',
    description: 'Je choisis ma série après le BEPC',
    icon: Compass,
  },
  {
    id: 'orientation_scolaire',
    label: 'Orientation scolaire',
    description: 'Je cherche ma voie après le Bac',
    icon: Compass,
  },
  {
    id: 'choix_formation',
    label: 'Choix de formation',
    description: 'Je veux trouver la bonne formation',
    icon: GraduationCap,
  },
  {
    id: 'reconversion',
    label: 'Reconversion',
    description: 'Je veux changer de carrière',
    icon: RefreshCw,
  },
]

export default function ConsultationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (user) navigate('/accueil', { replace: true })
  }, [user, navigate])

  const handleContinue = () => {
    if (!selected) return
    navigate('/onboarding', { state: { type_consultation: selected } })
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-white md:bg-[#F9FAFB] md:p-4">
      <div 
        className="relative flex flex-col w-full h-full min-h-screen md:min-h-0 bg-white overflow-hidden md:rounded-[32px] md:shadow-2xl md:border md:border-gray-100"
        style={{ maxWidth: '390px', height: '100%', maxHeight: '844px' }}
      >
        {/* Header Vert - Ajusté pour être plus grand avec beaucoup d'espace */}
        <div 
          className="bg-[#009640] px-6 w-full flex flex-col shrink-0"
          style={{ paddingTop: '72px', paddingBottom: '40px', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}
        >
          <h1 
            className="text-[32px] font-bold text-white leading-tight m-0 p-0"
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '-0.02em' }}
          >
            Bienvenue !
          </h1>
          <p 
            className="font-medium text-[16px] text-white mt-1 m-0 p-0"
            style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
          >
            Dis-nous pourquoi tu es là
          </p>
        </div>

        {/* Liste d'options - Plus espacée */}
        <div className="flex flex-col px-6 mt-8 w-full" style={{ gap: '16px' }}>
          {consultationTypes.map((type) => {
            const Icon = type.icon
            const isSelected = selected === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelected(type.id)}
                className={`flex items-center gap-4 text-left border w-full transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#ffed00] border-[#009640] shadow-sm'
                    : 'bg-white border-[#E5E7EB] hover:bg-gray-50'
                }`}
                style={{ padding: '18px 20px', borderRadius: '24px', minHeight: '88px' }}
                id={`consultation-${type.id}`}
              >
                {/* Icône */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white' : 'bg-[#F4F5F7]'
                }`}>
                  <Icon size={26} className="text-[#009640]" strokeWidth={2} />
                </div>

                {/* Textes */}
                <div className="flex flex-col flex-1">
                  <span 
                    className={`text-[18px] font-bold ${
                      isSelected ? 'text-[#000000]' : 'text-[#111827]'
                    }`}
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    {type.label}
                  </span>
                  <span 
                    className="text-[#6B7280] text-[14px] mt-0.5"
                    style={{ fontFamily: '"Be Vietnam Pro", sans-serif' }}
                  >
                    {type.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Espace flexible pour pousser le bouton tout en bas */}
        <div className="flex-1 min-h-[40px]"></div>

        {/* Bouton Continuer - Fixé en bas */}
        <div className="px-6 pb-10 pt-4 w-full bg-white shrink-0">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full h-[56px] rounded-full font-bold text-[18px] flex items-center justify-center transition-colors ${
              selected
                ? 'bg-[#009640] text-white active:scale-[0.98]'
                : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
            }`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
            id="btn-continue-consultation"
          >
            Continuer
          </button>
        </div>
      </div>
    </div>
  )
}
