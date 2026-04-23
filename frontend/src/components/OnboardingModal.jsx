import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanumakonda', 'Hyderabad', 'Jagtial',
  'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy',
  'Karimnagar', 'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar',
  'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool',
  'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli',
  'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet',
  'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri', 'Other',
]

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1.5px solid var(--color-border)',
  backgroundColor: '#fff',
  color: 'var(--color-text)',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  minHeight: '44px',
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: '5px',
}

export default function OnboardingModal({ onComplete }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('')
  const [land, setLand] = useState('')

  const save = (userData) => {
    localStorage.setItem('ym_user', JSON.stringify(userData))
    localStorage.setItem('ym_onboarded', 'true')
    onComplete(userData)
  }

  const handleStart = () => {
    save({
      name: name.trim() || null,
      district: district || null,
      land_acres: land ? parseFloat(land) : null,
    })
  }

  const handleSkip = () => {
    localStorage.setItem('ym_onboarded', 'true')
    onComplete(null)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        backgroundColor: 'var(--color-cream)',
        borderRadius: '20px',
        padding: '28px 24px',
        boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <span style={{ fontSize: '26px' }}>🌾</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--color-primary)' }}>
            {t('onboarding.title')}
          </h2>
        </div>
        <p style={{ margin: '0 0 22px', fontSize: '13px', color: 'var(--color-text-soft)' }}>
          {t('onboarding.subtitle')}
        </p>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>{t('onboarding.name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('onboarding.name_placeholder')}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>{t('onboarding.district')}</label>
            <select
              value={district}
              onChange={e => setDistrict(e.target.value)}
              style={{ ...inputStyle, color: district ? 'var(--color-text)' : 'var(--color-text-soft)' }}
            >
              <option value="">{t('onboarding.district_placeholder')}</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{t('onboarding.land')}</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={land}
              onChange={e => setLand(e.target.value)}
              placeholder={t('onboarding.land_placeholder')}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={handleStart}
            style={{
              minHeight: '48px', width: '100%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff', border: 'none',
              borderRadius: '12px', fontSize: '15px',
              fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('onboarding.start')}
          </button>
          <button
            onClick={handleSkip}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color-text-soft)', fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit',
              padding: '4px',
            }}
          >
            {t('onboarding.skip')}
          </button>
        </div>
      </div>
    </div>
  )
}
