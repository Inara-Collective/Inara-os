import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients } from '../lib/supabase.js'

const ACTIVE_STAGES = ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']
const PROSPECT_STAGES = ['New','Reached out','Discovery','Negotiation','Won','Lost','No Deal stage']
const HEALTH_COLOR = { '🟢 Strong': 'var(--teal)', '🟡 Building': 'var(--amber)', '🔴 Needs attention': 'var(--red)' }

const TABS = ['Active', 'Prospects', 'All']

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Active')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { getClients().then(d => { setClients(d); setLoading(false) }).catch(() => setLoading(false)) }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (tab === 'Active') return ACTIVE_STAGES.includes(c.stage)
    if (tab === 'Prospects') return PROSPECT_STAGES.includes(c.stage)
    return true
  })

  const counts = {
    Active: clients.filter(c => ACTIVE_STAGES.includes(c.stage)).length,
    Prospects: clients.filter(c => PROSPECT_STAGES.includes(c.stage)).length,
    All: clients.length,
  }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading clients...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Clients</div>
        <div className="topbar-actions">
          <input className="form-input" style={{ width: 200, padding: '.4rem .75rem' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>+ New client</button>
        </div>
      </div>
      <div className="page">
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="btn"
              style={{ borderRadius: '20px', background: tab === t ? 'var(--dark)' : 'var(--warm)', color: tab === t ? 'var(--bg)' : 'var(--muted)', border: `.5px solid ${tab === t ? 'var(--dark)' : 'var(--border)'}`, fontSize: '.72rem' }}
            >
              {t} <span style={{ opacity: .65, marginLeft: '.25rem' }}>{counts[t]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No {tab.toLowerCase()} clients</div>
            <div className="empty-sub">Add clients via the Pipeline page.</div>
          </div>
        ) : (
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '.5px solid var(--border)', background: 'var(--bg)' }}>
                  {['Client', 'Stage', 'Health', 'MRR', 'Industry', 'Next Action'].map(h => (
                    <th key={h} style={{ padding: '.625rem 1rem', textAlign: 'left', fontSize: '.58rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ borderBottom: '.5px solid var(--border)', cursor: 'pointer' }}>
                    <td style={{ padding: '.625rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 5, background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 500, color: 'var(--amber)', flexShrink: 0 }}>
                          {(c.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 500, fontSize: '.82rem' }}>{c.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '.625rem 1rem' }}>
                      <span className="badge badge-gray">{c.stage}</span>
                    </td>
                    <td style={{ padding: '.625rem 1rem' }}>
                      {c.health ? (
                        <span style={{ fontSize: '.75rem', color: HEALTH_COLOR[c.health] || 'var(--muted)' }}>{c.health}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '.625rem 1rem', fontSize: '.78rem' }}>
                      {c.mrr ? `$${c.mrr.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ padding: '.625rem 1rem', fontSize: '.75rem', color: 'var(--muted)' }}>
                      {c.industry || '—'}
                    </td>
                    <td style={{ padding: '.625rem 1rem', fontSize: '.72rem', color: 'var(--muted)', maxWidth: 200 }} className="truncate">
                      {c.next_action || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
