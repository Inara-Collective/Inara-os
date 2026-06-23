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
  getContentItems, createContentItem, updateContentItem, deleteContentItem,
  PIPELINE_STAGES, SALES_STAGES, PACKAGES,
  TASK_STATUSES, TASK_OWNERS, ALL_MODULES, MUST_MODULES,
  ACTION_TAKEN_OPTIONS, NEXT_ACTION_OPTIONS,
  OPPORTUNITY_TAGS, RELATIONSHIP_ACTIONS, CONNECTION_STRENGTHS, STAGE_TASK_FLOWS,
  CONTENT_TYPES, CONTENT_PLATFORMS, CONTENT_STATUSES
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
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskFilter, setTaskFilter] = useState('To Do Now')
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [showAddSuggestion, setShowAddSuggestion] = useState(false)
  const [newSuggestionForm, setNewSuggestionForm] = useState({ title:'', reason:'', impact:'', priority:'Medium', status:'Pending' })
  const [contentItems, setContentItems] = useState([])
  const [showAddContent, setShowAddContent] = useState(false)
  const [newContentForm, setNewContentForm] = useState({ title:'', status:'Ideas', platform:'', content_type:'', priority:'Medium', due_date:'' })
  const [showAddCampaign, setShowAddCampaign] = useState(false)
  const [newCampaignForm, setNewCampaignForm] = useState({ subject:'', sent_date:'', opens:'', clicks:'', status:'Draft' })
  const [websiteSubTab, setWebsiteSubTab] = useState('Tasks')

  useEffect(() => {
    getClient(id)
      .then(d => {
        setClient(d); setModules(d?.client_modules||[]); setTasks(d?.tasks||[])
        if (d && !SALES_STAGES.includes(d.stage) && d.stage !== 'Onboarding') setTab('home')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    getUsers().then(setUsers).catch(() => {})
  }, [id])

  useEffect(() => {
    if (tab === 'comments') getClientComments(id).then(setComments).catch(() => {})
    if (tab === 'emails' || tab === 'home') getClientEmails(id).then(setEmails).catch(() => {})
    if (tab === 'content') getContentItems(id).then(setContentItems).catch(() => {})
  }, [tab, id])

  const upd = async (field, value) => {
    setClient(c => ({ ...c, [field]: value }))
    try { const u = await updateClient(id, { [field]: value }); setClient(u) } catch (e) { console.error(e) }
  }

  const addMod = async (name, priority) => { const m = await addClientModule({client_id:id,module_name:name,priority,status:'Active'}); setModules(p=>[...p,m]); setShowModAdd(false) }
  const togMod = async (m) => { const u = await updateClientModule(m.id,{status:m.status==='Active'?'Paused':'Active'}); setModules(p=>p.map(x=>x.id===m.id?u:x)) }
  const delMod = async (mid) => { await deleteClientModule(mid); setModules(p=>p.filter(m=>m.id!==mid)) }
  const addTsk = async () => { const t = await createTask({client_id:id,name:'New task',status:'Now'}); setTasks(p=>[...p,t]); setTaskFilter('To Do Now'); setSelectedTask(t.id) }
  const updTsk = async (tid,field,value) => { setTasks(p=>p.map(t=>t.id===tid?{...t,[field]:value}:t)); try { await updateTask(tid,{[field]:value}) } catch(e){console.error(e)} }
  const delTsk = async (tid) => { await deleteTask(tid); setTasks(p=>p.filter(t=>t.id!==tid)) }

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
  const TASK_FILTER_LABELS = ['To Do Now','Up Next','Due Now','Due This Week','Waiting','Follow Up','High Value','Quick Wins','Relationship Builder','Done']

  function getFilteredTasks(filter) {
    const now = new Date().toISOString().split('T')[0]
    const in7 = new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0]
    const followKw = ['follow','check in','message','reminder','reach','touch','dm']
    const relKw = ['coffee','lunch','invite','connect','relationship','intro','warm','call']
    switch(filter) {
      case 'To Do Now':  return tasks.filter(t => t.status === 'Today' || t.status === 'Now')
      case 'Up Next':    return tasks.filter(t => t.status === 'Soon')
      case 'Due Now':    return tasks.filter(t => t.due_date && t.due_date <= now && t.status !== 'Done')
      case 'Due This Week': return tasks.filter(t => t.due_date && t.due_date >= now && t.due_date <= in7 && t.status !== 'Done')
      case 'Waiting':    return tasks.filter(t => t.status === 'Waiting')
      case 'Follow Up':  return tasks.filter(t => t.status !== 'Done' && followKw.some(k => (t.name||'').toLowerCase().includes(k)))
      case 'High Value': return tasks.filter(t => t.status !== 'Done' && (t.points||10) >= 25)
      case 'Quick Wins': return tasks.filter(t => t.status !== 'Done' && (t.points||10) <= 15)
      case 'Relationship Builder': return tasks.filter(t => t.status !== 'Done' && relKw.some(k => (t.name||'').toLowerCase().includes(k)))
      case 'Done':       return tasks.filter(t => t.status === 'Done')
      default:           return tasks
    }
  }

  function getTaskIcon(name) {
    const n = (name||'').toLowerCase()
    if (n.includes('call') || n.includes('phone')) return '📞'
    if (n.includes('email') || n.includes('follow-up email')) return '✉️'
    if (n.includes('message') || n.includes('check in') || n.includes('dm')) return '💬'
    if (n.includes('book') || n.includes('meeting') || n.includes('session') || n.includes('schedule')) return '🗓'
    if (n.includes('proposal') || n.includes('send proposal') || n.includes('draft')) return '📄'
    if (n.includes('coffee') || n.includes('lunch') || n.includes('invite')) return '☕'
    return '✓'
  }

  function dueBadge(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr + 'T00:00')
    const t = new Date(); t.setHours(0,0,0,0)
    const diff = Math.round((d-t)/(1000*60*60*24))
    if (diff < 0) return { text:'Overdue', color:'var(--red)', bold:true }
    if (diff === 0) return { text:'Due Today', color:'var(--red)', bold:true }
    if (diff === 1) return { text:'Due Tomorrow', color:'var(--amber)', bold:false }
    if (diff <= 7) return { text:'Due This Week', color:'var(--muted)', bold:false }
    return { text:`Due ${d.toLocaleDateString('en-NZ',{day:'numeric',month:'short'})}`, color:'var(--muted)', bold:false }
  }

  function TaskListItem({ task, selected, onSelect }) {
    const pts = task.points || 10
    const isDone = task.status === 'Done'
    const due = dueBadge(task.due_date)
    return (
      <div onClick={onSelect} style={{ display:'flex', alignItems:'center', gap:'.875rem', background: selected ? 'var(--pale-cloud)' : '#FFFFFF', border:`1.5px solid ${selected?'var(--mist-blue)':'var(--border)'}`, borderRadius:'14px', padding:'.875rem 1rem', marginBottom:'.625rem', cursor:'pointer', transition:'all .12s', opacity: isDone ? 0.6 : 1 }}
        onMouseEnter={e=>{ if(!selected){ e.currentTarget.style.borderColor='var(--mist-blue)'; e.currentTarget.style.background='#fafcfe' }}}
        onMouseLeave={e=>{ if(!selected){ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='#FFFFFF' }}}
      >
        <div style={{ width:42, height:42, borderRadius:'11px', background: selected ? 'rgba(159,187,208,.2)' : 'var(--bg)', border:`.5px solid ${selected?'rgba(159,187,208,.3)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.05rem', flexShrink:0 }}>
          {getTaskIcon(task.name)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'.95rem', fontWeight:700, color:isDone?'var(--muted)':'var(--dark)', textDecoration:isDone?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'.2rem' }}>{task.name}</div>
          {task.discussion_point && <div style={{ fontSize:'.8rem', color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'.3rem' }}>{task.discussion_point}</div>}
          {due && <div style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.78rem', color:due.color, fontWeight:due.bold?700:400 }}>📅 {due.text}</div>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.35rem', flexShrink:0 }}>
          <span style={{ background:'var(--pale-cloud)', color:'#2E6080', borderRadius:'999px', padding:'.18rem .6rem', fontSize:'.78rem', fontWeight:600 }}>+{pts} pts</span>
          <span style={{ color:'var(--muted)', fontSize:'1.1rem', lineHeight:1 }}>›</span>
        </div>
      </div>
    )
  }

  function TaskDetailPanel({ task, onClose }) {
    const [editMode, setEditMode] = useState(false)
    const col = taskStatusColors[task.status] || '#A6AAB5'
    const pts = task.points || 10
    const due = dueBadge(task.due_date)
    const copyText = (t) => { try { navigator.clipboard.writeText(t) } catch(e) {} }
    const n = (task.name||'').toLowerCase()
    const primaryLabel = n.includes('call')||n.includes('phone') ? '📞 Start Call'
      : n.includes('email') ? '✉ Send Email'
      : n.includes('message')||n.includes('dm') ? '💬 Copy Message'
      : '✓ Mark Done'
    const isCallType = n.includes('call')||n.includes('phone')||n.includes('email')||n.includes('message')||n.includes('dm')

    if (editMode) return (
      <div style={{ padding:'1.75rem', display:'flex', flexDirection:'column', gap:'.875rem', overflowY:'auto', maxHeight:'calc(100vh - 240px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase' }}>Edit task</span>
          <div style={{ display:'flex', gap:'.5rem' }}>
            <button className="btn btn-ghost btn-xs" onClick={()=>setEditMode(false)}>← Back</button>
            <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
          </div>
        </div>
        <input className="form-input" style={{ fontWeight:700, fontSize:'1.05rem' }} defaultValue={task.name} onBlur={e=>updTsk(task.id,'name',e.target.value)} autoFocus placeholder="Task name…"/>
        <div>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.5rem' }}>Status</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'.4rem' }}>
            {TASK_STATUSES.map(s=>{ const c=taskStatusColors[s]||'#A6AAB5'; return (
              <button key={s} onClick={()=>updTsk(task.id,'status',s)} style={{ padding:'.3rem .875rem', borderRadius:'999px', fontSize:'.85rem', cursor:'pointer', background:task.status===s?`${c}22`:'transparent', color:task.status===s?c:'var(--muted)', border:`1.5px solid ${task.status===s?c+'66':'var(--border)'}`, fontWeight:task.status===s?700:500, fontFamily:'inherit' }}>{s}</button>
            )})}
          </div>
        </div>
        <div style={{ display:'flex', gap:'.625rem' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Due date</div>
            <input type="date" className="form-input" value={task.due_date||''} onChange={e=>updTsk(task.id,'due_date',e.target.value)}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Points</div>
            <select className="form-select" value={task.points||10} onChange={e=>updTsk(task.id,'points',parseInt(e.target.value))}>
              {[5,10,15,20,25,30,50,100].map(p=><option key={p} value={p}>+{p} pts</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Owner</div>
            <select className="form-select" value={task.owner||''} onChange={e=>updTsk(task.id,'owner',e.target.value)}>
              <option value="">—</option>
              {TASK_OWNERS.map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Discussion point</div>
          <textarea className="form-textarea" style={{ minHeight:72 }} defaultValue={task.discussion_point||''} onBlur={e=>updTsk(task.id,'discussion_point',e.target.value)} placeholder="What to focus on or talk about…"/>
        </div>
        <div>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Where this leads</div>
          <textarea className="form-textarea" style={{ minHeight:64 }} defaultValue={task.where_this_leads||''} onBlur={e=>updTsk(task.id,'where_this_leads',e.target.value)} placeholder="The outcome or purpose of this task…"/>
        </div>
        <div>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Next tiny step</div>
          <input className="form-input" defaultValue={task.next_step||''} onBlur={e=>updTsk(task.id,'next_step',e.target.value)} placeholder="The smallest first action…"/>
        </div>
        <div>
          <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'.4rem' }}>Script / Email / Message Draft</div>
          <textarea className="form-textarea" style={{ minHeight:140, lineHeight:1.75 }} defaultValue={task.script||''} onBlur={e=>updTsk(task.id,'script',e.target.value)} placeholder="Add a call script, email draft, or message template here…"/>
        </div>
        <button className="btn btn-danger btn-xs" style={{ alignSelf:'flex-start' }} onClick={()=>{ delTsk(task.id); onClose() }}>Delete task</button>
      </div>
    )

    return (
      <div style={{ display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 240px)', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'1.375rem 1.625rem', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'1.2rem', fontWeight:700, color:'var(--dark)', lineHeight:1.35, marginBottom:'.625rem' }}>{task.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'.875rem', flexWrap:'wrap' }}>
                {client.company && <span style={{ fontSize:'.82rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'.3rem' }}>🏢 {client.company}</span>}
                {client.connection_strength && <span style={{ fontSize:'.82rem', color:'var(--muted)', display:'flex', alignItems:'center', gap:'.3rem' }}>⭐ {client.connection_strength}</span>}
                {due && <span style={{ fontSize:'.82rem', color:due.color, fontWeight:due.bold?700:400, display:'flex', alignItems:'center', gap:'.3rem' }}>📅 {due.text}</span>}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'.5rem', flexShrink:0 }}>
              <span style={{ background:'var(--pale-cloud)', color:'#2E6080', borderRadius:'999px', padding:'.28rem .875rem', fontSize:'.88rem', fontWeight:600 }}>+{pts} pts</span>
              <button onClick={()=>setEditMode(true)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer', color:'var(--muted)', fontSize:'1.15rem', padding:'.2rem .5rem', lineHeight:1 }}>⋯</button>
              <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'8px', cursor:'pointer', color:'var(--muted)', fontSize:'.85rem', padding:'.28rem .55rem', lineHeight:1 }}>✕</button>
            </div>
          </div>
        </div>

        {/* 4-column info strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {[
            { icon:'💬', label:'Discussion Point', value: task.discussion_point },
            { icon:'→', label:'Where This Leads', value: task.where_this_leads },
            { icon:'⭐', label:'Points', value: `+${pts} points\n${pts>=25?'High-value — moves this lead forward significantly.':pts>=20?'Strong action that builds real momentum.':pts>=15?'Keeps the lead warm and moving.':'Quick action to maintain connection.'}` },
            { icon:'▶', label:'Next Tiny Step', value: task.next_step },
          ].map(({icon,label,value},i) => (
            <div key={label} style={{ padding:'1rem 1.125rem', borderRight:i<3?'1px solid var(--border)':'none' }}>
              <div style={{ fontSize:'.6rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:'.5rem', display:'flex', alignItems:'center', gap:'.35rem' }}>
                <span>{icon}</span>{label}
              </div>
              <div style={{ fontSize:'.875rem', lineHeight:1.65, color: label==='Next Tiny Step'?'var(--mist-blue)':label==='Points'?'var(--dark)':'var(--dark)', whiteSpace:'pre-line', fontWeight: label==='Points'?700:400 }}>
                {value || <span style={{ color:'var(--border)', fontWeight:400 }}>—</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Script section */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.375rem 1.625rem' }}>
          {task.script ? (
            <>
              <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--mist-blue)', letterSpacing:'.14em', textTransform:'uppercase', marginBottom:'.875rem' }}>Script / Draft</div>
              <div style={{ fontSize:'.9rem', lineHeight:1.9, color:'var(--dark)', whiteSpace:'pre-wrap', fontFamily:'inherit' }}>{task.script}</div>
            </>
          ) : (
            <button onClick={()=>setEditMode(true)} style={{ background:'none', border:'1.5px dashed var(--border)', borderRadius:'12px', padding:'1.25rem', width:'100%', cursor:'pointer', color:'var(--muted)', fontSize:'.9rem', fontFamily:'inherit', textAlign:'center' }}>
              + Add a script or draft for this task
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ padding:'1.125rem 1.625rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.625rem', flexWrap:'wrap', flexShrink:0 }}>
          <button onClick={()=>updTsk(task.id,'status','Done')} style={{ flex:2, minWidth:130, background:'var(--dark)', color:'#fff', border:'none', borderRadius:'12px', padding:'.875rem 1rem', fontSize:'1rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'.4rem' }}>
            {primaryLabel}
          </button>
          {task.script && <button onClick={()=>copyText(task.script)} style={{ flex:1, minWidth:100, background:'transparent', color:'var(--dark)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'.875rem .875rem', fontSize:'.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Copy Script</button>}
          {isCallType && <button onClick={()=>updTsk(task.id,'status','Done')} style={{ flex:1, minWidth:100, background:'transparent', color:'var(--dark)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'.875rem .875rem', fontSize:'.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✓ Mark Done</button>}
          <button onClick={()=>setEditMode(true)} style={{ flex:1, minWidth:90, background:'transparent', color:'var(--dark)', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'.875rem .875rem', fontSize:'.95rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>✎ Add Note</button>
        </div>
      </div>
    )
  }


  const assignOptions = users.map(u => u.name).filter(Boolean)
  const mentionUsers = mentionSearch !== null ? users.filter(u => u.name?.toLowerCase().startsWith(mentionSearch.toLowerCase())) : []
  const isLead = SALES_STAGES.includes(client.stage)
  const isOnboarding = client.stage === 'Onboarding'
  const CLIENT_STAGES = PIPELINE_STAGES.filter(s => !SALES_STAGES.includes(s))
  const TABS = isLead
    ? ['overview','tasks','diagnosis','proposal','notes','comments','emails']
    : isOnboarding
    ? ['overview','tasks','onboarding','notes','emails']
    : ['home','content','deliverables','website','email','system','reporting','tasks','notes','comments']

  const TAB_LABELS = { home:'Client Home', content:'Marketing Hub', deliverables:'Deliverables', website:'Website Board', email:'Email Marketing', system:'System Building', reporting:'Reporting', tasks:'Tasks', notes:'Notes', comments:'Comments', overview:'Overview', diagnosis:'Diagnosis', proposal:'Proposal', onboarding:'Onboarding', emails:'Emails', suggestions:'Suggestions', package:'Package' }
  const ONBOARDING_ITEMS = ['Contract signed','Invoice sent','Invoice paid','Welcome email sent','Client board created','Brand questionnaire sent','Access requested','Assets received','Kickoff call booked','Strategy call scheduled','Client folder created','Team briefed']
  const doneOnboarding = (client.onboarding_done||'').split(',').map(s=>s.trim()).filter(Boolean)
  const toggleOnboarding = (item) => {
    const newDone = doneOnboarding.includes(item) ? doneOnboarding.filter(x=>x!==item) : [...doneOnboarding, item]
    upd('onboarding_done', newDone.join(','))
  }

  const GROWTH_OPPS = [
    { label:'Add paid ads management', value:'Est. $1,500/mth', priority:'High' },
    { label:'Monthly content retainer', value:'Est. $2,000/mth', priority:'High' },
    { label:'Email marketing setup', value:'Est. $800/mth', priority:'Medium' },
    { label:'Campaign strategy & execution', value:'Est. $3,000', priority:'Medium' },
    { label:'Content shoot', value:'Est. $1,200', priority:'Low' },
    { label:'Brand refresh', value:'Est. $4,000', priority:'Low' },
    { label:'Website update', value:'Est. $2,500', priority:'Low' },
    { label:'Training & on-camera coaching', value:'Est. $1,500', priority:'Medium' },
  ]

  const connColors = { 'Cold':'var(--blue)', 'Warm':'var(--gold)', 'Hot':'var(--red)', 'Existing relationship':'var(--teal)', 'Referral':'var(--purple)', 'Past client':'var(--teal)', 'Event connection':'var(--amber)' }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate(isLead?'/pipeline':'/clients')}>{isLead?'← Leads':'← Clients'}</button>
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
            {TAB_LABELS[t]||t.charAt(0).toUpperCase()+t.slice(1)}
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
          <div>
            {/* Page heading */}
            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.6rem', fontWeight:400, marginBottom:'.2rem' }}>Pipeline Tasks</div>
              <div style={{ fontSize:'.9rem', color:'var(--muted)' }}>Best next actions to move {(client.name||'').split(' ')[0]} forward.</div>
            </div>

            {/* Horizontal filter pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'.5rem', marginBottom:'1.375rem', alignItems:'center' }}>
              {TASK_FILTER_LABELS.map(f => {
                const count = getFilteredTasks(f).length
                const active = taskFilter === f
                const urgent = f === 'Due Now' && count > 0
                return (
                  <button key={f} onClick={()=>{setTaskFilter(f);setSelectedTask(null)}} style={{ padding:'.38rem .95rem', borderRadius:'999px', fontSize:'.875rem', fontWeight: active ? 700 : 400, cursor:'pointer', fontFamily:'inherit', border: active ? '1.5px solid var(--mist-blue)' : `1.5px solid ${urgent?'var(--red-b)':'var(--border)'}`, background: active ? 'var(--pale-cloud)' : 'transparent', color: active ? '#2E6080' : urgent ? 'var(--red)' : 'var(--muted)', transition:'all .12s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'.35rem' }}>
                    {f}{count > 0 && <span style={{ fontWeight:700 }}>{count}</span>}
                  </button>
                )
              })}
            </div>

            {/* Split panel */}
            <div style={{ display:'flex', gap:'1.25rem', alignItems:'flex-start' }}>

              {/* Left: compact task list */}
              <div style={{ width:360, flexShrink:0 }}>
                {getFilteredTasks(taskFilter).map(task => (
                  <TaskListItem key={task.id} task={task} selected={selectedTask===task.id} onSelect={()=>setSelectedTask(task.id)}/>
                ))}
                {getFilteredTasks(taskFilter).length === 0 && (
                  <div style={{ textAlign:'center', padding:'2.5rem 1rem', color:'var(--muted)', fontSize:'.9rem' }}>No tasks match this filter.</div>
                )}
                <button onClick={addTsk} style={{ width:'100%', background:'transparent', border:'1.5px dashed var(--border)', borderRadius:'14px', padding:'.875rem 1rem', fontSize:'.9rem', color:'var(--muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem', marginTop:'.375rem', fontFamily:'inherit' }}>
                  <span style={{ fontSize:'1.1rem', lineHeight:1 }}>+</span> Add New Task
                </button>

                {/* Lead progress + task generator below list */}
                {(() => {
                  const done = tasks.filter(t=>t.status==='Done')
                  const earned = done.reduce((s,t)=>s+(t.points||10),0)
                  const total = tasks.reduce((s,t)=>s+(t.points||10),0)
                  return total > 0 ? (
                    <div style={{ marginTop:'1.25rem', padding:'.875rem 1rem', background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'12px' }}>
                      <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'.5rem' }}>Lead Progress</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'.625rem' }}>
                        <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', borderRadius:'3px', background:'var(--mist-blue)', width:`${Math.round((earned/total)*100)}%`, transition:'width .4s' }}/>
                        </div>
                        <span style={{ fontSize:'.85rem', fontWeight:700, color:'var(--dark)', flexShrink:0 }}>{earned} / {total} pts</span>
                      </div>
                    </div>
                  ) : null
                })()}

                <div style={{ marginTop:'.875rem', padding:'.875rem 1rem', background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'12px' }}>
                  <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'.5rem' }}>Generate tasks</div>
                  <select className="form-select" style={{ marginBottom:'.5rem' }} value={taskFlow} onChange={e=>setTaskFlow(e.target.value)}>
                    <option value="">— choose a stage —</option>
                    {Object.keys(STAGE_TASK_FLOWS).map(k=><option key={k}>{k}</option>)}
                  </select>
                  {taskFlow && <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={applyTaskFlow} disabled={addingFlow}>{addingFlow?'Adding…':`Add ${STAGE_TASK_FLOWS[taskFlow].length} tasks`}</button>}
                </div>
              </div>

              {/* Right: task detail panel */}
              <div style={{ flex:1, minWidth:0 }}>
                {selectedTask && tasks.find(t=>t.id===selectedTask) ? (
                  <div style={{ background:'#FFFFFF', border:'1px solid var(--border)', borderRadius:'20px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.08)' }}>
                    <TaskDetailPanel task={tasks.find(t=>t.id===selectedTask)} onClose={()=>setSelectedTask(null)}/>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'5rem 2rem', color:'var(--muted)', textAlign:'center', background:'var(--warm)', borderRadius:'20px', border:'1.5px dashed var(--border)' }}>
                    <div style={{ fontSize:'1.5rem', marginBottom:'.75rem', opacity:.2 }}>→</div>
                    <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.25rem', marginBottom:'.4rem' }}>Select a task</div>
                    <div style={{ fontSize:'.9rem' }}>Click any task on the left to see the full details, script, and actions.</div>
                  </div>
                )}
              </div>

            </div>
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

        {/* ── PROPOSAL ── */}
        {tab==='proposal'&&(
          <div style={{maxWidth:800}}>
            {/* Status chips */}
            <div style={{marginBottom:'1.75rem'}}>
              <div style={{fontSize:'.65rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:600,marginBottom:'.875rem'}}>Proposal Status</div>
              <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                {['Draft','Sent','Viewed','Follow Up','Accepted','Declined','Revised'].map(s=>{
                  const active=(client.proposal_status||'Draft')===s
                  const col=s==='Accepted'?'var(--teal)':s==='Declined'?'var(--red)':s==='Revised'?'var(--amber)':s==='Sent'||s==='Viewed'?'var(--blue)':s==='Follow Up'?'var(--purple)':'var(--muted)'
                  return (
                    <button key={s} onClick={()=>upd('proposal_status',s)} style={{padding:'.5rem 1.25rem',borderRadius:'999px',fontSize:'.9rem',cursor:'pointer',fontFamily:'inherit',fontWeight:active?700:400,border:active?`2px solid ${col}`:'1.5px solid var(--border)',background:active?`${col}15`:'transparent',color:active?col:'var(--muted)',transition:'all .12s'}}>
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Package + Investment + Dates */}
            <div className="card" style={{marginBottom:'1.25rem'}}>
              <div className="card-head"><div className="card-title">Proposal Details</div></div>
              <div className="card-body" style={{padding:'.5rem 1rem'}}>
                <Field label="Package" value={client.recommended_package} type="select" options={PACKAGES} onSave={v=>upd('recommended_package',v)}/>
                <Field label="Investment (MRR)" value={client.mrr?.toString()} onSave={v=>upd('mrr',Number(v)||null)}/>
                <Field label="Date sent" value={client.proposal_sent_date} type="date" onSave={v=>upd('proposal_sent_date',v)}/>
                <Field label="Follow-up date" value={client.proposal_follow_up_date} type="date" onSave={v=>upd('proposal_follow_up_date',v)}/>
                <Field label="Proposal notes" value={client.proposal_notes} type="textarea" onSave={v=>upd('proposal_notes',v)}/>
              </div>
            </div>

            {/* Suggested next actions */}
            <div className="card">
              <div className="card-head"><div className="card-title">What to do next</div><span style={{fontSize:'.72rem',color:'var(--muted)'}}>Click to add as task →</span></div>
              <div className="card-body" style={{padding:'.25rem 1rem'}}>
                {['Send proposal','Follow up in 2 days','Call to walk through proposal','Send a case study or testimonial','Send payment details','Adjust and revise proposal','Convert to onboarding'].map(action=>(
                  <div key={action}
                    onClick={async()=>{const t=await createTask({client_id:id,name:action,status:'Now'});setTasks(p=>[...p,t]);setTaskFilter('To Do Now');setSelectedTask(t.id);setTab('tasks')}}
                    style={{display:'flex',alignItems:'center',gap:'.875rem',padding:'.75rem .25rem',borderBottom:'.5px solid var(--border)',cursor:'pointer',transition:'background .1s',borderRadius:'6px'}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{width:26,height:26,borderRadius:'7px',background:'var(--bg)',border:'.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.8rem',flexShrink:0,color:'var(--muted)'}}>+</div>
                    <span style={{fontSize:'.9rem',color:'var(--dark)'}}>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ONBOARDING ── */}
        {tab==='onboarding'&&(()=>{
          const pct = ONBOARDING_ITEMS.length > 0 ? Math.round((doneOnboarding.length/ONBOARDING_ITEMS.length)*100) : 0
          return (
            <div style={{maxWidth:700}}>
              {/* Progress hero */}
              <div style={{background:'var(--dark)',borderRadius:'16px',padding:'1.75rem',marginBottom:'1.5rem',color:'#fff'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                  <div>
                    <div style={{fontFamily:'Cormorant Garamond,Georgia,serif',fontSize:'1.5rem',fontWeight:300,marginBottom:'.2rem'}}>Onboarding Progress</div>
                    <div style={{fontSize:'.9rem',color:'rgba(255,255,255,.5)'}}>{doneOnboarding.length} of {ONBOARDING_ITEMS.length} steps completed</div>
                  </div>
                  <div style={{fontFamily:'Cormorant Garamond,Georgia,serif',fontSize:'3rem',fontWeight:300,color:pct===100?'#4A8A60':'#9FBBD0',lineHeight:1}}>{pct}%</div>
                </div>
                <div style={{height:8,background:'rgba(255,255,255,.1)',borderRadius:'4px',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:'4px',background:pct===100?'#4A8A60':'var(--mist-blue)',width:`${pct}%`,transition:'width .4s ease'}}/>
                </div>
                {pct===100&&<div style={{marginTop:'.875rem',fontSize:'.88rem',color:'#4A8A60',fontWeight:600}}>All done — {client.name?.split(' ')[0]} is ready to go! 🎉</div>}
              </div>

              {/* Checklist */}
              <div className="card">
                <div className="card-head"><div className="card-title">Onboarding checklist</div></div>
                <div style={{padding:'0 1rem'}}>
                  {ONBOARDING_ITEMS.map(item=>{
                    const done=doneOnboarding.includes(item)
                    return (
                      <div key={item} onClick={()=>toggleOnboarding(item)}
                        style={{display:'flex',alignItems:'center',gap:'.875rem',padding:'.875rem .25rem',borderBottom:'.5px solid var(--border)',cursor:'pointer',borderRadius:'6px',transition:'background .1s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                      >
                        <div style={{width:26,height:26,borderRadius:'7px',border:`2px solid ${done?'var(--teal)':'var(--border)'}`,background:done?'var(--teal)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .14s'}}>
                          {done&&<span style={{color:'#fff',fontSize:'.8rem',fontWeight:700,lineHeight:1}}>✓</span>}
                        </div>
                        <span style={{fontSize:'.95rem',color:done?'var(--muted)':'var(--dark)',textDecoration:done?'line-through':'none',transition:'all .14s'}}>{item}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── HOME (Active Client Hub) ── */}
        {tab==='home'&&(()=>{
          const done = tasks.filter(t=>t.status==='Done')
          const total = tasks.length
          let score = 0
          if (total > 0) score += Math.round((done.length/total)*40)
          if (client.current_focus) score += 20
          if (client.next_milestone) score += 20
          if (client.mrr) score += 20
          score = Math.min(score, 100)
          const scoreColor = score>=70?'#4A8A60':score>=40?'var(--amber)':'var(--red)'
          const circumference = 2 * Math.PI * 40
          const suggs = (() => { try { return JSON.parse(client.suggestions||'[]') } catch(e) { return [] } })()
          const pendingSuggs = suggs.filter(s=>s.status==='Pending'||!s.status)
          return (
            <div>
              {/* Row 1: Health | Suggestions | Email Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'190px 1fr 1fr', gap:'1rem', marginBottom:'1rem', alignItems:'stretch' }}>
                {/* Health Score */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.5rem 1.25rem', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'1rem' }}>Health Score</div>
                  <div style={{ position:'relative', width:100, height:100, margin:'0 auto .875rem' }}>
                    <svg viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)', width:'100%', height:'100%' }}>
                      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border)" strokeWidth="8"/>
                      <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="8" strokeDasharray={`${(score/100)*circumference} ${circumference}`} strokeLinecap="round"/>
                    </svg>
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                      <div style={{ fontSize:'1.6rem', fontWeight:700, color:'var(--dark)', lineHeight:1 }}>{score}</div>
                      <div style={{ fontSize:'.5rem', color:'var(--muted)', letterSpacing:'.12em', textTransform:'uppercase' }}>health</div>
                    </div>
                  </div>
                  <div style={{ fontSize:'.75rem', color:scoreColor, fontWeight:600 }}>{score>=70?'Thriving':score>=40?'On track':'Needs attention'}</div>
                </div>

                {/* Suggestions Preview */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.875rem' }}>
                    <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600 }}>Suggestions</div>
                    <button onClick={()=>setTab('suggestions')} style={{ fontSize:'.68rem', color:'var(--mist-blue)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}>View all →</button>
                  </div>
                  {pendingSuggs.length===0 ? (
                    <div style={{ padding:'1.5rem 0', textAlign:'center', color:'var(--muted)', fontSize:'.82rem' }}>No pending suggestions</div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                      {pendingSuggs.slice(0,3).map((s,i)=>{
                        const priCol = s.priority==='High'?'var(--amber)':s.priority==='Medium'?'var(--mist-blue)':'var(--muted)'
                        return (
                          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', padding:'.5rem .625rem', background:'#fff', borderRadius:'8px', border:'.5px solid var(--border)' }}>
                            <span style={{ fontSize:'.55rem', padding:'.18rem .4rem', borderRadius:'4px', background:`${priCol}18`, color:priCol, fontWeight:600, flexShrink:0, marginTop:'.12rem' }}>{s.priority}</span>
                            <span style={{ fontSize:'.82rem', color:'var(--dark)', lineHeight:1.4 }}>{s.title}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <button onClick={()=>{setShowAddSuggestion(true);setTab('suggestions')}} style={{ marginTop:'.75rem', width:'100%', background:'none', border:'1.5px dashed var(--border)', borderRadius:'8px', padding:'.4rem', fontSize:'.72rem', color:'var(--muted)', cursor:'pointer', fontFamily:'inherit' }}>+ Add suggestion</button>
                </div>

                {/* Email Stats */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.25rem' }}>
                  <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.875rem' }}>Email Activity</div>
                  <div style={{ display:'flex', gap:'1.5rem', marginBottom:'1rem' }}>
                    <div>
                      <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'2.2rem', color:'var(--dark)', lineHeight:1 }}>{emails.length}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--muted)', marginTop:'.2rem' }}>Emails logged</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'2.2rem', color:'var(--mist-blue)', lineHeight:1 }}>{client.report_email_opens||'—'}{client.report_email_opens?'%':''}</div>
                      <div style={{ fontSize:'.68rem', color:'var(--muted)', marginTop:'.2rem' }}>Open rate</div>
                    </div>
                  </div>
                  <button onClick={()=>setTab('email')} style={{ display:'block', fontSize:'.72rem', color:'var(--mist-blue)', background:'none', border:'.5px solid var(--mist-blue)', borderRadius:'6px', cursor:'pointer', padding:'.35rem .75rem', fontFamily:'inherit' }}>View email board →</button>
                </div>
              </div>

              {/* Row 2: Current Focus | This Month | Quick Access */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                {/* Current Focus */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.25rem' }}>
                  <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.75rem' }}>Current Focus</div>
                  <textarea
                    style={{ border:'none', background:'transparent', padding:0, minHeight:90, fontSize:'.9rem', fontFamily:'inherit', color:'var(--dark)', resize:'none', lineHeight:1.65, width:'100%', outline:'none' }}
                    placeholder="What's the main focus this month?"
                    value={client.current_focus||''}
                    onChange={e=>setClient(c=>({...c,current_focus:e.target.value}))}
                    onBlur={e=>upd('current_focus',e.target.value)}
                  />
                </div>

                {/* This Month at a Glance */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.25rem' }}>
                  <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.75rem' }}>This Month</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'.1rem' }}>
                    {[
                      { label:'Tasks for today', count:tasks.filter(t=>t.status==='Today').length, color:'#2E6080', filter:'To Do Now' },
                      { label:'Up next', count:tasks.filter(t=>t.status==='Now'||t.status==='Soon').length, color:'var(--mist-blue)', filter:'Up Next' },
                      { label:'Waiting on client', count:tasks.filter(t=>t.status==='Waiting').length, color:'var(--amber)', filter:'Waiting' },
                      { label:'Completed', count:tasks.filter(t=>t.status==='Done').length, color:'var(--teal)', filter:'Done' },
                      { label:'Total tasks', count:tasks.length, color:'var(--muted)', filter:'To Do Now' },
                    ].map(item=>(
                      <div key={item.label} onClick={()=>{setTaskFilter(item.filter);setTab('tasks')}} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.4rem 0', borderBottom:'.5px solid var(--border)', cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(0,0,0,.015)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <span style={{ fontSize:'.82rem', color:'var(--muted)' }}>{item.label}</span>
                        <span style={{ fontSize:'1rem', fontWeight:700, color:item.color }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Access */}
                <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'16px', padding:'1.25rem' }}>
                  <div style={{ fontSize:'.52rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.75rem' }}>Quick Access</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.5rem' }}>
                    {[
                      { key:'content', label:'Marketing Hub', icon:'◈' },
                      { key:'deliverables', label:'Deliverables', icon:'▦' },
                      { key:'website', label:'Website Board', icon:'→' },
                      { key:'email', label:'Email Marketing', icon:'✉' },
                      { key:'system', label:'System Building', icon:'◎' },
                      { key:'reporting', label:'Reporting', icon:'◌' },
                    ].map(l=>(
                      <div key={l.key} onClick={()=>setTab(l.key)} style={{ display:'flex', alignItems:'center', gap:'.4rem', padding:'.5rem .625rem', background:'#fff', border:'.5px solid var(--border)', borderRadius:'8px', cursor:'pointer', transition:'all .12s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--mist-blue)'}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
                        <span style={{ color:'var(--mist-blue)', fontSize:'.85rem', lineHeight:1 }}>{l.icon}</span>
                        <span style={{ fontSize:'.72rem', fontWeight:500, color:'var(--dark)', lineHeight:1.3 }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly rhythm banner */}
              <div style={{ background:'var(--dark)', borderRadius:'12px', padding:'.875rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', overflowX:'auto' }}>
                <div style={{ fontSize:'.58rem', letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.35)', fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>Monthly Rhythm</div>
                {['Plan','Build','Review','Approve','Deliver','Report','Improve'].map((phase,i)=>(
                  <React.Fragment key={phase}>
                    {i>0&&<div style={{ color:'rgba(255,255,255,.2)', fontSize:'.8rem', flexShrink:0 }}>→</div>}
                    <div style={{ background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'.4rem .875rem', fontSize:'.75rem', color:'rgba(255,255,255,.7)', fontWeight:500, whiteSpace:'nowrap', flexShrink:0 }}>{phase}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── PACKAGE ── */}
        {tab==='package'&&(
          <div style={{ maxWidth:800 }}>
            <div style={{ marginBottom:'1.75rem' }}>
              <div style={{ fontSize:'.65rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.875rem' }}>Current Package</div>
              <div style={{ display:'flex', gap:'.875rem', flexWrap:'wrap' }}>
                {['Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara','Alumni'].map(s=>{
                  const active = client.stage===s || client.recommended_package===s
                  return (
                    <div key={s} onClick={()=>upd('recommended_package',s)} style={{ padding:'.875rem 1.25rem', borderRadius:'14px', border:`1.5px solid ${active?'var(--mist-blue)':'var(--border)'}`, background:active?'var(--pale-cloud)':'var(--warm)', cursor:'pointer', transition:'all .12s' }}>
                      <div style={{ fontSize:'.88rem', fontWeight:700, color:active?'#2E6080':'var(--dark)', marginBottom:'.2rem' }}>{s}</div>
                      {active&&<div style={{ fontSize:'.58rem', color:'var(--mist-blue)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em' }}>Active</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
              <div className="card">
                <div className="card-head"><div className="card-title">Package Inclusions</div></div>
                <div className="card-body">
                  <textarea className="form-textarea" style={{ minHeight:180 }} placeholder={'List what\'s included in this package…\ne.g. 8 social posts/month\n1 email campaign\nMonthly strategy call'} value={client.package_inclusions||''} onChange={e=>setClient(c=>({...c,package_inclusions:e.target.value}))} onBlur={e=>upd('package_inclusions',e.target.value)}/>
                </div>
              </div>
              <div>
                <div className="card" style={{ marginBottom:'1rem' }}>
                  <div className="card-head"><div className="card-title">Investment</div></div>
                  <div className="card-body" style={{ padding:'.5rem 1rem' }}>
                    <Field label="Monthly Retainer" value={client.mrr?.toString()} onSave={v=>upd('mrr',Number(v)||null)}/>
                    <Field label="Total Investment" value={client.total_investment?.toString()} onSave={v=>upd('total_investment',parseFloat(v)||0)}/>
                    <Field label="Client Since" value={client.client_since} type="date" onSave={v=>upd('client_since',v)}/>
                    <Field label="Total Projects" value={client.total_projects?.toString()} onSave={v=>upd('total_projects',parseInt(v)||0)}/>
                  </div>
                </div>
                <div className="card">
                  <div className="card-head"><div className="card-title">Next Milestone</div></div>
                  <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                    <textarea className="form-textarea" style={{ minHeight:56 }} placeholder="The next big delivery or win…" value={client.next_milestone||''} onChange={e=>setClient(c=>({...c,next_milestone:e.target.value}))} onBlur={e=>upd('next_milestone',e.target.value)}/>
                    <input type="date" className="form-input" value={client.next_milestone_date||''} onChange={e=>upd('next_milestone_date',e.target.value)}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT HUB ── */}
        {tab==='content'&&(()=>{
          const COLS = [
            { label:'Ideas', statuses:['Ideas'], color:'var(--muted)', nextStatus:'Writing / Drafting' },
            { label:'In Progress', statuses:['Strategy Approved','Writing / Drafting','Design / Editing'], color:'var(--mist-blue)', nextStatus:'Internal Review' },
            { label:'In Review', statuses:['Internal Review','Ready for Client Review','Sent to Client','Client Feedback Received'], color:'var(--amber)', nextStatus:'Approved' },
            { label:'Approved', statuses:['Approved','Scheduled'], color:'#4A8A60', nextStatus:'Posted / Sent / Live' },
            { label:'Published', statuses:['Posted / Sent / Live','Reported'], color:'var(--teal)', nextStatus:null },
          ]
          const TYPE_COLORS = { 'Reel':'#E8B4C8', 'Carousel':'#9FBBD0', 'Static Post':'#A8C5A0', 'Story':'#F4C97B', 'Video':'#B4A8D8', 'Email':'#F4A87C', 'Blog Post':'#A8C5C0' }

          const moveForward = async (item, colIdx) => {
            const nextStatus = COLS[colIdx].nextStatus
            if (!nextStatus) return
            const updated = await updateContentItem(item.id, { status: nextStatus })
            setContentItems(p => p.map(i => i.id===item.id ? updated : i))
          }
          const moveBack = async (item, colIdx) => {
            const prevStatus = COLS[colIdx-1]?.statuses[0]
            if (!prevStatus) return
            const updated = await updateContentItem(item.id, { status: prevStatus })
            setContentItems(p => p.map(i => i.id===item.id ? updated : i))
          }
          const removeItem = async (item) => {
            await deleteContentItem(item.id)
            setContentItems(p => p.filter(i => i.id!==item.id))
          }
          const addItem = async () => {
            if (!newContentForm.title.trim()) return
            const created = await createContentItem({ ...newContentForm, client_id:id, due_date:newContentForm.due_date||null })
            setContentItems(p => [...p, created])
            setShowAddContent(false)
            setNewContentForm({ title:'', status:'Ideas', platform:'', content_type:'', priority:'Medium', due_date:'' })
          }

          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>Marketing Hub</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>Track content ideas, drafts, and published pieces for {client.name?.split(' ')[0]}. Also visible on the global Content Board.</div>
                </div>
                <button className="btn btn-primary" onClick={()=>setShowAddContent(v=>!v)}>+ Add Content</button>
              </div>

              {showAddContent&&(
                <div className="card" style={{ marginBottom:'1.25rem', border:'1.5px solid var(--mist-blue)' }}>
                  <div className="card-head"><div className="card-title">New Content Piece</div></div>
                  <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                    <input className="form-input" placeholder="Content title or idea…" value={newContentForm.title} onChange={e=>setNewContentForm(f=>({...f,title:e.target.value}))} autoFocus/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'.75rem' }}>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Start in</div>
                        <select className="form-select" value={newContentForm.status} onChange={e=>setNewContentForm(f=>({...f,status:e.target.value}))}>
                          {CONTENT_STATUSES.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Type</div>
                        <select className="form-select" value={newContentForm.content_type} onChange={e=>setNewContentForm(f=>({...f,content_type:e.target.value}))}>
                          <option value="">—</option>
                          {CONTENT_TYPES.map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Platform</div>
                        <select className="form-select" value={newContentForm.platform} onChange={e=>setNewContentForm(f=>({...f,platform:e.target.value}))}>
                          <option value="">—</option>
                          {CONTENT_PLATFORMS.map(p=><option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Due Date</div>
                        <input type="date" className="form-input" value={newContentForm.due_date} onChange={e=>setNewContentForm(f=>({...f,due_date:e.target.value}))}/>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setShowAddContent(false);setNewContentForm({title:'',status:'Ideas',platform:'',content_type:'',priority:'Medium',due_date:''})}}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={addItem} disabled={!newContentForm.title.trim()}>Add</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'.875rem' }}>
                {COLS.map((col,ci)=>{
                  const colItems = contentItems.filter(i=>col.statuses.includes(i.status))
                  return (
                    <div key={col.label}>
                      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:col.color, flexShrink:0 }}/>
                        <span style={{ fontSize:'.62rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600 }}>{col.label}</span>
                        <span style={{ fontSize:'.65rem', color:'var(--muted)', marginLeft:'auto' }}>{colItems.length}</span>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'.5rem' }}>
                        {colItems.map(item=>{
                          const typeColor = TYPE_COLORS[item.content_type]||'var(--border)'
                          return (
                            <div key={item.id} style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
                              <div style={{ height:4, background:typeColor }}/>
                              <div style={{ padding:'.75rem .75rem .5rem' }}>
                                <div style={{ fontSize:'.85rem', fontWeight:600, color:'var(--dark)', lineHeight:1.35, marginBottom:'.4rem' }}>{item.title}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:'.3rem', flexWrap:'wrap' }}>
                                  {item.content_type&&<span style={{ fontSize:'.6rem', padding:'.15rem .4rem', borderRadius:'4px', background:`${typeColor}30`, color:typeColor==='var(--border)'?'var(--muted)':typeColor, fontWeight:600 }}>{item.content_type}</span>}
                                  {item.platform&&<span style={{ fontSize:'.6rem', padding:'.15rem .35rem', borderRadius:'4px', background:'var(--bg)', border:'.5px solid var(--border)', color:'var(--muted)' }}>{item.platform}</span>}
                                  {item.priority==='High'&&<span style={{ fontSize:'.6rem', color:'var(--red)', fontWeight:700 }}>!</span>}
                                </div>
                                {item.due_date&&<div style={{ fontSize:'.68rem', color:'var(--muted)', marginTop:'.3rem' }}>📅 {new Date(item.due_date).toLocaleDateString('en-NZ',{day:'numeric',month:'short'})}</div>}
                              </div>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.35rem .5rem', borderTop:'.5px solid var(--border)' }}>
                                <button onClick={()=>moveBack(item,ci)} disabled={ci===0} style={{ background:'none', border:'none', cursor:ci===0?'default':'pointer', color:ci===0?'var(--border)':'var(--muted)', fontSize:'.72rem', padding:'.1rem .3rem', fontFamily:'inherit' }}>← Back</button>
                                <button onClick={()=>removeItem(item)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'.65rem', padding:'.1rem .3rem', fontFamily:'inherit', opacity:.5 }}>✕</button>
                                <button onClick={()=>moveForward(item,ci)} disabled={!col.nextStatus} style={{ background:'none', border:'none', cursor:col.nextStatus?'pointer':'default', color:col.nextStatus?'var(--mist-blue)':'var(--border)', fontSize:'.72rem', padding:'.1rem .3rem', fontFamily:'inherit', fontWeight:600 }}>Move →</button>
                              </div>
                            </div>
                          )
                        })}
                        {colItems.length===0&&(
                          <div style={{ textAlign:'center', padding:'1.25rem .5rem', color:'var(--border)', fontSize:'.75rem', border:'1.5px dashed var(--border)', borderRadius:'8px' }}>Empty</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── DELIVERABLES ── */}
        {tab==='deliverables'&&(()=>{
          const delivs = (() => { try { return JSON.parse(client.monthly_deliverables||'[]') } catch(e) { return [] } })()
          const saveDelivs = arr => upd('monthly_deliverables', JSON.stringify(arr))
          return (
            <div style={{ maxWidth:760 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>Monthly Deliverables</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>What gets delivered each month of the engagement.</div>
                </div>
                <button className="btn btn-primary" onClick={()=>saveDelivs([...delivs,{month:`Month ${delivs.length+1}`,focus:'',deliverables:[]}])}>+ Add Month</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'.625rem' }}>
                {delivs.length===0&&(
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontSize:'.9rem', background:'var(--warm)', borderRadius:'14px', border:'1.5px dashed var(--border)' }}>
                    No months added yet. Click "+ Add Month" to map out what gets delivered.
                  </div>
                )}
                {delivs.map((month,mi)=>{
                  const isOpen = expandedMonth === mi
                  return (
                    <div key={mi} style={{ background:'var(--warm)', border:`.5px solid ${isOpen?'var(--mist-blue)':'var(--border)'}`, borderRadius:'14px', overflow:'hidden', transition:'border-color .12s' }}>
                      <div onClick={()=>setExpandedMonth(isOpen?null:mi)} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', cursor:'pointer' }}>
                        <div style={{ width:36, height:36, borderRadius:'10px', background:isOpen?'var(--pale-cloud)':'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.82rem', fontWeight:700, color:isOpen?'#2E6080':'var(--muted)', flexShrink:0 }}>{mi+1}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, color:'var(--dark)', fontSize:'.95rem' }}>{month.month}</div>
                          {month.focus&&<div style={{ fontSize:'.78rem', color:'var(--muted)', marginTop:'.1rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{month.focus}</div>}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'.75rem', flexShrink:0 }}>
                          <span style={{ fontSize:'.72rem', background:'var(--pale-cloud)', color:'#2E6080', borderRadius:'999px', padding:'.18rem .55rem', fontWeight:600 }}>{(month.deliverables||[]).length}</span>
                          <span style={{ color:'var(--muted)', fontSize:'.85rem', lineHeight:1 }}>{isOpen?'▲':'▼'}</span>
                        </div>
                      </div>
                      {isOpen&&(
                        <div style={{ borderTop:'.5px solid var(--border)', padding:'1rem 1.25rem', background:'#FAFCFE' }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'.875rem' }}>
                            <div>
                              <div style={{ fontSize:'.6rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.35rem' }}>Month Name</div>
                              <input className="form-input" value={month.month} onChange={e=>{const arr=[...delivs];arr[mi]={...arr[mi],month:e.target.value};saveDelivs(arr)}}/>
                            </div>
                            <div>
                              <div style={{ fontSize:'.6rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.35rem' }}>Focus Theme</div>
                              <input className="form-input" value={month.focus||''} placeholder="This month's theme…" onChange={e=>{const arr=[...delivs];arr[mi]={...arr[mi],focus:e.target.value};saveDelivs(arr)}}/>
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize:'.6rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.5rem' }}>Deliverables</div>
                            {(month.deliverables||[]).map((d,di)=>(
                              <div key={di} style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.4rem' }}>
                                <span style={{ color:'var(--mist-blue)', fontSize:'.8rem', flexShrink:0 }}>▸</span>
                                <input className="form-input" style={{ flex:1 }} value={d} onChange={e=>{const arr=[...delivs];arr[mi]={...arr[mi],deliverables:arr[mi].deliverables.map((x,xi)=>xi===di?e.target.value:x)};saveDelivs(arr)}}/>
                                <button onClick={()=>{const arr=[...delivs];arr[mi]={...arr[mi],deliverables:arr[mi].deliverables.filter((_,xi)=>xi!==di)};saveDelivs(arr)}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'.85rem',padding:'.2rem .3rem',lineHeight:1,flexShrink:0 }}>✕</button>
                              </div>
                            ))}
                            <button onClick={()=>{const arr=[...delivs];arr[mi]={...arr[mi],deliverables:[...(arr[mi].deliverables||[]),'']};saveDelivs(arr)}} style={{ background:'none',border:'1.5px dashed var(--border)',borderRadius:'8px',padding:'.4rem .875rem',fontSize:'.82rem',color:'var(--muted)',cursor:'pointer',width:'100%',marginTop:'.35rem',fontFamily:'inherit' }}>+ Add deliverable</button>
                          </div>
                          <div style={{ marginTop:'1rem', paddingTop:'.75rem', borderTop:'.5px solid var(--border)', display:'flex', justifyContent:'flex-end' }}>
                            <button onClick={()=>{const arr=delivs.filter((_,xi)=>xi!==mi);saveDelivs(arr);setExpandedMonth(null)}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--red)',fontSize:'.78rem',padding:0 }}>Remove this month</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── WEBSITE BOARD ── */}
        {tab==='website'&&(()=>{
          const WEB_SUBTABS = ['Tasks','Pages','Copy Updates']
          const cols = [
            { label:'Not Started', statuses:['Now','Soon'], color:'var(--warm-greige)' },
            { label:'In Progress', statuses:['Today'], color:'var(--mist-blue)' },
            { label:'In Review', statuses:['Waiting'], color:'var(--amber)' },
            { label:'Done', statuses:['Done'], color:'var(--teal)' },
          ]
          const webTasks = tasks.filter(t=>(t.name||'').toLowerCase().includes('website')||(t.name||'').toLowerCase().includes('[web]'))
          const pageTasks = tasks.filter(t=>(t.name||'').toLowerCase().includes('[page]')||(t.name||'').toLowerCase().includes(' page '))
          const copyTasks = tasks.filter(t=>(t.name||'').toLowerCase().includes('[copy]')||(t.name||'').toLowerCase().includes('copy update'))

          const renderTable = (taskList, emptyMsg) => taskList.length===0 ? (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontSize:'.9rem', background:'var(--warm)', borderRadius:'14px', border:'1.5px dashed var(--border)' }}>{emptyMsg}</div>
          ) : (
            <div className="card">
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:'.5px solid var(--border)' }}>
                    {['Task','Status','Due Date',''].map(h=>(
                      <th key={h} style={{ padding:'.625rem 1rem', textAlign:'left', fontSize:'.58rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {taskList.map(task=>{
                    const due = dueBadge(task.due_date)
                    const col = cols.find(c=>c.statuses.includes(task.status))||cols[0]
                    return (
                      <tr key={task.id} onClick={()=>{setSelectedTask(task.id);setTab('tasks')}} style={{ borderBottom:'.5px solid var(--border)', cursor:'pointer' }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'.625rem 1rem' }}>
                          <div style={{ fontWeight:500, fontSize:'.85rem', color:'var(--dark)' }}>{(task.name||'').replace(/\[(web(site)?|page|copy)\]/gi,'').trim()}</div>
                          {task.discussion_point&&<div style={{ fontSize:'.72rem', color:'var(--muted)', marginTop:'.1rem' }}>{task.discussion_point}</div>}
                        </td>
                        <td style={{ padding:'.625rem 1rem' }}>
                          <span style={{ fontSize:'.65rem', padding:'.2rem .5rem', borderRadius:'999px', background:`${col.color}22`, color:col.color, fontWeight:600, border:`.5px solid ${col.color}44` }}>{col.label}</span>
                        </td>
                        <td style={{ padding:'.625rem 1rem', fontSize:'.78rem', color:due?due.color:'var(--muted)', fontWeight:due?.bold?600:400 }}>{due?due.text:'—'}</td>
                        <td style={{ padding:'.625rem 1rem', color:'var(--muted)', fontSize:'1rem' }}>›</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )

          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>Website Board</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>Track website tasks, pages, and copy updates for {client.name?.split(' ')[0]}.</div>
                </div>
                <button className="btn btn-primary" onClick={async()=>{const t=await createTask({client_id:id,name:'[Website] ',status:'Now'});setTasks(p=>[...p,t]);setSelectedTask(t.id);setTab('tasks')}}>+ Add Website Task</button>
              </div>

              {/* Sub-tabs */}
              <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.25rem' }}>
                {WEB_SUBTABS.map(st=>(
                  <button key={st} onClick={()=>setWebsiteSubTab(st)} style={{ padding:'.38rem .875rem', borderRadius:'999px', fontSize:'.78rem', cursor:'pointer', fontFamily:'inherit', fontWeight:websiteSubTab===st?600:400, border:`1.5px solid ${websiteSubTab===st?'var(--mist-blue)':'var(--border)'}`, background:websiteSubTab===st?'var(--pale-cloud)':'transparent', color:websiteSubTab===st?'#2E6080':'var(--muted)', transition:'all .12s' }}>{st}</button>
                ))}
              </div>

              {websiteSubTab==='Tasks'&&(
                webTasks.length===0 ? (
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontSize:'.9rem', background:'var(--warm)', borderRadius:'14px', border:'1.5px dashed var(--border)' }}>
                    No website tasks yet. Tasks with "website" or "[web]" in the name appear here.
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
                    {cols.map(col=>(
                      <div key={col.label}>
                        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.75rem' }}>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:col.color, flexShrink:0 }}/>
                          <span style={{ fontSize:'.62rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600 }}>{col.label}</span>
                          <span style={{ fontSize:'.65rem', color:'var(--muted)', marginLeft:'auto' }}>{webTasks.filter(t=>col.statuses.includes(t.status)).length}</span>
                        </div>
                        {webTasks.filter(t=>col.statuses.includes(t.status)).map(task=>(
                          <div key={task.id} onClick={()=>{setSelectedTask(task.id);setTab('tasks')}} style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'12px', padding:'.875rem', marginBottom:'.5rem', cursor:'pointer', transition:'all .12s' }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--mist-blue)'}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
                            <div style={{ fontSize:'.88rem', fontWeight:600, color:'var(--dark)', lineHeight:1.4, marginBottom:'.35rem' }}>{(task.name||'').replace(/\[web(site)?\]/gi,'').trim()}</div>
                            {task.due_date&&<div style={{ fontSize:'.65rem', color:'var(--muted)' }}>Due {new Date(task.due_date+'T00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short'})}</div>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )
              )}
              {websiteSubTab==='Pages'&&renderTable(pageTasks,'No page tasks yet. Add tasks with "[page]" or "page" in the name.')}
              {websiteSubTab==='Copy Updates'&&renderTable(copyTasks,'No copy update tasks yet. Add tasks with "[copy]" or "copy update" in the name.')}
            </div>
          )
        })()}

        {/* ── SUGGESTIONS ── */}
        {tab==='suggestions'&&(()=>{
          const suggs = (() => { try { return JSON.parse(client.suggestions||'[]') } catch(e) { return [] } })()
          const saveSuggs = arr => upd('suggestions', JSON.stringify(arr))
          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>Suggestions to Improve</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>Growth ideas and recommendations for {client.name?.split(' ')[0]}.</div>
                </div>
                <button className="btn btn-primary" onClick={()=>setShowAddSuggestion(v=>!v)}>+ Add Suggestion</button>
              </div>

              {showAddSuggestion&&(
                <div className="card" style={{ marginBottom:'1.25rem', border:'1.5px solid var(--mist-blue)' }}>
                  <div className="card-head"><div className="card-title">New Suggestion</div></div>
                  <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                    <input className="form-input" placeholder="What to improve or add…" value={newSuggestionForm.title} onChange={e=>setNewSuggestionForm(f=>({...f,title:e.target.value}))}/>
                    <textarea className="form-textarea" style={{ minHeight:60 }} placeholder="Why does this matter for this client?" value={newSuggestionForm.reason} onChange={e=>setNewSuggestionForm(f=>({...f,reason:e.target.value}))}/>
                    <input className="form-input" placeholder="Expected impact or outcome…" value={newSuggestionForm.impact} onChange={e=>setNewSuggestionForm(f=>({...f,impact:e.target.value}))}/>
                    <div>
                      <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Priority</div>
                      <div style={{ display:'flex', gap:'.4rem' }}>
                        {['High','Medium','Low'].map(p=>(
                          <button key={p} onClick={()=>setNewSuggestionForm(f=>({...f,priority:p}))} style={{ padding:'.3rem .875rem', borderRadius:'999px', fontSize:'.82rem', cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${newSuggestionForm.priority===p?'var(--mist-blue)':'var(--border)'}`, background:newSuggestionForm.priority===p?'var(--pale-cloud)':'transparent', color:newSuggestionForm.priority===p?'#2E6080':'var(--muted)', fontWeight:newSuggestionForm.priority===p?700:400 }}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setShowAddSuggestion(false);setNewSuggestionForm({title:'',reason:'',impact:'',priority:'Medium',status:'Pending'})}}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={()=>{if(!newSuggestionForm.title.trim())return;saveSuggs([...suggs,{...newSuggestionForm,id:Date.now()}]);setShowAddSuggestion(false);setNewSuggestionForm({title:'',reason:'',impact:'',priority:'Medium',status:'Pending'})}}>Add</button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', flexDirection:'column', gap:'.875rem' }}>
                {suggs.length===0&&!showAddSuggestion&&(
                  <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontSize:'.9rem', background:'var(--warm)', borderRadius:'14px', border:'1.5px dashed var(--border)' }}>
                    No suggestions yet. Click "+ Add Suggestion" to capture growth ideas.
                  </div>
                )}
                {suggs.map((s,si)=>{
                  const priCol = s.priority==='High'?'var(--amber)':s.priority==='Medium'?'var(--mist-blue)':'var(--muted)'
                  return (
                    <div key={s.id||si} className="card">
                      <div className="card-body">
                        <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:'.95rem', color:'var(--dark)', marginBottom:'.4rem' }}>{s.title}</div>
                            {s.reason&&<div style={{ fontSize:'.82rem', color:'var(--muted)', lineHeight:1.6, marginBottom:'.5rem' }}>{s.reason}</div>}
                            {s.impact&&<div style={{ display:'inline-flex', alignItems:'center', gap:'.35rem', fontSize:'.78rem', color:'var(--dark)', background:'var(--bg)', borderRadius:'6px', padding:'.3rem .625rem' }}>
                              <span style={{ color:'var(--mist-blue)', fontWeight:700 }}>↑</span>{s.impact}
                            </div>}
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.5rem', flexShrink:0 }}>
                            <span style={{ fontSize:'.65rem', padding:'.2rem .55rem', borderRadius:'999px', background:`${priCol}18`, color:priCol, fontWeight:600, border:`.5px solid ${priCol}44` }}>{s.priority}</span>
                            <div style={{ display:'flex', gap:'.3rem' }}>
                              {['Pending','In Progress','Done'].map(st=>{
                                const stActive = s.status===st
                                const stBg = st==='Done'?'var(--teal)':st==='In Progress'?'var(--mist-blue)':'var(--warm-greige)'
                                return (
                                  <button key={st} onClick={()=>{const arr=[...suggs];arr[si]={...arr[si],status:st};saveSuggs(arr)}} style={{ padding:'.2rem .5rem', borderRadius:'999px', fontSize:'.6rem', cursor:'pointer', fontFamily:'inherit', background:stActive?stBg:'transparent', color:stActive?(st==='Pending'?'var(--dark)':'#fff'):'var(--muted)', border:`.5px solid ${stActive?stBg:'var(--border)'}`, fontWeight:stActive?600:400 }}>{st}</button>
                                )
                              })}
                            </div>
                            <button onClick={()=>saveSuggs(suggs.filter((_,xi)=>xi!==si))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:'.68rem',padding:0,textDecoration:'underline' }}>Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── EMAIL MARKETING ── */}
        {tab==='email'&&(()=>{
          const campaigns = (() => { try { return JSON.parse(client.email_campaigns||'[]') } catch(e) { return [] } })()
          const saveCampaigns = arr => upd('email_campaigns', JSON.stringify(arr))
          const sentCampaigns = campaigns.filter(c=>c.status==='Sent')
          const avgOpen = sentCampaigns.filter(c=>c.opens).length > 0
            ? Math.round(sentCampaigns.filter(c=>c.opens).reduce((s,c)=>s+(parseFloat(c.opens)||0),0)/sentCampaigns.filter(c=>c.opens).length)
            : null
          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>Email Marketing</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>Campaigns, stats, and send history for {client.name?.split(' ')[0]}.</div>
                </div>
                <button className="btn btn-primary" onClick={()=>setShowAddCampaign(v=>!v)}>+ Log Campaign</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.875rem', marginBottom:'1.25rem' }}>
                {[
                  { label:'Total campaigns', value:campaigns.length },
                  { label:'Campaigns sent', value:sentCampaigns.length },
                  { label:'Avg open rate', value:avgOpen!==null?avgOpen:client.report_email_opens||'—', suffix:(avgOpen!==null||client.report_email_opens)?'%':'' },
                  { label:'Emails logged', value:emails.length },
                ].map(m=>(
                  <div key={m.label} style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'14px', padding:'1.125rem' }}>
                    <div style={{ fontSize:'.58rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.5rem' }}>{m.label}</div>
                    <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'2rem', color:'var(--dark)', lineHeight:1 }}>{m.value}{m.suffix||''}</div>
                  </div>
                ))}
              </div>

              {showAddCampaign&&(
                <div className="card" style={{ marginBottom:'1.25rem', border:'1.5px solid var(--mist-blue)' }}>
                  <div className="card-head"><div className="card-title">Log Campaign</div></div>
                  <div className="card-body" style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                    <input className="form-input" placeholder="Subject line…" value={newCampaignForm.subject} onChange={e=>setNewCampaignForm(f=>({...f,subject:e.target.value}))}/>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'.75rem' }}>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Date Sent</div>
                        <input type="date" className="form-input" value={newCampaignForm.sent_date} onChange={e=>setNewCampaignForm(f=>({...f,sent_date:e.target.value}))}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Open Rate %</div>
                        <input type="number" className="form-input" placeholder="e.g. 42" value={newCampaignForm.opens} onChange={e=>setNewCampaignForm(f=>({...f,opens:e.target.value}))}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Click Rate %</div>
                        <input type="number" className="form-input" placeholder="e.g. 8" value={newCampaignForm.clicks} onChange={e=>setNewCampaignForm(f=>({...f,clicks:e.target.value}))}/>
                      </div>
                      <div>
                        <div style={{ fontSize:'.6rem', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.4rem' }}>Status</div>
                        <select className="form-select" value={newCampaignForm.status} onChange={e=>setNewCampaignForm(f=>({...f,status:e.target.value}))}>
                          {['Draft','Scheduled','Sent'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', gap:'.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setShowAddCampaign(false);setNewCampaignForm({subject:'',sent_date:'',opens:'',clicks:'',status:'Draft'})}}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={()=>{if(!newCampaignForm.subject.trim())return;saveCampaigns([...campaigns,{...newCampaignForm,id:Date.now()}]);setShowAddCampaign(false);setNewCampaignForm({subject:'',sent_date:'',opens:'',clicks:'',status:'Draft'})}}>Save</button>
                    </div>
                  </div>
                </div>
              )}

              {campaigns.length===0&&!showAddCampaign ? (
                <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontSize:'.9rem', background:'var(--warm)', borderRadius:'14px', border:'1.5px dashed var(--border)' }}>
                  No campaigns logged yet. Click "+ Log Campaign" to track email sends.
                </div>
              ) : campaigns.length > 0 && (
                <div className="card">
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom:'.5px solid var(--border)' }}>
                        {['Subject','Date Sent','Open Rate','Click Rate','Status',''].map(h=>(
                          <th key={h} style={{ padding:'.625rem 1rem', textAlign:'left', fontSize:'.58rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...campaigns].reverse().map((c,i)=>(
                        <tr key={c.id||i} style={{ borderBottom:'.5px solid var(--border)' }}>
                          <td style={{ padding:'.625rem 1rem', fontSize:'.85rem', fontWeight:500, color:'var(--dark)' }}>{c.subject}</td>
                          <td style={{ padding:'.625rem 1rem', fontSize:'.78rem', color:'var(--muted)' }}>{c.sent_date?new Date(c.sent_date+'T00:00').toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'}):'—'}</td>
                          <td style={{ padding:'.625rem 1rem', fontSize:'.82rem', fontWeight:c.opens?600:400, color:c.opens?'var(--dark)':'var(--muted)' }}>{c.opens?`${c.opens}%`:'—'}</td>
                          <td style={{ padding:'.625rem 1rem', fontSize:'.82rem', fontWeight:c.clicks?600:400, color:c.clicks?'var(--dark)':'var(--muted)' }}>{c.clicks?`${c.clicks}%`:'—'}</td>
                          <td style={{ padding:'.625rem 1rem' }}>
                            <span style={{ fontSize:'.65rem', padding:'.2rem .5rem', borderRadius:'999px', background:c.status==='Sent'?'rgba(74,138,96,.1)':c.status==='Scheduled'?'var(--gold-bg)':'var(--warm)', color:c.status==='Sent'?'var(--teal)':c.status==='Scheduled'?'var(--amber)':'var(--muted)', fontWeight:600 }}>{c.status}</span>
                          </td>
                          <td style={{ padding:'.625rem 1rem' }}>
                            <button onClick={()=>saveCampaigns(campaigns.filter(x=>x.id!==c.id))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'.68rem', padding:0 }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })()}

        {/* ── SYSTEM BUILDING ── */}
        {tab==='system'&&(()=>{
          const DEFAULT_SYSTEM = [
            { id:'funnel', label:'Funnel Setup', desc:'Lead capture pages, thank you pages, and conversion flow', icon:'◈' },
            { id:'crm', label:'CRM Setup', desc:'Client records, pipeline stages, and automation rules', icon:'◎' },
            { id:'email_seq', label:'Email Sequences', desc:'Welcome sequence, nurture series, and follow-up automation', icon:'✉' },
            { id:'templates', label:'Social Templates', desc:'Branded post templates, story frames, and caption banks', icon:'▦' },
            { id:'analytics', label:'Analytics Dashboard', desc:'Reporting setup, tracking, and performance views', icon:'◌' },
            { id:'sops', label:'SOPs & Processes', desc:'Standard operating procedures and team workflows', icon:'→' },
          ]
          const systemRaw = (() => { try { return JSON.parse(client.system_items||'{}') } catch(e) { return {} } })()
          const saveSystem = obj => upd('system_items', JSON.stringify(obj))
          const STATUS_OPTS = ['Not Started','In Progress','Done']
          const statusColors = { 'Not Started':'var(--muted)', 'In Progress':'var(--amber)', 'Done':'var(--teal)' }
          const done = DEFAULT_SYSTEM.filter(i=>(systemRaw[i.id]?.status||'Not Started')==='Done').length
          return (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem' }}>
                <div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400 }}>System Building</div>
                  <div style={{ fontSize:'.85rem', color:'var(--muted)' }}>{done} of {DEFAULT_SYSTEM.length} systems built for {client.name?.split(' ')[0]}.</div>
                </div>
                <div style={{ background:'var(--pale-cloud)', color:'#2E6080', borderRadius:'999px', padding:'.4rem 1rem', fontSize:'.82rem', fontWeight:600 }}>{done}/{DEFAULT_SYSTEM.length} done</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
                {DEFAULT_SYSTEM.map(item=>{
                  const status = systemRaw[item.id]?.status || 'Not Started'
                  const notes = systemRaw[item.id]?.notes || ''
                  const sc = statusColors[status]
                  return (
                    <div key={item.id} style={{ background:'var(--warm)', border:`.5px solid ${status==='Done'?'rgba(74,138,96,.3)':status==='In Progress'?'rgba(229,166,49,.3)':'var(--border)'}`, borderRadius:'16px', padding:'1.25rem', transition:'border-color .15s' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'.75rem' }}>
                        <div style={{ width:36, height:36, borderRadius:'10px', background:'var(--bg)', border:'.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', color:'var(--muted)', flexShrink:0 }}>{item.icon}</div>
                        <span style={{ fontSize:'.63rem', padding:'.2rem .55rem', borderRadius:'999px', background:`${sc}18`, color:sc, fontWeight:600, border:`.5px solid ${sc}44` }}>{status}</span>
                      </div>
                      <div style={{ fontWeight:700, fontSize:'.9rem', color:'var(--dark)', marginBottom:'.3rem' }}>{item.label}</div>
                      <div style={{ fontSize:'.78rem', color:'var(--muted)', lineHeight:1.5, marginBottom:'.875rem' }}>{item.desc}</div>
                      <div style={{ display:'flex', gap:'.3rem', marginBottom:'.625rem' }}>
                        {STATUS_OPTS.map(s=>{
                          const active = status===s
                          const c = statusColors[s]
                          return <button key={s} onClick={()=>saveSystem({...systemRaw,[item.id]:{...systemRaw[item.id],status:s}})} style={{ flex:1, padding:'.25rem', borderRadius:'6px', fontSize:'.62rem', cursor:'pointer', fontFamily:'inherit', border:`1.5px solid ${active?c:'var(--border)'}`, background:active?`${c}18`:'transparent', color:active?c:'var(--muted)', fontWeight:active?600:400, transition:'all .1s', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s}</button>
                        })}
                      </div>
                      <textarea className="form-textarea" style={{ minHeight:48, fontSize:'.75rem', resize:'none' }} placeholder="Notes…" value={notes} onChange={e=>saveSystem({...systemRaw,[item.id]:{...systemRaw[item.id],notes:e.target.value}})}/>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── REPORTING ── */}
        {tab==='reporting'&&(
          <div style={{ maxWidth:800 }}>
            <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'1.6rem', fontWeight:400, marginBottom:'1.5rem' }}>Monthly Reporting & Optimisation</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.875rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Growth %', field:'report_growth_pct', suffix:'%' },
                { label:'New Leads', field:'report_new_leads', suffix:'' },
                { label:'Email Opens', field:'report_email_opens', suffix:'%' },
                { label:'Engagement', field:'report_engagement', suffix:'%' },
              ].map(m=>(
                <div key={m.field} style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'14px', padding:'1.125rem' }}>
                  <div style={{ fontSize:'.58rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:600, marginBottom:'.5rem' }}>{m.label}</div>
                  <div style={{ fontFamily:'Cormorant Garamond,Georgia,serif', fontSize:'2rem', color:'var(--dark)', lineHeight:1, marginBottom:'.5rem' }}>
                    {client[m.field]||'—'}{client[m.field]?m.suffix:''}
                  </div>
                  <input type="number" className="form-input" style={{ fontSize:'.78rem', padding:'.3rem .5rem' }} placeholder="Enter…" value={client[m.field]||''} onChange={e=>setClient(c=>({...c,[m.field]:e.target.value}))} onBlur={e=>upd(m.field,e.target.value||null)}/>
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>
              <div className="card">
                <div className="card-head"><div className="card-title">Top Performance</div></div>
                <div className="card-body">
                  <textarea className="form-textarea" style={{ minHeight:120 }} placeholder="What worked best this month? Top posts, emails, campaigns…" value={client.report_top_performance||''} onChange={e=>setClient(c=>({...c,report_top_performance:e.target.value}))} onBlur={e=>upd('report_top_performance',e.target.value)}/>
                </div>
              </div>
              <div className="card">
                <div className="card-head"><div className="card-title">Recommendations</div></div>
                <div className="card-body">
                  <textarea className="form-textarea" style={{ minHeight:120 }} placeholder="What do we recommend for next month?" value={client.report_recommendations||''} onChange={e=>setClient(c=>({...c,report_recommendations:e.target.value}))} onBlur={e=>upd('report_recommendations',e.target.value)}/>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Next Steps</div></div>
              <div className="card-body">
                <textarea className="form-textarea" style={{ minHeight:80 }} placeholder="Key actions for next month…" value={client.report_next_steps||''} onChange={e=>setClient(c=>({...c,report_next_steps:e.target.value}))} onBlur={e=>upd('report_next_steps',e.target.value)}/>
              </div>
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
