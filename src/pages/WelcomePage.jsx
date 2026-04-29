import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Compass, MessageCircle, Rocket, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  const [step, setStep] = useState(0); // 0 = splash, 1 = slide 1, 2 = slide 2, 3 = slide 3
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/accueil', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else navigate('/consultation');
  };

  const handleSkip = () => {
    navigate('/consultation');
  };

  const containerStyle = {
    width: '100%',
    maxWidth: '393px',
    height: '100vh',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0,0,0,0.05)',
    backgroundColor: '#ffffff'
  };

  if (step === 0) {
    return (
      <div style={{ ...containerStyle, backgroundColor: '#20B95B', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
           <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9999px' }} />
           <div style={{ position: 'relative', width: '90px', height: '90px', backgroundColor: '#ffffff', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
             <img src="/icons/icon-192.png" alt="logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
           </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '2px 12px', marginBottom: '12px' }}>
          <h1 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 900, color: '#000000', fontSize: '26px', letterSpacing: '-0.025em', margin: 0 }}>Kpékpé</h1>
        </div>
        <p style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#ffffff', fontSize: '15px', marginBottom: '64px', letterSpacing: '0.025em', margin: '0 0 64px 0' }}>Trouve ta voie</p>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '9999px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '9999px' }} />
          <div style={{ width: '8px', height: '8px', backgroundColor: '#ffffff', borderRadius: '9999px' }} />
        </div>
      </div>
    );
  }

  const slides = [
    {
      title: "Découvre ton IKIGAI",
      desc: "Une méthode japonaise adaptée à la réalité togolaise pour trouver ta voie idéale.",
      icon: <Compass color="#ffffff" size={56} strokeWidth={1.5} />,
      boxBg: "#009640",
      lightBg: "#e9f5ed",
      buttonText: "Suivant",
      buttonIcon: <ArrowRight size={20} />,
      buttonBg: "#009640",
      buttonColor: "white",
      dotColor: "#009640",
      inactiveDotColor: "#bce4cd",
    },
    {
      title: "Ton conseiller IA",
      desc: "Parle avec Kpékpé IA pour obtenir des recommandations personnalisées sur ton avenir.",
      icon: <MessageCircle color="#ffffff" size={56} strokeWidth={1.5} />,
      boxBg: "#009640",
      lightBg: "#e9f5ed",
      buttonText: "Suivant",
      buttonIcon: <ArrowRight size={20} />,
      buttonBg: "#009640",
      buttonColor: "white",
      dotColor: "#009640",
      inactiveDotColor: "#bce4cd",
    },
    {
      title: "C'est parti !",
      desc: "Lance ton premier test IKIGAI et découvre les métiers, écoles et parcours faits pour toi.",
      icon: <Rocket color="#ffffff" size={56} strokeWidth={1.5} />,
      boxBg: "#ffed00",
      lightBg: "#fffde6",
      buttonText: "Commencer",
      buttonIcon: <Rocket size={20} />, 
      buttonBg: "#ffed00",
      buttonColor: "#000000",
      dotColor: "#ffed00",
      inactiveDotColor: "#fff9b3",
    }
  ];

  const slide = slides[step - 1];

  return (
    <div style={containerStyle}>
      {/* Top Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: slide.lightBg, transition: 'background-color 0.5s ease-in-out' }}>
        {/* Header */}
        <div style={{ paddingTop: '48px', paddingBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
          <img src="/icons/icon-192.png" alt="logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
          <span style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 'bold', color: '#000000', fontSize: '17px', letterSpacing: '-0.025em' }}>Kpékpé</span>
        </div>
        
        {/* Center Icon */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '32px' }} key={`icon-${step}`}>
          <div style={{ width: '140px', height: '140px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: slide.boxBg, boxShadow: `0 20px 40px -10px ${slide.boxBg}60`, transition: 'all 0.5s' }}>
             {slide.icon}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ backgroundColor: '#ffffff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', marginTop: '-32px', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 32px 48px 32px' }}>
        {/* Pagination Dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[0, 1, 2].map((i) => {
             const isActive = i === (step - 1);
             return (
               <div 
                 key={i} 
                 style={{ 
                   height: '8px', 
                   borderRadius: '9999px', 
                   transition: 'all 0.3s', 
                   width: isActive ? '28px' : '8px',
                   backgroundColor: isActive ? slide.dotColor : slide.inactiveDotColor 
                 }} 
               />
             );
          })}
        </div>

        {/* Text */}
        <div style={{ minHeight: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} key={`text-${step}`}>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '26px', fontWeight: 800, color: '#000000', marginBottom: '12px', textAlign: 'center', letterSpacing: '-0.025em', lineHeight: 1, margin: '0 0 12px 0' }}>
            {slide.title}
          </h2>
          <p style={{ fontFamily: '"Be Vietnam Pro", sans-serif', color: '#6B7280', textAlign: 'center', fontSize: '15px', lineHeight: 1.6, padding: '0 8px', margin: 0 }}>
            {slide.desc}
          </p>
        </div>

        {/* Button */}
        <button 
          onClick={handleNext} 
          style={{ 
            width: '100%', 
            marginTop: '40px', 
            padding: '18px 0', 
            borderRadius: '16px', 
            fontFamily: '"Plus Jakarta Sans", sans-serif', 
            fontWeight: 'bold', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            backgroundColor: slide.buttonBg, 
            color: slide.buttonColor,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {slide.buttonText}
          {slide.buttonIcon}
        </button>

        {/* Skip */}
        <button 
          onClick={handleSkip} 
          style={{ 
            marginTop: '24px', 
            color: 'rgba(0,0,0,0.4)', 
            fontFamily: '"Plus Jakarta Sans", sans-serif', 
            fontWeight: 500, 
            fontSize: '15px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Passer <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
