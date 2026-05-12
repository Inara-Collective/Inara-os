import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClients, createClient_, PIPELINE_STAGES, LEAK_STAGES } from '../lib/supabase.js'

const STAGE_GROUPS = {
  'Sales Pipeline': ['Find','Score','Call 1 — Qualify','Call 2 — Intro','Handover','Discovery Call','Diagnosis','Proposal Sent','Sales Call'],
  'Closed': ['Closed — Won','Closed — Lost'],
  'Active Delivery': ['Onboarding','Stage 1 — Clarity','Stage 2 — Structure','Stage 3 — Growth Partner','Dial an Inara'],
  'Alumni': ['Alumni'],
}
const STAGE_COLOR = { 'Find':'var(--muted)','Score':'var(--muted)','Call 1 — Qualify':'var(--blue)','Call 2 — Intro':'var(--blue)','Handover':'var(--purple)','Discovery Call':'var(--purple)','Diagnosis':'var(--purple)','Proposal Sent':'var(--amber)','Sales Call':'var(--amber)','Closed — Won':'var(--teal)','Closed — Lost':'var(--red)','Onboarding':'var(--gold)','Stage 1 — Clarity':'var(--gold)','Stage 2 — Structure':'var(--gold)','Stage 3 — Growth Partner':'var(--gold)','Dial an Inara':'var(--teal)','Alumni':'var(--muted)' }

