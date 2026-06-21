import React, { useState, useEffect } from 'react'
import { getAllTasks, createTask, updateTask, deleteTask, getClients, TASK_STATUSES, TASK_OWNERS, TASK_CATEGORIES } from '../lib/supabase.js'

const STATUS_COLOR = {
  'Today': 'var(--red)', 'Now': 'var(--amber)', 'Soon': 'var(--blue)', 'Waiting': 'var(--muted)', 'Done': 'var(--teal)',
  'To Do': 'var(--blue)', 'In Progress': 'var(--amber)', 'Awaiting Approval': 'var(--purple)', 'Blocked': 'var(--red)', 'Complete': 'var(--teal)',
}

export default function TeamBoard() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    Promise.all([getAllTasks(), getClients()])
      .then(([t, c]) => { setTasks(t); setClients(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t => {
    if (t.status === 'Complete' || t.status === 'Done') return false
    if (ownerFilter && t.owner !== ownerFilter) return false
    if (clientFilter && t.client_id !== clientFilter) return false
    if (catFilter && t.category !== catFilter) return false
    return true
  })

  const upd = async (id, field, value) => {
    const u = await updateTask(id, { [field]: value })
    setTasks(p => p.map(t => t.id === id ? u : t))
  }
  const del = async (id) => { await deleteTask(id); setTasks(p => p.filter(t => t.id !== id)) }
  const handleNew = (t) => { setTasks(p => [...p, t]); setShowNew(false) }
  const tog = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  // Group by category
  const categorised = {}
  filtered.forEach(t => {
    const cat = t.category || 'Uncategorised'
    if (!categorised[cat]) categorised[cat] = []
    categorised[cat].push(t)
  })

  // Order: known categories first, then others
  const catOrder = [...(TASK_CATEGORIES || []), 'Uncategorised']
  const sortedCats = Object.keys(categorised).sort((a, b) => {
    const ai = catOrder.indexOf(a)
    const bi = catOrder.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading team board...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Team Board</div>
        <div className="topbar-actions">
          <select className="form-select" style={{ width: 140, padding: '.4rem .75rem', fontSize: '.78rem' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {(TASK_CATEGORIES || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="form-select" style={{ width: 140, padding: '.4rem .75rem', fontSize: '.78rem' }} value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
            <option value="">All owners</option>
            {TASK_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="form-select" style={{ width: 140, padding: '.4rem .75rem', fontSize: '.78rem' }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New task</button>
        </div>
      </div>
      <div className="page">
        {filtered.length === 0 && (
          <div className="empty"><div className="empty-title">No tasks</div><div className="empty-sub">All clear or no tasks match your filters.</div></div>
        )}

        {sortedCats.map(cat => {
          const catTasks = categorised[cat]
          return (
            <div key={cat} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                <span style={{ fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: cat === 'Uncategorised' ? 'var(--muted)' : 'var(--dark)' }}>{cat}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>{catTasks.length}</span>
                <div style={{ flex: 1, height: '.5px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '.65rem' }}>
                {catTasks.map(t => {
                  const statusColor = STATUS_COLOR[t.status] || 'var(--muted)'
                  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Complete' && t.status !== 'Done'
                  return (
                    <div key={t.id} style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '8px', overflow: 'hidden', borderLeft: `2.5px solid ${statusColor}` }}>
                      <div onClick={() => tog(t.id)} style={{ padding: '.65rem .875rem', cursor: 'pointer' }}>
                        <div style={{ fontSize: '.78rem', fontWeight: 500, marginBottom: '.3rem', lineHeight: 1.35 }}>{t.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.38rem', flexWrap: 'wrap' }}>
                          {t.clients?.name && <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>{t.clients.name}</span>}
                          {t.owner && <span className="badge badge-gray" style={{ fontSize: '.54rem' }}>{t.owner}</span>}
                          <span style={{ fontSize: '.58rem', color: statusColor, background: `${statusColor}18`, padding: '.1rem .35rem', borderRadius: '4px' }}>{t.status}</span>
                          {t.due_date && <span style={{ fontSize: '.6rem', color: isOverdue ? 'var(--red)' : 'var(--muted)' }}>Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      </div>
                      {expanded[t.id] && (
                        <div style={{ padding: '.625rem .875rem', borderTop: '.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.status} onChange={e => upd(t.id, 'status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.category || ''} onChange={e => upd(t.id, 'category', e.target.value)}>
                            <option value="">No category</option>
                            {(TASK_CATEGORIES || []).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.owner || ''} onChange={e => upd(t.id, 'owner', e.target.value)}><option value="">No owner</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select>
                          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.client_id || ''} onChange={e => upd(t.id, 'client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                          <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.due_date || ''} onChange={e => upd(t.id, 'due_date', e.target.value)} />
                          <button className="btn btn-danger btn-xs" onClick={() => del(t.id)} style={{ alignSelf: 'flex-start' }}>Delete task</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">New Task</div><button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>✕</button></div>
            <NewTaskForm clients={clients} onSave={handleNew} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewTaskForm({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', status: TASK_STATUSES[0] || 'Now', category: '', owner: '', client_id: '', due_date: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = async () => {
    if (!form.name.trim()) return
    const t = await createTask({ ...form, client_id: form.client_id || null, due_date: form.due_date || null, category: form.category || null })
    onSave(t)
  }
  return (
    <>
      <div className="modal-body">
        <div className="form-group"><label className="form-label">Task name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}><option value="">No category</option>{(TASK_CATEGORIES || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Owner</label><select className="form-select" value={form.owner} onChange={e => set('owner', e.target.value)}><option value="">No owner</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={e => set('client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="form-label">Due date</label><input type="date" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
      </div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>Create task</button></div>
    </>
  )
}
