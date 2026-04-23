import { useTranslation } from 'react-i18next'

export default function SuggestedPrompts({ onSelect }) {
  const { t } = useTranslation()
  const prompts = ['q1','q2','q3','q4','q5','q6','q7','q8','q9'].map(k => t(`prompts.${k}`))

  return (
    <div
      className="hide-scrollbar"
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '10px 16px',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: '#fff',
      }}
    >
      {prompts.map((p, i) => (
        <button
          key={i}
          onClick={() => onSelect(p)}
          style={{
            flexShrink: 0,
            padding: '8px 14px',
            borderRadius: '999px',
            border: '1.5px solid var(--color-border)',
            backgroundColor: 'var(--color-cream)',
            color: 'var(--color-accent)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
            minHeight: '36px',
            whiteSpace: 'nowrap',
          }}
        >
          {p}
        </button>
      ))}
    </div>
  )
}
