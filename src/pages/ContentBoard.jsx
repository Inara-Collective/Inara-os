import React, { useState, useEffect } from 'react'
import { getContentItems, createContentItem, updateContentItem, deleteContentItem, getClients, CONTENT_STATUSES, CONTENT_PLATFORMS, CONTENT_TYPES, CONTENT_PILLARS, TASK_OWNERS } from '../lib/supabase.js'

const PRODUCTION = ['Ideas', 'Strategy Approved', 'Writing / Drafting', 'Design / Editing', 'Internal Review']
const CLIENT_REVIEW = ['Ready for Client Review', 'Sent to Client', 'Client Feedback Received']
const COMPLETE = ['Approved', 'Scheduled', 'Posted / Sent / Live', 'Reported']

const PHASE_TABS = [
  { label: 'Production', statuses: PRODUCTION },
  { label: 'Client Review', statuses: CLIENT_REVIEW },
  { label: 'Complete', statuses: COMPLETE },
]

const STATUS_COLOR = {
  'Ideas': 'rgba(255,255,255,.3)',
  'Strategy Approved': 'var(--blue)',
  'Writing / Drafting': 'var(--amber)',
  'Design / Editing': 'var(--amber)',
  'Internal Review': 'var(--purple)',
  'Ready for Client Review': 'var(--teal)',
  'Sent to Client': 'var(--teal)',
  'Client Feedback Received': 'var(--red)',
  'Approved': 'var(--teal)',
  'Scheduled': 'var(--blue)',
  'Posted / Sent / Live': 'var(--teal)',
  'Reported': 'rgba(255,255,255,.3)',
}

const PRIORITY_COLOR = { 'High': 'var(--red)', 'Medium': 'var(--amber)', 'Low': 'var(--muted)' }

