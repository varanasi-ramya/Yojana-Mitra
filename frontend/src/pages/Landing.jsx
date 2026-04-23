import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import {
  Wheat, FileText, Shield, CreditCard,
  Heart, Leaf, DollarSign, Users, ArrowRight,
} from 'lucide-react'

const CARD_ICONS = [Wheat, FileText, Shield, CreditCard, Heart, Leaf, DollarSign, Users]
const SCHEME_KEYS = ['s1','s2','s3','s4','s5','s6','s7','s8','s9']
const PROMPT_KEYS  = ['q1','q2','q3','q4','q5','q6','q7','q8']

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const goToChat = (question) => {
    navigate('/chat', { state: question ? { question } : undefined })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: '#fff',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🌾</span>
          <div>
            <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary)' }}>
              {t('app.title')}
            </span>
            <span style={{
              display: 'block', fontSize: '11px',
              color: 'var(--color-text-soft)', lineHeight: 1,
            }}>
              {t('app.subtitle')}
            </span>
          </div>
        </div>
        <LanguageSwitcher />
      </nav>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>

        {/* ── Hero ───────────────────────────────────── */}
        <section style={{ padding: '56px 0 40px', textAlign: 'center' }}>
          {/* Decorative badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            backgroundColor: 'var(--color-cream)',
            border: '1px solid var(--color-border)',
            borderRadius: '999px', padding: '5px 14px',
            fontSize: '12px', fontWeight: 600,
            color: 'var(--color-mid)',
            marginBottom: '20px',
          }}>
            <span>🇮🇳</span> Telangana · 9 schemes covered
          </div>

          <h1 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(24px, 5vw, 40px)',
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--color-primary)',
          }}>
            {t('landing.hero_title')}
          </h1>

          <p style={{
            margin: '0 auto 32px',
            maxWidth: '520px',
            fontSize: '15px',
            lineHeight: 1.7,
            color: 'var(--color-text-soft)',
          }}>
            {t('landing.hero_sub')}
          </p>

          <button
            onClick={() => goToChat()}
            style={{
              minHeight: '52px',
              padding: '14px 32px',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(94,0,6,0.3)',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(94,0,6,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(94,0,6,0.3)' }}
          >
            {t('landing.cta')} →
          </button>

          <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--color-text-soft)' }}>
            {t('landing.free_note')}
          </p>
        </section>

        {/* ── Question cards ─────────────────────────── */}
        <section style={{ paddingBottom: '40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}
            className="cards-grid"
          >
            {PROMPT_KEYS.map((key, i) => {
              const Icon = CARD_ICONS[i]
              const question = t(`prompts.${key}`)
              return (
                <button
                  key={key}
                  onClick={() => goToChat(question)}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'flex-start', textAlign: 'left',
                    padding: '16px',
                    backgroundColor: 'var(--color-cream)',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    minHeight: '110px',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(213,62,15,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Icon size={18} style={{ color: 'var(--color-accent)', marginBottom: '8px', flexShrink: 0 }} />
                  <span style={{
                    flex: 1, fontSize: '13px', fontWeight: 500,
                    lineHeight: 1.45, color: 'var(--color-text)',
                  }}>
                    {question}
                  </span>
                  <ArrowRight size={13} style={{ color: 'var(--color-text-soft)', alignSelf: 'flex-end', marginTop: '8px' }} />
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Schemes covered ────────────────────────── */}
        <section style={{ paddingBottom: '48px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {t('landing.schemes_covered')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SCHEME_KEYS.map(k => (
              <span key={k} style={{
                padding: '5px 14px',
                backgroundColor: 'var(--color-cream)',
                border: '1px solid var(--color-border)',
                borderRadius: '999px',
                fontSize: '13px',
                color: 'var(--color-text)',
                fontWeight: 500,
              }}>
                {t(`schemes.${k}`)}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)',
        padding: '20px',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--color-text-soft)',
        lineHeight: 1.6,
      }}>
        {t('footer.disclaimer')}
      </footer>

      {/* Responsive: 4 columns on wider screens */}
      <style>{`
        @media (min-width: 600px) {
          .cards-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
