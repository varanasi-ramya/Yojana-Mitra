import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { ArrowLeft, Send } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import OnboardingModal from '../components/OnboardingModal.jsx'
import SuggestedPrompts from '../components/SuggestedPrompts.jsx'
import MessageBubble from '../components/MessageBubble.jsx'

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export default function Chat() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { t, i18n } = useTranslation()

  const [messages,       setMessages]       = useState([])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [firstMessage,   setFirstMessage]   = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userContext,    setUserContext]     = useState(null)
  const [activeScheme,    setActiveScheme]   = useState(location.state?.question || null)
  const [sessionId]                         = useState(uuid)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  // ── Helpers ─────────────────────────────────
  const welcomeMsg = useCallback(() => ({
    role: 'assistant',
    content: t('chat.welcome'),
    sources: [],
  }), [t])

  const initialSent = useRef(false)

  // ── Mount ────────────────────────────────────
  useEffect(() => {
    setMessages([welcomeMsg()])

    const onboarded = localStorage.getItem('ym_onboarded')
    const saved     = localStorage.getItem('ym_user')

    if (saved) setUserContext(JSON.parse(saved))

    const passedQ = location.state?.question || null

    if (!onboarded) {
      if (passedQ) setPendingQ(passedQ)
      setShowOnboarding(true)
    } else if (passedQ && !initialSent.current) {
      initialSent.current = true
      setActiveScheme(passedQ)
      // DO NOT auto-send! User must click a button first.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update welcome message when language changes
  useEffect(() => {
    setMessages(prev =>
      prev.map((m, i) => i === 0 && m.role === 'assistant' ? { ...m, content: t('chat.welcome') } : m)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Onboarding complete ───────────────────────
  const handleOnboardingComplete = (userData) => {
    setShowOnboarding(false)
    if (userData) setUserContext(userData)
    // If we had a pending scheme, set it as active
    if (pendingQ) {
      setActiveScheme(pendingQ)
      setPendingQ(null)
    }
  }

  // ── Send ─────────────────────────────────────
  const sendMessage = async (text, displayText) => {
    const query = typeof text === 'string' ? text.trim() : input.trim()
    if (!query || loading) return

    // Display original question text in the bubble, but send the ID to backend
    const displayMsg = displayText || query
    
    setInput('')
    setFirstMessage(false)
    setMessages(prev => [...prev, { role: 'user', content: displayMsg, sources: [] }])
    setLoading(true)

    try {
      const base = import.meta.env.VITE_API_BASE_URL || ''
      const { data } = await axios.post(`${base}/api/v1/chat`, {
        query: query, // Send the ID (e.g. 'guided.docs')
        language: i18n.language?.slice(0, 2) || 'en',
        scheme: activeScheme, // Pass active scheme context for reliability
        context: {
          district:   userContext?.district   || null,
          land_acres: userContext?.land_acres || null,
        },
        session_id: sessionId,
      })

      setMessages(prev => [...prev, {
        role:    'assistant',
        content: data.answer || data.response || t('chat.error'),
        sources: data.sources || [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant', content: t('chat.error'), sources: [],
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Render ───────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh', height: '100vh',
      backgroundColor: 'var(--color-bg)',
    }}>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none', color: '#fff',
              cursor: 'pointer', padding: '8px', borderRadius: '8px',
              display: 'flex', alignItems: 'center',
              minHeight: '44px', minWidth: '44px',
              justifyContent: 'center',
            }}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              {t('app.title')}
            </p>
            <p style={{ margin: 0, fontSize: '11px', opacity: 0.75, lineHeight: 1 }}>
              {t('app.subtitle')}
            </p>
          </div>
        </div>
        {/* White-ish switcher in header */}
        <div style={{ filter: 'invert(1) hue-rotate(180deg)' }}>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Messages */}
      <div
        className="messages-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              backgroundColor: 'var(--color-cream)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', marginRight: '8px', flexShrink: 0,
            }}>🌾</div>
            <div style={{
              padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
              backgroundColor: '#fff', border: '1px solid var(--color-border)',
              display: 'flex', gap: '5px', alignItems: 'center',
            }}>
              {[0, 160, 320].map(delay => (
                <span key={delay} style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  backgroundColor: 'var(--color-text-soft)',
                  display: 'inline-block',
                  animation: 'bounce 1s infinite',
                  animationDelay: `${delay}ms`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Controlled FAQ Buttons (No free-form text input) */}
      <div style={{
        padding: '16px 14px 20px',
        backgroundColor: '#fff',
        borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        {/* Scheme Label */}
        <div style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--color-primary)',
          textAlign: 'center',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: 0.8,
        }}>
          {activeScheme || t('chat.placeholder')}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}>
          {[
            { id: 'guided.docs',        key: 'chat.guided.docs' },
            { id: 'guided.money',       key: 'chat.guided.money' },
            { id: 'guided.eligibility', key: 'chat.guided.eligibility' },
            { id: 'guided.process',     key: 'chat.guided.process' },
            { id: 'guided.deadline',    key: 'chat.guided.deadline' }
          ].map((btn, idx) => (
            <button
              key={btn.id}
              onClick={() => sendMessage(btn.id, t(btn.key))}
              disabled={loading}
              style={{
                gridColumn: idx === 4 ? 'span 2' : 'span 1',
                padding: '12px 10px',
                backgroundColor: 'var(--color-bg)',
                border: '1.5px solid var(--color-primary)',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease',
                textAlign: 'center',
                boxShadow: '0 2px 0 var(--color-border)',
                outline: 'none',
              }}
              onMouseEnter={e => !loading && (e.target.style.backgroundColor = 'var(--color-cream)')}
              onMouseLeave={e => !loading && (e.target.style.backgroundColor = 'var(--color-bg)')}
              onMouseDown={e  => !loading && (e.target.style.transform = 'translateY(2px)')}
              onMouseUp={e    => !loading && (e.target.style.transform = 'translateY(0)')}
            >
              {t(btn.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Bounce animation for typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}
