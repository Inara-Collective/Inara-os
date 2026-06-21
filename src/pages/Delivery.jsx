import React, { useState, useEffect } from 'react'
import { getAllTasks, createTask, updateTask, deleteTask, getClients, TASK_STATUSES, TASK_OWNERS } from '../lib/supabase.js'

const STATUS_COLOR = {
  'Today': 'var(--red)', 'Now': 'var(--amber)', 'Soon': 'var(--blue)', 'Waiting': 'var(--muted)', 'Done': 'var(--teal)',
  'To Do': 'var(--blue)', 'In Progress': 'var(--amber)', 'Awaiting Approval': 'var(--purple)', 'Blocked': 'var(--red)', 'Complete': 'var(--teal)',
}

const fmtTime = (secs) => {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function Delivery() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [filterClient, setFilterClient] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [expanded, setExpanded] = useState({})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    Promise.all([getAllTasks(), getClients()]).then(([t, c]) => { setTasks(t); setClients(c); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  // Tick every second to drive running timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const upd = async (id, field, value) => {
    const u = await updateTask(id, { [field]: value })
    setTasks(p => p.map(t => t.id === id ? u : t))
  }
  const del = async (id) => { await deleteTask(id); setTasks(p => p.filter(t => t.id !== id)) }
  const handleNew = (t) => { setTasks(p => [...p, t]); setShowNew(false) }
  const tog = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const startTimer = async (task) => {
    const u = await updateTask(task.id, { timer_started_at: new Date().toISOString() })
    setTasks(p => p.map(t => t.id === task.id ? u : t))
  }
  const stopTimer = async (task) => {
    const elapsed = task.timer_started_at ? Math.floor((Date.now() - new Date(task.timer_started_at)) / 1000) : 0
    const u = await updateTask(task.id, { timer_started_at: null, time_logged: (task.time_logged || 0) + elapsed })
    setTasks(p => p.map(t => t.id === task.id ? u : t))
  }

  const getDisplayTime = (task) => {
    const base = task.time_logged || 0
    const running = task.timer_started_at ? Math.floor((now - new Date(task.timer_started_at)) / 1000) : 0
    return base + running
  }

  let filtered = tasks.filter(t => t.status !== 'Complete' && t.status !== 'Done')
  if (filterClient) filtered = filtered.filter(t => t.client_id === filterClient)
  if (filterOwner) filtered = filtered.filter(t => t.owner === filterOwner)

  const activeOwners = TASK_OWNERS.filter(o => filtered.some(t => t.owner === o))
  const unassigned = filtered.filter(t => !t.owner || t.owner === '')

  const statCounts = TASK_STATUSES.reduce((acc, s) => { acc[s] = tasks.filter(t => t.status === s).length; return acc }, {})

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading delivery board...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Delivery Board</div>
        <div className="topbar-actions">
          <select className="form-select" style={{ width: 160, padding: '.4rem .75rem', fontSize: '.78rem' }} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">All people</option>
            {TASK_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="form-select" style={{ width: 160, padding: '.4rem .75rem', fontSize: '.78rem' }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>+ New task</button>
        </div>
      </div>
      <div className="page">

        {/* Status summary */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {TASK_STATUSES.map(s => (
            <div key={s} style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', padding: '.4rem .75rem', borderLeft: `2px solid ${STATUS_COLOR[s] || 'var(--muted)'}`, display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '.56rem', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>{s}</span>
              <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', fontWeight: 300, color: STATUS_COLOR[s] || 'var(--muted)' }}>{statCounts[s] || 0}</span>
            </div>
          ))}
        </div>

        {/* Per-person sections */}
        {activeOwners.length === 0 && unassigned.length === 0 && (
          <div className="empty"><div className="empty-title">All clear</div><div className="empty-sub">No open tasks.</div></div>
        )}

        {activeOwners.map(owner => {
          const ownerTasks = filtered.filter(t => t.owner === owner)
          return (
            <div key={owner} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 600, color: 'var(--amber)', flexShrink: 0 }}>
                  {owner.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--dark)' }}>{owner}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>{ownerTasks.length} task{ownerTasks.length !== 1 ? 's' : ''}</span>
                <div style={{ flex: 1, height: '.5px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '.65rem' }}>
                {ownerTasks.map(t => <TaskCard key={t.id} task={t} clients={clients} expanded={expanded[t.id]} onToggle={() => tog(t.id)} onUpdate={upd} onDelete={del} onStart={startTimer} onStop={stopTimer} displayTime={getDisplayTime(t)} now={now} />)}
              </div>
            </div>
          )
        })}

        {unassigned.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.75rem' }}>
              <span style={{ fontSize: '.6rem', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 600, color: 'var(--muted)' }}>Unassigned</span>
              <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>{unassigned.length} task{unassigned.length !== 1 ? 's' : ''}</span>
              <div style={{ flex: 1, height: '.5px', background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '.65rem' }}>
              {unassigned.map(t => <TaskCard key={t.id} task={t} clients={clients} expanded={expanded[t.id]} onToggle={() => tog(t.id)} onUpdate={upd} onDelete={del} onStart={startTimer} onStop={stopTimer} displayTime={getDisplayTime(t)} now={now} />)}
            </div>
          </div>
        )}
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

function TaskCard({ task: t, clients, expanded, onToggle, onUpdate, onDelete, onStart, onStop, displayTime, now }) {
  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Complete' && t.status !== 'Done'
  const statusColor = STATUS_COLOR[t.status] || 'var(--muted)'
  const isRunning = !!t.timer_started_at

  return (
    <div style={{ background: 'var(--warm)', border: `.5px solid ${isRunning ? 'var(--teal)' : 'var(--border)'}`, borderRadius: '8px', overflow: 'hidden', borderLeft: `2.5px solid ${statusColor}` }}>
      <div onClick={onToggle} style={{ padding: '.65rem .875rem', cursor: 'pointer' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 500, marginBottom: '.3rem', lineHeight: 1.35 }}>{t.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.38rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
          {t.clients?.name && <span style={{ fontSize: '.62rem', color: 'var(--muted)' }}>{t.clients.name}</span>}
          <span style={{ fontSize: '.58rem', color: statusColor, background: `${statusColor}18`, padding: '.1rem .35rem', borderRadius: '4px' }}>{t.status}</span>
          {t.due_date && <span style={{ fontSize: '.6rem', color: isOverdue ? 'var(--red)' : 'var(--muted)' }}>Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>}
        </div>
        {/* Timer row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }} onClick={e => e.stopPropagation()}>
          <span style={{ fontSize: '.62rem', color: isRunning ? 'var(--teal)' : 'var(--muted)', fontFamily: 'monospace', minWidth: 48 }}>
            {isRunning ? '⏱ ' : ''}{fmtTime(displayTime)}
          </span>
          {isRunning ? (
            <button onClick={() => onStop(t)} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '4px', padding: '.18rem .5rem', fontSize: '.62rem', cursor: 'pointer', fontWeight: 500 }}>⏹ Stop</button>
          ) : (
            <button onClick={() => onStart(t)} style={{ background: 'var(--warm)', color: 'var(--muted)', border: '.5px solid var(--border)', borderRadius: '4px', padding: '.18rem .5rem', fontSize: '.62rem', cursor: 'pointer' }}>▶ Start</button>
          )}
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '.625rem .875rem', borderTop: '.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.status} onChange={e => onUpdate(t.id, 'status', e.target.value)}>{TASK_STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.owner || ''} onChange={e => onUpdate(t.id, 'owner', e.target.value)}><option value="">No owner</option>{TASK_OWNERS.map(o => <option key={o}>{o}</option>)}</select>
          <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.client_id || ''} onChange={e => onUpdate(t.id, 'client_id', e.target.value)}><option value="">No client</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <input type="date" className="form-input" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={t.due_date || ''} onChange={e => onUpdate(t.id, 'due_date', e.target.value)} />
          <button className="btn btn-danger btn-xs" onClick={() => onDelete(t.id)} style={{ alignSelf: 'flex-start' }}>Delete task</button>
        </div>
      )}
    </div>
  )
}

function NewTaskForm({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({ name: '', status: TASK_STATUSES[0] || 'Now', owner: '', client_id: '', due_date: '' })
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
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={!form.name.trim()}>Create task</button></div>
    </>
  )
}