function ClientCard({ client, onClick }) {
  const hc = { '🟢 Strong':'var(--teal)','🟡 Building':'var(--amber)','🔴 Needs attention':'var(--red)' }
  return (
    <div onClick={onClick} style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'8px', padding:'.75rem', marginBottom:'.5rem', cursor:'pointer', borderLeft:`2px solid ${STAGE_COLOR[client.stage]||'var(--border)'}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.3rem' }}>
        <div style={{ width:24, height:24, borderRadius:5, background:'var(--gold-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.58rem', fontWeight:500, color:'var(--amber)', flexShrink:0 }}>{(client.name||'?').slice(0,2).toUpperCase()}</div>
        <div className="truncate" style={{ fontSize:'.78rem', fontWeight:500, flex:1 }}>{client.name}</div>
        {client.health && <span style={{ width:7, height:7, borderRadius:'50%', background:hc[client.health]||'var(--muted)', flexShrink:0 }}></span>}
      </div>
      {client.industry && <div style={{ fontSize:'.63rem', color:'var(--muted)', marginBottom:'.28rem' }}>{client.industry}</div>}
      <div style={{ display:'flex', gap:'.3rem', flexWrap:'wrap' }}>
        {client.fit_score != null && <span className="badge badge-gold">{client.fit_score}</span>}
        {client.lead_leak_stage && <span className="badge badge-amber">{client.lead_leak_stage.charAt(0)}</span>}
        {client.mrr > 0 && <span className="badge badge-teal">${client.mrr?.toLocaleString()}/mo</span>}
      </div>
      {client.next_action && <div style={{ fontSize:'.62rem', color:'var(--muted)', marginTop:'.38rem', borderTop:'.5px solid var(--border)', paddingTop:'.32rem' }}>→ {client.next_action}</div>}
    </div>
  )
}

function NewClientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', industry:'', stage:'Find', connector_name:'', fit_score:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const c = await createClient_({ ...form, fit_score: form.fit_score ? Number(form.fit_score) : null })
      onSave(c)
    } catch(e) { console.error(e) }
    setSaving(false)
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head"><div className="modal-title">New Client Record</div><button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="g2">
            <div className="form-group"><label className="form-label">Business name *</label><input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} autoFocus /></div>
            <div className="form-group"><label className="form-label">Industry & location</label><input className="form-input" value={form.industry} onChange={e=>set('industry',e.target.value)} /></div>
          </div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Stage</label><select className="form-select" value={form.stage} onChange={e=>set('stage',e.target.value)}>{PIPELINE_STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Connector</label><input className="form-input" value={form.connector_name} onChange={e=>set('connector_name',e.target.value)} /></div>
          </div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Fit score (0–100)</label><input className="form-input" type="number" min="0" max="100" value={form.fit_score} onChange={e=>set('fit_score',e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Lead leak stage</label><select className="form-select" value={form.lead_leak_stage||''} onChange={e=>set('lead_leak_stage',e.target.value)}><option value="">Not assessed</option>{LEAK_STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Initial notes</label><textarea className="form-textarea" value={form.notes} onChange={e=>set('notes',e.target.value)} /></div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving||!form.name.trim()}>{saving?'Creating...':'Create client'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('board')
  const [showNew, setShowNew] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { getClients().then(d=>{setClients(d);setLoading(false)}).catch(()=>setLoading(false)) }, [])

  const filtered = clients.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()))
  const handleNew = (c) => { setClients(p=>[c,...p]); setShowNew(false) }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading pipeline...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Pipeline — Client Records</div>
        <div className="topbar-actions">
          <input className="form-input" style={{ width:200, padding:'.4rem .75rem' }} placeholder="Search clients..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div style={{ display:'flex', border:'.5px solid var(--border)', borderRadius:'6px', overflow:'hidden' }}>
            {['board','table','hot'].map(v=>(
              <button key={v} onClick={()=>setView(v)} className="btn" style={{ borderRadius:0, border:'none', background:view===v?'var(--dark)':'transparent', color:view===v?'var(--bg)':'var(--muted)' }}>
                {v==='board'?'Board':v==='table'?'Table':'🔥 Hot'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={()=>setShowNew(true)}>+ New client</button>
        </div>
      </div>
      <div className="page">
        {view === 'board' && Object.entries(STAGE_GROUPS).map(([group, stages]) => {
          const groupClients = filtered.filter(c => stages.includes(c.stage))
          if (groupClients.length === 0) return null
          return (
            <div key={group} style={{ marginBottom:'2rem' }}>
              <div style={{ fontSize:'.6rem', letterSpacing:'.2em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'1rem' }}>{group} <span style={{ background:'var(--border)', borderRadius:'10px', padding:'.1rem .45rem', fontSize:'.56rem' }}>{groupClients.length}</span></div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(stages.length,4)},1fr)`, gap:'1rem', overflowX:'auto' }}>
                {stages.map(stage => {
                  const sc = filtered.filter(c => c.stage === stage)
                  return (
                    <div key={stage} style={{ minWidth:200 }}>
                      <div style={{ fontSize:'.58rem', letterSpacing:'.12em', textTransform:'uppercase', color:STAGE_COLOR[stage]||'var(--muted)', fontWeight:500, marginBottom:'.625rem' }}>{stage} {sc.length > 0 && <span style={{ color:'var(--muted)', fontWeight:400 }}>({sc.length})</span>}</div>
                      {sc.map(c => <ClientCard key={c.id} client={c} onClick={()=>navigate(`/pipeline/${c.id}`)} />)}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {view === 'table' && (
          <div className="card">
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ borderBottom:'.5px solid var(--border)', background:'var(--bg)' }}>{['Client','Stage','Health','Fit Score','Leak','MRR','Next Action'].map(h=><th key={h} style={{ padding:'.625rem 1rem', textAlign:'left', fontSize:'.58rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(c=>(
                <tr key={c.id} onClick={()=>navigate(`/pipeline/${c.id}`)} style={{ borderBottom:'.5px solid var(--border)', cursor:'pointer' }}>
                  <td style={{ padding:'.625rem 1rem' }}><div style={{ fontWeight:500, fontSize:'.82rem' }}>{c.name}</div>{c.industry&&<div style={{ fontSize:'.68rem', color:'var(--muted)' }}>{c.industry}</div>}</td>
                  <td style={{ padding:'.625rem 1rem' }}><span className="badge badge-gray">{c.stage}</span></td>
                  <td style={{ padding:'.625rem 1rem', fontSize:'.8rem' }}>{c.health||'—'}</td>
                  <td style={{ padding:'.625rem 1rem' }}>{c.fit_score!=null?<span className="badge badge-gold">{c.fit_score}</span>:'—'}</td>
                  <td style={{ padding:'.625rem 1rem', fontSize:'.78rem', color:'var(--muted)' }}>{c.lead_leak_stage?.charAt(0)||'—'}</td>
                  <td style={{ padding:'.625rem 1rem', fontSize:'.78rem' }}>{c.mrr?`$${c.mrr.toLocaleString()}`:'—'}</td>
                  <td style={{ padding:'.625rem 1rem', fontSize:'.72rem', color:'var(--muted)', maxWidth:180 }} className="truncate">{c.next_action||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
            {filtered.length === 0 && <div className="empty"><div className="empty-title">No clients yet</div></div>}
          </div>
        )}
        {view === 'hot' && (
          <div>
            {filtered.filter(c=>(c.fit_score||0)>=75).sort((a,b)=>(b.fit_score||0)-(a.fit_score||0)).map(c=>(
              <div key={c.id} className="card" onClick={()=>navigate(`/pipeline/${c.id}`)} style={{ marginBottom:'.75rem', padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:'1rem', cursor:'pointer' }}>
                <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:'2.2rem', fontWeight:300, color:'var(--gold)', minWidth:48, textAlign:'center' }}>{c.fit_score}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize:'.88rem', marginBottom:'.2rem' }}>{c.name}</div>
                  <div style={{ fontSize:'.72rem', color:'var(--muted)' }}>{c.industry} · {c.stage}</div>
                  {c.next_action&&<div style={{ fontSize:'.7rem', color:'var(--gold)', marginTop:'.3rem' }}>→ {c.next_action}</div>}
                </div>
                {c.lead_leak_stage&&<span className="badge badge-amber">{c.lead_leak_stage}</span>}
              </div>
            ))}
            {filtered.filter(c=>(c.fit_score||0)>=75).length===0&&<div className="empty"><div className="empty-title">No hot leads</div><div className="empty-sub">Run the Audit Generator to score your prospects.</div></div>}
          </div>
        )}
      </div>
      {showNew && <NewClientModal onClose={()=>setShowNew(false)} onSave={handleNew} />}
    </div>
  )
}
