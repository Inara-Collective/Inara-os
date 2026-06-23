import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getClient, getClientTasks } from '../lib/supabase.js'
import ContentBoard from './workspace/ContentBoard.jsx'
import Meetings from './workspace/Meetings.jsx'

const SECTIONS = [
  { id: 'home',         label: 'Client Home' },
  { id: 'package',      label: 'Package Overview' },
  { id: 'meetings',     label: 'Meetings' },
  { id: 'onboarding',   label: 'Onboarding' },
  { id: 'deliverables', label: 'Monthly Deliverables' },
  { id: 'content',      label: 'Marketing Hub' },
  { id: 'review',       label: 'Content Review' },
  { id: 'email',        label: 'Email Marketing' },
  { id: 'website',      label: 'Website' },
  { id: 'systems',      label: 'System Building' },
  { id: 'comments',     label: 'Comments & Feedback' },
  { id: 'reporting',    label: 'Reporting' },
  { id: 'payments',     label: 'Payments', agencyOnly: true },
  { id: 'contract',     label: 'Contract',  agencyOnly: true },
]

function HealthGauge({ score = 92 }) {
  const r     = 36
  const circ  = 2 * Math.PI * r
  const filled = Math.min(score / 100, 1) * circ
  const color  = score >= 80 ? '#BABEAF' : score >= 50 ? '#D4A843' : '#C0392B'
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#E8ECF0" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={r}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink leading-none">{score}</span>
          <span className="text-[0.58rem] text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
    </div>
  )
}

function MiniBarChart({ data = [12, 20, 16, 28, 22, 34, 48], accent = '#424B63', muted = '#D1D8DE' }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-[3px] h-9 mt-2">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max((v / max) * 100, 5)}%`,
            background: i === data.length - 1 ? accent : muted,
          }}
        />
      ))}
    </div>
  )
}

function TaskRow({ task, dueDateColor = 'text-muted-foreground' }) {
  const fmtDate = d => new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-ink truncate">{task.name}</div>
        {task.category && <div className="text-[0.58rem] text-muted-foreground">{task.category}</div>}
      </div>
      {task.owner && <span className="badge badge-gray text-[0.55rem] flex-shrink-0">{task.owner}</span>}
      {task.due_date && (
        <span className={`text-[0.58rem] flex-shrink-0 ${dueDateColor}`}>{fmtDate(task.due_date)}</span>
      )}
    </div>
  )
}

