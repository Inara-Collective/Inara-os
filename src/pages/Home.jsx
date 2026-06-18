import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getClients, getAllTasks } from '../lib/supabase.js'

const ACTIVE_STAGES = ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']

export default function Home() {
  const { profile } = useAuth()
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getClients(), getAllTasks()])
      .then(([c, t]) => { setClients(c); setTasks(t); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const active = clients.filter(c => ACTIVE_STAGES.includes(c.stage))
  const prospects = clients.filter(c => !ACTIVE_STAGES.includes(c.stage) && c.stage !== 'Alumni' && c.stage !== 'Closed — Lost')
  const mrr = active.reduce((s, c) => s + (c.mrr || 0), 0)
  const blocked = tasks.filter(t => t.status === 'Blocked')
  const awaiting = tasks.filter(t => t.status === 'Awaiting Approval')
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Complete')

  const needsReport = active.filter(c => {
    if (!c.contract_start) return false
    const start = new Date(c.contract_start)
    const now = new Date()
    const daysSince = Math.floor((now - start) / 86400000)
    return daysSince % 30 <= 3
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const name = profile?.name || profile?.email?.split('@')[0] || ''

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">{greeting()}{name ? `, ${name}` : ''}</div>
          <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.15rem' }}>
            {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="page">
        <div className="g4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Active Clients', value: active.length, sub: 'in delivery', link: '/clients', accent: null },
            { label: 'Total MRR', value: `$${mrr.toLocaleString()}`, sub: 'active retainers', link: '/clients', accent: null },
            { label: 'Blocked Tasks', value: blocked.length, sub: 'need resolution', link: '/delivery', accent: blocked.length > 0 ? 'var(--red)' : null },
            { label: 'Hot Prospects', value: prospects.filter(c => (c.fit_score || 0) >= 75).length, sub: 'fit score 75+', link: '/pipeline', accent: null },
          ].map(({ label, value, sub, link, accent }) => (
            <div key={label} className="kpi" style={{ cursor: 'pointer' }} onClick={() => navigate(link)}>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value" style={accent ? { color: accent } : {}}>{value}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          ))}
        </div>

        <div className="g2" style={{ gap: '1.25rem' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Active Clients</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/clients')}>View all</button>
            </div>
            {active.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No active clients yet.</div>
            ) : active.map(c => (
              <div key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 500, color: 'var(--amber)', flexShrink: 0 }}>
                  {(c.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.8rem', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{c.stage}</div>
                </div>
                {c.health && (
                  <span style={{ fontSize: '.72rem' }}>{c.health.split(' ')[0]}</span>
                )}
                {c.mrr > 0 && <span className="badge badge-teal" style={{ fontSize: '.58rem' }}>${c.mrr.toLocaleString()}</span>}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ color: blocked.length > 0 ? 'var(--red)' : undefined }}>
                {blocked.length > 0 ? '⛔ Blocked' : 'Blocked Tasks'}
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>View board</button>
            </div>
            {blocked.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No blocked tasks. System is flowing.</div>
            ) : blocked.slice(0, 6).map(t => (
              <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--red)' }}>{t.name}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">Awaiting Approval</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>Review</button>
            </div>
            {awaiting.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>Nothing pending approval.</div>
            ) : awaiting.slice(0, 5).map(t => (
              <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
                </div>
                <span className="badge badge-amber">Pending</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ color: overdue.length > 0 ? 'var(--amber)' : undefined }}>
                Overdue Tasks
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>View</button>
            </div>
            {overdue.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No overdue tasks.</div>
            ) : overdue.slice(0, 5).map(t => (
              <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
                </div>
                <span style={{ fontSize: '.68rem', color: 'var(--red)' }}>
                  {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {needsReport.length > 0 && (
          <div style={{ marginTop: '1.5rem', background: 'var(--amber-bg, rgba(184,149,106,.08))', border: '.5px solid var(--amber)', borderRadius: '8px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--amber)', fontWeight: 500, marginBottom: '.65rem' }}>Contract Alerts — Reports Due</div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              {needsReport.map(c => (
                <div key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', padding: '.5rem .875rem', cursor: 'pointer', fontSize: '.75rem' }}>
                  <span style={{ fontWeight: 500 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)', marginLeft: '.4rem', fontSize: '.68rem' }}>— report due</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
