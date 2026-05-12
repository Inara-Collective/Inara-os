import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, getAllTasks, getReports } from '../lib/supabase.js'

const LOOP = ['Report','Diagnose','System fix','Module activate','Deliver','Optimise','Report again']

export default function Dashboard() {
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getClients(), getAllTasks(), getReports()])
      .then(([c, t, r]) => { setClients(c); setTasks(t); setReports(r); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const active = clients.filter(c => ['Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara'].includes(c.stage))
  const hot = clients.filter(c => (c.fit_score || 0) >= 75 && !active.includes(c))
  const blocked = tasks.filter(t => t.status === 'Blocked')
  const awaiting = tasks.filter(t => t.status === 'Awaiting Approval')
  const mrr = active.reduce((sum, c) => sum + (c.mrr || 0), 0)

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
        <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>
      <div className="page">
        <div style={{ background: 'var(--dark)', borderRadius: '10px', padding: '1.1rem 1.4rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '.56rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.75rem', fontWeight: 500 }}>The Ecosystem Loop</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', flexWrap: 'wrap' }}>
            {LOOP.map((step, i) => (
              <React.Fragment key={step}>
                <span style={{ fontSize: '.68rem', padding: '.2rem .55rem', borderRadius: '20px', background: 'rgba(184,149,106,.12)', border: '.5px solid rgba(184,149,106,.25)', color: 'var(--gold)' }}>{step}</span>
                {i < LOOP.length - 1 && <span style={{ color: 'rgba(255,255,255,.2)', fontSize: '.7rem' }}>›</span>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.32)', marginTop: '.65rem', lineHeight: 1.65 }}>The system never ends. Reporting identifies bottlenecks and feeds the next diagnosis.</div>
        </div>

        <div className="g4" style={{ marginBottom: '1.5rem' }}>
          {[
            ['Active Clients', active.length, 'across all stages'],
            ['Hot Leads', hot.length, 'fit score 75+'],
            ['Blockers', blocked.length, 'need resolution', blocked.length > 0 ? 'var(--red)' : null],
            ['Total MRR', '$' + mrr.toLocaleString(), 'active retainers'],
          ].map(([label, value, sub, color]) => (
            <div key={label} className="kpi" style={{ cursor: 'pointer' }} onClick={() => navigate(label === 'Blockers' || label === 'Active Clients' ? '/pipeline' : '/pipeline')}>
              <div className="kpi-label">{label}</div>
              <div className="kpi-value" style={color ? { color } : {}}>{value}</div>
              <div className="kpi-sub">{sub}</div>
            </div>
          ))}
        </div>

        <div className="g2" style={{ gap: '1.25rem' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">🔥 Hot Leads</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/pipeline')}>View all</button>
            </div>
            {hot.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No hot leads right now.</div>
            ) : hot.slice(0, 5).map(c => (
              <div key={c.id} onClick={() => navigate(`/pipeline/${c.id}`)} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 500, color: 'var(--amber)', flexShrink: 0 }}>{(c.name || '?').slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.8rem', fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{c.stage}</div>
                </div>
                <span className="badge badge-gold">{c.fit_score}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title" style={{ color: 'var(--red)' }}>⛔ Blocked</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>View board</button>
            </div>
            {blocked.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No blocked tasks. The system is flowing.</div>
            ) : blocked.slice(0, 5).map(t => (
              <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)' }}>
                <div style={{ fontSize: '.78rem', fontWeight: 500, color: 'var(--red)' }} className="truncate">{t.name}</div>
                <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">⏳ Awaiting Approval</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>View</button>
            </div>
            {awaiting.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>Nothing pending approval.</div>
            ) : awaiting.slice(0, 4).map(t => (
              <div key={t.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{t.clients?.name}</div>
                </div>
                <span className="badge badge-amber">48h SLA</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title">📊 Recent Reports</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/reporting')}>View all</button>
            </div>
            {reports.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>No reports yet.</div>
            ) : reports.slice(0, 4).map(r => (
              <div key={r.id} style={{ padding: '.65rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{r.clients?.name}</div>
                </div>
                <span style={{ fontSize: '.7rem' }}>{r.client_health}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
