import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients } from '../lib/supabase.js'

const ACTIVE_STAGES   = ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara']
const PROSPECT_STAGES = ['New','Reached out','Discovery','Negotiation','Won','Lost','No Deal stage']

const HEALTH_BADGE = {
  '🟢 Strong':          'badge-sage',
  '🟡 Building':        'badge-blush',
  '🔴 Needs attention': 'badge-red',
}

const TABS = ['Active', 'Prospects', 'All']

const TH_COLS = ['Client', 'Stage', 'Health', 'MRR', 'Industry', 'Next Action']

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('Active')
  const [search, setSearch]   = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getClients()
      .then(d => { setClients(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search
      || c.name?.toLowerCase().includes(search.toLowerCase())
      || c.industry?.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (tab === 'Active')    return ACTIVE_STAGES.includes(c.stage)
    if (tab === 'Prospects') return PROSPECT_STAGES.includes(c.stage)
    return true
  })

  const counts = {
    Active:    clients.filter(c => ACTIVE_STAGES.includes(c.stage)).length,
    Prospects: clients.filter(c => PROSPECT_STAGES.includes(c.stage)).length,
    All:       clients.length,
  }

  if (loading) {
    return (
      <div className="page flex items-center gap-3 text-sm text-muted-foreground">
        <span className="spinner" /> Loading clients…
      </div>
    )
  }

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-title">Clients</div>
        <div className="topbar-actions">
          <input
            className="form-input"
            style={{ width: 200 }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => navigate('/pipeline')}>
            + New client
          </button>
        </div>
      </div>

      <div className="page">
        {/* Tab pills */}
        <div className="flex gap-1.5 mb-5">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                tab === t
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-muted-foreground border-border hover:border-ink/30 hover:text-ink'
              }`}
            >
              {t}
              <span className="ml-1.5 opacity-60">{counts[t]}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <div className="text-sm font-medium text-ink mb-1">No {tab.toLowerCase()} clients</div>
            <div className="text-xs text-muted-foreground">Add clients via the Pipeline page.</div>
          </div>
        ) : (
          <div className="card">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-cream/40">
                  {TH_COLS.map(h => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[0.57rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/pipeline/${c.id}`)}
                    className="border-b border-border last:border-b-0 cursor-pointer hover:bg-cream/50 transition-colors"
                  >
                    {/* Client name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-md bg-blush flex items-center justify-center text-[0.55rem] font-semibold text-ink flex-shrink-0">
                          {(c.name || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-ink">{c.name}</span>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className="badge badge-gray">{c.stage}</span>
                    </td>

                    {/* Health */}
                    <td className="px-4 py-3">
                      {c.health
                        ? <span className={`badge ${HEALTH_BADGE[c.health] || 'badge-gray'}`}>{c.health}</span>
                        : <span className="text-muted-foreground text-sm">—</span>
                      }
                    </td>

                    {/* MRR */}
                    <td className="px-4 py-3 text-sm text-ink">
                      {c.mrr ? `$${c.mrr.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                    </td>

                    {/* Industry */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.industry || '—'}
                    </td>

                    {/* Next action */}
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
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
