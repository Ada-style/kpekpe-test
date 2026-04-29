import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { askKpekpe, getUserProfile, saveSession } from '../lib/rag'

const font = '"Plus Jakarta Sans", sans-serif'

const PILLARS = [
  { key: 'passion', label: 'Passion', color: '#EF4444' },
  { key: 'talent', label: 'Talent', color: '#3B82F6' },
  { key: 'besoins', label: 'Besoins', color: '#F97316' },
  { key: 'aspiration', label: 'Aspiration', color: '#2563EB' },
]

export default function KpekpePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [questionCount, setQuestionCount] = useState(0)
  const [activePillar, setActivePillar] = useState(0)
  const [chatPhase, setChatPhase] = useState('questioning')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [sessionId, setSessionId] = useState(null)

  const CHAT_QUESTIONS = [
    "Dis-moi, quelles sont tes matières préférées à l’école ou celles où tu es le plus à l’aise ?",
    "Et en dehors des cours, qu’est-ce que tu aimes faire qui te fait vibrer ? (Sport, musique, bricolage...)",
    "Si tu pouvais résoudre un problème au Togo ou dans ton entourage, ce serait quoi ?",
    "Pour ton avenir, qu’est-ce qui compte le plus : la passion, un bon salaire, aider les autres, ou la stabilité ?",
    "As-tu des contraintes particulières ? (Budget études, envie de travailler vite, ou prêt pour de longues études ?)"
  ]
  const chatEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('kpekpe_current_chat')
    if (saved) {
      const state = JSON.parse(saved)
      setMessages(state.messages || [])
      setChatPhase(state.chatPhase || 'questioning')
      setQuestionIndex(state.questionIndex || 0)
      setAnswers(state.answers || [])
      setSessionId(state.sessionId || null)
      if (user) getUserProfile(user.id).then(setProfile)
    } else {
      initChat()
    }
  }, [user])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('kpekpe_current_chat', JSON.stringify({
        messages,
        chatPhase,
        questionIndex,
        answers,
        sessionId
      }))
    }
  }, [messages, chatPhase, questionIndex, answers, sessionId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const initChat = async () => {
    let profileData = null
    if (user) {
      profileData = await getUserProfile(user.id)
    }
    setProfile(profileData)

    const prenom = profileData?.prenom || 'ami(e)'
    const personnalite = profileData?.personnalite || 'Aventurier'

    const greeting = `Salut ${prenom} ! J'ai bien analysé ton profil IKIGAI d'inscription. Tu sembles avoir un profil **${personnalite}**. Génial ! On va utiliser ça pour te guider.`
    const firstQuestion = `Maintenant, passons aux choses sérieuses.\n\n${CHAT_QUESTIONS[0]}`

    setMessages([
      { role: 'assistant', content: greeting },
      { role: 'assistant', content: firstQuestion },
    ])
    setQuestionCount(1)
    setChatPhase('questioning')
    setQuestionIndex(0)
    setAnswers([])
  }

  const handleSend = async (text = null) => {
    const messageText = text || input.trim()
    if (!messageText) return

    const newMessages = [...messages, { role: 'user', content: messageText }]
    setMessages(newMessages)
    setInput('')
    setIsTyping(true)
    setQuestionCount(prev => prev + 1)

    if (chatPhase === 'recommendation') {
      if (messageText.toLowerCase().includes('oui') || messageText.toLowerCase().includes('voir') || messageText.toLowerCase().includes('découvrir')) {
        navigate('/learnia')
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "D'accord ! Si tu as d'autres questions sur ton orientation, n'hésite pas à m'en parler." }])
        setChatPhase('done')
      }
      setIsTyping(false)
      return
    }

    if (chatPhase === 'questioning') {
      const updatedAnswers = [...answers, messageText]
      setAnswers(updatedAnswers)
      const nextIndex = questionIndex + 1

      if (nextIndex < CHAT_QUESTIONS.length) {
        const encouragements = ["Super !", "Intéressant.", "Je vois.", "C'est noté !"]
        const randEnc = encouragements[Math.floor(Math.random() * encouragements.length)]
        
        setTimeout(() => {
          setMessages([...newMessages, { role: 'assistant', content: `${randEnc} ${CHAT_QUESTIONS[nextIndex]}` }])
          setQuestionIndex(nextIndex)
          setIsTyping(false)
        }, 800)
      } else {
        setChatPhase('analyzing')
        setTimeout(() => {
          const waitMsg = [...newMessages, { role: 'assistant', content: "Merci pour tes réponses ! Laisse-moi analyser tout ça avec mes données sur le Togo... 🇹🇬" }]
          setMessages(waitMsg)
          generateRecommendations(updatedAnswers, waitMsg)
        }, 800)
      }
      return
    }

    // Normal chat after recommendations
    try {
      const reply = await askKpekpe(
        newMessages.map(m => ({ role: m.role, content: m.content })),
        profile
      )
      const updatedMessages = [...newMessages, { role: 'assistant', content: reply }]
      setMessages(updatedMessages)
      const newSid = await saveSession(user?.id, updatedMessages, sessionId)
      if (newSid) setSessionId(newSid)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai eu un petit souci." }])
    } finally {
      setIsTyping(false)
    }
  }

  const generateRecommendations = async (userAnswers, historyMsgs) => {
    try {
      const prompt = `Voici mes réponses aux 5 questions d'orientation : ${userAnswers.join(' | ')}. En te basant sur mon profil et ces réponses, recommande-moi 3 métiers pertinents au Togo, avec une brève justification. Termine impérativement ta réponse en me demandant : "Veux-tu découvrir les universités et formations adaptées à ton profil sur Learnia ?"`
      
      const reply = await askKpekpe([{ role: 'user', content: prompt }], profile)
      
      const updatedMessages = [...historyMsgs, { role: 'assistant', content: reply }]
      setMessages(updatedMessages)
      setChatPhase('recommendation')
      if (user) {
        const newSid = await saveSession(user.id, updatedMessages, sessionId)
        if (newSid) setSessionId(newSid)
      }
    } catch(err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur d'analyse." }])
    } finally {
      setIsTyping(false)
    }
  }

  const quickSuggestions = chatPhase === 'recommendation' 
    ? ['Oui, je veux voir !', 'Non merci'] 
    : []

  const showSuggestions = chatPhase === 'recommendation'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', fontFamily: font }}>
      {/* Header */}
      <div style={{ background: '#009640', padding: '48px 16px 12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/accueil')} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} id="btn-back-chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Kpé kpé-IA</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '4px 12px', color: '#fff', fontSize: 12, fontWeight: 500 }}>
              Q{questionCount}/20
            </span>
            <button style={{ width: 32, height: 32, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <button onClick={() => {
              localStorage.removeItem('kpekpe_current_chat')
              setMessages([])
              setChatPhase('questioning')
              setQuestionIndex(0)
              setAnswers([])
              setSessionId(null)
              initChat()
            }} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 12px', borderRadius: 16, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Nouvelle discussion
            </button>
          </div>
        </div>

        {/* Pillar tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {PILLARS.map((pillar, i) => (
            <div key={pillar.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                height: 4, width: '100%', borderRadius: 999,
                background: i <= activePillar ? pillar.color : 'rgba(255,255,255,0.2)',
                transition: 'background 0.3s'
              }} />
              <span style={{ fontSize: 10, color: i <= activePillar ? '#fff' : 'rgba(255,255,255,0.5)' }}>{pillar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 4 }}>
                <svg width="14" height="14" viewBox="0 0 56 56" fill="none">
                  <path d="M28 8L14 18v14l14 10 14-10V18L28 8z" fill="#009640" />
                  <circle cx="28" cy="28" r="4" fill="white" />
                </svg>
              </div>
            )}
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: 16, fontSize: 14, lineHeight: 1.5,
              ...(msg.role === 'user'
                ? { background: '#009640', color: '#fff', borderBottomRightRadius: 4 }
                : { background: '#fff', color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderBottomLeftRadius: 4 }
              )
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Quick suggestions */}
        {showSuggestions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start', marginLeft: 40 }}>
            {quickSuggestions.map((suggestion) => (
              <button key={suggestion} onClick={() => handleSend(suggestion)} style={{
                padding: '10px 16px', borderRadius: 999, background: '#F0FDF4', border: '1px solid #D1FAE5',
                color: '#111', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                transition: 'transform 0.2s'
              }}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8 }}>
              <svg width="14" height="14" viewBox="0 0 56 56" fill="none">
                <path d="M28 8L14 18v14l14 10 14-10V18L28 8z" fill="#009640" />
                <circle cx="28" cy="28" r="4" fill="white" />
              </svg>
            </div>
            <div style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 16, padding: '12px 16px', display: 'flex', gap: 6 }}>
              <div style={{ width: 8, height: 8, background: '#9CA3AF', borderRadius: '50%', animation: 'bounce 1s infinite' }} />
              <div style={{ width: 8, height: 8, background: '#9CA3AF', borderRadius: '50%', animation: 'bounce 1s infinite 0.15s' }} />
              <div style={{ width: 8, height: 8, background: '#9CA3AF', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div style={{ padding: '8px 16px 90px 16px', background: '#F5F5F5', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ flex: 1, background: '#fff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Écris ton message..."
              style={{ flex: 1, width: '100%', minHeight: 24, fontSize: 16, color: '#111', fontFamily: font, background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
              id="chat-input"
            />
          </div>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              width: 48, height: 48, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: input.trim() ? 'pointer' : 'default',
              background: input.trim() ? '#009640' : '#E5E7EB', boxShadow: input.trim() ? '0 2px 8px rgba(0,150,64,0.3)' : 'none',
              transition: 'all 0.2s'
            }}
            id="btn-send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
