import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import { getClient } from '../lib/supabase.js'

const SECTIONS = [
  { id: 'home',         label: 'Client Home' },
  { id: 'package',      label: 'Package Overview' },
  { id: 'meetings',     label: 'Meetings' },
  { id: 'onboarding',   label: 'Onboarding' },
  { id: 'deliverables', label: 'Monthly Deliverables' },
  { id: 'content',      label: 'Content Hub' },
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

function ClientHomeSection({ client, onNavigate }) {
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

  const quickLinks = [
    { label: 'Content Hub',        icon: '◈', section: 'content' },
    { label: 'Email Marketing',    icon: '✉', section: 'email' },
    { label: 'Website',            icon: '◎', section: 'website' },
    { label: 'Payments',           icon: '◷', section: 'payments' },
    { label: 'Events & Campaigns', icon: '◉', section: 'content' },
    { label: 'Monthly Reports',    icon: '◌', section: 'reporting' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-ink">Client Home</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Everything you need, at a glance.</p>
      </div>

      {/* Row 1: Health + Project Health */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-5 flex flex-col items-center justify-center text-center">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Client Health
          </div>
          <HealthGauge score={92} />
          <div className="mt-3 text-sm font-semibold text-ink">Excellent</div>
          <div className="text-[0.62rem] text-muted-foreground mt-0.5">You're on track!</div>
        </div>

        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground">
              Project Health
            </div>
            <span className={`badge ${projectHealth.statusBadge}`}>{projectHealth.status}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'On schedule', value: `${projectHealth.deliverablesOnSchedule} / ${projectHealth.totalDeliverables}`, sub: 'deliverables' },
              { label: 'Overdue tasks', value: projectHealth.overdueTasksCount, accent: projectHealth.overdueTasksCount > 0 },
              { label: 'Next milestone', value: `${projectHealth.daysToNextMilestone}d`, sub: 'away' },
              { label: 'Last activity', value: projectHealth.lastActivity, small: true },
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
        </div>
      </div>

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

      {/* Row 3: This Month at a Glance + Quick Links */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 col-span-2">
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

        <div className="card p-5">
          <div className="text-[0.58rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Quick Links
          </div>
          <div className="space-y-0.5">
            {quickLinks.map((link, i) => (
              <button
                key={i}
                onClick={() => onNavigate(link.section)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs text-ink hover:bg-cream transition-colors text-left"
              >
                <span className="text-muted-foreground text-sm w-4 text-center">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>
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
        return <ClientHomeSection client={client} onNavigate={setActiveSection} />
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
