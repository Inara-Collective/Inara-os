import React, { useState, useEffect } from 'react'
import { getAllTasks, createTask, updateTask, deleteTask, getClients, TASK_STATUSES, TASK_OWNERS } from '../lib/supabase.js'

const STATUS_COLOR = { 'To Do': 'var(--blue)', 'In Progress': 'var(--amber)', 'Awaiting Approval': 'var(--purple)', 'Blocked': 'var(--red)', 'Complete': 'var(--teal)' }

export default function TeamBoard() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [ownerFilter, setOwnerFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    Promise.all([getAllTasks(), getClients()])
      .then(([t, c]) => { setTasks(t); setClients(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t => {
    if (ownerFilter && t.owner !== ownerFilter) return false
    if (clientFilter && t.client_id !== clientFilter) return false
    return true
  })

  const upd = async (id, field, value) => {
    const u = await updateTask(id, { [field]: value })
    setTasks(p => p.map(t => t.id === id ? u : t))
  }
  const del = async (id) => {
    await deleteTask(id)
    setTasks(p => p.filter(t => t.id !== id))
  }
  const handleNew = (t) => { setTasks(p => [...p, t]); setShowNew(false) }
  const tog = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const ownerCounts = TASK_OWNERS.reduce((acc, o) => {
    acc[o] = tasks.filter(t => t.owner === o && t.status !== 'Complete').length
    return acc
  }, {})

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading team board...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Team Board</div>
        <div className="topbar-actions">
          <select className="form-select" style={{ width: 180, padding: '.4rem .75rem', fontSize: '.78rem' }} value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)}>
            <option value="">All owners</option>
            {TASK_OWNERS.map(o => <option key={o} value={o}>{o} ({ownerCounts[o] || 0})</option>)}
          </select>
          <select className="form-select" style={{ width: 180, padding: '.4rem .75rem', fontSize: '.78rem' }} value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New task</button>
        </div>
      </div>
      <div className="page">
        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TASK_STATUSES.map(s => {
            const count = filtered.filter(t => t.status === s).length
            return (
              <div key={s} style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '8px', padding: '.6rem .875rem', borderLeft: `2px solid ${STATUS_COLOR[s]}` }}>
                <div style={{ fontSize: '.56rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.2rem' }}>{s}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', fontWeight: 300, color: count > 0 && s === 'Blocked' ? 'var(--red)' : 'var(--dark)' }}>{count}</div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', alignItems: 'start' }}>
          {TASK_STATUSES.map(status => {
            const col = filtered.filter(t => t.status === status)
            return (
              <div key={status}>
                <div style={{ fontSize: '.58rem', letterSpacing: '.15em', textTransform: 'uppercase', color: STATUS_COLOR[status], fontWeight: 600, marginBottom: '.75rem', textAlign: 'center', padding: '.32rem', background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', borderBottom: `2px solid ${STATUS_COLOR[status]}` }}>
                  {status} ({col.length})
                </div>
                {col.map(t => (
                  <div key={t.id} style={{ background: status === 'Blocked' ? 'var(--red-bg)' : 'var(--warm)', border: `.5px solid ${status === 'Blocked' ? 'var(--red-b)' : 'var(--border)'}`, borderRadius: '8px', marginBottom: '.5rem', overflow: 'hidden', borderLeft: `2px solid ${STATUS_COLOR[status]}` }}>
                    <div onClick={() => tog(t.id)} style={{ padding: '.65rem .875rem', cursor: 'pointer' }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 500, color: status === 'Blocked' ? 'var(--red)' : 'var(--dark)', marginBottom: '.28rem', lineHeight: 1.35 }}>{t.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.38rem', flexWrap: 'wrap' }}>
                        {t.clients?.name && <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>{t.clients.name}</span>}
                        {t.owner && <span className="badge badge-gray" style={{ fontSize: '.54rem' }}>{t.owner}</span>}
                        {t.due_date && <span style={{ fontSize: '.6rem', color: new Date(t.due_date) < new Date() && status !== 'Complete' ? 'var(--red)' : 'var(--muted)' }}>Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>}
                      </div>
                    </div>
                    {expanded[t.id] && (
                      <div style={{ padding: '.625rem .875rem', borderTop: '.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.status} onChange={e => upd(t.id, 'status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                        <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.owner || ''} onChange={e => upd(t.id, 'owner', e.target.value)}><option value="">No owner</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select>
                        <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.client_id || ''} onChange={e => upd(t.id, 'client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.due_date || ''} onChange={e => upd(t.id, 'due_date', e.target.value)} />
                        {status === 'Blocked' && <textarea className="form-textarea" style={{ fontSize: '.72rem', minHeight: 60 }} value={t.blocker_notes || ''} onChange={e => upd(t.id, 'blocker_notes', e.target.value)} placeholder="What is blocking this?" />}
                        <button className="btn btn-danger btn-xs" onClick={() => del(t.id)} style={{ alignSelf: 'flex-start' }}>Delete task</button>
                      </div>
                    )}
                  </div>
                ))}
                {col.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem .5rem', color: 'var(--muted)', fontSize: '.72rem', border: '.5px dashed var(--border)', borderRadius: '8px' }}>Nothing here</div>}
              </div>
            )
          })}
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">New Task</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <NewTaskForm clients={clients} onSave={handleNew} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewTaskForm({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', status: 'To Do', owner: '', client_id: '', due_date: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const handleSave = async () => {
    if (!form.name.trim()) return
    const t = await createTask({ ...form, client_id: form.client_id || null, due_date: form.due_date || null })
    onSave(t)
  }
  return (
    <>
      <div className="modal-body">
        <div className="form-group"><label className="form-label">Task name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} autoFocus /></div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Owner</label><select className="form-select" value={form.owner} onChange={e => set('owner', e.target.value)}><option value="">No owner</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select></div>
        </div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Client</label><select className="form-select" value={form.client_id} onChange={e => set('client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Due date</label><input type="date" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>Create task</button>
      </div>
    </>
  )
}
