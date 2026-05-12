// ClientDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getClient, updateClient, addClientModule, updateClientModule, deleteClientModule, createTask, updateTask, deleteTask, PIPELINE_STAGES, HEALTH_OPTIONS, LEAK_STAGES, PACKAGES, TASK_STATUSES, TASK_OWNERS, ALL_MODULES, MUST_MODULES } from '../lib/supabase.js'

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
        {type==='select'?<select className="form-select" style={{flex:1}} value={val} onChange={e=>setVal(e.target.value)} autoFocus><option value="">—</option>{options?.map(o=><option key={o}>{o}</option>)}</select>
        :type==='textarea'?<textarea className="form-textarea" style={{flex:1,minHeight:60}} value={val} onChange={e=>setVal(e.target.value)} autoFocus/>
        :<input className="form-input" style={{flex:1}} type={type||'text'} value={val} onChange={e=>setVal(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&save()}/>}
        <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>{setVal(value||'');setEditing(false)}}>✕</button>
      </div>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [showModAdd, setShowModAdd] = useState(false)

  useEffect(() => {
    getClient(id).then(d => { setClient(d); setModules(d?.client_modules||[]); setTasks(d?.tasks||[]); setLoading(false) }).catch(()=>setLoading(false))
  }, [id])

  const upd = async (field, value) => { const u = await updateClient(id, {[field]:value}); setClient(u) }
  const addMod = async (name, priority) => { const m = await addClientModule({client_id:id,module_name:name,priority,status:'Active'}); setModules(p=>[...p,m]); setShowModAdd(false) }
  const togMod = async (m) => { const u = await updateClientModule(m.id,{status:m.status==='Active'?'Paused':'Active'}); setModules(p=>p.map(x=>x.id===m.id?u:x)) }
  const delMod = async (mid) => { await deleteClientModule(mid); setModules(p=>p.filter(m=>m.id!==mid)) }
  const addTsk = async () => { const t = await createTask({client_id:id,name:'New task',status:'To Do'}); setTasks(p=>[...p,t]) }
  const updTsk = async (tid,field,value) => { const u = await updateTask(tid,{[field]:value}); setTasks(p=>p.map(t=>t.id===tid?u:t)) }
  const delTsk = async (tid) => { await deleteTask(tid); setTasks(p=>p.filter(t=>t.id!==tid)) }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>
  if (!client) return <div className="page"><div className="empty"><div className="empty-title">Client not found</div></div></div>

  const TABS = ['overview','modules','tasks','notes']

  return (
    <div>
      <div className="topbar">
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/pipeline')}>← Pipeline</button>
          <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'1.3rem' }}>{client.name}</div>
          <span className="badge badge-gold">{client.stage}</span>
        </div>
        <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{client.industry}</div>
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
                  <Field label="Website" value={client.website} onSave={v=>upd('website',v)}/>
                  <Field label="Connector" value={client.connector_name} onSave={v=>upd('connector_name',v)}/>
                  <Field label="Next action" value={client.next_action} onSave={v=>upd('next_action',v)}/>
                  <Field label="Next action date" value={client.next_action_date} type="date" onSave={v=>upd('next_action_date',v)}/>
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
            {modules.length===0?<div className="empty"><div className="empty-title">No modules yet</div><div className="empty-sub">Activate modules based on the diagnosis.</div></div>
            :<div style={{display:'flex',flexDirection:'column',gap:'.625rem'}}>
              {modules.map(m=>(
                <div key={m.id} className="card" style={{borderLeft:`3px solid ${m.status==='Active'?'var(--teal)':m.status==='Paused'?'var(--amber)':'var(--border)'}`}}>
                  <div style={{padding:'.75rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div style={{flex:1}}><div style={{fontWeight:500,fontSize:'.85rem',marginBottom:'.2rem'}}>{m.module_name}</div>
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
            </div>}
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
            {tasks.length===0?<div className="empty"><div className="empty-title">No tasks yet</div></div>
            :<div className="card"><table style={{width:'100%',borderCollapse:'collapse'}}>
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
            </table></div>}
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
      </div>
    </div>
  )
}