function ClientHomeSection({ client }) {
  const [healthOpen, setHealthOpen]     = useState(false)
  const [projectOpen, setProjectOpen]   = useState(false)
  const [tasks, setTasks]               = useState(null)
  const [tasksLoading, setTasksLoading] = useState(false)

  const loadTasks = async () => {
    if (tasks !== null) return
    setTasksLoading(true)
    try {
      const all = await getClientTasks(client.id)
      setTasks(all)
    } catch { setTasks([]) }
    setTasksLoading(false)
  }

  const toggleHealth = async () => {
    await loadTasks()
    setHealthOpen(o => !o)
  }

  const toggleProject = async () => {
    await loadTasks()
    setProjectOpen(o => !o)
  }

  const now = new Date()
  const t   = tasks || []

  const doneTasks     = t.filter(x => x.status === 'Done' || x.status === 'Complete')
  const resolvedTasks = t.filter(x => x.status === 'Resolved')
  const overdueTasks  = t.filter(x =>
    x.due_date && new Date(x.due_date) < now &&
    !['Done','Complete','Resolved'].includes(x.status)
  )
  const blockedTasks  = t.filter(x => x.status === 'Blocked')
  const activeTasks   = t.filter(x =>
    ['Today','Now','In Progress'].includes(x.status) &&
    !(x.due_date && new Date(x.due_date) < now)
  )
  const upcomingTasks = t.filter(x => {
    if (!x.due_date) return false
    const d = new Date(x.due_date)
    const days = Math.ceil((d - now) / 86400000)
    return days >= 0 && days <= 14 && !['Done','Complete','Resolved','Blocked'].includes(x.status)
  })

  const projectHealth = {
    status: 'On Track',
    statusBadge: 'badge-sage',
    deliverablesOnSchedule: 8,
    totalDeliverables: 10,
    overdueTasksCount: 1,
    daysToNextMilestone: 12,
    lastActivity: '2 hours ago',
  }

  const suggestions = [
    'Repurpose top content',
    'Add more client testimonials',
    'Update website service page',
  ]

  const glanceItems = [
    { label: 'Content drafts to review',      count: 5 },
    { label: 'Website updates in progress',   count: 2 },
    { label: 'Campaigns in progress',          count: 1 },
    { label: 'Events upcoming',               count: 2 },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-ink">Client Home</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Everything you need, at a glance.</p>
      </div>

      {/* Row 1: Health + Project Health */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <button
          onClick={toggleHealth}
          className={`card p-5 flex flex-col items-center justify-center text-center w-full hover:border-navy/40 transition-colors ${healthOpen ? 'border-navy/40 bg-cream/30' : ''}`}
        >
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Client Health
          </div>
          <HealthGauge score={92} />
          <div className="mt-3 text-sm font-semibold text-ink">Excellent</div>
          <div className="text-[0.62rem] text-muted-foreground mt-0.5">You're on track!</div>
          <div className="text-[0.6rem] text-navy mt-3 opacity-70">
            {healthOpen ? '↑ Hide' : '↓ See completed & resolved'}
          </div>
        </button>

        <button
          onClick={toggleProject}
          className={`card p-5 col-span-2 text-left w-full hover:border-navy/40 transition-colors ${projectOpen ? 'border-navy/40 bg-cream/30' : ''}`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Project Health
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${projectHealth.statusBadge}`}>{projectHealth.status}</span>
              <span className="text-[0.6rem] text-navy opacity-70">{projectOpen ? '↑ Hide' : '↓ Details'}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: 'Active tasks',
                value: tasks !== null ? activeTasks.length : projectHealth.deliverablesOnSchedule,
                sub: 'in progress',
              },
              {
                label: 'Overdue',
                value: tasks !== null ? overdueTasks.length : projectHealth.overdueTasksCount,
                accent: tasks !== null ? overdueTasks.length > 0 : projectHealth.overdueTasksCount > 0,
              },
              {
                label: 'Blocked',
                value: tasks !== null ? blockedTasks.length : '—',
                accent: tasks !== null && blockedTasks.length > 0,
              },
              {
                label: 'Last activity',
                value: projectHealth.lastActivity,
                small: true,
              },
            ].map(({ label, value, sub, accent, small }) => (
              <div key={label}>
                <div className="text-[0.58rem] text-muted-foreground mb-1.5">{label}</div>
                <div className={`font-semibold leading-none ${small ? 'text-sm' : 'text-xl'} ${accent ? 'text-red-500' : 'text-ink'}`}>
                  {value}
                </div>
                {sub && <div className="text-[0.58rem] text-muted-foreground mt-1">{sub}</div>}
              </div>
            ))}
          </div>
        </button>
      </div>

      {/* Health detail panel */}
      {healthOpen && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Completed &amp; Resolved
            </div>
            <button
              onClick={() => setHealthOpen(false)}
              className="text-xs text-muted-foreground hover:text-ink transition-colors w-5 h-5 flex items-center justify-center rounded"
            >
              ✕
            </button>
          </div>

          {tasksLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <span className="spinner" /> Loading tasks…
            </div>
          ) : doneTasks.length === 0 && resolvedTasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No completed or resolved tasks yet.
            </div>
          ) : (
            <div>
              {doneTasks.length > 0 && (
                <div className="mb-4">
                  <div className="text-[0.56rem] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    Done ({doneTasks.length})
                  </div>
                  {doneTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                      <div className="w-5 h-5 rounded-full bg-sage/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[0.6rem] text-ink font-bold">✓</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-ink truncate">{t.name}</div>
                        {t.category && <div className="text-[0.6rem] text-muted-foreground">{t.category}</div>}
                      </div>
                      {t.owner && <span className="badge badge-gray text-[0.58rem]">{t.owner}</span>}
                      {t.due_date && (
                        <span className="text-[0.6rem] text-muted-foreground flex-shrink-0">
                          {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {resolvedTasks.length > 0 && (
                <div>
                  <div className="text-[0.56rem] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    Resolved ({resolvedTasks.length})
                  </div>
                  {resolvedTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                      <div className="w-5 h-5 rounded-full bg-blush flex items-center justify-center flex-shrink-0">
                        <span className="text-[0.6rem] text-ink font-bold">↺</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-ink truncate">{t.name}</div>
                        {t.category && <div className="text-[0.6rem] text-muted-foreground">{t.category}</div>}
                      </div>
                      {t.owner && <span className="badge badge-gray text-[0.58rem]">{t.owner}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Project health detail panel */}
      {projectOpen && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Project breakdown
            </div>
            <button
              onClick={() => setProjectOpen(false)}
              className="text-xs text-muted-foreground hover:text-ink transition-colors w-5 h-5 flex items-center justify-center rounded"
            >
              ✕
            </button>
          </div>

          {tasksLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <span className="spinner" /> Loading tasks…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Overdue */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-wider text-red-500">
                    Overdue ({overdueTasks.length})
                  </span>
                </div>
                {overdueTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">None — great work!</p>
                ) : overdueTasks.map(task => (
                  <TaskRow key={task.id} task={task} dueDateColor="text-red-500" />
                ))}
              </div>

              {/* Blocked */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-wider text-amber-600">
                    Blocked ({blockedTasks.length})
                  </span>
                </div>
                {blockedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nothing blocked.</p>
                ) : blockedTasks.map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>

              {/* Active / in progress */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-navy flex-shrink-0" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-wider text-navy">
                    Active ({activeTasks.length})
                  </span>
                </div>
                {activeTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No active tasks right now.</p>
                ) : activeTasks.map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>

              {/* Upcoming (next 14 days) */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-bluegrey flex-shrink-0" />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Due soon ({upcomingTasks.length})
                  </span>
                </div>
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Nothing due in the next 14 days.</p>
                ) : upcomingTasks.map(task => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Suggestions + Emails Sent + Current Focus */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-5">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Suggestions to Improve
          </div>
          <div className="space-y-2.5">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-sm bg-sage" />
                </div>
                <span className="text-xs text-ink leading-snug">{s}</span>
              </div>
            ))}
          </div>
          <button className="text-[0.63rem] text-navy mt-4 hover:underline">
            See all suggestions →
          </button>
        </div>

        <div className="card p-5">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Emails Sent
          </div>
          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-3xl font-semibold text-ink leading-none">48</span>
            <span className="text-xs text-muted-foreground">this month</span>
          </div>
          <MiniBarChart />
          <button className="text-[0.63rem] text-navy mt-3 hover:underline">View history →</button>
        </div>

        <div className="card p-5">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Current Focus
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-sage flex-shrink-0" />
            <span className="text-sm font-medium text-ink">Content & Visibility</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Building authority and consistent visibility.
          </p>
          <button className="text-[0.63rem] text-navy mt-4 hover:underline">
            View focus plan →
          </button>
        </div>
      </div>

      {/* Row 3: This Month at a Glance */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
            This Month at a Glance
          </div>
          <button className="text-[0.63rem] text-navy hover:underline">View full calendar →</button>
        </div>
        <div className="space-y-0">
          {glanceItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
              <span className="text-xs text-ink">{item.label}</span>
              <span className="badge badge-gray">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StubSection({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mb-4">
        <span className="text-bluegrey text-xl">◌</span>
      </div>
      <div className="font-display text-2xl text-ink mb-1.5">{label}</div>
      <div className="text-sm text-muted-foreground">This section is coming soon.</div>
    </div>
  )
}

export default function ClientWorkspace() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuth()
  const [client, setClient]               = useState(null)
  const [loading, setLoading]             = useState(true)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    getClient(id)
      .then(d => { setClient(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-8 text-sm text-muted-foreground">
        <span className="spinner" /> Loading client…
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Client not found.{' '}
        <button className="text-navy underline ml-1" onClick={() => navigate('/clients')}>
          Back to Clients
        </button>
      </div>
    )
  }

  const isAgency = profile?.role !== 'client'
  const visibleSections = SECTIONS.filter(s => !s.agencyOnly || isAgency)

  const renderSection = () => {
    switch (activeSection) {
      case 'home':
        return <ClientHomeSection client={client} />
      case 'content':
        return <ContentBoard client={client} />
      case 'meetings':
        return <Meetings client={client} />
      default: {
        const sec = SECTIONS.find(s => s.id === activeSection)
        return <StubSection label={sec?.label || activeSection} />
      }
    }
  }

  const initials = (client.name || '??').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col">
      {/* Client topbar */}
      <div className="bg-white border-b border-border px-6 py-3.5 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/clients')}
          className="text-xs text-muted-foreground hover:text-ink transition-colors flex items-center gap-1 flex-shrink-0"
        >
          ← All Clients
        </button>
        <div className="w-px h-4 bg-border flex-shrink-0" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blush flex items-center justify-center text-[0.62rem] font-bold text-ink flex-shrink-0">
            {initials}
          </div>
          <h1 className="font-display text-xl text-ink leading-tight truncate">{client.name}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {client.stage  && <span className="badge badge-gray">{client.stage}</span>}
          {client.health && <span className="badge badge-sage">{client.health}</span>}
          {client.mrr > 0 && <span className="badge badge-teal">${client.mrr.toLocaleString()}/mo</span>}
        </div>
      </div>

      {/* Body: sub-nav + section content */}
      <div className="flex flex-1 min-h-0">

        {/* Left sub-navigation */}
        <aside className="w-48 bg-white border-r border-border flex-shrink-0 py-3 px-2 self-start sticky top-[57px]" style={{ minHeight: 'calc(100vh - 57px)' }}>
          {visibleSections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-xs mb-0.5 transition-colors ${
                activeSection === section.id
                  ? 'bg-navy text-white font-medium'
                  : 'text-ink/70 hover:bg-cream hover:text-ink'
              }`}
            >
              <span>{section.label}</span>
              {section.agencyOnly && (
                <span className={`text-[0.48rem] font-normal ml-1 ${activeSection === section.id ? 'text-white/50' : 'text-muted-foreground/60'}`}>
                  Internal
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Section content */}
        <main className="flex-1 p-6 min-w-0">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
