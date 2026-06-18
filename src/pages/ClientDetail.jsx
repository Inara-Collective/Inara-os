import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../App.jsx'
import {
  getClient, updateClient,
  addClientModule, updateClientModule, deleteClientModule,
  createTask, updateTask, deleteTask,
  getClientComments, createClientComment,
  getClientEmails, createClientEmail,
  getUsers,
  PIPELINE_STAGES, SALES_STAGES, HEALTH_OPTIONS, LEAK_STAGES, PACKAGES,
  TASK_STATUSES, TASK_OWNERS, ALL_MODULES, MUST_MODULES,
  ACTION_TAKEN_OPTIONS, NEXT_ACTION_OPTIONS
} from '../lib/supabase.js'

function Field({ label, value, type, options, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const save = () => { onSave(val); setEditing(false) }
  if (!editing) return (
    <div onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'flex-start', gap:'.5rem', padding:'.35rem 0', borderBottom:'.5px solid var(--border)', cursor:'pointer', minHeight:34 }}>
      <span style={{ fontSize:'.56rem', letterSpacing:'.14em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, minWidth:110, paddingTop:'.1rem', flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:'.8rem', color:value?'var(--dark)':'var(--muted)', fontStyle:value?'normal':'italic', flex:1 }}>{value || 'Click to edit'}</span>
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
      <span style={{ fontSize:'.8rem', color:current.length?'var(--dark)':'var(--muted)', fontStyle:current.length?'normal':'italic', flex:1 }}>{current.length ? current.join(', ') : 'Click to edit'}</span>
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

function renderWithMentions(text) {
  return text.split(/(@\S+)/g).map((part, i) =>
    part.startsWith('@')
      ? <mark key={i} style={{ background:'var(--gold-bg)', color:'var(--amber)', borderRadius:'3px', padding:'0 .2rem', fontWeight:500 }}>{part}</mark>
      : part
  )
}

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleString('en-NZ', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

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
  const [convertForm, setConvertForm] = useState({ stage: 'Onboarding', mrr: '', recommended_package: '' })
  const [converting, setConverting] = useState(false)

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

  const upd = async (field, value) => { const u = await updateClient(id, {[field]:value}); setClient(u) }
  const addMod = async (name, priority) => { const m = await addClientModule({client_id:id,module_name:name,priority,status:'Active'}); setModules(p=>[...p,m]); setShowModAdd(false) }
  const togMod = async (m) => { const u = await updateClientModule(m.id,{status:m.status==='Active'?'Paused':'Active'}); setModules(p=>p.map(x=>x.id===m.id?u:x)) }
  const delMod = async (mid) => { await deleteClientModule(mid); setModules(p=>p.filter(m=>m.id!==mid)) }
  const addTsk = async () => { const t = await createTask({client_id:id,name:'New task',status:'To Do'}); setTasks(p=>[...p,t]) }
  const updTsk = async (tid,field,value) => { const u = await updateTask(tid,{[field]:value}); setTasks(p=>p.map(t=>t.id===tid?u:t)) }
  const delTsk = async (tid) => { await deleteTask(tid); setTasks(p=>p.filter(t=>t.id!==tid)) }

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
      const c = await createClientComment({
        client_id: id,
        content: commentText.trim(),
        author_name: profile?.name || profile?.email || 'Me',
        author_id: profile?.id
      })
      setComments(p => [...p, c])
      setCommentText('')
      setMentionSearch(null)
    } catch (e) { console.error(e) }
    setSubmittingComment(false)
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

  const saveEmail = async () => {
    if ((!emailForm.subject.trim() && !emailForm.body.trim()) || savingEmail) return
    setSavingEmail(true)
    try {
      const e = await createClientEmail({ client_id: id, ...emailForm, logged_by: profile?.name || 'Me', sent_at: new Date().toISOString() })
      setEmails(p => [e, ...p])
      setEmailForm({ subject:'', body:'', to_email:'', from_email:'' })
      setShowEmailForm(false)
    } catch (e) { console.error(e) }
    setSavingEmail(false)
  }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>
  if (!client) return <div className="page"><div className="empty"><div className="empty-title">Client not found</div></div></div>

  const TABS = ['overview','modules','tasks','notes','comments','emails']
  const assignOptions = users.map(u => u.name).filter(Boolean)
  const mentionUsers = mentionSearch !== null
    ? users.filter(u => u.name?.toLowerCase().startsWith(mentionSearch.toLowerCase()))
    : []
  const isLead = SALES_STAGES.includes(client.stage)
  const CLIENT_STAGES = PIPELINE_STAGES.filter(s => !SALES_STAGES.includes(s))

  return (
    <div>
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/pipeline')}>← Pipeline</button>
          <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.3rem' }}>{client.name}</div>
          <span className="badge badge-gold">{client.stage}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'.75rem' }}>
          {isLead && (
            <button className="btn btn-gold" onClick={() => { setConvertForm({ stage:'Onboarding', mrr: client.mrr?.toString()||'', recommended_package: client.recommended_package||'' }); setShowConvert(true) }}>
              Convert to client →
            </button>
          )}
          <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{client.industry}</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'.5px solid var(--border)', padding:'0 1.75rem', background:'var(--warm)' }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ padding:'.55rem 1rem', fontSize:'.68rem', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:500, background:'none', border:'none', borderBottom:`2px solid ${tab===t?'var(--gold)':'transparent'}`, color:tab===t?'var(--dark)':'var(--muted)', cursor:'pointer' }}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div className="page">

        {tab==='overview'&&(
          <div className="g2" style={{gap:'1.25rem'}}>
            <div>
              <div className="card" style={{marginBottom:'1rem'}}>
                <div className="card-head"><div className="card-title">Pipeline & Scoring</div></div>
                <div className="card-body" style={{padding:'.5rem 1rem'}}>
                  <Field label="Stage" value={client.stage} type="select" options={PIPELINE_STAGES} onSave={v=>upd('stage',v)}/>
                  <Field label="Health" value={client.health} type="select" options={HEALTH_OPTIONS} onSave={v=>upd('health',v)}/>
                  <Field label="Fit score" value={client.fit_score?.toString()} type="number" onSave={v=>upd('fit_score',Number(v))}/>
                  <Field label="Lead leak" value={client.lead_leak_stage} type="select" options={LEAK_STAGES} onSave={v=>upd('lead_leak_stage',v)}/>
                  <Field label="Package" value={client.recommended_package} type="select" options={PACKAGES} onSave={v=>upd('recommended_package',v)}/>
                  <Field label="Investment" value={client.investment_value?.toString()} type="number" onSave={v=>upd('investment_value',Number(v))}/>
                  <Field label="MRR" value={client.mrr?.toString()} type="number" onSave={v=>upd('mrr',Number(v))}/>
                </div>
              </div>

              <div className="card">
                <div className="card-head"><div className="card-title">Contact & Next Action</div></div>
                <div className="card-body" style={{padding:'.5rem 1rem'}}>
                  <Field label="Contact name" value={client.contact_name} onSave={v=>upd('contact_name',v)}/>
                  <Field label="Email" value={client.contact_email} onSave={v=>upd('contact_email',v)}/>
                  <Field label="Phone" value={client.phone} onSave={v=>upd('phone',v)}/>
                  <Field label="Company" value={client.company} onSave={v=>upd('company',v)}/>
                  <Field label="Role" value={client.contact_role} onSave={v=>upd('contact_role',v)}/>
                  <Field label="Website" value={client.website} onSave={v=>upd('website',v)}/>
                  <Field label="Connector" value={client.connector_name} onSave={v=>upd('connector_name',v)}/>
                  <Field label="Date contacted" value={client.date_contacted} type="date" onSave={v=>upd('date_contacted',v)}/>
                  <MultiCheckField label="Action taken" value={client.action_taken} options={ACTION_TAKEN_OPTIONS} onSave={v=>upd('action_taken',v)}/>
                  <Field label="Next action" value={client.next_action} onSave={v=>upd('next_action',v)}/>
                  <Field label="Next action date" value={client.next_action_date} type="date" onSave={v=>upd('next_action_date',v)}/>
                  <Field label="Next action to take" value={client.next_action_to_take} type="select" options={NEXT_ACTION_OPTIONS} onSave={v=>upd('next_action_to_take',v)}/>
                  {assignOptions.length > 0 && (
                    <Field label="Assigned to" value={client.assigned_to} type="select" options={assignOptions} onSave={v=>upd('assigned_to',v)}/>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Discovery & Diagnosis</div></div>
              <div className="card-body" style={{padding:'.5rem 1rem'}}>
                <Field label="Core insight" value={client.diagnosis_core_insight} type="textarea" onSave={v=>upd('diagnosis_core_insight',v)}/>
                <Field label="Bottleneck" value={client.diagnosis_bottleneck} type="textarea" onSave={v=>upd('diagnosis_bottleneck',v)}/>
                <Field label="Opening line" value={client.diagnosis_opening_line} type="textarea" onSave={v=>upd('diagnosis_opening_line',v)}/>
                <Field label="Confidence" value={client.diagnosis_confidence} type="select" options={['High','Medium','Low']} onSave={v=>upd('diagnosis_confidence',v)}/>
                <Field label="Connector notes" value={client.handover_notes} type="textarea" onSave={v=>upd('handover_notes',v)}/>
                <Field label="Discovery notes" value={client.discovery_notes} type="textarea" onSave={v=>upd('discovery_notes',v)}/>
                <Field label="Notes" value={client.notes} type="textarea" onSave={v=>upd('notes',v)}/>
              </div>
            </div>
          </div>
        )}

        {tab==='modules'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <div style={{fontSize:'.78rem',color:'var(--muted)'}}>{modules.length} modules activated</div>
              <button className="btn btn-primary" onClick={()=>setShowModAdd(true)}>+ Activate module</button>
            </div>
            {modules.length===0
              ? <div className="empty"><div className="empty-title">No modules yet</div><div className="empty-sub">Activate modules based on the diagnosis.</div></div>
              : <div style={{display:'flex',flexDirection:'column',gap:'.625rem'}}>
                {modules.map(m=>(
                  <div key={m.id} className="card" style={{borderLeft:`3px solid ${m.status==='Active'?'var(--teal)':m.status==='Paused'?'var(--amber)':'var(--border)'}`}}>
                    <div style={{padding:'.75rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500,fontSize:'.85rem',marginBottom:'.2rem'}}>{m.module_name}</div>
                        <div style={{display:'flex',gap:'.4rem'}}>
                          <span className={`badge ${m.priority==='Must'?'badge-teal':'badge-gold'}`}>{m.priority}</span>
                          <span className={`badge ${m.status==='Active'?'badge-teal':m.status==='Paused'?'badge-amber':'badge-gray'}`}>{m.status}</span>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:'.4rem'}}>
                        <button className="btn btn-ghost btn-xs" onClick={()=>togMod(m)}>{m.status==='Active'?'Pause':'Activate'}</button>
                        <button className="btn btn-danger btn-xs" onClick={()=>delMod(m.id)}>Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
            {showModAdd&&(
              <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModAdd(false)}>
                <div className="modal">
                  <div className="modal-head"><div className="modal-title">Activate a Module</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowModAdd(false)}>✕</button></div>
                  <div className="modal-body">
                    {ALL_MODULES.filter(name=>!modules.find(m=>m.module_name===name)).map(name=>(
                      <div key={name} onClick={()=>addMod(name,MUST_MODULES.includes(name)?'Must':'Supporting')} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.625rem .875rem',borderRadius:'6px',marginBottom:'.35rem',border:'.5px solid var(--border)',background:'var(--bg)',cursor:'pointer'}}>
                        <span style={{fontSize:'.8rem',fontWeight:500}}>{name}</span>
                        <span className={`badge ${MUST_MODULES.includes(name)?'badge-teal':'badge-gold'}`}>{MUST_MODULES.includes(name)?'Must':'Supporting'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab==='tasks'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem'}}>
              <div style={{fontSize:'.78rem',color:'var(--muted)'}}>{tasks.length} tasks</div>
              <button className="btn btn-primary" onClick={addTsk}>+ Add task</button>
            </div>
            {tasks.length===0
              ? <div className="empty"><div className="empty-title">No tasks yet</div></div>
              : <div className="card"><table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'var(--bg)',borderBottom:'.5px solid var(--border)'}}>
                  {['Task','Status','Owner','Due Date',''].map(h=><th key={h} style={{padding:'.55rem 1rem',textAlign:'left',fontSize:'.58rem',letterSpacing:'.15em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500}}>{h}</th>)}
                </tr></thead>
                <tbody>{tasks.map(t=>(
                  <tr key={t.id} style={{borderBottom:'.5px solid var(--border)'}}>
                    <td style={{padding:'.5rem 1rem'}}><input className="form-input" style={{border:'none',background:'transparent',padding:0,fontSize:'.8rem',fontWeight:500}} value={t.name} onChange={e=>updTsk(t.id,'name',e.target.value)} onBlur={e=>updTsk(t.id,'name',e.target.value)}/></td>
                    <td style={{padding:'.5rem 1rem'}}><select className="form-select" style={{padding:'.25rem .5rem',fontSize:'.72rem'}} value={t.status} onChange={e=>updTsk(t.id,'status',e.target.value)}>{TASK_STATUSES.map(s=><option key={s}>{s}</option>)}</select></td>
                    <td style={{padding:'.5rem 1rem'}}><select className="form-select" style={{padding:'.25rem .5rem',fontSize:'.72rem'}} value={t.owner||''} onChange={e=>updTsk(t.id,'owner',e.target.value)}><option value="">—</option>{TASK_OWNERS.map(o=><option key={o}>{o}</option>)}</select></td>
                    <td style={{padding:'.5rem 1rem'}}><input type="date" className="form-input" style={{padding:'.25rem .5rem',fontSize:'.72rem'}} value={t.due_date||''} onChange={e=>updTsk(t.id,'due_date',e.target.value)}/></td>
                    <td style={{padding:'.5rem 1rem'}}><button className="btn btn-danger btn-xs" onClick={()=>delTsk(t.id)}>✕</button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            }
          </div>
        )}

        {tab==='notes'&&(
          <div className="g2" style={{gap:'1.25rem'}}>
            <div className="card"><div className="card-head"><div className="card-title">Discovery Call Notes</div></div><div className="card-body"><textarea className="form-textarea" style={{minHeight:200}} value={client.discovery_notes||''} onChange={e=>setClient(c=>({...c,discovery_notes:e.target.value}))} onBlur={e=>upd('discovery_notes',e.target.value)} placeholder="Paste transcript summary, pain points in their own words..."/></div></div>
            <div className="card"><div className="card-head"><div className="card-title">Handover Notes from Connector</div></div><div className="card-body"><textarea className="form-textarea" style={{minHeight:200}} value={client.handover_notes||''} onChange={e=>setClient(c=>({...c,handover_notes:e.target.value}))} onBlur={e=>upd('handover_notes',e.target.value)} placeholder="What the connector learned..."/></div></div>
            <div className="card"><div className="card-head"><div className="card-title">Opening Line for Proposal</div></div><div className="card-body"><textarea className="form-textarea" style={{minHeight:100,fontFamily:'Cormorant Garamond, Georgia, serif',fontSize:'1rem',fontStyle:'italic'}} value={client.diagnosis_opening_line||''} onChange={e=>setClient(c=>({...c,diagnosis_opening_line:e.target.value}))} onBlur={e=>upd('diagnosis_opening_line',e.target.value)} placeholder="The exact line that shows Maxine was listening..."/></div></div>
            <div className="card"><div className="card-head"><div className="card-title">General Notes</div></div><div className="card-body"><textarea className="form-textarea" style={{minHeight:100}} value={client.notes||''} onChange={e=>setClient(c=>({...c,notes:e.target.value}))} onBlur={e=>upd('notes',e.target.value)}/></div></div>
          </div>
        )}

        {tab==='comments'&&(
          <div style={{maxWidth:720}}>
            <div style={{display:'flex',flexDirection:'column',gap:'.625rem',marginBottom:'1.5rem'}}>
              {comments.length===0&&<div style={{color:'var(--muted)',fontSize:'.8rem',padding:'2rem 0',textAlign:'center'}}>No comments yet. Start the conversation below.</div>}
              {comments.map(c=>(
                <div key={c.id} style={{background:'var(--warm)',border:'.5px solid var(--border)',borderRadius:'8px',padding:'.875rem 1rem'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.5rem'}}>
                    <div style={{width:24,height:24,borderRadius:'5px',background:'var(--gold-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:600,color:'var(--amber)',flexShrink:0}}>
                      {(c.author_name||'?').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{fontSize:'.75rem',fontWeight:500,color:'var(--dark)'}}>{c.author_name||'Team'}</span>
                    <span style={{fontSize:'.65rem',color:'var(--muted)',marginLeft:'auto'}}>{fmtDate(c.created_at)}</span>
                  </div>
                  <div style={{fontSize:'.82rem',color:'var(--dark)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{renderWithMentions(c.content)}</div>
                </div>
              ))}
            </div>

            <div style={{position:'relative'}}>
              {mentionUsers.length > 0 && (
                <div style={{position:'absolute',bottom:'100%',left:0,right:0,background:'var(--warm)',border:'.5px solid var(--border)',borderRadius:'6px',boxShadow:'0 4px 16px rgba(0,0,0,.1)',zIndex:10,marginBottom:'.25rem'}}>
                  {mentionUsers.slice(0,5).map(u=>(
                    <div key={u.id} onClick={()=>insertMention(u)} style={{display:'flex',alignItems:'center',gap:'.5rem',padding:'.5rem .75rem',cursor:'pointer',borderBottom:'.5px solid var(--border)'}}>
                      <div style={{width:22,height:22,borderRadius:'4px',background:'var(--gold-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontWeight:600,color:'var(--amber)'}}>
                        {(u.name||'?').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{fontSize:'.8rem'}}>{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={commentRef}
                className="form-textarea"
                style={{minHeight:80,marginBottom:'.5rem'}}
                placeholder="Add a comment... type @ to mention someone"
                value={commentText}
                onChange={handleCommentChange}
                onKeyDown={e=>{
                  if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){submitComment()}
                  if(e.key==='Escape'){setMentionSearch(null)}
                }}
              />
              <div style={{display:'flex',justifyContent:'flex-end',gap:'.5rem',alignItems:'center'}}>
                <span style={{fontSize:'.62rem',color:'var(--muted)'}}>⌘+Enter to post</span>
                <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submittingComment||!commentText.trim()}>
                  {submittingComment?'Posting...':'Post comment'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                    <button className="btn btn-primary btn-sm" onClick={saveEmail} disabled={savingEmail}>{savingEmail?'Saving...':'Save'}</button>
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
                  {e.body&&(
                    <div style={{padding:'.75rem 1rem',fontSize:'.78rem',color:'var(--dark)',lineHeight:1.7,whiteSpace:'pre-wrap',maxHeight:200,overflowY:'auto'}}>
                      {e.body}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showConvert && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowConvert(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-head">
              <div className="modal-title">Convert to Client</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowConvert(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--teal-bg)', border: '.5px solid var(--teal-b)', borderRadius: '8px', padding: '.875rem 1rem', fontSize: '.78rem', color: 'var(--teal)', lineHeight: 1.6 }}>
                Converting <strong>{client.name}</strong> will move them out of the pipeline and into active client delivery.
              </div>
              <div className="form-group">
                <label className="form-label">Starting stage</label>
                <select className="form-select" value={convertForm.stage} onChange={e => setConvertForm(f => ({ ...f, stage: e.target.value }))}>
                  {CLIENT_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Package</label>
                <select className="form-select" value={convertForm.recommended_package} onChange={e => setConvertForm(f => ({ ...f, recommended_package: e.target.value }))}>
                  <option value="">— Select package —</option>
                  {PACKAGES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly retainer (MRR)</label>
                <input className="form-input" type="number" placeholder="e.g. 3500" value={convertForm.mrr} onChange={e => setConvertForm(f => ({ ...f, mrr: e.target.value }))} />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowConvert(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleConvert} disabled={converting}>
                {converting ? 'Converting...' : 'Confirm conversion →'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
