import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getClients, getAllTasks } from '../lib/supabase.js'

const ACTIVE_STAGES = ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']
const SALES_STAGES = ['New','Reached out','To Action','Discovery','Negotiation']

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

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()

  const active = clients.filter(c => ACTIVE_STAGES.includes(c.stage))
  const pipeline = clients.filter(c => SALES_STAGES.includes(c.stage))
  const monthlyRevenue = active.reduce((s, c) => s + (c.mrr || 0), 0)
  const pipelineValue = pipeline.reduce((s, c) => s + (c.mrr || 0), 0)
  const closedThisMonth = active.filter(c => {
    if (!c.contract_start) return false
    const d = new Date(c.contract_start)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  })

  const blocked = tasks.filter(t => t.status === 'Blocked')
  const overdue = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < now && t.status !== 'Complete' && t.status !== 'Done'
  )
  const awaiting = tasks.filter(t => t.status === 'Awaiting Approval')

  const contractReviews = active.filter(c => {
    if (!c.contract_end) return false
    const end = new Date(c.contract_end)
    const days = Math.ceil((end - now) / 86400000)
    return days >= 0 && days <= 30
  })

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const name = profile?.name || profile?.email?.split('@')[0] || ''

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  const alertCount = blocked.length + overdue.length

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="topbar-title">{greeting()}{name ? `, ${name}` : ''}</div>
          <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.15rem' }}>
            {now.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
      <div className="page">

        {/* KPI tiles */}
        <div className="g4" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Active Clients', value: active.length, sub: 'in delivery', link: '/clients' },
            { label: 'Monthly Revenue', value: `$${monthlyRevenue.toLocaleString()}`, sub: 'confirmed MRR', link: '/clients' },
            { label: 'Pipeline Value', value: pipelineValue > 0 ? `$${pipelineValue.toLocaleString()}` : `${pipeline.length} leads`, sub: 'in sales stages', link: '/pipeline' },
            { label: 'Closed This Month', value: closedThisMonth.length, sub: 'new active clients', link: '/clients', accent: closedThisMonth.length > 0 ? 'var(--teal)' : null },
          ].map(({ label, value, sub, link, accent }) => (
            <div key={label} className="kpi" style={{ cursor: 'pointer' }} onClick={() => navigate(link)}>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value" style={accent ? { color: accent } : {}}>{value}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          ))}
        </div>

        {/* Alerts banner */}
        {alertCount > 0 && (
          <div style={{ marginBottom: '1.5rem', background: 'rgba(184,74,74,.06)', border: '.5px solid var(--red)', borderRadius: '8px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 600, marginBottom: '.75rem' }}>
              Alerts — {alertCount} item{alertCount !== 1 ? 's' : ''} need attention
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {blocked.slice(0, 5).map(t => (
                <div key={t.id} onClick={() => navigate('/delivery')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ fontSize: '.64rem', color: 'var(--red)', fontWeight: 500 }}>⛔</span>
                  <div>
                    <div style={{ fontSize: '.75rem', fontWeight: 500, color: 'var(--red)' }}>{t.name}</div>
                    {t.clients?.name && <div style={{ fontSize: '.62rem', color: 'var(--muted)' }}>{t.clients.name}</div>}
                  </div>
                </div>
              ))}
              {overdue.slice(0, 5).map(t => (
                <div key={t.id} onClick={() => navigate('/delivery')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ fontSize: '.64rem', color: 'var(--amber)', fontWeight: 500 }}>⚠</span>
                  <div>
                    <div style={{ fontSize: '.75rem', fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: '.62rem', color: 'var(--red)' }}>Overdue {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main two-column */}
        <div className="g2" style={{ gap: '1.25rem', alignItems: 'start' }}>
          {/* Active clients */}
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
                {c.health && <span style={{ fontSize: '.72rem' }}>{c.health.split(' ')[0]}</span>}
                {c.mrr > 0 && <span className="badge badge-teal" style={{ fontSize: '.58rem' }}>${c.mrr.toLocaleString()}/mo</span>}
              </div>
            ))}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Awaiting approval */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Awaiting Approval</div>
                <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>Review</button>
              </div>
              {awaiting.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>Nothing pending approval.</div>
              ) : awaiting.slice(0, 6).map(t => (
                <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
                  </div>
                  <span className="badge badge-amber">Pending</span>
                </div>
              ))}
            </div>

            {/* Contract reviews */}
            {contractReviews.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--amber)' }}>
                <div className="card-head">
                  <div className="card-title" style={{ color: 'var(--amber)' }}>Contract Reviews Due</div>
                </div>
                {contractReviews.map(c => (
                  <div key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>
                        Contract ends {new Date(c.contract_end).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className="badge badge-amber">Review</span>
                  </div>
                ))}
              </div>
            )}

            {/* New clients this month */}
            {closedThisMonth.length > 0 && (
              <div className="card" style={{ borderColor: 'var(--teal)' }}>
                <div className="card-head">
                  <div className="card-title" style={{ color: 'var(--teal)' }}>Closed This Month</div>
                </div>
                {closedThisMonth.map(c => (
                  <div key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{c.stage}</div>
                    </div>
                    {c.mrr > 0 && <span className="badge badge-teal">${c.mrr.toLocaleString()}/mo</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
