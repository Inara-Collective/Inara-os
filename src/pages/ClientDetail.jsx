import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import DiagnosticEngine from './DiagnosticEngine.jsx'
import NotesTab from './NotesTab.jsx'
import {
  getClient, updateClient,
  addClientModule, updateClientModule, deleteClientModule,
  createTask, updateTask, deleteTask,
  getClientComments, createClientComment,
  getClientEmails, createClientEmail,
  getUsers,
  PIPELINE_STAGES, SALES_STAGES, PACKAGES,
  TASK_STATUSES, TASK_OWNERS, ALL_MODULES, MUST_MODULES,
  ACTION_TAKEN_OPTIONS, NEXT_ACTION_OPTIONS,
  OPPORTUNITY_TAGS, RELATIONSHIP_ACTIONS, CONNECTION_STRENGTHS, STAGE_TASK_FLOWS
} from '../lib/supabase.js'

/* ── helpers ── */
function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleString('en-NZ', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

function renderWithMentions(text) {
  return text.split(/(@\S+)/g).map((part, i) =>
    part.startsWith('@')
      ? <mark key={i} style={{ background:'var(--gold-bg)', color:'var(--amber)', borderRadius:'3px', padding:'0 .2rem', fontWeight:500 }}>{part}</mark>
      : part
  )
}

/* ── Field: inline click-to-edit ── */
function Field({ label, value, type, options, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const save = () => { onSave(val); setEditing(false) }
  if (!editing) return (
    <div onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', padding:'.35rem 0', borderBottom:'.5px solid var(--border)', cursor:'pointer', minHeight:34 }}>
      <span style={{ fontSize:'.56rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, minWidth:110, paddingTop:'.1rem', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:'.8rem', color:value?'var(--dark)':'var(--border)', flex:1 }}>{value || '—'}</span>
    </div>
  )
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', padding:'.35rem 0', borderBottom:'.5px solid var(--border)' }}>
      <span style={{ fontSize:'.56rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, minWidth:110, paddingTop:'.5rem', flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, display:'flex', gap:'.4rem' }}>
        {type==='select'
          ? <select className="form-select" style={{flex:1}} value={val} onChange={e=>setVal(e.target.value)} autoFocus><option value="">—</option>{options?.map(o=><option key={o}>{o}</option>)}</select>
          : type==='textarea'
          ? <textarea className="form-textarea" style={{flex:1,minHeight:60}} value={val} onChange={e=>setVal(e.target.value)} autoFocus/>
          : <input className="form-input" style={{flex:1}} type={type||'text'} value={val} onChange={e=>setVal(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&save()}/>
        }
        <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setVal(value||'');setEditing(false)}}>✕</button>
      </div>
    </div>
  )
}

/* ── MultiCheckField: toggling chip group ── */
function MultiCheckField({ label, value, options, onSave }) {
  const [editing, setEditing] = useState(false)
  const current = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  const [selected, setSelected] = useState(current)

  const open = () => { setSelected(current); setEditing(true) }
  const toggle = (opt) => setSelected(s => s.includes(opt) ? s.filter(x => x !== opt) : [...s, opt])
  const save = () => { onSave(selected.join(', ')); setEditing(false) }

  if (!editing) return (
    <div onClick={open} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', padding:'.35rem 0', borderBottom:'.5px solid var(--border)', cursor:'pointer', minHeight:34 }}>
      <span style={{ fontSize:'.56rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, minWidth:110, paddingTop:'.1rem', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:'.8rem', color:current.length?'var(--dark)':'var(--border)', flex:1 }}>{current.length ? current.join(', ') : '—'}</span>
    </div>
  )
  return (
    <div style={{ padding:'.35rem 0', borderBottom:'.5px solid var(--border)' }}>
      <span style={{ fontSize:'.56rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>{label}</span>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'.35rem', margin:'.5rem 0' }}>
        {options.map(opt => (
          <button key={opt} onClick={() => toggle(opt)} style={{ padding:'.2rem .55rem', borderRadius:'4px', fontSize:'.68rem', cursor:'pointer', background: selected.includes(opt) ? 'var(--dark)' : 'transparent', color: selected.includes(opt) ? 'var(--bg)' : 'var(--muted)', border: `.5px solid ${selected.includes(opt) ? 'var(--dark)' : 'var(--border)'}` }}>
            {opt}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end' }}>
        <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(current); setEditing(false) }}>✕</button>
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [client, setClient] = useState(null)
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [comments, setComments] = useState([])
  const [emails, setEmails] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [showModAdd, setShowModAdd] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [mentionSearch, setMentionSearch] = useState(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const commentRef = useRef(null)

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [emailForm, setEmailForm] = useState({ subject:'', body:'', to_email:'', from_email:'' })
  const [savingEmail, setSavingEmail] = useState(false)

  const [showConvert, setShowConvert] = useState(false)
  const [convertForm, setConvertForm] = useState({ stage:'Onboarding', mrr:'', recommended_package:'' })
  const [converting, setConverting] = useState(false)

  const [taskFlow, setTaskFlow] = useState('')
  const [addingFlow, setAddingFlow] = useState(false)
  const [expandedTask, setExpandedTask] = useState(null)
  const [taskFilter, setTaskFilter] = useState('To Do Now')

  useEffect(() => {
    getClient(id)
      .then(d => { setClient(d); setModules(d?.client_modules||[]); setTasks(d?.tasks||[]) })
      .catch(() => {})
      .finally(() => setLoading(false))
    getUsers().then(setUsers).catch(() => {})
  }, [id])

  useEffect(() => {
    if (tab === 'comments') getClientComments(id).then(setComments).catch(() => {})
    if (tab === 'emails') getClientEmails(id).then(setEmails).catch(() => {})
  }, [tab, id])

  const upd = async (field, value) => {
    setClient(c => ({ ...c, [field]: value }))
    try { const u = await updateClient(id, { [field]: value }); setClient(u) } catch (e) { console.error(e) }
  }

  const addMod = async (name, priority) => { const m = await addClientModule({client_id:id,module_name:name,priority,status:'Active'}); setModules(p=>[...p,m]); setShowModAdd(false) }
  const togMod = async (m) => { const u = await updateClientModule(m.id,{status:m.status==='Active'?'Paused':'Active'}); setModules(p=>p.map(x=>x.id===m.id?u:x)) }
  const delMod = async (mid) => { await deleteClientModule(mid); setModules(p=>p.filter(m=>m.id!==mid)) }
  const addTsk = async () => { const t = await createTask({client_id:id,name:'New task',status:'Now'}); setTasks(p=>[...p,t]); setExpandedTask(t.id) }
  const updTsk = async (tid,field,value) => { setTasks(p=>p.map(t=>t.id===tid?{...t,[field]:value}:t)); try { await updateTask(tid,{[field]:value}) } catch(e){console.error(e)} }
  const delTsk = async (tid) => { await deleteTask(tid); setTasks(p=>p.filter(t=>t.id!==tid)) }
  const addTskToStatus = async (status) => { const t = await createTask({ client_id:id, name:'New task', status }); setTasks(p=>[...p,t]); setExpandedTask(t.id) }

  const applyTaskFlow = async () => {
    if (!taskFlow || addingFlow) return
    setAddingFlow(true)
    for (const name of STAGE_TASK_FLOWS[taskFlow] || []) {
      const t = await createTask({ client_id: id, name, status: 'Now' })
      setTasks(p => [...p, t])
    }
    setTaskFlow('')
    setAddingFlow(false)
  }

  const handleCommentChange = (e) => {
    const val = e.target.value
    setCommentText(val)
    const cursor = e.target.selectionStart
    const textBefore = val.slice(0, cursor)
    const atMatch = textBefore.match(/@(\w*)$/)
    setMentionSearch(atMatch ? atMatch[1] : null)
  }

  const insertMention = (user) => {
    const el = commentRef.current
    const cursor = el.selectionStart
    const textBefore = commentText.slice(0, cursor)
    const textAfter = commentText.slice(cursor)
    const atIndex = textBefore.lastIndexOf('@')
    const newText = textBefore.slice(0, atIndex) + '@' + user.name + ' ' + textAfter
    setCommentText(newText)
    setMentionSearch(null)
    setTimeout(() => el.focus(), 0)
  }

  const submitComment = async () => {
    if (!commentText.trim() || submittingComment) return
    setSubmittingComment(true)
    try {
      const c = await createClientComment({ client_id:id, content:commentText.trim(), author_name:profile?.name||profile?.email||'Me', author_id:profile?.id })
      setComments(p => [...p, c])
      setCommentText('')
      setMentionSearch(null)
    } catch (e) { console.error(e) }
    setSubmittingComment(false)
  }

  const saveEmail = async () => {
    if ((!emailForm.subject.trim() && !emailForm.body.trim()) || savingEmail) return
    setSavingEmail(true)
    try {
      const e = await createClientEmail({ client_id:id, ...emailForm, logged_by:profile?.name||'Me', sent_at:new Date().toISOString() })
      setEmails(p => [e, ...p])
      setEmailForm({ subject:'', body:'', to_email:'', from_email:'' })
      setShowEmailForm(false)
    } catch (e) { console.error(e) }
    setSavingEmail(false)
  }

  const handleConvert = async () => {
    if (converting) return
    setConverting(true)
    try {
      const updates = { stage: convertForm.stage }
      if (convertForm.mrr) updates.mrr = Number(convertForm.mrr)
      if (convertForm.recommended_package) updates.recommended_package = convertForm.recommended_package
      const u = await updateClient(id, updates)
      setClient(u)
      setShowConvert(false)
    } catch (e) { console.error(e) }
    setConverting(false)
  }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>
  if (!client) return <div className="page"><div className="empty"><div className="empty-title">Client not found</div></div></div>

  const taskStatusColors = { 'Today':'#2E6080', 'Now':'#9FBBD0', 'Soon':'#BEB4AA', 'Waiting':'#A6AAB5', 'Done':'#7A8090' }
  const TASK_FILTER_LABELS = ['To Do Now','Up Next','Due Now','Due This Week','Waiting','Follow Up','High Value','Quick Wins','Done']

  function getFilteredTasks(filter) {
    const now = new Date().toISOString().split('T')[0]
    const in7 = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
    const kw = ['follow','check in','message','reminder','reach','touch','contact','call','email','invite']
    switch(filter) {
      case 'To Do Now': return tasks.filter(t => t.status === 'Today' || t.status === 'Now')
      case 'Up Next':   return tasks.filter(t => t.status === 'Soon')
      case 'Due Now':   return tasks.filter(t => t.due_date && t.due_date <= now && t.status !== 'Done')
      case 'Due This Week': return tasks.filter(t => t.due_date && t.due_date >= now && t.due_date <= in7 && t.status !== 'Done')
      case 'Waiting':   return tasks.filter(t => t.status === 'Waiting')
      case 'Follow Up': return tasks.filter(t => t.status !== 'Done' && kw.some(k => (t.name||'').toLowerCase().includes(k)))
      case 'High Value': return tasks.filter(t => t.status !== 'Done' && (t.points||10) >= 25)
      case 'Quick Wins': return tasks.filter(t => t.status !== 'Done' && (t.points||10) <= 15)
      case 'Done':      return tasks.filter(t => t.status === 'Done')
      default:          return tasks
    }
  }

  function TaskCard({ task }) {
    const isEditing = expandedTask === task.id
    const [showScript, setShowScript] = useState(false)
    const col = taskStatusColors[task.status] || '#A6AAB5'
    const pts = task.points || 10
    const todayStr = new Date().toISOString().split('T')[0]
    const isOverdue = task.due_date && task.due_date < todayStr && task.status !== 'Done'
    const isDone = task.status === 'Done'

    const fmtDue = (str) => {
      if (!str) return null
      return new Date(str + 'T00:00').toLocaleDateString('en-NZ', { weekday:'long', day:'numeric', month:'long' })
    }
    const copyText = (text) => { try { navigator.clipboard.writeText(text) } catch(e) {} }

    return (
      <div style={{ background:'#FFFFFF', border:'1px solid var(--border)', borderRadius:'20px', marginBottom:'1.5rem', boxShadow:'0 8px 24px rgba(0,0,0,.06)', overflow:'hidden', opacity: isDone ? 0.65 : 1 }}>
        {isEditing ? (
          /* ── Edit mode ── */
          <div style={{ padding:'1.75rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase' }}>Edit task</span>
              <button className="btn btn-ghost btn-xs" onClick={()=>setExpandedTask(null)}>Done</button>
            </div>

            <input className="form-input" style={{ fontWeight:700, fontSize:'1.05rem' }} defaultValue={task.name} onBlur={e=>updTsk(task.id,'name',e.target.value)} autoFocus placeholder="Task name…"/>

            {/* Status pills */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.5rem' }}>Status</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
                {TASK_STATUSES.map(s=>{ const c=taskStatusColors[s]||'#A6AAB5'; return (
                  <button key={s} onClick={()=>updTsk(task.id,'status',s)} style={{ padding:'.3rem .875rem', borderRadius:'999px', fontSize:'.85rem', cursor:'pointer', background:task.status===s?`${c}22`:'transparent', color:task.status===s?c:'var(--muted)', border:`1.5px solid ${task.status===s?c+'66':'var(--border)'}`, fontWeight:task.status===s?700:500, fontFamily:'inherit' }}>{s}</button>
                )})}
              </div>
            </div>

            {/* Due + owner */}
            <div style={{ display:'flex', gap:'.625rem' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Due date</div>
                <input type="date" className="form-input" value={task.due_date||''} onChange={e=>updTsk(task.id,'due_date',e.target.value)}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Owner</div>
                <select className="form-select" value={task.owner||''} onChange={e=>updTsk(task.id,'owner',e.target.value)}>
                  <option value="">— Owner —</option>
                  {TASK_OWNERS.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Points */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Points</div>
              <select className="form-select" value={task.points||10} onChange={e=>updTsk(task.id,'points',parseInt(e.target.value))}>
                {[5,10,15,20,25,30,50,100].map(p=>(
                  <option key={p} value={p}>+{p} pts — {p<=5?'Quick admin':p<=10?'Short message':p<=15?'Send email':p<=20?'Phone call':p<=25?'Book meeting':p<=30?'Send proposal':p<=50?'Proposal accepted':'Client onboarded'}</option>
                ))}
              </select>
            </div>

            {/* Discussion point */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Discussion point</div>
              <textarea className="form-textarea" style={{ minHeight:72 }} defaultValue={task.discussion_point||''} onBlur={e=>updTsk(task.id,'discussion_point',e.target.value)} placeholder="What to focus on or talk about…"/>
            </div>

            {/* Where this leads */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Where this leads</div>
              <textarea className="form-textarea" style={{ minHeight:64 }} defaultValue={task.where_this_leads||''} onBlur={e=>updTsk(task.id,'where_this_leads',e.target.value)} placeholder="The outcome or purpose of this task…"/>
            </div>

            {/* Next tiny step */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Next tiny step</div>
              <input className="form-input" defaultValue={task.next_step||''} onBlur={e=>updTsk(task.id,'next_step',e.target.value)} placeholder="The smallest first action…"/>
            </div>

            {/* Script */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Script / Email / Message Draft</div>
              <textarea className="form-textarea" style={{ minHeight:130, lineHeight:1.75 }} defaultValue={task.script||''} onBlur={e=>updTsk(task.id,'script',e.target.value)} placeholder="Paste a call script, email draft, or message template here…"/>
            </div>

            {/* Progress dots */}
            <div>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.5rem' }}>Progress</div>
              <div style={{ display:'flex', alignItems:'center', gap:'.625rem' }}>
                <div style={{ display:'flex', gap:'.4rem' }}>
                  {Array.from({length:task.progress_total||5},(_,i)=>(
                    <button key={i} onClick={()=>updTsk(task.id,'progress_current',i+1===(task.progress_current||0)?i:i+1)} style={{ width:14, height:14, borderRadius:'50%', border:'none', cursor:'pointer', background:i<(task.progress_current||0)?col:'var(--border)', padding:0 }}/>
                  ))}
                </div>
                <span style={{ fontSize:'.82rem', color:'var(--muted)' }}>{task.progress_current||0} of {task.progress_total||5}</span>
              </div>
            </div>

            <button className="btn btn-danger btn-xs" style={{ alignSelf:'flex-start' }} onClick={()=>{ delTsk(task.id); setExpandedTask(null) }}>Delete task</button>
          </div>
        ) : (
          /* ── Display mode ── */
          <div style={{ padding:'1.75rem' }}>
            {/* Header: status + points + menu */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <span style={{ background:`${col}22`, color:col, border:`1px solid ${col}66`, borderRadius:'999px', padding:'.3rem .875rem', fontSize:'.82rem', fontWeight:700 }}>{task.status}</span>
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                <span style={{ background:'var(--pale-cloud)', color:'#2E6080', borderRadius:'999px', padding:'.28rem .75rem', fontSize:'.82rem', fontWeight:600 }}>+{pts} pts</span>
                <button onClick={()=>setExpandedTask(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'1.25rem', padding:'.1rem .3rem', lineHeight:1 }}>⋯</button>
              </div>
            </div>

            {/* Task name */}
            <div style={{ fontSize:'1.15rem', fontWeight:700, color: isDone ? 'var(--muted)' : 'var(--dark)', lineHeight:1.4, marginBottom:task.due_date?'.75rem':'1.25rem', textDecoration: isDone ? 'line-through' : 'none' }}>
              {task.name}
            </div>

            {/* Due date */}
            {task.due_date && (
              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.9rem', color: isOverdue ? 'var(--red)' : 'var(--muted)', marginBottom:'1.25rem' }}>
                <span>📅</span>
                <span style={{ fontWeight: isOverdue ? 700 : 400 }}>{isOverdue ? 'Overdue — ' : 'Due: '}{fmtDue(task.due_date)}</span>
              </div>
            )}

            <div style={{ height:'1px', background:'var(--border)', margin:'1.25rem 0' }}/>

            {/* Discussion point */}
            {task.discussion_point && (
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.5rem' }}>Discussion point</div>
                <div style={{ fontSize:'1rem', lineHeight:1.65, color:'var(--dark)' }}>{task.discussion_point}</div>
              </div>
            )}

            {/* Where this leads */}
            {task.where_this_leads && (
              <div style={{ marginBottom:'1.25rem', padding:'1rem 1.25rem', background:'var(--bg)', borderRadius:'12px', border:'.5px solid var(--border)' }}>
                <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Where this leads</div>
                <div style={{ fontSize:'1rem', lineHeight:1.65, color:'var(--dark)' }}>{task.where_this_leads}</div>
              </div>
            )}

            {(task.discussion_point || task.where_this_leads) && (
              <div style={{ height:'1px', background:'var(--border)', margin:'1.25rem 0' }}/>
            )}

            {/* Script / Draft (expandable) */}
            {task.script && (
              <>
                <div style={{ marginBottom:'1.25rem' }}>
                  <button onClick={()=>setShowScript(s=>!s)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'.4rem', padding:0, marginBottom: showScript ? '.875rem' : 0 }}>
                    <span style={{ color: showScript ? 'var(--dark)' : 'var(--mist-blue)', fontSize:'.9rem' }}>{showScript ? '▾' : '▸'}</span>
                    <span style={{ fontSize:'.82rem', fontWeight:700, color: showScript ? 'var(--muted)' : 'var(--mist-blue)', letterSpacing:'.1em', textTransform:'uppercase' }}>Script / Draft</span>
                  </button>
                  {showScript && (
                    <div style={{ background:'var(--bg)', borderRadius:'12px', padding:'1.25rem 1.5rem', fontSize:'.95rem', lineHeight:1.8, color:'var(--dark)', whiteSpace:'pre-wrap', fontFamily:'inherit', border:'.5px solid var(--border)' }}>
                      {task.script}
                    </div>
                  )}
                </div>
                <div style={{ height:'1px', background:'var(--border)', margin:'1.25rem 0' }}/>
              </>
            )}

            {/* Next tiny step */}
            <div style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.5rem' }}>Next tiny step</div>
              {task.next_step ? (
                <div style={{ display:'flex', alignItems:'flex-start', gap:'.625rem' }}>
                  <span style={{ color:'var(--mist-blue)', flexShrink:0, marginTop:'.15rem' }}>▶</span>
                  <span style={{ fontSize:'1rem', color:'var(--mist-blue)', lineHeight:1.6, fontWeight:500 }}>{task.next_step}</span>
                </div>
              ) : (
                <button onClick={()=>setExpandedTask(task.id)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'.5rem', padding:0 }}>
                  <span style={{ color:'var(--border)' }}>▶</span>
                  <span style={{ fontSize:'.9rem', color:'var(--muted)', fontStyle:'italic' }}>Add next step…</span>
                </button>
              )}
            </div>

            {/* Action buttons */}
            {!isDone ? (
              <div style={{ display:'flex', gap:'.625rem', flexWrap:'wrap' }}>
                <button onClick={()=>updTsk(task.id,'status','Done')} style={{ flex:1, minWidth:110, background:'var(--dark)', color:'#fff', border:'none', borderRadius:'12px', padding:'.875rem 1rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Mark Done</button>
                {task.script && (
                  <button onClick={()=>copyText(task.script)} style={{ flex:1, minWidth:110, background:'transparent', color:'var(--dark)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'.875rem 1rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Copy Script</button>
                )}
                <button onClick={()=>setExpandedTask(task.id)} style={{ flex:1, minWidth:100, background:'transparent', color:'var(--dark)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'.875rem 1rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✎ Edit</button>
              </div>
            ) : (
              <button onClick={()=>updTsk(task.id,'status','Now')} style={{ background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:'12px', padding:'.5rem 1.25rem', fontSize:'.9rem', cursor:'pointer', fontFamily:'inherit' }}>↩ Reopen</button>
            )}
          </div>
        )}
      </div>
    )
  }

  const TABS = ['overview','tasks','diagnosis','notes','comments','emails']
  const assignOptions = users.map(u => u.name).filter(Boolean)
  const mentionUsers = mentionSearch !== null ? users.filter(u => u.name?.toLowerCase().startsWith(mentionSearch.toLowerCase())) : []
  const isLead = SALES_STAGES.includes(client.stage)
  const CLIENT_STAGES = PIPELINE_STAGES.filter(s => !SALES_STAGES.includes(s))

  const connColors = { 'Cold':'var(--blue)', 'Warm':'var(--gold)', 'Hot':'var(--red)', 'Existing relationship':'var(--teal)', 'Referral':'var(--purple)', 'Past client':'var(--teal)', 'Event connection':'var(--amber)' }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/pipeline')}>← Pipeline</button>
          <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.3rem' }}>{client.name}</div>
          <span className="badge badge-gold">{client.stage}</span>
          {client.connection_strength && (
            <span style={{ fontSize:'.65rem', color:connColors[client.connection_strength]||'var(--muted)', background:`${(connColors[client.connection_strength]||'#888')}15`, border:`.5px solid ${(connColors[client.connection_strength]||'#888')}40`, borderRadius:'20px', padding:'.15rem .5rem' }}>{client.connection_strength}</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          {isLead && (
            <button className="btn btn-gold" onClick={() => { setConvertForm({ stage:'Onboarding', mrr:client.mrr?.toString()||'', recommended_package:client.recommended_package||'' }); setShowConvert(true) }}>
              Convert to client →
            </button>
          )}
          <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{client.industry}</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:'flex', borderBottom:'.5px solid var(--border)', padding:'0 1.75rem', background:'var(--warm)', overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'.55rem 1rem', fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:500, background:'none', border:'none', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--dark)':'var(--muted)', cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="page">

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div>
            {/* Inara Notes — sticky note */}
            <div style={{ background:'#FBF3E6', border:'.5px solid var(--gold-b)', borderRadius:'10px', padding:'1rem 1.25rem', marginBottom:'1.25rem', borderLeft:'3px solid var(--gold)' }}>
              <div style={{ fontSize:'.52rem', letterSpacing:'.2em', textTransform:'uppercase', color:'var(--gold)', fontWeight:600, marginBottom:'.4rem' }}>Inara Notes</div>
              <textarea
                style={{ border:'none', background:'transparent', padding:0, minHeight:64, fontSize:'.88rem', fontFamily:'Cormorant Garamond, Georgia, serif', fontStyle:'italic', color:'var(--dark2)', resize:'none', lineHeight:1.7, width:'100%', outline:'none' }}
                placeholder="Quick thoughts, opportunities, personality notes, ideas…"
                value={client.inara_notes||''}
                onChange={e=>setClient(c=>({...c,inara_notes:e.target.value}))}
                onBlur={e=>upd('inara_notes',e.target.value)}
              />
            </div>

            <div className="g2" style={{gap:'1.25rem'}}>
              {/* Left column */}
              <div>
                {/* Opportunity Snapshot */}
                <div className="card" style={{marginBottom:'1rem'}}>
                  <div className="card-head"><div className="card-title">Opportunity Snapshot</div></div>
                  <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

                    {/* Client Strength */}
                    <div>
                      <div style={{fontSize:'.52rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:600,marginBottom:'.35rem'}}>Client strength</div>
                      <textarea className="form-textarea" style={{minHeight:56,fontSize:'.8rem'}} placeholder="This client has strong potential for…" value={client.client_strength||''} onChange={e=>setClient(c=>({...c,client_strength:e.target.value}))} onBlur={e=>upd('client_strength',e.target.value)}/>
                    </div>

                    {/* Opportunity Tags */}
                    <div>
                      <div style={{fontSize:'.52rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:600,marginBottom:'.4rem'}}>Opportunity tags</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'.3rem'}}>
                        {OPPORTUNITY_TAGS.map(tag=>{
                          const tags = client.opportunity_tags ? client.opportunity_tags.split(',').map(s=>s.trim()).filter(Boolean) : []
                          const active = tags.includes(tag)
                          const newTags = active ? tags.filter(t=>t!==tag) : [...tags,tag]
                          return (
                            <button key={tag} onClick={()=>upd('opportunity_tags',newTags.join(', '))} style={{ padding:'.2rem .55rem', borderRadius:'20px', fontSize:'.63rem', cursor:'pointer', background:active?'var(--gold-bg)':'transparent', color:active?'var(--amber)':'var(--muted)', border:`.5px solid ${active?'var(--gold-b)':'var(--border)'}`, transition:'all .1s' }}>{tag}</button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Relationship Action */}
                    <div>
                      <div style={{fontSize:'.52rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:600,marginBottom:'.4rem'}}>Best relationship action</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'.3rem'}}>
                        {RELATIONSHIP_ACTIONS.map(action=>{
                          const active = client.relationship_action === action
                          return (
                            <button key={action} onClick={()=>upd('relationship_action',active?'':action)} style={{ padding:'.2rem .55rem', borderRadius:'4px', fontSize:'.63rem', cursor:'pointer', background:active?'var(--dark)':'transparent', color:active?'var(--bg)':'var(--muted)', border:`.5px solid ${active?'var(--dark)':'var(--border)'}`, transition:'all .1s' }}>{action}</button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div>
                <div className="card" style={{marginBottom:'1rem'}}>
                  <div className="card-head"><div className="card-title">Contact & Next Action</div></div>
                  <div className="card-body" style={{padding:'.5rem 1rem'}}>
                    <Field label="Contact name" value={client.contact_name} onSave={v=>upd('contact_name',v)}/>
                    <Field label="Email" value={client.contact_email} onSave={v=>upd('contact_email',v)}/>
                    <Field label="Phone" value={client.phone} onSave={v=>upd('phone',v)}/>
                    <Field label="Company" value={client.company} onSave={v=>upd('company',v)}/>
                    <Field label="Role" value={client.contact_role} onSave={v=>upd('contact_role',v)}/>
                    <Field label="Website" value={client.website} onSave={v=>upd('website',v)}/>
                    <Field label="Instagram" value={client.instagram} onSave={v=>upd('instagram',v)}/>
                    <Field label="LinkedIn" value={client.linkedin} onSave={v=>upd('linkedin',v)}/>
                    <Field label="Location" value={client.location} onSave={v=>upd('location',v)}/>
                    <Field label="Connector" value={client.connector_name} onSave={v=>upd('connector_name',v)}/>

                    {/* Connection Strength inline chips */}
                    <div style={{display:'flex',alignItems:'flex-start',gap:'.5rem',padding:'.35rem 0',borderBottom:'.5px solid var(--border)',minHeight:34}}>
                      <span style={{fontSize:'.56rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,minWidth:110,paddingTop:'.35rem',flexShrink:0}}>Connection</span>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'.25rem'}}>
                        {CONNECTION_STRENGTHS.map(s=>{
                          const active = client.connection_strength === s
                          const col = connColors[s] || 'var(--muted)'
                          return <button key={s} onClick={()=>upd('connection_strength',active?'':s)} style={{ padding:'.15rem .45rem', borderRadius:'20px', fontSize:'.62rem', cursor:'pointer', background:active?`${col}18`:'transparent', color:active?col:'var(--muted)', border:`.5px solid ${active?col+'55':'var(--border)'}`, fontWeight:active?500:400 }}>{s}</button>
                        })}
                      </div>
                    </div>

                    <Field label="Date contacted" value={client.date_contacted} type="date" onSave={v=>upd('date_contacted',v)}/>
                    <MultiCheckField label="Action taken" value={client.action_taken} options={ACTION_TAKEN_OPTIONS} onSave={v=>upd('action_taken',v)}/>
                    <Field label="Next action" value={client.next_action} onSave={v=>upd('next_action',v)}/>
                    <Field label="Next action date" value={client.next_action_date} type="date" onSave={v=>upd('next_action_date',v)}/>
                    <Field label="Next action to take" value={client.next_action_to_take} type="select" options={NEXT_ACTION_OPTIONS} onSave={v=>upd('next_action_to_take',v)}/>
                    {assignOptions.length>0&&<Field label="Assigned to" value={client.assigned_to} type="select" options={assignOptions} onSave={v=>upd('assigned_to',v)}/>}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}


        {/* ── TASKS ── */}
        {tab==='tasks'&&(
          <div style={{ maxWidth:680 }}>
            {/* Header row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <div>
                {(() => {
                  const done = tasks.filter(t=>t.status==='Done')
                  const earnedPts = done.reduce((s,t)=>s+(t.points||10),0)
                  const totalPts = tasks.reduce((s,t)=>s+(t.points||10),0)
                  return totalPts > 0 ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
                      <div style={{ fontSize:'.78rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase' }}>Lead Progress</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                        <div style={{ width:120, height:6, background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:'3px', background:'var(--mist-blue)', width:`${Math.round((earnedPts/totalPts)*100)}%`, transition:'width .4s' }}/>
                        </div>
                        <span style={{ fontSize:'.82rem', fontWeight:600, color:'var(--dark)' }}>{earnedPts} / {totalPts} pts</span>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
              <button className="btn btn-primary btn-sm" onClick={addTsk}>+ Add task</button>
            </div>

            {/* Filter pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:'1.5rem' }}>
              {TASK_FILTER_LABELS.map(f => {
                const count = getFilteredTasks(f).length
                const active = taskFilter === f
                return (
                  <button key={f} onClick={()=>setTaskFilter(f)} style={{ padding:'.4rem 1rem', borderRadius:'999px', fontSize:'.875rem', fontWeight: active ? 700 : 500, cursor:'pointer', fontFamily:'inherit', border: active ? '1.5px solid var(--mist-blue)' : '1.5px solid var(--border)', background: active ? 'var(--pale-cloud)' : 'transparent', color: active ? '#2E6080' : 'var(--muted)', transition:'all .14s', whiteSpace:'nowrap' }}>
                    {f}{count > 0 ? <span style={{ marginLeft:'.4rem', fontSize:'.78rem', opacity:.7 }}>{count}</span> : null}
                  </button>
                )
              })}
            </div>

            {/* Task flow generator */}
            <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'12px', padding:'.875rem 1.125rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap' }}>
              <span style={{ fontSize:'.72rem', letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, flexShrink:0 }}>Generate tasks for</span>
              <select className="form-select" style={{ flex:1, minWidth:160, maxWidth:240 }} value={taskFlow} onChange={e=>setTaskFlow(e.target.value)}>
                <option value="">— choose a stage —</option>
                {Object.keys(STAGE_TASK_FLOWS).map(k=><option key={k}>{k}</option>)}
              </select>
              {taskFlow && (
                <>
                  <div style={{ fontSize:'.82rem', color:'var(--muted)' }}>{STAGE_TASK_FLOWS[taskFlow].length} tasks</div>
                  <button className="btn btn-primary btn-sm" onClick={applyTaskFlow} disabled={addingFlow}>{addingFlow?'Adding…':'Add tasks'}</button>
                </>
              )}
            </div>

            {/* Task list */}
            {(() => {
              const filtered = getFilteredTasks(taskFilter)
              if (filtered.length === 0) return (
                <div style={{ textAlign:'center', padding:'3.5rem 1rem' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'.75rem', opacity:.25 }}>✓</div>
                  <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.35rem', color:'var(--muted)', marginBottom:'.5rem' }}>Nothing here</div>
                  <div style={{ fontSize:'.9rem', color:'var(--muted)' }}>No tasks match this filter right now.</div>
                </div>
              )
              return filtered.map(task => <TaskCard key={task.id} task={task}/>)
            })()}
          </div>
        )}

        {/* ── DIAGNOSIS ── */}
        {tab==='diagnosis'&&(
          <div style={{display:'flex',gap:'1.5rem',alignItems:'flex-start'}}>

            {/* Left: AI Diagnostic Engine */}
            <div style={{flex:1,minWidth:0}}>
              <DiagnosticEngine
                client={client}
                clientId={id}
                onUpdate={updates => setClient(c => ({ ...c, ...updates }))}
              />
            </div>

            {/* Right: Notes sidebar */}
            <div style={{width:280,flexShrink:0,position:'sticky',top:0}}>
              <div style={{background:'#FBF3E6',border:'.5px solid var(--gold-b)',borderRadius:'10px',padding:'1rem 1.1rem',borderLeft:'3px solid var(--gold)'}}>
                <div style={{fontSize:'.52rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--gold)',fontWeight:600,marginBottom:'1rem'}}>Diagnosis Notes</div>

                <div style={{marginBottom:'.875rem'}}>
                  <div style={{fontSize:'.54rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.3rem'}}>Core insight</div>
                  <textarea
                    className="form-textarea"
                    style={{minHeight:72,fontSize:'.78rem',background:'rgba(255,255,255,.6)',resize:'vertical'}}
                    placeholder="What's the core insight about this client?"
                    value={client.diagnosis_core_insight||''}
                    onChange={e=>setClient(c=>({...c,diagnosis_core_insight:e.target.value}))}
                    onBlur={e=>upd('diagnosis_core_insight',e.target.value)}
                  />
                </div>

                <div style={{marginBottom:'.875rem'}}>
                  <div style={{fontSize:'.54rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.3rem'}}>Main bottleneck</div>
                  <textarea
                    className="form-textarea"
                    style={{minHeight:72,fontSize:'.78rem',background:'rgba(255,255,255,.6)',resize:'vertical'}}
                    placeholder="Where are they stuck or leaking?"
                    value={client.diagnosis_bottleneck||''}
                    onChange={e=>setClient(c=>({...c,diagnosis_bottleneck:e.target.value}))}
                    onBlur={e=>upd('diagnosis_bottleneck',e.target.value)}
                  />
                </div>

                <div style={{marginBottom:'.875rem'}}>
                  <div style={{fontSize:'.54rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.3rem'}}>Opening line</div>
                  <textarea
                    className="form-textarea"
                    style={{minHeight:64,fontSize:'.82rem',fontFamily:'Cormorant Garamond,Georgia,serif',fontStyle:'italic',background:'rgba(255,255,255,.6)',resize:'vertical'}}
                    placeholder="The line that shows Maxine was listening…"
                    value={client.diagnosis_opening_line||''}
                    onChange={e=>setClient(c=>({...c,diagnosis_opening_line:e.target.value}))}
                    onBlur={e=>upd('diagnosis_opening_line',e.target.value)}
                  />
                </div>

                <div style={{marginBottom:'.875rem'}}>
                  <div style={{fontSize:'.54rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.3rem'}}>Connector / handover notes</div>
                  <textarea
                    className="form-textarea"
                    style={{minHeight:64,fontSize:'.78rem',background:'rgba(255,255,255,.6)',resize:'vertical'}}
                    placeholder="What did the connector share?"
                    value={client.handover_notes||''}
                    onChange={e=>setClient(c=>({...c,handover_notes:e.target.value}))}
                    onBlur={e=>upd('handover_notes',e.target.value)}
                  />
                </div>

                <div>
                  <div style={{fontSize:'.54rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.3rem'}}>Confidence</div>
                  <select
                    className="form-select"
                    style={{fontSize:'.78rem',background:'rgba(255,255,255,.6)'}}
                    value={client.diagnosis_confidence||''}
                    onChange={e=>upd('diagnosis_confidence',e.target.value)}
                  >
                    <option value="">—</option>
                    {['High','Medium','Low'].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── NOTES ── */}
        {tab==='notes'&&(
          <div style={{maxWidth:860}}>
            <NotesTab clientId={id} clientName={client.name} />
          </div>
        )}

        {/* ── COMMENTS ── */}
        {tab==='comments'&&(
          <div style={{maxWidth:720}}>
            <div style={{display:'flex',flexDirection:'column',gap:'.625rem',marginBottom:'1.5rem'}}>
              {comments.length===0&&<div style={{color:'var(--muted)',fontSize:'.8rem',padding:'2rem 0',textAlign:'center'}}>No comments yet. Start the conversation below.</div>}
              {comments.map(c=>(
                <div key={c.id} style={{background:'var(--warm)',border:'.5px solid var(--border)',borderRadius:'8px',padding:'.875rem 1rem'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.5rem'}}>
                    <div style={{width:24,height:24,borderRadius:'5px',background:'var(--gold-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:600,color:'var(--amber)',flexShrink:0}}>{(c.author_name||'?').slice(0,2).toUpperCase()}</div>
                    <span style={{fontSize:'.75rem',fontWeight:500,color:'var(--dark)'}}>{c.author_name||'Team'}</span>
                    <span style={{fontSize:'.65rem',color:'var(--muted)',marginLeft:'auto'}}>{fmtDate(c.created_at)}</span>
                  </div>
                  <div style={{fontSize:'.82rem',color:'var(--dark)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{renderWithMentions(c.content)}</div>
                </div>
              ))}
            </div>
            <div style={{position:'relative'}}>
              {mentionUsers.length>0&&(
                <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'var(--warm)',border:'.5px solid var(--border)',borderRadius:'6px',boxShadow:'0 4px 16px rgba(0,0,0,.1)',zIndex:10,marginBottom:'.25rem'}}>
                  {mentionUsers.slice(0,5).map(u=>(
                    <div key={u.id} onClick={()=>insertMention(u)} style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.5rem .75rem',cursor:'pointer',borderBottom:'.5px solid var(--border)'}}>
                      <div style={{width:22,height:22,borderRadius:'4px',background:'var(--gold-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:600,color:'var(--amber)'}}>{(u.name||'?').slice(0,2).toUpperCase()}</div>
                      <span style={{fontSize:'.8rem'}}>{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <textarea ref={commentRef} className="form-textarea" style={{minHeight:80,marginBottom:'.5rem'}} placeholder="Add a comment... type @ to mention someone" value={commentText} onChange={handleCommentChange} onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))submitComment();if(e.key==='Escape')setMentionSearch(null)}}/>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'.5rem',alignItems:'center'}}>
                <span style={{fontSize:'.62rem',color:'var(--muted)'}}>⌘+Enter to post</span>
                <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submittingComment||!commentText.trim()}>{submittingComment?'Posting…':'Post comment'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ── EMAILS ── */}
        {tab==='emails'&&(
          <div style={{maxWidth:760}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
              <div style={{fontSize:'.78rem',color:'var(--muted)'}}>{emails.length} emails logged</div>
              <button className="btn btn-primary" onClick={()=>setShowEmailForm(v=>!v)}>+ Log email</button>
            </div>
            <div style={{background:'var(--blue-bg)',border:'.5px solid var(--blue-b)',borderRadius:'8px',padding:'.875rem 1rem',marginBottom:'1.25rem',fontSize:'.75rem',color:'var(--blue)',lineHeight:1.6}}>
              <strong style={{display:'block',marginBottom:'.2rem'}}>Auto-capture emails via Postmark</strong>
              BCC your Postmark inbound address when emailing this client and emails will appear here automatically. Ask your admin to set up the Postmark webhook at <code style={{background:'rgba(26,63,107,.08)',borderRadius:'3px',padding:'0 .25rem'}}>/api/inbound-email</code>.
            </div>
            {showEmailForm&&(
              <div className="card" style={{marginBottom:'1.25rem'}}>
                <div className="card-head"><div className="card-title">Log an email</div></div>
                <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  <div className="g2">
                    <div className="form-group"><label className="form-label">From</label><input className="form-input" placeholder="sender@example.com" value={emailForm.from_email} onChange={e=>setEmailForm(f=>({...f,from_email:e.target.value}))}/></div>
                    <div className="form-group"><label className="form-label">To</label><input className="form-input" placeholder="recipient@example.com" value={emailForm.to_email} onChange={e=>setEmailForm(f=>({...f,to_email:e.target.value}))}/></div>
                  </div>
                  <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={emailForm.subject} onChange={e=>setEmailForm(f=>({...f,subject:e.target.value}))}/></div>
                  <div className="form-group"><label className="form-label">Body</label><textarea className="form-textarea" style={{minHeight:100}} value={emailForm.body} onChange={e=>setEmailForm(f=>({...f,body:e.target.value}))}/></div>
                  <div style={{display:'flex',justifyContent:'flex-end',gap:'.5rem'}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>setShowEmailForm(false)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={saveEmail} disabled={savingEmail}>{savingEmail?'Saving…':'Save'}</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'.625rem'}}>
              {emails.length===0&&!showEmailForm&&<div style={{color:'var(--muted)',fontSize:'.8rem',padding:'2rem 0',textAlign:'center'}}>No emails logged yet.</div>}
              {emails.map(e=>(
                <div key={e.id} className="card">
                  <div style={{padding:'.75rem 1rem',borderBottom:'.5px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem'}}>
                    <div>
                      <div style={{fontWeight:500,fontSize:'.82rem',marginBottom:'.2rem'}}>{e.subject||'(no subject)'}</div>
                      <div style={{fontSize:'.68rem',color:'var(--muted)'}}>
                        {e.from_email&&<span>From: {e.from_email}</span>}
                        {e.from_email&&e.to_email&&<span> · </span>}
                        {e.to_email&&<span>To: {e.to_email}</span>}
                      </div>
                    </div>
                    <div style={{fontSize:'.65rem',color:'var(--muted)',flexShrink:0}}>{fmtDate(e.sent_at)}</div>
                  </div>
                  {e.body&&<div style={{padding:'.75rem 1rem',fontSize:'.78rem',color:'var(--dark)',lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto'}}>{e.body}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Convert to client modal */}
      {showConvert&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowConvert(false)}>
          <div className="modal" style={{maxWidth:480}}>
            <div className="modal-head">
              <div className="modal-title">Convert to Client</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowConvert(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{background:'var(--teal-bg)',border:'.5px solid var(--teal-b)',borderRadius:'8px',padding:'.875rem 1rem',fontSize:'.78rem',color:'var(--teal)',lineHeight:1.6}}>
                Converting <strong>{client.name}</strong> will move them out of the pipeline and into active client delivery.
              </div>
              <div className="form-group">
                <label className="form-label">Starting stage</label>
                <select className="form-select" value={convertForm.stage} onChange={e=>setConvertForm(f=>({...f,stage:e.target.value}))}>
                  {CLIENT_STAGES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Package</label>
                <select className="form-select" value={convertForm.recommended_package} onChange={e=>setConvertForm(f=>({...f,recommended_package:e.target.value}))}>
                  <option value="">— Select package —</option>
                  {PACKAGES.map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly retainer (MRR)</label>
                <input className="form-input" type="number" placeholder="e.g. 3500" value={convertForm.mrr} onChange={e=>setConvertForm(f=>({...f,mrr:e.target.value}))}/>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={()=>setShowConvert(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleConvert} disabled={converting}>{converting?'Converting…':'Confirm conversion →'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
