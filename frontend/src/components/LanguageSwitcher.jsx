import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'te', label: 'తె' },
  { code: 'hi', label: 'हि' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language?.slice(0, 2)

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {LANGS.map(({ code, label }) => {
        const active = current === code
        return (
          <button
            key={code}
            onClick={() => i18n.changeLanguage(code)}
            style={{
              minHeight: '36px',
              minWidth: '40px',
              padding: '4px 10px',
              borderRadius: '999px',
              border: `1.5px solid var(--color-primary)`,
              backgroundColor: active ? 'var(--color-primary)' : 'transparent',
              color: active ? '#fff' : 'var(--color-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
