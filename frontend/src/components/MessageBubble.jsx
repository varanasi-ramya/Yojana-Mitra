import { useTranslation } from 'react-i18next'

export default function MessageBubble({ message }) {
  const { t } = useTranslation()
  const isUser = message.role === 'user'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '12px',
    }}>
      {!isUser && (
        <div style={{
          width: '28px', height: '28px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-cream)',
          border: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', marginRight: '8px', flexShrink: 0,
          marginTop: '2px',
        }}>
          🌾
        </div>
      )}

      <div style={{
        maxWidth: 'min(85%, 520px)',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        backgroundColor: isUser ? 'var(--color-primary)' : '#fff',
        color: isUser ? '#fff' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        fontSize: '14px',
        lineHeight: '1.6',
        boxShadow: isUser
          ? '0 2px 8px rgba(94,0,6,0.2)'
          : '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </p>
        {!isUser && message.sources && message.sources.length > 0 && (
          <p style={{
            margin: '8px 0 0',
            fontSize: '11px',
            color: 'var(--color-text-soft)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '6px',
          }}>
            {t('chat.sources_label')}: {message.sources.join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