export default function ContentBoard() {
  const [items, setItems] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('Production')
  const [clientFilter, setClientFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    Promise.all([getContentItems(), getClients()])
      .then(([i, c]) => { setItems(i); setClients(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const phaseStatuses = PHASE_TABS.find(p => p.label === phase)?.statuses || []

  const filtered = items.filter(i => {
    if (!phaseStatuses.includes(i.status)) return false
    if (clientFilter && i.client_id !== clientFilter) return false
    if (ownerFilter && i.assigned_to !== ownerFilter) return false
    return true
  })

  const upd = async (id, updates) => {
    const u = await updateContentItem(id, updates)
    setItems(p => p.map(i => i.id === id ? u : i))
  }

  const del = async (id) => {
    await deleteContentItem(id)
    setItems(p => p.filter(i => i.id !== id))
  }

  const handleNew = (item) => { setItems(p => [...p, item]); setShowNew(false) }
  const handleEdit = (item) => { setItems(p => p.map(i => i.id === item.id ? item : i)); setEditing(null) }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading content board...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Content Board</div>
        <div className="topbar-actions">
          <select className="form-select" style={{ width: 160, padding: '.4rem .75rem', fontSize: '.78rem' }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 150, padding: '.4rem .75rem', fontSize: '.78rem' }} value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
            <option value="">All owners</option>
            {TASK_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New piece</button>
        </div>
      </div>

      <div className="page">
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem' }}>
          {PHASE_TABS.map(pt => {
            const count = items.filter(i =>
              pt.statuses.includes(i.status) &&
              (!clientFilter || i.client_id === clientFilter) &&
              (!ownerFilter || i.assigned_to === ownerFilter)
            ).length
            return (
              <button
                key={pt.label}
                onClick={() => setPhase(pt.label)}
                className="btn"
                style={{
                  borderRadius: '20px',
                  background: phase === pt.label ? 'var(--dark)' : 'var(--warm)',
                  color: phase === pt.label ? 'var(--bg)' : 'var(--muted)',
                  border: `.5px solid ${phase === pt.label ? 'var(--dark)' : 'var(--border)'}`,
                  fontSize: '.72rem',
                }}
              >
                {pt.label} <span style={{ opacity: .65, marginLeft: '.25rem' }}>{count}</span>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${phaseStatuses.length}, 1fr)`, gap: '1rem', alignItems: 'start' }}>
          {phaseStatuses.map(status => {
            const col = filtered.filter(i => i.status === status)
            return (
              <div key={status}>
                <div style={{ fontSize: '.56rem', letterSpacing: '.15em', textTransform: 'uppercase', color: STATUS_COLOR[status], fontWeight: 600, marginBottom: '.75rem', textAlign: 'center', padding: '.32rem', background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', borderBottom: `2px solid ${STATUS_COLOR[status]}` }}>
                  {status} ({col.length})
                </div>
                {col.map(item => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditing(item)}
                    onPushToClient={() => upd(item.id, { status: 'Ready for Client Review' })}
                  />
                ))}
                {col.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '1.5rem .5rem', color: 'var(--muted)', fontSize: '.72rem', border: '.5px dashed var(--border)', borderRadius: '8px' }}>Empty</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-head">
              <div className="modal-title">New Content Piece</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <NewItemForm clients={clients} onSave={handleNew} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-head">
              <div className="modal-title truncate" style={{ flex: 1, minWidth: 0 }}>{editing.title}</div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
                <button className="btn btn-danger btn-xs" onClick={() => { del(editing.id); setEditing(null) }}>Delete</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>✕</button>
              </div>
            </div>
            <EditItemForm item={editing} clients={clients} onSave={handleEdit} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}
    </div>
  )
}

function ContentCard({ item, onEdit, onPushToClient }) {
  const isFeedback = item.status === 'Client Feedback Received'
  return (
    <div style={{
      background: isFeedback ? 'var(--red-bg)' : 'var(--warm)',
      border: `.5px solid ${isFeedback ? 'var(--red-b)' : 'var(--border)'}`,
      borderRadius: '8px',
      marginBottom: '.5rem',
      overflow: 'hidden',
      borderLeft: `2px solid ${STATUS_COLOR[item.status]}`,
    }}>
      <div onClick={onEdit} style={{ padding: '.65rem .875rem', cursor: 'pointer' }}>
        <div style={{ fontSize: '.75rem', fontWeight: 500, marginBottom: '.28rem', lineHeight: 1.35, color: isFeedback ? 'var(--red)' : 'var(--dark)' }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.38rem', flexWrap: 'wrap' }}>
          {item.clients?.name && <span style={{ fontSize: '.6rem', color: 'var(--muted)' }}>{item.clients.name}</span>}
          {item.platform && <span className="badge badge-gray" style={{ fontSize: '.54rem' }}>{item.platform}</span>}
          {item.content_type && <span className="badge badge-gray" style={{ fontSize: '.54rem' }}>{item.content_type}</span>}
          {item.priority === 'High' && <span style={{ fontSize: '.58rem', color: 'var(--red)', fontWeight: 600 }}>!</span>}
          {item.due_date && (
            <span style={{ fontSize: '.6rem', color: new Date(item.due_date) < new Date() ? 'var(--red)' : 'var(--muted)' }}>
              Due {new Date(item.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      {isFeedback && item.client_comments && (
        <div style={{ padding: '.4rem .875rem', borderTop: '.5px solid var(--red-b)', fontSize: '.68rem', color: 'var(--red)', lineHeight: 1.45, fontStyle: 'italic' }}>
          "{item.client_comments}"
        </div>
      )}
      {item.status === 'Internal Review' && (
        <div style={{ padding: '.4rem .875rem', borderTop: '.5px solid var(--border)' }}>
          <button
            className="btn btn-primary btn-xs"
            style={{ width: '100%', fontSize: '.62rem' }}
            onClick={e => { e.stopPropagation(); onPushToClient() }}
          >
            → Push to client review
          </button>
        </div>
      )}
    </div>
  )
}

function NewItemForm({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', status: 'Ideas', platform: '', content_type: '', assigned_to: '', priority: 'Medium', client_id: '', due_date: '', pillar: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    const item = await createContentItem({ ...form, client_id: form.client_id || null, due_date: form.due_date || null })
    onSave(item)
  }

  return (
    <>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>{CONTENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>{['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}</select></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={e => set('client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Assigned to</label><select className="form-select" value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}><option value="">Unassigned</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Platform</label><select className="form-select" value={form.platform} onChange={e => set('platform', e.target.value)}><option value="">—</option>{CONTENT_PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Content type</label><select className="form-select" value={form.content_type} onChange={e => set('content_type', e.target.value)}><option value="">—</option>{CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Pillar</label><select className="form-select" value={form.pillar} onChange={e => set('pillar', e.target.value)}><option value="">—</option>{CONTENT_PILLARS.map(p => <option key={p}>{p}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Due date</label><input type="date" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>Create</button>
      </div>
    </>
  )
}

function EditItemForm({ item, clients, onSave, onCancel }) {
  const [form, setForm] = useState({ ...item })
  const [tab, setTab] = useState('Overview')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    const { clients: _c, ...updates } = form
    const u = await updateContentItem(form.id, updates)
    onSave(u)
  }

  const TABS = ['Overview', 'Copy', 'Production', 'Links & Notes']

  return (
    <>
      <div style={{ borderBottom: '.5px solid var(--border)', padding: '0 1.5rem', display: 'flex', gap: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent', padding: '.6rem .875rem', fontSize: '.72rem', color: tab === t ? 'var(--dark)' : 'var(--muted)', cursor: 'pointer', marginBottom: -1 }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="modal-body">
        {tab === 'Overview' && (
          <>
            <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title || ''} onChange={e => set('title', e.target.value)} /></div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status || ''} onChange={e => set('status', e.target.value)}>{CONTENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority || 'Medium'} onChange={e => set('priority', e.target.value)}>{['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}</select></div>
            </div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id || ''} onChange={e => set('client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Assigned to</label><select className="form-select" value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value)}><option value="">Unassigned</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select></div>
            </div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Platform</label><select className="form-select" value={form.platform || ''} onChange={e => set('platform', e.target.value)}><option value="">—</option>{CONTENT_PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Content type</label><select className="form-select" value={form.content_type || ''} onChange={e => set('content_type', e.target.value)}><option value="">—</option>{CONTENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            </div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Pillar</label><select className="form-select" value={form.pillar || ''} onChange={e => set('pillar', e.target.value)}><option value="">—</option>{CONTENT_PILLARS.map(p => <option key={p}>{p}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Campaign</label><input className="form-input" value={form.campaign || ''} onChange={e => set('campaign', e.target.value)} /></div>
            </div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Publish date</label><input type="date" className="form-input" value={form.publish_date || ''} onChange={e => set('publish_date', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Due date</label><input type="date" className="form-input" value={form.due_date || ''} onChange={e => set('due_date', e.target.value)} /></div>
            </div>
          </>
        )}
        {tab === 'Copy' && (
          <>
            <div className="form-group"><label className="form-label">Hook</label><textarea className="form-textarea" style={{ minHeight: 60 }} value={form.hook || ''} onChange={e => set('hook', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Caption</label><textarea className="form-textarea" style={{ minHeight: 100 }} value={form.caption || ''} onChange={e => set('caption', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">CTA</label><input className="form-input" value={form.cta || ''} onChange={e => set('cta', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Graphic text</label><input className="form-input" value={form.graphic_text || ''} onChange={e => set('graphic_text', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Carousel slides</label><textarea className="form-textarea" style={{ minHeight: 80 }} value={form.carousel_slides || ''} onChange={e => set('carousel_slides', e.target.value)} placeholder="One slide per line..." /></div>
          </>
        )}
        {tab === 'Production' && (
          <>
            <div className="form-group"><label className="form-label">Script</label><textarea className="form-textarea" style={{ minHeight: 120 }} value={form.script || ''} onChange={e => set('script', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">B-roll notes</label><textarea className="form-textarea" style={{ minHeight: 70 }} value={form.broll_notes || ''} onChange={e => set('broll_notes', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Shot list</label><textarea className="form-textarea" style={{ minHeight: 70 }} value={form.shot_list || ''} onChange={e => set('shot_list', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Creative direction</label><textarea className="form-textarea" style={{ minHeight: 70 }} value={form.creative_direction || ''} onChange={e => set('creative_direction', e.target.value)} /></div>
          </>
        )}
        {tab === 'Links & Notes' && (
          <>
            <div className="form-group"><label className="form-label">Canva link</label><input className="form-input" value={form.canva_link || ''} onChange={e => set('canva_link', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Drive link</label><input className="form-input" value={form.drive_link || ''} onChange={e => set('drive_link', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Asset link</label><input className="form-input" value={form.asset_link || ''} onChange={e => set('asset_link', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Internal notes</label><textarea className="form-textarea" style={{ minHeight: 80 }} value={form.internal_notes || ''} onChange={e => set('internal_notes', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Performance notes</label><textarea className="form-textarea" style={{ minHeight: 60 }} value={form.performance_notes || ''} onChange={e => set('performance_notes', e.target.value)} /></div>
            {form.client_comments && (
              <div className="form-group">
                <label className="form-label">Client feedback</label>
                <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red-b)', borderRadius: '6px', padding: '.75rem', fontSize: '.78rem', color: 'var(--red)', lineHeight: 1.55 }}>{form.client_comments}</div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>Save changes</button>
      </div>
    </>
  )
}
