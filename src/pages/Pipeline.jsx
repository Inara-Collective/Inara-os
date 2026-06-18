import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, createClient_, PIPELINE_STAGES, SALES_STAGES } from '../lib/supabase.js'

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
  if (!str) return 'rgba(255,255,255,.3)'
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return SOURCE_PALETTE[Math.abs(h) % SOURCE_PALETTE.length]
}

function ClientCard({ client, onClick }) {
  const sc = sourceColor(client.connector_name)
  const actions = client.action_taken
    ? client.action_taken.split(',').map(a => a.trim()).filter(Boolean)
    : []

  return (
    <div
      onClick={onClick}
      style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '8px', padding: '.875rem', marginBottom: '.5rem', cursor: 'pointer' }}
    >
      <div style={{ fontWeight: 600, fontSize: '.85rem', marginBottom: '.28rem', color: 'var(--dark)', lineHeight: 1.3 }}>{client.name}</div>
      {client.contact_email && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.15rem' }}>{client.contact_email}</div>}
      {client.phone && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.15rem' }}>{client.phone}</div>}
      {client.company && <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.28rem' }}>{client.company}</div>}
      {client.connector_name && (
        <div style={{ marginBottom: '.28rem' }}>
          <span style={{ display: 'inline-block', fontSize: '.62rem', padding: '.15rem .55rem', borderRadius: '4px', background: `${sc}22`, color: sc, border: `.5px solid ${sc}66` }}>
            {client.connector_name}
          </span>
        </div>
      )}
      {(client.contact_role || client.industry) && (
        <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginBottom: '.1rem' }}>
          {client.contact_role || client.industry}
        </div>
      )}
      {(client.next_action || actions.length > 0) && (
        <div style={{ marginTop: '.5rem', paddingTop: '.5rem', borderTop: '.5px solid var(--border)' }}>
          {client.next_action && (
            <div style={{ marginBottom: actions.length > 0 ? '.38rem' : 0 }}>
              <div style={{ fontSize: '.5rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, marginBottom: '.12rem' }}>Next action</div>
              <div style={{ fontSize: '.7rem', color: 'var(--dark)' }}>{client.next_action}</div>
            </div>
          )}
          {actions.length > 0 && (
            <div>
              <div style={{ fontSize: '.5rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, marginBottom: '.22rem' }}>Action taken</div>
              <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                {actions.map((a, i) => (
                  <span key={i} style={{ fontSize: '.64rem', padding: '.15rem .55rem', borderRadius: '4px', background: 'rgba(255,255,255,.06)', border: '.5px solid var(--border)', color: 'var(--dark)' }}>{a}</span>
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
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getClients().then(d => { setClients(d); setLoading(false) }).catch(() => setLoading(false))
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
    <div>
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

      <div style={{ overflowX: 'auto', padding: '1.5rem 2rem 2rem', flex: 1 }}>
        <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content', alignItems: 'start' }}>
          {SALES_STAGES.map(stage => {
            const col = filtered.filter(c => c.stage === stage)
            const color = STAGE_COLOR[stage]
            return (
              <div key={stage} style={{ width: 240, flexShrink: 0 }}>
                <div style={{ fontSize: '.58rem', letterSpacing: '.14em', textTransform: 'uppercase', color, fontWeight: 600, marginBottom: '.5rem', padding: '.35rem .6rem', background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', borderBottom: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{stage}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{col.length}</span>
                </div>
                <button
                  onClick={() => setShowNew(stage)}
                  style={{ width: '100%', background: 'none', border: '.5px dashed var(--border)', borderRadius: '6px', padding: '.4rem', color: 'var(--muted)', fontSize: '.7rem', cursor: 'pointer', marginBottom: '.5rem' }}
                >
                  + Add
                </button>
                {col.map(c => (
                  <ClientCard key={c.id} client={c} onClick={() => navigate(`/pipeline/${c.id}`)} />
                ))}
                {col.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem .5rem', color: 'var(--muted)', fontSize: '.72rem', border: '.5px dashed var(--border)', borderRadius: '8px' }}>Empty</div>
                )}
              </div>
            )
          })}
          <div style={{ width: 200, flexShrink: 0, paddingTop: '.1rem' }}>
            <button style={{ width: '100%', background: 'none', border: '.5px dashed var(--border)', borderRadius: '6px', padding: '.35rem .6rem', color: 'var(--muted)', fontSize: '.68rem', cursor: 'pointer', textAlign: 'left' }}>
              + New group
            </button>
          </div>
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <div className="modal-title">New Deal</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(null)}>✕</button>
            </div>
            <NewDealForm defaultStage={showNew} onClose={() => setShowNew(null)} onSave={handleNew} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewDealForm({ defaultStage = 'New', onClose, onSave }) {
  const [form, setForm] = useState({ name: '', company: '', contact_email: '', phone: '', contact_role: '', industry: '', stage: defaultStage, connector_name: '', action_taken: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

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

  return (
    <>
      <div className="modal-body">
        {error && <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red-b)', borderRadius: '6px', padding: '.625rem .875rem', marginBottom: '.75rem', fontSize: '.76rem', color: 'var(--red)' }}>{error}</div>}
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
        <div className="g2">
          <div className="form-group"><label className="form-label">Stage</label><select className="form-select" value={form.stage} onChange={e => set('stage', e.target.value)}>{SALES_STAGES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Lead source</label><input className="form-input" value={form.connector_name} onChange={e => set('connector_name', e.target.value)} placeholder="e.g. Lads Who Lunch" /></div>
        </div>
        <div className="form-group"><label className="form-label">Action taken</label><input className="form-input" value={form.action_taken} onChange={e => set('action_taken', e.target.value)} placeholder="e.g. Emailed, Called" /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>{saving ? 'Creating...' : 'Create deal'}</button>
      </div>
    </>
  )
}
