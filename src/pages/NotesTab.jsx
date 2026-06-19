import React, { useState, useEffect, useRef } from 'react'
import {
  getClientMeetings, createClientMeeting, updateClientMeeting, deleteClientMeeting,
  getClientNotesList, createClientNote, updateClientNote, deleteClientNote,
  MEETING_TYPES
} from '../lib/supabase.js'

const API_PROXY = 'https://inara-api-proxy.maxine-44c.workers.dev'

function fmtDate(str) {
  if (!str) return ''
  return new Date(str).toLocaleDateString('en-NZ', { day:'numeric', month:'short', year:'numeric' })
}

function SectionHeader({ title, count, action }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.875rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'.625rem' }}>
        <div style={{ fontSize:'.56rem', letterSpacing:'.2em', textTransform:'uppercase', fontWeight:600, color:'var(--muted)' }}>{title}</div>
        {count > 0 && <span style={{ background:'var(--border)', color:'var(--muted)', borderRadius:'20px', fontSize:'.58rem', padding:'.1rem .45rem', fontWeight:500 }}>{count}</span>}
      </div>
      {action}
    </div>
  )
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

  // Note form
  const [noteForm, setNoteForm] = useState(null) // { type: 'remember'|'handover' }
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Editing notes / meetings inline
  const [editingNote, setEditingNote] = useState(null)
  const [editingMeeting, setEditingMeeting] = useState(null) // { id, field, value }

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
      if (final) {
        setLiveText(prev => {
          const updated = prev + final
          liveTextRef.current = updated
          return updated
        })
      }
      setInterim(interimT)
    }

    r.onerror = (ev) => {
      if (ev.error !== 'no-speech') {
        isRecordingRef.current = false
        recordingIdRef.current = null
        setRecordingId(null)
        setInterim('')
      }
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
      const newTranscript = existing
        ? `${existing}\n\n--- Continued ${ts} ---\n${finalText.trim()}`
        : finalText.trim()
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
      const prompt = `You are an assistant for a marketing agency. Review this meeting transcript and extract a clear action item list. Format as a numbered list. Each item should be specific and actionable.

Meeting: ${meeting.title} (${meeting.meeting_type}) on ${meeting.meeting_date}
Client: ${clientName || 'Client'}

Transcript:
${meeting.transcript}

Return ONLY the numbered action items, nothing else.`

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
    } catch (e) { console.error('Action items error:', e) }
    setGeneratingFor(null)
  }

  /* ── Notes ── */
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || savingNote) return
    setSavingNote(true)
    try {
      const n = await createClientNote({
        client_id: clientId,
        note_type: noteForm.type,
        title: noteTitle.trim(),
        content: noteContent.trim(),
      })
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

  if (loading) return <div className="loading"><div className="spinner"></div>Loading notes…</div>

  const rememberNotes = notes.filter(n => n.note_type === 'remember')
  const handoverNotes = notes.filter(n => n.note_type === 'handover')

  const NoteCard = ({ note }) => {
    const isEditing = editingNote?.id === note.id
    const [editTitle, setEditTitle] = useState(note.title)
    const [editContent, setEditContent] = useState(note.content || '')

    if (isEditing) return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'1rem' }}>
        <input className="form-input" style={{ marginBottom:'.5rem', fontWeight:500 }} value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Note title"/>
        <textarea className="form-textarea" style={{ minHeight:80 }} value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Note content…"/>
        <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end', marginTop:'.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingNote(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => saveNoteEdit(note.id, editTitle, editContent)}>Save</button>
        </div>
      </div>
    )

    return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'8px', padding:'.875rem 1rem' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'.5rem', marginBottom: note.content ? '.4rem' : 0 }}>
          <div style={{ fontWeight:500, fontSize:'.84rem', color:'var(--dark)' }}>{note.title}</div>
          <div style={{ display:'flex', gap:'.3rem', flexShrink:0 }}>
            <button className="btn btn-ghost btn-xs" onClick={() => setEditingNote(note)}>Edit</button>
            <button className="btn btn-danger btn-xs" onClick={() => deleteNote(note.id)}>✕</button>
          </div>
        </div>
        {note.content && <div style={{ fontSize:'.78rem', color:'var(--dark2)', lineHeight:1.65, whiteSpace:'pre-wrap' }}>{note.content}</div>}
        <div style={{ fontSize:'.6rem', color:'var(--muted)', marginTop:'.5rem' }}>{fmtDate(note.created_at)}</div>
      </div>
    )
  }

  const MeetingCard = ({ meeting }) => {
    const isOpen = expanded[meeting.id]
    const isRecording = recordingId === meeting.id
    const isEditingTranscript = editingMeeting?.id === meeting.id && editingMeeting?.field === 'transcript'
    const [localTranscript, setLocalTranscript] = useState(meeting.transcript || '')

    return (
      <div style={{ background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'10px', overflow:'hidden' }}>
        {/* Meeting header */}
        <div
          onClick={() => setExpanded(prev => ({ ...prev, [meeting.id]: !prev[meeting.id] }))}
          style={{ padding:'.875rem 1.25rem', display:'flex', alignItems:'center', gap:'.875rem', cursor:'pointer' }}
        >
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:500, fontSize:'.88rem', color:'var(--dark)' }}>{meeting.title}</div>
            <div style={{ display:'flex', gap:'.5rem', alignItems:'center', marginTop:'.18rem', flexWrap:'wrap' }}>
              <span style={{ fontSize:'.66rem', color:'var(--muted)' }}>{meeting.meeting_type}</span>
              <span style={{ fontSize:'.6rem', color:'var(--muted)' }}>·</span>
              <span style={{ fontSize:'.66rem', color:'var(--muted)' }}>{fmtDate(meeting.meeting_date)}</span>
              {meeting.transcript && <span style={{ background:'var(--teal-bg)', color:'var(--teal)', border:'.5px solid var(--teal-b)', borderRadius:'20px', fontSize:'.58rem', padding:'.1rem .45rem' }}>Transcript</span>}
              {meeting.action_items && <span style={{ background:'var(--gold-bg)', color:'var(--amber)', border:'.5px solid var(--gold-b)', borderRadius:'20px', fontSize:'.58rem', padding:'.1rem .45rem' }}>Actions</span>}
            </div>
          </div>
          {isRecording && (
            <span style={{ display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.68rem', color:'var(--red)', flexShrink:0 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)', display:'inline-block', animation:'spin .9s linear infinite' }}/>
              Recording
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); deleteMeeting(meeting.id) }}
            className="btn btn-danger btn-xs"
            style={{ flexShrink:0 }}
          >✕</button>
          <span style={{ color:'var(--muted)', fontSize:'.9rem', flexShrink:0, transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform .15s' }}>›</span>
        </div>

        {/* Meeting body */}
        {isOpen && (
          <div style={{ padding:'1.25rem', borderTop:'.5px solid var(--border)', display:'flex', flexDirection:'column', gap:'1rem' }}>

            {/* Record controls */}
            <div style={{ background:'var(--bg)', borderRadius:'8px', padding:'.875rem 1rem', border:'.5px solid var(--border)' }}>
              <div style={{ fontSize:'.56rem', letterSpacing:'.16em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'.5rem' }}>Meeting recording</div>
              <div style={{ display:'flex', gap:'.625rem', alignItems:'center', flexWrap:'wrap' }}>
                {!isRecording
                  ? <button className="btn btn-primary btn-sm" onClick={() => startRecording(meeting.id)}>● Record meeting</button>
                  : <button
                      className="btn btn-sm"
                      onClick={stopRecording}
                      style={{ background:'var(--red)', color:'white', borderColor:'var(--red)' }}
                    >■ Stop recording</button>
                }
                {meeting.transcript && !isRecording && !generatingFor && (
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => generateActionItems(meeting)}
                    disabled={!!generatingFor}
                  >✦ Generate action items</button>
                )}
                {generatingFor === meeting.id && (
                  <span style={{ display:'flex', alignItems:'center', gap:'.4rem', fontSize:'.72rem', color:'var(--muted)' }}>
                    <div className="spinner" style={{ width:14, height:14 }}/>Generating…
                  </span>
                )}
              </div>

              {/* Live transcript preview while recording */}
              {isRecording && (
                <div style={{ marginTop:'.625rem', background:'var(--warm)', border:'.5px solid var(--border)', borderRadius:'6px', padding:'.75rem', maxHeight:160, overflowY:'auto' }}>
                  <span style={{ fontSize:'.8rem', color:'var(--dark)', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{liveText}</span>
                  {interim && <span style={{ fontSize:'.8rem', color:'var(--muted)', fontStyle:'italic' }}>{interim}</span>}
                  {!liveText && !interim && <span style={{ fontSize:'.78rem', color:'var(--muted)', fontStyle:'italic' }}>Listening… speak clearly</span>}
                </div>
              )}
            </div>

            {/* Transcript */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'.4rem' }}>
                <div style={{ fontSize:'.56rem', letterSpacing:'.16em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500 }}>Transcript / notes</div>
                {!isEditingTranscript && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => { setLocalTranscript(meeting.transcript || ''); setEditingMeeting({ id: meeting.id, field:'transcript' }) }}
                  >Edit</button>
                )}
              </div>
              {isEditingTranscript
                ? (
                  <div>
                    <textarea
                      className="form-textarea"
                      style={{ minHeight:140 }}
                      value={localTranscript}
                      onChange={e => setLocalTranscript(e.target.value)}
                    />
                    <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end', marginTop:'.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingMeeting(null)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={() => saveMeetingField(meeting.id, 'transcript', localTranscript)}>Save</button>
                    </div>
                  </div>
                )
                : meeting.transcript
                  ? <div style={{ fontSize:'.8rem', color:'var(--dark2)', lineHeight:1.7, whiteSpace:'pre-wrap', background:'var(--bg)', borderRadius:'6px', padding:'.75rem', border:'.5px solid var(--border)', maxHeight:240, overflowY:'auto' }}>{meeting.transcript}</div>
                  : <div style={{ fontSize:'.78rem', color:'var(--muted)', fontStyle:'italic' }}>No transcript yet — record the meeting above, or click Edit to paste notes.</div>
              }
            </div>

            {/* Action items */}
            {meeting.action_items && (
              <div>
                <div style={{ fontSize:'.56rem', letterSpacing:'.16em', textTransform:'uppercase', color:'var(--muted)', fontWeight:500, marginBottom:'.4rem' }}>Action items</div>
                <div style={{ background:'var(--gold-bg)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'.875rem 1rem' }}>
                  <pre style={{ fontSize:'.8rem', color:'var(--dark2)', lineHeight:1.75, whiteSpace:'pre-wrap', fontFamily:'inherit', margin:0 }}>{meeting.action_items}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const NoteSection = ({ type, label, sectionNotes }) => {
    const isOpen = noteForm?.type === type
    return (
      <div style={{ marginBottom:'2rem' }}>
        <SectionHeader
          title={label}
          count={sectionNotes.length}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => { if (isOpen) { setNoteForm(null) } else { setNoteForm({ type }); setNoteTitle(''); setNoteContent('') } }}>
              {isOpen ? 'Cancel' : '+ Add note'}
            </button>
          }
        />

        {isOpen && (
          <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'1rem', marginBottom:'.75rem' }}>
            <div className="form-group" style={{ marginBottom:'.625rem' }}>
              <label className="form-label">Title</label>
              <input className="form-input" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note title…" autoFocus onKeyDown={e => e.key === 'Enter' && !e.shiftKey && noteContent === '' && handleSaveNote()}/>
            </div>
            <div className="form-group" style={{ marginBottom:'.625rem' }}>
              <label className="form-label">Content</label>
              <textarea className="form-textarea" style={{ minHeight:80 }} value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Note details…"/>
            </div>
            <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setNoteForm(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveNote} disabled={savingNote || !noteTitle.trim()}>
                {savingNote ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        )}

        {sectionNotes.length === 0 && !isOpen && (
          <div style={{ fontSize:'.78rem', color:'var(--muted)', fontStyle:'italic', padding:'.5rem 0' }}>No {label.toLowerCase()} yet.</div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'.625rem' }}>
          {sectionNotes.map(n => <NoteCard key={n.id} note={n} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>

      {/* ── Meetings ── */}
      <div style={{ marginBottom:'2rem' }}>
        <SectionHeader
          title="Meetings"
          count={meetings.length}
          action={
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewMeeting(v => !v); setNewTitle(''); setNewType(MEETING_TYPES[0]) }}>
              {showNewMeeting ? 'Cancel' : '+ New meeting'}
            </button>
          }
        />

        {showNewMeeting && (
          <div style={{ background:'var(--warm)', border:'.5px solid var(--gold-b)', borderRadius:'8px', padding:'1rem', marginBottom:'.75rem' }}>
            <div className="g2" style={{ marginBottom:'.625rem' }}>
              <div className="form-group">
                <label className="form-label">Meeting title</label>
                <input className="form-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Discovery call with Sarah" autoFocus onKeyDown={e => e.key === 'Enter' && handleCreateMeeting()}/>
              </div>
              <div className="form-group">
                <label className="form-label">Meeting type</label>
                <select className="form-select" value={newType} onChange={e => setNewType(e.target.value)}>
                  {MEETING_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'.4rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewMeeting(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreateMeeting} disabled={creatingMeeting || !newTitle.trim()}>
                {creatingMeeting ? 'Creating…' : 'Create meeting'}
              </button>
            </div>
          </div>
        )}

        {meetings.length === 0 && !showNewMeeting && (
          <div style={{ fontSize:'.78rem', color:'var(--muted)', fontStyle:'italic', padding:'.5rem 0' }}>No meetings logged yet.</div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
          {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      </div>

      <div style={{ height:'.5px', background:'var(--border)', marginBottom:'2rem' }}/>

      <NoteSection type="remember" label="Notes to remember" sectionNotes={rememberNotes} />

      <div style={{ height:'.5px', background:'var(--border)', marginBottom:'2rem' }}/>

      <NoteSection type="handover" label="Handover notes" sectionNotes={handoverNotes} />

    </div>
  )
}
