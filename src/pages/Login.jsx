import React, { useState } from 'react'
import { signIn } from '../lib/supabase.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1A1816', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', color: '#B8956A', letterSpacing: '.06em', marginBottom: '.4rem' }}>Inara Collective</div>
          <div style={{ fontSize: '.6rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' }}>Ecosystem OS</div>
        </div>
        <div style={{ background: '#2E2B26', border: '.5px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '2rem' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.3rem', color: '#F6F2EA', marginBottom: '1.5rem' }}>Sign in</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,.38)' }}>Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus style={{ background: '#1A1816', color: '#F6F2EA', borderColor: 'rgba(255,255,255,.1)' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'rgba(255,255,255,.38)' }}>Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ background: '#1A1816', color: '#F6F2EA', borderColor: 'rgba(255,255,255,.1)' }} />
            </div>
            {error && <div style={{ background: '#FBF0ED', border: '.5px solid #E8B4A8', borderRadius: '6px', padding: '.625rem .875rem', fontSize: '.78rem', color: '#8B2A1A' }}>{error}</div>}
            <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.66rem', color: 'rgba(255,255,255,.18)' }}>Internal tool — Inara Collective</div>
      </div>
    </div>
  )
}
