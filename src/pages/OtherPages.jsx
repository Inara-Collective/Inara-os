// Modules.jsx
import React, { useState, useEffect } from 'react'
import { getModulesLibrary } from '../lib/supabase.js'

export function Modules() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [pri, setPri] = useState('All')
  const [open, setOpen] = useState({})

  useEffect(() => { getModulesLibrary().then(d=>{setModules(d);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const cats = ['All','Brand','Content','Social','Email','Website','Leads','Systems','Growth','Training']
  const filtered = modules.filter(m=>(cat==='All'||m.category===cat)&&(pri==='All'||m.priority===pri))
  const must = filtered.filter(m=>m.priority==='Must')
  const sup = filtered.filter(m=>m.priority==='Supporting')

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Module Library</div>
        <select className="form-select" style={{width:140,padding:'.4rem .75rem',fontSize:'.78rem'}} value={pri} onChange={e=>setPri(e.target.value)}>
          <option>All</option><option>Must</option><option>Supporting</option>
        </select>
      </div>
      <div className="page">
        <div style={{display:'flex',gap:'.4rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
          {cats.map(c=><button key={c} onClick={()=>setCat(c)} className="btn" style={{fontSize:'.65rem',padding:'.3rem .75rem',background:cat===c?'var(--dark)':'transparent',color:cat===c?'var(--bg)':'var(--muted)',border:'.5px solid var(--border)'}}>{c}</button>)}
        </div>
        {must.length>0&&(
          <div style={{marginBottom:'2rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'1rem'}}>
              <div style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--teal)',fontWeight:600}}>Must Modules</div>
              <div style={{height:'.5px',flex:1,background:'var(--teal-b)'}}></div>
              <span style={{fontSize:'.62rem',color:'var(--teal)'}}>{must.length}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'.75rem'}}>
              {must.map(m=>(
                <div key={m.id} className="card" onClick={()=>setOpen(o=>({...o,[m.id]:!o[m.id]}))} style={{cursor:'pointer',borderLeft:'2px solid var(--teal)'}}>
                  <div style={{padding:'.875rem 1rem'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'.5rem',marginBottom:'.35rem'}}>
                      <div style={{fontWeight:500,fontSize:'.82rem'}}>{m.name}</div>
                      <span className="badge badge-teal">Must</span>
                    </div>
                    {m.category&&<span className="badge badge-gray" style={{fontSize:'.54rem'}}>{m.category}</span>}
                  </div>
                  {open[m.id]&&m.kpis&&<div style={{padding:'.625rem 1rem',borderTop:'.5px solid var(--border)',background:'var(--bg)'}}>
                    <div style={{fontSize:'.56rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'.3rem',fontWeight:500}}>KPIs</div>
                    <div style={{fontSize:'.75rem',color:'var(--dark2)',lineHeight:1.6}}>{m.kpis}</div>
                  </div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {sup.length>0&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'1rem'}}>
              <div style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:'var(--amber)',fontWeight:600}}>Supporting Modules</div>
              <div style={{height:'.5px',flex:1,background:'var(--amber-b)'}}></div>
              <span style={{fontSize:'.62rem',color:'var(--amber)'}}>{sup.length}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'.75rem'}}>
              {sup.map(m=>(
                <div key={m.id} className="card" onClick={()=>setOpen(o=>({...o,[m.id]:!o[m.id]}))} style={{cursor:'pointer',borderLeft:'2px solid var(--gold)'}}>
                  <div style={{padding:'.875rem 1rem'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'.5rem',marginBottom:'.35rem'}}>
                      <div style={{fontWeight:500,fontSize:'.82rem'}}>{m.name}</div>
                      <span className="badge badge-gold">Supporting</span>
                    </div>
                    {m.category&&<span className="badge badge-gray" style={{fontSize:'.54rem'}}>{m.category}</span>}
                  </div>
                  {open[m.id]&&m.kpis&&<div style={{padding:'.625rem 1rem',borderTop:'.5px solid var(--border)',background:'var(--bg)'}}>
                    <div style={{fontSize:'.56rem',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'.3rem',fontWeight:500}}>KPIs</div>
                    <div style={{fontSize:'.75rem',color:'var(--dark2)',lineHeight:1.6}}>{m.kpis}</div>
                  </div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Reporting.jsx
import React, { useState, useEffect } from 'react'
import { getReports, createReport, updateReport, deleteReport, getClients, HEALTH_OPTIONS, LEAK_STAGES } from '../lib/supabase.js'

export function Reporting() {
  const [reports, setReports] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { Promise.all([getReports(),getClients()]).then(([r,c])=>{setReports(r);setClients(c);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const handleNew = async (form) => { const r = await createReport(form); setReports(p=>[r,...p]); setSelected(r); setShowNew(false) }
  const upd = async (field, value) => { if (!selected) return; const u = await updateReport(selected.id,{[field]:value}); setReports(p=>p.map(r=>r.id===selected.id?u:r)); setSelected(u) }
  const del = async (id) => { await deleteReport(id); setReports(p=>p.filter(r=>r.id!==id)); setSelected(null) }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar"><div className="topbar-title">Reporting Hub</div><button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ New report</button></div>
      <div className="page">
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'1.25rem',alignItems:'start'}}>
          <div className="card">
            {reports.length===0?<div style={{padding:'2rem',textAlign:'center',color:'var(--muted)',fontSize:'.78rem'}}>No reports yet.</div>
            :reports.map(r=>(
              <div key={r.id} onClick={()=>setSelected(r)} style={{padding:'.75rem 1rem',borderBottom:'.5px solid var(--border)',cursor:'pointer',background:selected?.id===r.id?'var(--gold-bg)':'transparent',borderLeft:selected?.id===r.id?'2px solid var(--gold)':'2px solid transparent'}}>
                <div style={{fontWeight:500,fontSize:'.8rem',marginBottom:'.2rem'}}>{r.title}</div>
                <div style={{fontSize:'.66rem',color:'var(--muted)'}}>{r.clients?.name} {r.report_date&&'· '+new Date(r.report_date).toLocaleDateString('en-NZ',{day:'numeric',month:'short',year:'numeric'})}</div>
                {r.client_health&&<span style={{fontSize:'.62rem'}}>{r.client_health}</span>}
              </div>
            ))}
          </div>
          {selected?(
            <div className="card">
              <div className="card-head"><div className="card-title">{selected.title}</div><button className="btn btn-danger btn-xs" onClick={()=>del(selected.id)}>Delete</button></div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div className="g2">
                  <div className="form-group"><label className="form-label">Report date</label><input type="date" className="form-input" value={selected.report_date||''} onChange={e=>upd('report_date',e.target.value)}/></div>
                  <div className="form-group"><label className="form-label">Client health</label><select className="form-select" value={selected.client_health||''} onChange={e=>upd('client_health',e.target.value)}><option value="">—</option>{HEALTH_OPTIONS.map(h=><option key={h}>{h}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Lead leak stage</label><select className="form-select" value={selected.lead_leak_stage||''} onChange={e=>upd('lead_leak_stage',e.target.value)}><option value="">—</option>{LEAK_STAGES.map(l=><option key={l}>{l}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Module health</label><select className="form-select" value={selected.module_health||''} onChange={e=>upd('module_health',e.target.value)}><option value="">—</option><option>🟢 All green</option><option>🟡 Some need attention</option><option>🔴 Critical issues</option></select></div>
                </div>
                <div style={{borderTop:'.5px solid var(--border)',paddingTop:'1rem'}}>
                  <div style={{fontSize:'.58rem',letterSpacing:'.15em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500,marginBottom:'.75rem'}}>Key Metrics</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'.75rem'}}>
                    {[['Email open rate (%)','email_open_rate'],['Reel reach avg','reel_reach_avg'],['Website traffic','website_traffic'],['Monthly enquiries','monthly_enquiries'],['Conversion rate (%)','conversion_rate'],['MRR ($)','mrr']].map(([label,field])=>(
                      <div className="form-group" key={field}><label className="form-label">{label}</label><input type="number" className="form-input" value={selected[field]||''} onChange={e=>upd(field,e.target.value)}/></div>
                    ))}
                  </div>
                </div>
                {[['How did the month feel?','qualitative_checkin'],['Key wins','key_wins'],['Issues — be upfront','issues'],['Modules adjusted','modules_adjusted'],['Recommended next modules','recommended_modules'],['Next 30 day priority','next_30_day_priority']].map(([label,field])=>(
                  <div className="form-group" key={field}><label className="form-label">{label}</label><textarea className="form-textarea" value={selected[field]||''} onChange={e=>upd(field,e.target.value)}/></div>
                ))}
                <div className="form-group"><label className="form-label" style={{display:'flex',alignItems:'center',gap:'.5rem'}}><input type="checkbox" checked={selected.report_sent||false} onChange={e=>upd('report_sent',e.target.checked)}/>Report sent to client</label></div>
              </div>
            </div>
          ):<div className="empty"><div className="empty-icon">📊</div><div className="empty-title">Select a report</div><div className="empty-sub">Choose from the list or create a new one.</div></div>}
        </div>
      </div>
      {showNew&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">New Monthly Report</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowNew(false)}>✕</button></div>
            <NewReportForm clients={clients} onSave={handleNew} onCancel={()=>setShowNew(false)}/>
          </div>
        </div>
      )}
    </div>
  )
}

function NewReportForm({ clients, onSave, onCancel }) {
  const [form, setForm] = useState({title:'',client_id:'',report_date:new Date().toISOString().split('T')[0]})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <>
      <div className="modal-body">
        <div className="form-group"><label className="form-label">Report title *</label><input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Petra Lane Studio — May 2025" autoFocus/></div>
        <div className="g2">
          <div className="form-group"><label className="form-label">Client *</label><select className="form-select" value={form.client_id} onChange={e=>set('client_id',e.target.value)}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Report date</label><input type="date" className="form-input" value={form.report_date} onChange={e=>set('report_date',e.target.value)}/></div>
        </div>
      </div>
      <div className="modal-foot"><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" onClick={()=>onSave(form)} disabled={!form.title||!form.client_id}>Create report</button></div>
    </>
  )
}

// SOPs.jsx
import React, { useState, useEffect } from 'react'
import { getSops, createSop, updateSop, SOP_CATEGORIES } from '../lib/supabase.js'

export function SOPs() {
  const [sops, setSops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { getSops().then(d=>{setSops(d);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const handleCreate = async (form) => { const s = await createSop(form); setSops(p=>[...p,s]); setSelected(s); setShowNew(false) }
  const upd = async (field, value) => { if (!selected) return; const u = await updateSop(selected.id,{[field]:value}); setSops(p=>p.map(s=>s.id===selected.id?u:s)); setSelected(u) }
  const STATUS_COLOR = { Live:'var(--teal)', Draft:'var(--amber)', 'Needs update':'var(--red)' }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar"><div className="topbar-title">SOP Library</div><button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ New SOP</button></div>
      <div className="page">
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'1.25rem',alignItems:'start'}}>
          <div className="card">
            {sops.map(s=>(
              <div key={s.id} onClick={()=>setSelected(s)} style={{padding:'.7rem 1rem',borderBottom:'.5px solid var(--border)',cursor:'pointer',background:selected?.id===s.id?'var(--gold-bg)':'transparent',borderLeft:selected?.id===s.id?'2px solid var(--gold)':'2px solid transparent'}}>
                <div style={{fontWeight:500,fontSize:'.78rem',marginBottom:'.22rem'}}>{s.title}</div>
                <div style={{display:'flex',gap:'.4rem'}}>
                  {s.category&&<span className="badge badge-gray" style={{fontSize:'.52rem'}}>{s.category}</span>}
                  <span style={{fontSize:'.6rem',color:STATUS_COLOR[s.status]||'var(--muted)'}}>{s.status}</span>
                </div>
              </div>
            ))}
            {sops.length===0&&<div style={{padding:'1.5rem',textAlign:'center',color:'var(--muted)',fontSize:'.78rem'}}>No SOPs yet.</div>}
          </div>
          {selected?(
            <div className="card">
              <div className="card-head"><div className="card-title">Editing: {selected.title}</div><select className="form-select" style={{padding:'.25rem .5rem',fontSize:'.72rem',width:'auto'}} value={selected.status} onChange={e=>upd('status',e.target.value)}>{['Live','Draft','Needs update'].map(s=><option key={s}>{s}</option>)}</select></div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                <div className="g2">
                  <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={selected.category||''} onChange={e=>upd('category',e.target.value)}><option value="">—</option>{SOP_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Owner</label><input className="form-input" value={selected.owner||''} onChange={e=>upd('owner',e.target.value)}/></div>
                </div>
                <div className="form-group"><label className="form-label">SOP Content</label><textarea className="form-textarea" style={{minHeight:400}} value={selected.content||''} onChange={e=>upd('content',e.target.value)} placeholder="Write the SOP step by step. Be specific enough that a new team member could follow this on day one.&#10;&#10;Step 1 —&#10;Step 2 —&#10;Step 3 —"/></div>
              </div>
            </div>
          ):<div className="empty"><div className="empty-icon">☰</div><div className="empty-title">Select an SOP</div><div className="empty-sub">Choose from the list or create a new one.</div></div>}
        </div>
      </div>
      {showNew&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">New SOP</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowNew(false)}>✕</button></div>
            <div className="modal-body">
              <NewSOPForm onSave={handleCreate} onCancel={()=>setShowNew(false)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewSOPForm({ onSave, onCancel }) {
  const [form, setForm] = useState({title:'',category:'Content',status:'Draft'})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <>
      <div className="form-group"><label className="form-label">SOP title *</label><input className="form-input" value={form.title} onChange={e=>set('title',e.target.value)} autoFocus/></div>
      <div className="g2" style={{marginTop:'1rem'}}>
        <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e=>set('category',e.target.value)}>{SOP_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e=>set('status',e.target.value)}><option>Draft</option><option>Live</option></select></div>
      </div>
      <div className="modal-foot" style={{marginTop:'1rem'}}><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" onClick={()=>onSave(form)} disabled={!form.title}>Create SOP</button></div>
    </>
  )
}

// Outsource.jsx
import React, { useState, useEffect } from 'react'
import { getOutsource, createOutsource, updateOutsource, OUTSOURCE_ROLES } from '../lib/supabase.js'

export function Outsource() {
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { getOutsource().then(d=>{setPeople(d);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const handleCreate = async (form) => { const p = await createOutsource(form); setPeople(prev=>[...prev,p]); setSelected(p); setShowNew(false) }
  const upd = async (field, value) => { if (!selected) return; const u = await updateOutsource(selected.id,{[field]:value}); setPeople(p=>p.map(x=>x.id===selected.id?u:x)); setSelected(u) }
  const STATUS_COLOR = { Active:'var(--teal)','On call':'var(--amber)','Not using':'var(--muted)' }
  const grouped = OUTSOURCE_ROLES.map(role=>({role,people:people.filter(p=>p.role===role)})).filter(g=>g.people.length>0)

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div>
      <div className="topbar"><div className="topbar-title">Outsource Network</div><button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ Add person</button></div>
      <div className="page">
        <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'1.25rem',alignItems:'start'}}>
          <div className="card">
            {grouped.map(g=>(
              <div key={g.role} style={{borderBottom:'.5px solid var(--border)'}}>
                <div style={{padding:'.5rem 1rem .28rem',fontSize:'.54rem',letterSpacing:'.18em',textTransform:'uppercase',color:'var(--muted)',fontWeight:500}}>{g.role}</div>
                {g.people.map(p=>(
                  <div key={p.id} onClick={()=>setSelected(p)} style={{padding:'.52rem 1rem',cursor:'pointer',background:selected?.id===p.id?'var(--gold-bg)':'transparent',borderLeft:selected?.id===p.id?'2px solid var(--gold)':'2px solid transparent',display:'flex',alignItems:'center',gap:'.5rem'}}>
                    <div style={{flex:1,minWidth:0}}><div style={{fontSize:'.78rem',fontWeight:500}} className="truncate">{p.name}</div>{p.location&&<div style={{fontSize:'.63rem',color:'var(--muted)'}}>{p.location}</div>}</div>
                    <span style={{width:7,height:7,borderRadius:'50%',background:STATUS_COLOR[p.status]||'var(--muted)',flexShrink:0}}></span>
                  </div>
                ))}
              </div>
            ))}
            {people.length===0&&<div style={{padding:'1.5rem',textAlign:'center',color:'var(--muted)',fontSize:'.78rem'}}>No contacts yet.</div>}
          </div>
          {selected?(
            <div className="card">
              <div className="card-head"><div className="card-title">Editing: {selected.name}</div></div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'.875rem'}}>
                <div className="g2">
                  <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={selected.name||''} onChange={e=>upd('name',e.target.value)}/></div>
                  <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={selected.role||''} onChange={e=>upd('role',e.target.value)}><option value="">—</option>{OUTSOURCE_ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={selected.status||''} onChange={e=>upd('status',e.target.value)}><option>Active</option><option>On call</option><option>Not using</option></select></div>
                  <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={selected.location||''} onChange={e=>upd('location',e.target.value)}/></div>
                  <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={selected.contact_email||''} onChange={e=>upd('contact_email',e.target.value)}/></div>
                  <div className="form-group"><label className="form-label">Rate</label><input className="form-input" value={selected.rate||''} onChange={e=>upd('rate',e.target.value)} placeholder="e.g. $150/hr"/></div>
                </div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={selected.notes||''} onChange={e=>upd('notes',e.target.value)}/></div>
              </div>
            </div>
          ):<div className="empty"><div className="empty-icon">◌</div><div className="empty-title">Select a contact</div></div>}
        </div>
      </div>
      {showNew&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowNew(false)}>
          <div className="modal">
            <div className="modal-head"><div className="modal-title">Add to Network</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowNew(false)}>✕</button></div>
            <div className="modal-body">
              <NewPersonForm onSave={handleCreate} onCancel={()=>setShowNew(false)}/>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewPersonForm({ onSave, onCancel }) {
  const [form, setForm] = useState({name:'',role:'',status:'On call'})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <>
      <div className="g2">
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} autoFocus/></div>
        <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e=>set('role',e.target.value)}><option value="">—</option>{OUTSOURCE_ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
      </div>
      <div className="modal-foot" style={{marginTop:'1rem'}}><button className="btn btn-ghost" onClick={onCancel}>Cancel</button><button className="btn btn-primary" onClick={()=>onSave(form)} disabled={!form.name}>Add</button></div>
    </>
  )
}

// SystemFlow.jsx
import React, { useState } from 'react'

const STAGES = [
  {num:'01',who:'Connector',group:'Sales Team',title:'Find the Business',detail:'$1M+ businesses with inconsistent marketing.',points:['LinkedIn DM + content strategy','Instagram DM + genuine comments','Events + networking','Referrals from network','Cold outreach — any platform','70% relationship + curiosity. 30% value. Never pitch first.']},
  {num:'02',who:'Connector + System',group:'Sales Team',title:'Score the Lead',detail:'Audit Generator → scores out of 100.',points:['Hot (75+) — book Discovery Call immediately','Warm (45–74) — nurture and book when ready','Cold (0–44) — not a fit, move on']},
  {num:'03',who:'Connector',group:'Sales Team',title:'Call 1 — Qualify',detail:'10–15 mins. Confirm pain. Confirm decision maker.',points:['"This is not a sales call. I am doing research on businesses in [industry]..."','Close: Ask permission for Call 2. Do not explain Inara yet.']},
  {num:'04',who:'Connector',group:'Sales Team',title:'Call 2 — Intro',detail:'Plant the Inara thinking. Book the Maxine meeting.',points:['"Most businesses think it is a content problem. It is almost always a structure problem."','"Would it be worth 45 minutes with Maxine?" — Meeting bonus earned when lead shows up.']},
  {num:'05',who:'Connector → Maxine',group:'Sales Team',title:'Handover to Maxine',detail:'Connector sends everything. Maxine fully briefed.',points:['Full audit report','Call 1 notes — pain in their own words','Call 2 notes — what resonated','Personal context']},
  {num:'06',who:'Maxine',group:'Maxine',title:'Discovery Call',detail:'45–60 minutes. Diagnose, never pitch.',points:['"This is not a sales call. I am going to understand your business and tell you honestly what I find."','Record: Otter.ai / Fireflies / Zoom','"Would it be okay if I came back in 48 hours with something specific?"']},
  {num:'07',who:'Maxine + System',group:'Maxine',title:'Transcript → Diagnosis',detail:'Tools do the work. Maxine reviews.',points:['Transcript Analyser → 20 mins → full diagnosis','Proposal Generator → one click → 8-section bespoke proposal','Maxine reviews and personalises. Sent within 48 hours.']},
  {num:'08',who:'Maxine',group:'Maxine',title:'Sales Call — Present Proposal',detail:'Walk through. Confirm fit. Then stop talking.',points:['"Does the investment feel workable?" (never "can you afford it")','"Does this feel like the right direction?" — then silence.']},
  {num:'09',who:'Maxine + Team',group:'Delivery',title:'Close and Onboard',detail:'Contract signed. 50% deposit in. Connector earns 10%.',points:['Contract and invoice same day','Kickoff call within 5 days','Module stack confirmed. KPIs set.']},
  {num:'10',who:'Maxine',group:'Delivery',title:'Build the Strategy',detail:'Weeks 1–4. Brand positioning, full funnel, 90-day plan.',points:['Brand narrative and positioning','Tone of voice and messaging framework','Full customer journey map']},
  {num:'11',who:'Team + Outsource',group:'Delivery',title:'Execute + Produce',detail:'Full content ecosystem built and running.',points:['12 reels monthly. 8 feed posts. 12 story sets.','2 email campaigns per month','ALL approval through platform only. No WhatsApp. Max 3 revisions.']},
  {num:'12',who:'Maxine',group:'Delivery',title:'Report + Refine',detail:'Monthly 45-minute meeting. Every module health checked.',points:['Always qualitative before quantitative — how did the month feel?','Reporting is never the end — it begins the next cycle.']},
  {num:'13',who:'Maxine + Team',group:'Revenue',title:'Expand Revenue',detail:'+$2k–$10k extra per month.',points:['Events + referral activation','Advisory sessions + workshops','Partnership and co-marketing deals']},
  {num:'14',who:'Maxine',group:'Revenue',title:'Retain + Dial In',detail:'$1.5k–$3k/mo ongoing.',points:['Team training → client runs more independently','Dial an Inara — strategic support when it counts','Referrals loop back into the top of the pipeline']},
]

const GROUP_COLOR = {'Sales Team':'var(--blue)','Maxine':'var(--gold)','Delivery':'var(--teal)','Revenue':'var(--purple)'}

export function SystemFlow() {
  const [open, setOpen] = useState({})
  const tog = (num) => setOpen(o=>({...o,[num]:!o[num]}))
  const expandAll = () => setOpen(STAGES.reduce((a,s)=>({...a,[s.num]:true}),{}))
  let lastGroup = null

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">The Full Business on One Line</div>
        <button className="btn btn-ghost btn-sm" onClick={expandAll}>Expand all</button>
      </div>
      <div className="page">
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'.75rem',marginBottom:'2rem'}}>
          {[['$7k','Strategy'],['$50k','Build Phase'],['$50k+','Growth Partner'],['$3k/mo','Dial an Inara'],['$80k+','Monthly potential']].map(([val,label])=>(
            <div key={val} style={{background:'var(--dark)',borderRadius:'8px',padding:'.875rem 1rem',textAlign:'center'}}>
              <div style={{fontFamily:'Cormorant Garamond, Georgia, serif',fontSize:'1.75rem',fontWeight:300,color:'var(--gold)',lineHeight:1}}>{val}</div>
              <div style={{fontSize:'.62rem',color:'rgba(255,255,255,.35)',marginTop:'.25rem'}}>{label}</div>
            </div>
          ))}
        </div>
        {STAGES.map((s,i) => {
          const showHeader = s.group !== lastGroup
          lastGroup = s.group
          return (
            <React.Fragment key={s.num}>
              {showHeader&&(
                <div style={{display:'flex',alignItems:'center',gap:'1rem',margin:`${i>0?'1.75rem':'0'} 0 .875rem`}}>
                  <div style={{fontSize:'.58rem',letterSpacing:'.2em',textTransform:'uppercase',color:GROUP_COLOR[s.group],fontWeight:600,whiteSpace:'nowrap'}}>{s.group}</div>
                  <div style={{height:'.5px',flex:1,background:GROUP_COLOR[s.group],opacity:.3}}></div>
                </div>
              )}
              <div style={{marginBottom:'.5rem'}}>
                <div className="card" onClick={()=>tog(s.num)} style={{cursor:'pointer',borderLeft:`3px solid ${GROUP_COLOR[s.group]}`}}>
                  <div style={{padding:'.875rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem'}}>
                    <div style={{fontFamily:'Cormorant Garamond, Georgia, serif',fontSize:'1.4rem',fontWeight:300,color:GROUP_COLOR[s.group],minWidth:36,lineHeight:1}}>{s.num}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:'.88rem',marginBottom:'.15rem'}}>{s.title}</div>
                      <div style={{fontSize:'.7rem',color:'var(--muted)'}}>{s.who} · {s.detail}</div>
                    </div>
                    <span style={{color:'var(--muted)',fontSize:'.8rem',transition:'transform .18s',transform:open[s.num]?'rotate(90deg)':'none'}}>›</span>
                  </div>
                  {open[s.num]&&(
                    <div style={{padding:'.625rem 1.25rem 1rem',borderTop:'.5px solid var(--border)'}}>
                      {s.points.map((p,pi)=>(
                        <div key={pi} style={{display:'flex',gap:'.5rem',fontSize:'.8rem',color:'var(--dark2)',lineHeight:1.5,marginBottom:'.38rem'}}>
                          <span style={{color:GROUP_COLOR[s.group],flexShrink:0,marginTop:'.1rem'}}>→</span>
                          <span style={{fontFamily:p.startsWith('"')?'Cormorant Garamond, Georgia, serif':'inherit',fontStyle:p.startsWith('"')?'italic':'normal',fontSize:p.startsWith('"')?'.88rem':'.8rem'}}>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {i<STAGES.length-1&&<div style={{textAlign:'center',padding:'.22rem 0',color:'var(--muted)',fontSize:'.75rem'}}>↓</div>}
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
