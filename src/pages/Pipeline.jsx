import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, createClient_, getUsers, PIPELINE_STAGES, SALES_STAGES, ACTION_TAKEN_OPTIONS, NEXT_ACTION_OPTIONS } from '../lib/supabase.js'

const STAGE_COLOR = {
  'New': 'var(--muted)',
  'Reached out': 'var(--blue)',
  'To Action': 'var(--gold)',
  'Discovery': 'var(--purple)',
  'Negotiation': 'var(--amber)',
  'Won': 'var(--teal)',
  'Lost': 'var(--red)',
  'No Deal stage': 'var(--muted)',
}

const SOURCE_PALETTE = ['#B8956A','#4A90B8','#4CAF8A','#8B5CBE','#E87F4A','#D4A843','#E06B8B']

function sourceColor(str) {
  if (!str) return 'rgba(184,149,106,.6)'
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return SOURCE_PALETTE[Math.abs(h) % SOURCE_PALETTE.length]
}

function avatarColor(str) {
  if (!str) return '#88847A'
  const cols = ['#B8956A','#4A90B8','#4CAF8A','#8B5CBE','#E87F4A','#D4A843','#5B8FBE']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return cols[Math.abs(h) % cols.length]
}

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ClientCard({ client, onClick }) {
  const actions = client.action_taken
    ? client.action_taken.split(',').map(a => a.trim()).filter(Boolean)
    : []
  const sc = sourceColor(client.connector_name)
  const ac = avatarColor(client.assigned_to)
  const displayDate = client.next_action_date || client.date_contacted
  const notesPreview = client.inara_notes?.trim() || client.notes?.trim()

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--warm)',
        border: '.5px solid var(--border)',
        borderRadius: '8px',
        padding: '.875rem',
        marginBottom: '.5rem',
        cursor: 'pointer',
        transition: 'border-color .12s, box-shadow .12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.07)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Date */}
      {displayDate && (
        <div style={{ fontSize: '.65rem', color: 'var(--muted)', marginBottom: '.35rem' }}>{fmtDate(displayDate)}</div>
      )}

      {/* Notes preview */}
      {notesPreview && (
        <div style={{ fontSize: '.7rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '.4rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {notesPreview}
        </div>
      )}

      {/* Assigned person */}
      {client.assigned_to && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginBottom: '.5rem' }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${ac}22`, border: `.5px solid ${ac}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.52rem', fontWeight: 600, color: ac, flexShrink: 0 }}>
            {client.assigned_to.slice(0,1).toUpperCase()}
          </div>
          <span style={{ fontSize: '.68rem', color: 'var(--muted)' }}>{client.assigned_to}</span>
        </div>
      )}

      {/* Name */}
      <div style={{ fontWeight: 600, fontSize: '.88rem', color: 'var(--dark)', lineHeight: 1.3, marginBottom: '.35rem' }}>{client.name}</div>

      {/* Fit score badge */}
      {client.fit_score && (
        <div style={{ marginBottom: '.35rem' }}>
          {client.fit_score >= 8
            ? <span style={{ fontSize: '.6rem', padding: '.12rem .45rem', borderRadius: '20px', background: 'var(--purple-bg)', color: 'var(--purple)', border: '.5px solid var(--purple-b)', fontWeight: 500 }}>High</span>
            : client.fit_score >= 5
            ? <span style={{ fontSize: '.6rem', padding: '.12rem .45rem', borderRadius: '20px', background: 'var(--gold-bg)', color: 'var(--amber)', border: '.5px solid var(--gold-b)', fontWeight: 500 }}>Medium</span>
            : <span style={{ fontSize: '.6rem', padding: '.12rem .45rem', borderRadius: '20px', background: 'var(--border)', color: 'var(--muted)', border: '.5px solid var(--border)', fontWeight: 500 }}>Low</span>
          }
        </div>
      )}

      {/* Contact info */}
      {client.contact_email && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.18rem' }}>{client.contact_email}</div>}
      {client.phone && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.18rem' }}>{client.phone}</div>}
      {client.company && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.25rem' }}>{client.company}</div>}

      {/* Source / connector tag */}
      {client.connector_name && (
        <div style={{ marginBottom: '.3rem' }}>
          <span style={{ display: 'inline-block', fontSize: '.62rem', padding: '.15rem .52rem', borderRadius: '20px', background: `${sc}18`, color: sc, border: `.5px solid ${sc}55`, fontWeight: 500 }}>
            {client.connector_name}
          </span>
        </div>
      )}

      {/* Role */}
      {client.contact_role && (
        <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: '.1rem' }}>{client.contact_role}</div>
      )}

      {/* Next action + action taken */}
      {(client.next_action_to_take || client.next_action || actions.length > 0) && (
        <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '.5px solid var(--border)' }}>
          {(client.next_action_to_take || client.next_action) && (
            <div style={{ marginBottom: actions.length > 0 ? '.4rem' : 0 }}>
              <div style={{ fontSize: '.5rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.1rem' }}>Next action</div>
              <div style={{ fontSize: '.7rem', color: 'var(--dark)' }}>{client.next_action_to_take || client.next_action}</div>
            </div>
          )}
          {actions.length > 0 && (
            <div>
              <div style={{ fontSize: '.5rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.22rem' }}>Action taken</div>
              <div style={{ display: 'flex', gap: '.28rem', flexWrap: 'wrap' }}>
                {actions.map((a, i) => (
                  <span key={i} style={{ fontSize: '.62rem', padding: '.13rem .48rem', borderRadius: '4px', background: 'var(--bg)', border: '.5px solid var(--border)', color: 'var(--dark2)', fontWeight: 400 }}>{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Pipeline() {
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getClients().then(d => { setClients(d); setLoading(false) }).catch(() => setLoading(false))
    getUsers().then(setUsers).catch(() => {})
  }, [])

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  const handleNew = (c) => { setClients(p => [c, ...p]); setShowNew(false) }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading pipeline...</div></div>

  return (
    <div style={{ minWidth: 'max-content', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <div className="topbar-title">Pipeline</div>
        <div className="topbar-actions">
          <input
            className="form-input"
            style={{ width: 220, padding: '.4rem .75rem' }}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setShowNew('New')}>+ New deal</button>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.75rem 2rem', flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '.875rem', alignItems: 'start' }}>
          {SALES_STAGES.map(stage => {
            const col = filtered.filter(c => c.stage === stage)
            const color = STAGE_COLOR[stage]
            return (
              <div key={stage} style={{ width: 220, flexShrink: 0 }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.625rem', padding: '0 .1rem' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 600, color, letterSpacing: '.04em' }}>{stage}</span>
                  <span style={{ fontSize: '.68rem', color: 'var(--muted)', fontWeight: 400 }}>{col.length}</span>
                </div>

                {/* Cards */}
                {col.map(c => (
                  <ClientCard key={c.id} client={c} onClick={() => navigate(`/pipeline/${c.id}`)} />
                ))}

                {/* Empty state */}
                {col.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.25rem .5rem', color: 'var(--border)', fontSize: '.7rem' }}>—</div>
                )}

                {/* Add new deal */}
                <button
                  onClick={() => setShowNew(stage)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '.35rem .1rem', color: 'var(--muted)', fontSize: '.7rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.3rem', opacity: .6 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = .6}
                >
                  <span style={{ fontSize: '.85rem', lineHeight: 1 }}>+</span> New deal
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <div className="modal-title">New Deal</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(null)}>✕</button>
            </div>
            <NewDealForm defaultStage={showNew} users={users} onClose={() => setShowNew(null)} onSave={handleNew} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewDealForm({ defaultStage = 'New', users = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', company: '', contact_email: '', phone: '', contact_role: '', industry: '',
    stage: defaultStage, connector_name: '', action_taken: '', next_action: '',
    next_action_date: '', next_action_to_take: '', date_contacted: '', assigned_to: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAction = (opt) => {
    const current = form.action_taken ? form.action_taken.split(',').map(s => s.trim()).filter(Boolean) : []
    const next = current.includes(opt) ? current.filter(x => x !== opt) : [...current, opt]
    set('action_taken', next.join(', '))
  }
  const actionSelected = form.action_taken ? form.action_taken.split(',').map(s => s.trim()).filter(Boolean) : []

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const c = await createClient_(form)
      onSave(c)
    } catch (e) {
      setError(e.message || 'Failed to create')
    }
    setSaving(false)
  }

  const assignOptions = users.map(u => u.name).filter(Boolean)

  return (
    <>
      <div className="modal-body">
        {error && <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red-b)', borderRadius: '6px', padding: '.625rem .875rem', fontSize: '.76rem', color: 'var(--red)' }}>{error}</div>}

        <div style={{ fontSize: '.56rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Contact details</div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} autoFocus placeholder="Contact or business name" /></div>
          <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => set('company', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Role / title</label><input className="form-input" value={form.contact_role} onChange={e => set('contact_role', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Industry</label><input className="form-input" value={form.industry} onChange={e => set('industry', e.target.value)} /></div>
        </div>

        <div className="divider" />
        <div style={{ fontSize: '.56rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Pipeline</div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Stage</label><select className="form-select" value={form.stage} onChange={e => set('stage', e.target.value)}>{SALES_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Lead source / event</label><input className="form-input" value={form.connector_name} onChange={e => set('connector_name', e.target.value)} placeholder="e.g. Lads Who Lunch May 26" /></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Date contacted</label><input className="form-input" type="date" value={form.date_contacted} onChange={e => set('date_contacted', e.target.value)} /></div>
          {assignOptions.length > 0 && (
            <div className="form-group"><label className="form-label">Assigned to</label><select className="form-select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}><option value="">—</option>{assignOptions.map(n => <option key={n}>{n}</option>)}</select></div>
          )}
        </div>

        <div className="divider" />
        <div style={{ fontSize: '.56rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Action taken</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
          {ACTION_TAKEN_OPTIONS.map(opt => (
            <button key={opt} type="button" onClick={() => toggleAction(opt)} style={{ padding: '.2rem .55rem', borderRadius: '4px', fontSize: '.68rem', cursor: 'pointer', background: actionSelected.includes(opt) ? 'var(--dark)' : 'transparent', color: actionSelected.includes(opt) ? 'var(--bg)' : 'var(--muted)', border: `.5px solid ${actionSelected.includes(opt) ? 'var(--dark)' : 'var(--border)'}` }}>
              {opt}
            </button>
          ))}
        </div>

        <div className="divider" />
        <div style={{ fontSize: '.56rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Next action</div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Next action to take</label><select className="form-select" value={form.next_action_to_take} onChange={e => set('next_action_to_take', e.target.value)}><option value="">—</option>{NEXT_ACTION_OPTIONS.map(o => <option key={o}>{o}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Due date</label><input className="form-input" type="date" value={form.next_action_date} onChange={e => set('next_action_date', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Next action details</label><input className="form-input" value={form.next_action} onChange={e => set('next_action', e.target.value)} placeholder="e.g. Send proposal draft" /></div>

        <div className="divider" />
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Creating...' : 'Create deal'}</button>
      </div>
    </>
  )
}

