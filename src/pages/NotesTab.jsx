import React, { useState, useEffect, useRef } from 'react'
import {
  getClientMeetings, createClientMeeting, updateClientMeeting, deleteClientMeeting,
  getClientNotesList, createClientNote, updateClientNote, deleteClientNote,
  MEETING_TYPES
} from '../lib/supabase.js'

const API_PROXY = 'https://inara-api-proxy.maxine-44c.workers.dev'

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-NZ', { day:'numeric', month:'long', year:'numeric' })
}

export default function NotesTab({ clientId, clientName }) {
  const [meetings, setMeetings] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  // New meeting form
  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState(MEETING_TYPES[0])
  const [creatingMeeting, setCreatingMeeting] = useState(false)

  // Recording
  const [recordingId, setRecordingId] = useState(null)
  const [liveText, setLiveText] = useState('')
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)
  const isRecordingRef = useRef(false)
  const recordingIdRef = useRef(null)
  const liveTextRef = useRef('')

  // AI action items
  const [generatingFor, setGeneratingFor] = useState(null)

  // Expanded meetings
  const [expanded, setExpanded] = useState({})

  // Note forms
  const [noteForm, setNoteForm] = useState(null) // { type: 'remember'|'handover' }
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [editingMeeting, setEditingMeeting] = useState(null)

  useEffect(() => {
    Promise.all([getClientMeetings(clientId), getClientNotesList(clientId)])
      .then(([m, n]) => { setMeetings(m); setNotes(n) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId])

  useEffect(() => { liveTextRef.current = liveText }, [liveText])

  /* ── Meetings ── */
  const handleCreateMeeting = async () => {
    if (!newTitle.trim() || creatingMeeting) return
    setCreatingMeeting(true)
    try {
      const m = await createClientMeeting({
        client_id: clientId,
        title: newTitle.trim(),
        meeting_type: newType,
        meeting_date: new Date().toISOString().split('T')[0],
      })
      setMeetings(prev => [m, ...prev])
      setExpanded(prev => ({ ...prev, [m.id]: true }))
      setNewTitle('')
      setNewType(MEETING_TYPES[0])
      setShowNewMeeting(false)
    } catch (e) { console.error(e) }
    setCreatingMeeting(false)
  }

  const deleteMeeting = async (mid) => {
    if (!window.confirm('Delete this meeting?')) return
    await deleteClientMeeting(mid).catch(console.error)
    setMeetings(prev => prev.filter(m => m.id !== mid))
  }

  const saveMeetingField = async (mid, field, value) => {
    setMeetings(prev => prev.map(m => m.id === mid ? { ...m, [field]: value } : m))
    await updateClientMeeting(mid, { [field]: value }).catch(console.error)
    setEditingMeeting(null)
  }

  /* ── Recording ── */
  const startRecording = (mid) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Recording requires Chrome or Edge.'); return }
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-NZ'
    r.onresult = (e) => {
      let final = '', interimT = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t + ' '
        else interimT += t
      }
      if (final) setLiveText(prev => { const u = prev + final; liveTextRef.current = u; return u })
      setInterim(interimT)
    }
    r.onerror = (ev) => {
      if (ev.error !== 'no-speech') { isRecordingRef.current = false; recordingIdRef.current = null; setRecordingId(null); setInterim('') }
    }
    r.onend = () => { if (isRecordingRef.current) r.start() }
    isRecordingRef.current = true
    recordingIdRef.current = mid
    r.start()
    recognitionRef.current = r
    setRecordingId(mid)
    setLiveText('')
    liveTextRef.current = ''
    setInterim('')
  }

  const stopRecording = () => {
    const mid = recordingIdRef.current
    const finalText = liveTextRef.current
    isRecordingRef.current = false
    recognitionRef.current?.stop()
    setRecordingId(null)
    recordingIdRef.current = null
    setInterim('')
    if (!finalText.trim() || !mid) { setLiveText(''); liveTextRef.current = ''; return }
    setMeetings(prev => {
      const meeting = prev.find(m => m.id === mid)
      if (!meeting) return prev
      const existing = meeting.transcript?.trim() || ''
      const ts = new Date().toLocaleString('en-NZ', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' })
      const newTranscript = existing ? `${existing}\n\n--- Continued ${ts} ---\n${finalText.trim()}` : finalText.trim()
      updateClientMeeting(mid, { transcript: newTranscript }).catch(console.error)
      return prev.map(m => m.id === mid ? { ...m, transcript: newTranscript } : m)
    })
    setLiveText('')
    liveTextRef.current = ''
  }

  /* ── AI action items ── */
  const generateActionItems = async (meeting) => {
    if (!meeting.transcript?.trim() || generatingFor) return
    setGeneratingFor(meeting.id)
    try {
      const prompt = `Review this meeting transcript and extract a numbered action item list. Each item should be specific and actionable.\n\nMeeting: ${meeting.title} (${meeting.meeting_type})\nClient: ${clientName || 'Client'}\n\nTranscript:\n${meeting.transcript}\n\nReturn ONLY the numbered action items.`
      const res = await fetch(`${API_PROXY}/v1/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 800, messages: [{ role:'user', content: prompt }] })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message || 'API error')
      const items = json.content?.[0]?.text?.trim() || ''
      if (items) {
        await updateClientMeeting(meeting.id, { action_items: items })
        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, action_items: items } : m))
      }
    } catch (e) { console.error(e) }
    setGeneratingFor(null)
  }

  /* ── Notes ── */
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || savingNote) return
    setSavingNote(true)
    try {
      const n = await createClientNote({ client_id: clientId, note_type: noteForm.type, title: noteTitle.trim(), content: noteContent.trim() })
      setNotes(prev => [n, ...prev])
      setNoteTitle('')
      setNoteContent('')
      setNoteForm(null)
    } catch (e) { console.error(e) }
    setSavingNote(false)
  }

  const saveNoteEdit = async (nid, title, content) => {
    setNotes(prev => prev.map(n => n.id === nid ? { ...n, title, content } : n))
    await updateClientNote(nid, { title, content }).catch(console.error)
    setEditingNote(null)
  }

  const deleteNote = async (nid) => {
    if (!window.confirm('Delete this note?')) return
    await deleteClientNote(nid).catch(console.error)
    setNotes(prev => prev.filter(n => n.id !== nid))
  }

  if (loading) return <div className="loading"><div className="spinner"></div>Loading…</div>

  const rememberNotes = notes.filter(n => n.note_type === 'remember')
  const handoverNotes = notes.filter(n => n.note_type === 'handover')

  /* ── Sub-components ── */
  function NoteCard({ note }) {
    const isEditing = editingNote?.id === note.id
    const [eTitle, setETitle] = useState(note.title)
    const [eContent, setEContent] = useState(note.content || '')
    if (isEditing) return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'.875rem', marginBottom:'.5rem' }}>
        <input className="form-input" style={{ marginBottom:'.5rem', fontWeight:500, fontSize:'.82rem' }} value={eTitle} onChange={e=>setETitle(e.target.value)} placeholder="Title"/>
        <textarea className="form-textarea" style={{ minHeight:72, fontSize:'.78rem' }} value={eContent} onChange={e=>setEContent(e.target.value)} placeholder="Content…"/>
        <div style={{ display:'flex', gap:'.35rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
          <button className="btn btn-ghost btn-xs" onClick={()=>setEditingNote(null)}>Cancel</button>
          <button className="btn btn-primary btn-xs" onClick={()=>saveNoteEdit(note.id,eTitle,eContent)}>Save</button>
        </div>
      </div>
    )
    return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'8px', padding:'.875rem', marginBottom:'.5rem', cursor:'default' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
      >
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'.5rem' }}>
          <div style={{ fontWeight:600, fontSize:'.84rem', color:'var(--dark)', lineHeight:1.3 }}>{note.title}</div>
          <div style={{ display:'flex', gap:'.25rem', flexShrink:0 }}>
            <button className="btn btn-ghost btn-xs" onClick={()=>setEditingNote(note)}>Edit</button>
            <button className="btn btn-danger btn-xs" onClick={()=>deleteNote(note.id)}>✕</button>
          </div>
        </div>
        {note.content && <div style={{ fontSize:'.76rem', color:'var(--dark2)', lineHeight:1.6, whiteSpace:'pre-wrap', marginTop:'.35rem' }}>{note.content}</div>}
        <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:'.5rem' }}>{fmtDate(note.created_at)}</div>
      </div>
    )
  }

  function MeetingCard({ meeting }) {
    const isOpen = expanded[meeting.id]
    const isRecording = recordingId === meeting.id
    const isEditingT = editingMeeting?.id === meeting.id && editingMeeting?.field === 'transcript'
    const [localT, setLocalT] = useState(meeting.transcript || '')

    return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'8px', marginBottom:'.5rem', overflow:'hidden' }}
        onMouseEnter={e=>{ if(!isOpen) e.currentTarget.style.borderColor='var(--gold)' }}
        onMouseLeave={e=>{ if(!isOpen) e.currentTarget.style.borderColor='var(--border)' }}
      >
        <div onClick={()=>setExpanded(p=>({...p,[meeting.id]:!p[meeting.id]}))} style={{ padding:'.875rem', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'.5rem' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:'.84rem', color:'var(--dark)', lineHeight:1.3 }}>{meeting.title}</div>
              <div style={{ fontSize:'.66rem', color:'var(--muted)', marginTop:'.2rem' }}>{meeting.meeting_type} · {fmtDate(meeting.meeting_date)}</div>
              {(meeting.transcript || meeting.action_items) && (
                <div style={{ display:'flex', gap:'.3rem', marginTop:'.35rem', flexWrap:'wrap' }}>
                  {meeting.transcript && <span style={{ fontSize:'.58rem', padding:'.1rem .4rem', borderRadius:'20px', background:'var(--teal-bg)', color:'var(--teal)', border:'.5px solid var(--teal-b)' }}>Transcript</span>}
                  {meeting.action_items && <span style={{ fontSize:'.58rem', padding:'.1rem .4rem', borderRadius:'20px', background:'var(--gold-bg)', color:'var(--amber)', border:'.5px solid var(--gold-b)' }}>Actions</span>}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:'.25rem', flexShrink:0, alignItems:'center' }}>
              {isRecording && <span style={{ display:'flex', alignItems:'center', gap:'.3rem', fontSize:'.62rem', color:'var(--red)' }}><span style={{ width:6,height:6,borderRadius:'50%',background:'var(--red)',display:'inline-block',animation:'spin .9s linear infinite' }}/>Rec</span>}
              <button onClick={e=>{e.stopPropagation();deleteMeeting(meeting.id)}} className="btn btn-danger btn-xs">✕</button>
              <span style={{ color:'var(--muted)', fontSize:'.85rem', transform:isOpen?'rotate(90deg)':'none', transition:'transform .15s', display:'inline-block' }}>›</span>
            </div>
          </div>
        </div>

        {isOpen && (
          <div style={{ padding:'.875rem', borderTop:'.5px solid var(--border)', display:'flex', flexDirection:'column', gap:'.875rem' }}>
            {/* Record */}
            <div>
              <div style={{ fontSize:'.52rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'.4rem' }}>Recording</div>
              <div style={{ display:'flex', gap:'.5rem', flexWrap:'wrap', alignItems:'center' }}>
                {!isRecording
                  ? <button className="btn btn-primary btn-xs" onClick={()=>startRecording(meeting.id)}>● Record</button>
                  : <button className="btn btn-xs" onClick={stopRecording} style={{ background:'var(--red)', color:'white', borderColor:'var(--red)' }}>■ Stop</button>
                }
                {meeting.transcript && !isRecording && (
                  <button className="btn btn-gold btn-xs" onClick={()=>generateActionItems(meeting)} disabled={!!generatingFor}>
                    {generatingFor===meeting.id ? '…' : '✦ Action items'}
                  </button>
                )}
              </div>
              {isRecording && (
                <div style={{ marginTop:'.5rem', background:'var(--bg)', border:'.5px solid var(--border)', borderRadius:'6px', padding:'.625rem', maxHeight:120, overflowY:'auto', fontSize:'.76rem', lineHeight:1.6 }}>
                  <span style={{ color:'var(--dark)', whiteSpace:'pre-wrap' }}>{liveText}</span>
                  {interim && <span style={{ color:'var(--muted)', fontStyle:'italic' }}>{interim}</span>}
                  {!liveText && !interim && <span style={{ color:'var(--muted)', fontStyle:'italic' }}>Listening…</span>}
                </div>
              )}
            </div>

            {/* Transcript */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.3rem' }}>
                <div style={{ fontSize:'.52rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>Transcript / notes</div>
                {!isEditingT && <button className="btn btn-ghost btn-xs" onClick={()=>{setLocalT(meeting.transcript||'');setEditingMeeting({id:meeting.id,field:'transcript'})}}>Edit</button>}
              </div>
              {isEditingT
                ? <div><textarea className="form-textarea" style={{ minHeight:120, fontSize:'.76rem' }} value={localT} onChange={e=>setLocalT(e.target.value)}/>
                    <div style={{ display:'flex', gap:'.35rem', justifyContent:'flex-end', marginTop:'.35rem' }}>
                      <button className="btn btn-ghost btn-xs" onClick={()=>setEditingMeeting(null)}>Cancel</button>
                      <button className="btn btn-primary btn-xs" onClick={()=>saveMeetingField(meeting.id,'transcript',localT)}>Save</button>
                    </div>
                  </div>
                : meeting.transcript
                  ? <div style={{ fontSize:'.76rem', color:'var(--dark2)', lineHeight:1.65, whiteSpace:'pre-wrap', background:'var(--bg)', borderRadius:'6px', padding:'.625rem', border:'.5px solid var(--border)', maxHeight:180, overflowY:'auto' }}>{meeting.transcript}</div>
                  : <div style={{ fontSize:'.74rem', color:'var(--muted)', fontStyle:'italic' }}>No transcript yet — record above or click Edit to paste.</div>
              }
            </div>

            {/* Action items */}
            {meeting.action_items && (
              <div>
                <div style={{ fontSize:'.52rem', letterSpacing:'.15em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'.3rem' }}>Action items</div>
                <div style={{ background:'var(--gold-bg)', border:'.5px solid var(--gold-b)', borderRadius:'6px', padding:'.75rem' }}>
                  <pre style={{ fontSize:'.76rem', color:'var(--dark2)', lineHeight:1.75, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{meeting.action_items}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  function NoteColumn({ type, label, colNotes }) {
    const isOpen = noteForm?.type === type
    return (
      <div style={{ flex:1, minWidth:0 }}>
        {/* Column header */}
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.625rem' }}>
          <span style={{ fontSize:'.72rem', fontWeight:600, color:'var(--muted)', letterSpacing:'.04em' }}>{label}</span>
          <span style={{ fontSize:'.68rem', color:'var(--muted)', fontWeight:400 }}>{colNotes.length}</span>
        </div>

        {/* Add note form */}
        {isOpen && (
          <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'.875rem', marginBottom:'.5rem' }}>
            <input className="form-input" style={{ marginBottom:'.5rem', fontSize:'.82rem', fontWeight:500 }} value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder="Note title…" autoFocus onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSaveNote()}/>
            <textarea className="form-textarea" style={{ minHeight:72, fontSize:'.78rem' }} value={noteContent} onChange={e=>setNoteContent(e.target.value)} placeholder="Content…"/>
            <div style={{ display:'flex', gap:'.35rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
              <button className="btn btn-ghost btn-xs" onClick={()=>setNoteForm(null)}>Cancel</button>
              <button className="btn btn-primary btn-xs" onClick={handleSaveNote} disabled={savingNote||!noteTitle.trim()}>{savingNote?'…':'Save'}</button>
            </div>
          </div>
        )}

        {/* Cards */}
        {colNotes.map(n => <NoteCard key={n.id} note={n}/>)}

        {/* Empty */}
        {colNotes.length === 0 && !isOpen && (
          <div style={{ textAlign:'center', padding:'1.25rem .5rem', color:'var(--border)', fontSize:'.7rem' }}>—</div>
        )}

        {/* Add button */}
        <button
          onClick={()=>{ if(isOpen){setNoteForm(null)}else{setNoteForm({type});setNoteTitle('');setNoteContent('')} }}
          style={{ width:'100%', background:'none', border:'none', padding:'.35rem .1rem', color:'var(--muted)', fontSize:'.7rem', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'.3rem', opacity:.6 }}
          onMouseEnter={e=>e.currentTarget.style.opacity=1}
          onMouseLeave={e=>e.currentTarget.style.opacity=.6}
        >
          <span style={{ fontSize:'.85rem', lineHeight:1 }}>+</span> {isOpen ? 'Cancel' : 'Add note'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', gap:'1.25rem', alignItems:'flex-start', height:'100%' }}>

      {/* ── Meetings column ── */}
      <div style={{ flex:1.2, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.625rem' }}>
          <span style={{ fontSize:'.72rem', fontWeight:600, color:'var(--muted)', letterSpacing:'.04em' }}>Meetings</span>
          <span style={{ fontSize:'.68rem', color:'var(--muted)', fontWeight:400 }}>{meetings.length}</span>
        </div>

        {showNewMeeting && (
          <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'.875rem', marginBottom:'.5rem' }}>
            <input className="form-input" style={{ marginBottom:'.5rem', fontSize:'.82rem', fontWeight:500 }} value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Meeting title…" autoFocus onKeyDown={e=>e.key==='Enter'&&handleCreateMeeting()}/>
            <select className="form-select" style={{ marginBottom:'.5rem', fontSize:'.78rem' }} value={newType} onChange={e=>setNewType(e.target.value)}>
              {MEETING_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
            <div style={{ display:'flex', gap:'.35rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost btn-xs" onClick={()=>setShowNewMeeting(false)}>Cancel</button>
              <button className="btn btn-primary btn-xs" onClick={handleCreateMeeting} disabled={creatingMeeting||!newTitle.trim()}>{creatingMeeting?'…':'Create'}</button>
            </div>
          </div>
        )}

        {meetings.map(m => <MeetingCard key={m.id} meeting={m}/>)}

        {meetings.length === 0 && !showNewMeeting && (
          <div style={{ textAlign:'center', padding:'1.25rem .5rem', color:'var(--border)', fontSize:'.7rem' }}>—</div>
        )}

        <button
          onClick={()=>{ setShowNewMeeting(v=>!v); setNewTitle(''); setNewType(MEETING_TYPES[0]) }}
          style={{ width:'100%', background:'none', border:'none', padding:'.35rem .1rem', color:'var(--muted)', fontSize:'.7rem', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'.3rem', opacity:.6 }}
          onMouseEnter={e=>e.currentTarget.style.opacity=1}
          onMouseLeave={e=>e.currentTarget.style.opacity=.6}
        >
          <span style={{ fontSize:'.85rem', lineHeight:1 }}>+</span> {showNewMeeting ? 'Cancel' : 'New meeting'}
        </button>
      </div>

      {/* ── Notes to Remember column ── */}
      <NoteColumn type="remember" label="Notes to remember" colNotes={rememberNotes}/>

      {/* ── Handover Notes column ── */}
      <NoteColumn type="handover" label="Handover notes" colNotes={handoverNotes}/>

    </div>
  )
}
