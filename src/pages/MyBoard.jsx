import React, { useState, useEffect } from 'react'
import { getAllTasks, createTask, updateTask, deleteTask, getClients, TASK_STATUSES, TASK_OWNERS } from '../lib/supabase.js'
import { useAuth } from '../App.jsx'

const STATUS_COLOR = { 'To Do': 'var(--blue)', 'In Progress': 'var(--amber)', 'Awaiting Approval': 'var(--purple)', 'Blocked': 'var(--red)', 'Complete': 'var(--teal)' }

const MY_OWNER_MAP = {
  maxine: 'Maxine',
}

export default function MyBoard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState({})

  const myOwner = MY_OWNER_MAP[profile?.name?.toLowerCase()] || profile?.name || 'Maxine'

  useEffect(() => {
    Promise.all([getAllTasks(), getClients()])
      .then(([t, c]) => { setTasks(t); setClients(c); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const mine = tasks.filter(t => t.owner === myOwner && t.status !== 'Complete')
  const completed = tasks.filter(t => t.owner === myOwner && t.status === 'Complete')

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

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading your board...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">My Board</div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New task</button>
        </div>
      </div>
      <div className="page">
        {mine.length === 0 && (
          <div className="empty">
            <div className="empty-title">All clear</div>
            <div className="empty-sub">No open tasks assigned to you.</div>
          </div>
        )}
        {TASK_STATUSES.filter(s => s !== 'Complete').map(status => {
          const col = mine.filter(t => t.status === status)
          if (col.length === 0) return null
          return (
            <div key={status} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: STATUS_COLOR[status], fontWeight: 600, marginBottom: '.75rem' }}>
                {status} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({col.length})</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '.75rem' }}>
                {col.map(t => (
                  <div key={t.id} style={{ background: status === 'Blocked' ? 'var(--red-bg)' : 'var(--warm)', border: `.5px solid ${status === 'Blocked' ? 'var(--red-b)' : 'var(--border)'}`, borderRadius: '8px', overflow: 'hidden', borderLeft: `2px solid ${STATUS_COLOR[status]}` }}>
                    <div onClick={() => tog(t.id)} style={{ padding: '.75rem 1rem', cursor: 'pointer' }}>
                      <div style={{ fontSize: '.8rem', fontWeight: 500, marginBottom: '.3rem', lineHeight: 1.4, color: status === 'Blocked' ? 'var(--red)' : 'var(--dark)' }}>{t.name}</div>
                      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {t.clients?.name && <span style={{ fontSize: '.64rem', color: 'var(--muted)' }}>{t.clients.name}</span>}
                        {t.due_date && (
                          <span style={{ fontSize: '.62rem', color: new Date(t.due_date) < new Date() ? 'var(--red)' : 'var(--muted)' }}>
                            Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                    {expanded[t.id] && (
                      <div style={{ padding: '.625rem 1rem', borderTop: '.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.status} onChange={e => upd(t.id, 'status', e.target.value)}>
                          {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.client_id || ''} onChange={e => upd(t.id, 'client_id', e.target.value)}>
                          <option value="">No client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.due_date || ''} onChange={e => upd(t.id, 'due_date', e.target.value)} />
                        <button className="btn btn-danger btn-xs" onClick={() => del(t.id)} style={{ alignSelf: 'flex-start' }}>Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {completed.length > 0 && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ fontSize: '.58rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--teal)', fontWeight: 600, marginBottom: '.75rem' }}>
              Done <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({completed.length})</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '.75rem', opacity: .65 }}>
              {completed.slice(0, 8).map(t => (
                <div key={t.id} style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '8px', padding: '.65rem 1rem', borderLeft: '2px solid var(--teal)' }}>
                  <div style={{ fontSize: '.78rem', fontWeight: 500, textDecoration: 'line-through', color: 'var(--muted)' }}>{t.name}</div>
                  {t.clients?.name && <div style={{ fontSize: '.64rem', color: 'var(--muted)', marginTop: '.2rem' }}>{t.clients.name}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">New Task</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <NewTaskForm clients={clients} defaultOwner={myOwner} onSave={handleNew} onCancel={() => setShowNew(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function NewTaskForm({ clients, defaultOwner, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', status: 'To Do', owner: defaultOwner, client_id: '', due_date: '' })
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
