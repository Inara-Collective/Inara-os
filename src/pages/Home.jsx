import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getClients, getAllTasks } from '../lib/supabase.js'

const ACTIVE_STAGES = ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']
const SALES_STAGES  = ['New','Reached out','To Action','Discovery','Negotiation']

function StatTile({ label, value, sub, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-lg shadow-card border border-border p-5 text-left w-full hover:border-navy/40 transition-colors"
    >
      <div className="text-[0.62rem] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold leading-none ${accent ? 'text-navy' : 'text-ink'}`}>{value}</div>
      {sub && <div className="text-[0.62rem] text-muted-foreground mt-1.5">{sub}</div>}
    </button>
  )
}

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

  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const active  = clients.filter(c => ACTIVE_STAGES.includes(c.stage))
  const pipeline = clients.filter(c => SALES_STAGES.includes(c.stage))
  const monthlyRevenue = active.reduce((s, c) => s + (c.mrr || 0), 0)
  const pipelineValue  = pipeline.reduce((s, c) => s + (c.mrr || 0), 0)
  const closedThisMonth = active.filter(c => {
    if (!c.contract_start) return false
    const d = new Date(c.contract_start)
    return d.getMonth() === month && d.getFullYear() === year
  })

  const blocked  = tasks.filter(t => t.status === 'Blocked')
  const overdue  = tasks.filter(t =>
    t.due_date && new Date(t.due_date) < now && t.status !== 'Complete' && t.status !== 'Done'
  )
  const awaiting = tasks.filter(t => t.status === 'Awaiting Approval')

  const contractReviews = active.filter(c => {
    if (!c.contract_end) return false
    const days = Math.ceil((new Date(c.contract_end) - now) / 86400000)
    return days >= 0 && days <= 30
  })

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const name      = profile?.name || profile?.email?.split('@')[0] || ''
  const alertCount = blocked.length + overdue.length
  const dateStr   = now.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="page flex items-center gap-3 text-sm text-muted-foreground">
        <span className="spinner" /> Loading…
      </div>
    )
  }

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">{greeting()}{name ? `, ${name}` : ''}</div>
          <div className="text-[0.68rem] text-muted-foreground mt-0.5">{dateStr}</div>
        </div>
      </div>

      <div className="page max-w-6xl">

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatTile
            label="Active Clients"
            value={active.length}
            sub="in delivery"
            onClick={() => navigate('/clients')}
          />
          <StatTile
            label="Monthly Revenue"
            value={`$${monthlyRevenue.toLocaleString()}`}
            sub="confirmed MRR"
            onClick={() => navigate('/clients')}
          />
          <StatTile
            label="Pipeline Value"
            value={pipelineValue > 0 ? `$${pipelineValue.toLocaleString()}` : `${pipeline.length} leads`}
            sub="in sales stages"
            onClick={() => navigate('/pipeline')}
          />
          <StatTile
            label="Closed This Month"
            value={closedThisMonth.length}
            sub="new active clients"
            accent={closedThisMonth.length > 0}
            onClick={() => navigate('/clients')}
          />
        </div>

        {/* Alerts banner */}
        {alertCount > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-5 py-4">
            <div className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-red-600 mb-2.5">
              {alertCount} item{alertCount !== 1 ? 's' : ''} need attention
            </div>
            <div className="flex flex-wrap gap-5">
              {blocked.slice(0, 5).map(t => (
                <button key={t.id} onClick={() => navigate('/delivery')}
                  className="flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer">
                  <span className="text-xs text-red-500">⛔</span>
                  <div>
                    <div className="text-xs font-medium text-red-700">{t.name}</div>
                    {t.clients?.name && <div className="text-[0.62rem] text-muted-foreground">{t.clients.name}</div>}
                  </div>
                </button>
              ))}
              {overdue.slice(0, 5).map(t => (
                <button key={t.id} onClick={() => navigate('/delivery')}
                  className="flex items-center gap-1.5 text-left bg-transparent border-0 p-0 cursor-pointer">
                  <span className="text-xs text-amber-500">⚠</span>
                  <div>
                    <div className="text-xs font-medium text-ink">{t.name}</div>
                    <div className="text-[0.62rem] text-red-600">
                      Overdue {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main two-column */}
        <div className="grid grid-cols-2 gap-5 items-start">

          {/* Active clients card */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Active Clients</div>
              <button className="btn btn-ghost btn-xs" onClick={() => navigate('/clients')}>View all</button>
            </div>
            {active.length === 0 ? (
              <div className="empty">No active clients yet.</div>
            ) : active.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                className="w-full text-left flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-cream/60 transition-colors bg-transparent"
              >
                <div className="w-7 h-7 rounded-md bg-blush flex items-center justify-center text-[0.58rem] font-semibold text-ink flex-shrink-0">
                  {(c.name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink truncate">{c.name}</div>
                  <div className="text-[0.65rem] text-muted-foreground">{c.stage}</div>
                </div>
                {c.health && <span className="text-sm">{c.health.split(' ')[0]}</span>}
                {c.mrr > 0 && (
                  <span className="badge badge-teal text-[0.58rem]">${c.mrr.toLocaleString()}/mo</span>
                )}
              </button>
            ))}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* Awaiting approval */}
            <div className="card">
              <div className="card-head">
                <div className="card-title">Awaiting Approval</div>
                <button className="btn btn-ghost btn-xs" onClick={() => navigate('/delivery')}>Review</button>
              </div>
              {awaiting.length === 0 ? (
                <div className="empty text-sm py-6">Nothing pending approval.</div>
              ) : awaiting.slice(0, 6).map(t => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{t.name}</div>
                    <div className="text-[0.65rem] text-muted-foreground">{t.clients?.name}</div>
                  </div>
                  <span className="badge badge-blush">Pending</span>
                </div>
              ))}
            </div>

            {/* Contract reviews */}
            {contractReviews.length > 0 && (
              <div className="card border-amber-200">
                <div className="card-head">
                  <div className="card-title text-amber-700">Contract Reviews Due</div>
                </div>
                {contractReviews.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/pipeline/${c.id}`)}
                    className="w-full text-left flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-cream/60 transition-colors bg-transparent"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{c.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground">
                        Contract ends {new Date(c.contract_end).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <span className="badge badge-blush">Review</span>
                  </button>
                ))}
              </div>
            )}

            {/* Closed this month */}
            {closedThisMonth.length > 0 && (
              <div className="card border-navy/30">
                <div className="card-head">
                  <div className="card-title text-navy">Closed This Month</div>
                </div>
                {closedThisMonth.map(c => (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/pipeline/${c.id}`)}
                    className="w-full text-left flex items-center gap-3 px-5 py-3 border-b border-border last:border-b-0 hover:bg-cream/60 transition-colors bg-transparent"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{c.name}</div>
                      <div className="text-[0.65rem] text-muted-foreground">{c.stage}</div>
                    </div>
                    {c.mrr > 0 && <span className="badge badge-teal">${c.mrr.toLocaleString()}/mo</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
