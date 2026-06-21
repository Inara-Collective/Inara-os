import React, { useState, useRef } from 'react'

// ── Transcription via Cloudflare Worker ────────────────────────────────────────
//
// SETUP — 3 steps:
//
//   1. .env.local:
//        VITE_AI_WORKER_URL=https://your-worker.workers.dev
//
//   2. Create a Cloudflare Worker (workers.cloudflare.com) with a POST /transcribe
//      route. The Worker receives the audio file, calls your chosen API, and
//      returns { transcript: "..." }. Store the API key as a Worker secret only —
//      never in this file.
//
//   3. Pick a transcription service (sign up, get an API key, add it to the Worker):
//        • OpenAI Whisper  → platform.openai.com/api-keys   ($0.006/min, very accurate)
//        • AssemblyAI      → assemblyai.com/app/api-keys    (free tier, good NZ English)
//        • Deepgram Nova   → deepgram.com/signup            (fast, clean punctuation)
//
const WORKER_URL = import.meta.env.VITE_AI_WORKER_URL // ← set in .env.local

async function transcribeViaWorker(file) {
  if (!WORKER_URL) throw new Error('Set VITE_AI_WORKER_URL in .env.local to enable transcription.')
  const form = new FormData()
  form.append('file', file, file.name)
  const res = await fetch(`${WORKER_URL}/transcribe`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Worker error (${res.status}): ${await res.text().catch(() => res.statusText)}`)
  const json = await res.json()
  return json.transcript ?? json.text ?? ''
}

// ── Seed data ──────────────────────────────────────────────────────────────────
const SEED_MEETINGS = [
  {
    id: 1,
    title: 'Monthly Strategy Review',
    date: new Date(2026, 5, 25, 10, 0),
    attendees: [
      { id: 'a1', name: 'Maxine Reid',    initials: 'MR', color: '#424B63' },
      { id: 'a2', name: 'Tanya Hicks',    initials: 'TH', color: '#8B5CBE' },
      { id: 'a3', name: 'Jared Thompson', initials: 'JT', color: '#4A90B8' },
    ],
    agenda: [
      'Review June content performance metrics',
      'Plan July content calendar and themes',
      'Discuss Demo Day follow-up campaign',
      'Website SEO — quick wins and priorities',
    ],
    notes: '',
    actionItems: [],
    summary: '',
    recordingUrl: '',
    transcript: '',
    consentGiven: false,
    recordingFile: null,
    recordingObjectUrl: null,
  },
  {
    id: 2,
    title: 'Content Planning Catchup',
    date: new Date(2026, 5, 30, 14, 0),
    attendees: [
      { id: 'a1', name: 'Maxine Reid',   initials: 'MR', color: '#424B63' },
      { id: 'a4', name: 'Sarah Connell', initials: 'SC', color: '#BABEAF' },
    ],
    agenda: [
      'Review June newsletter draft',
      'Approve BTS video concept for July',
      'Confirm posting schedule for next fortnight',
    ],
    notes: '',
    actionItems: [],
    summary: '',
    recordingUrl: '',
    transcript: '',
    consentGiven: false,
    recordingFile: null,
    recordingObjectUrl: null,
  },
  {
    id: 3,
    title: 'Onboarding Call',
    date: new Date(2026, 5, 5, 9, 30),
    attendees: [
      { id: 'a1', name: 'Maxine Reid',    initials: 'MR', color: '#424B63' },
      { id: 'a3', name: 'Jared Thompson', initials: 'JT', color: '#4A90B8' },
      { id: 'a5', name: 'Lisa Park',      initials: 'LP', color: '#C0392B' },
    ],
    agenda: [
      'Introductions and team overview',
      'Review business goals and growth targets',
      'Walk through the Inara Collective process',
      'Set up communication channels and access',
    ],
    notes: 'Jared wants to focus heavily on Instagram for the first 60 days — strong existing following there. Lisa manages day-to-day and is the key contact for content approvals. Monthly budget confirmed at $3,800. Contract signed and sent.',
    actionItems: [
      { id: 'ai1', text: 'Send welcome pack and onboarding checklist', assignee: 'Maxine',      done: true  },
      { id: 'ai2', text: 'Get access to existing social accounts',      assignee: 'Lisa Park',   done: true  },
      { id: 'ai3', text: 'Set up ClickUp board and invite client',      assignee: 'Tanya Hicks', done: true  },
      { id: 'ai4', text: 'Draft first content calendar for approval',   assignee: 'Maxine',      done: false },
    ],
    summary: 'Strong onboarding call — client is energised and clear on their goals. Key focus for Stage 1 is building Instagram presence and establishing a consistent posting rhythm. Jared and Lisa are both engaged. Next step is sending the content calendar draft by end of week.',
    recordingUrl: '',
    transcript: '',
    consentGiven: true,
    recordingFile: null,
    recordingObjectUrl: null,
  },
  {
    id: 4,
    title: 'Mid-month Check-in',
    date: new Date(2026, 5, 13, 11, 0),
    attendees: [
      { id: 'a1', name: 'Maxine Reid',    initials: 'MR', color: '#424B63' },
      { id: 'a3', name: 'Jared Thompson', initials: 'JT', color: '#4A90B8' },
    ],
    agenda: [
      'Content performance so far this month',
      'Showroom post thumbnail approval',
      'Demo Day planning',
    ],
    notes: 'Jared very happy with the BTS video — 847 likes, best performing post since launch. He wants more video content in the mix. Showroom changes post still needs thumbnail approval before scheduling.',
    actionItems: [
      { id: 'ai5', text: 'Book approval call for showroom post thumbnail', assignee: 'Maxine',      done: true  },
      { id: 'ai6', text: 'Create Demo Day social campaign brief',          assignee: 'Tanya Hicks', done: true  },
      { id: 'ai7', text: 'Investigate reel format for next BTS video',     assignee: 'Tanya Hicks', done: false },
    ],
    summary: 'Positive check-in. Client is pleased with early results. All action items captured. Next full strategy review is 25 June.',
    recordingUrl: 'https://meet.google.com/recordings/abc123-placeholder',
    transcript: '',
    consentGiven: true,
    recordingFile: null,
    recordingObjectUrl: null,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtShort(d) {
  return d.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' · ' + d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function daysLabel(d) {
  const diff = Math.ceil((d - new Date()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff > 1 && diff <= 14) return `In ${diff} days`
  return null
}

function toInputDt(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const AV_COLORS = ['#424B63','#8B5CBE','#4A90B8','#C0392B','#D4A843','#3A5A36']

// ── Tiny components ────────────────────────────────────────────────────────────
function Av({ person, lg }) {
  const s = lg ? 30 : 22
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: s, height: s, background: person.color, fontSize: lg ? '0.6rem' : '0.46rem' }}
      title={person.name}
    >
      {person.initials}
    </div>
  )
}

function AvatarStack({ attendees }) {
  const shown = attendees.slice(0, 4)
  const rest  = attendees.length - 4
  return (
    <div className="flex items-center">
      {shown.map((a, i) => (
        <div key={a.id} style={{ marginLeft: i > 0 ? -5 : 0, zIndex: shown.length - i, position: 'relative' }}>
          <div
            className="rounded-full border-2 border-white flex items-center justify-center text-white font-bold"
            style={{ width: 22, height: 22, background: a.color, fontSize: '0.46rem' }}
            title={a.name}
          >{a.initials}</div>
        </div>
      ))}
      {rest > 0 && <span className="ml-1 text-[0.62rem] text-muted-foreground">+{rest}</span>}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
      {children}
    </div>
  )
}

// ── AgendaEditor ───────────────────────────────────────────────────────────────
function AgendaEditor({ items, onChange }) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 group">
          <span className="text-muted-foreground text-xs w-3 flex-shrink-0 select-none">•</span>
          <input
            className="flex-1 text-sm text-ink bg-transparent border-b border-transparent hover:border-border focus:border-navy focus:outline-none pb-0.5 transition-colors"
            value={item}
            onChange={e => onChange(items.map((x, j) => j === i ? e.target.value : x))}
            placeholder="Agenda item…"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 text-xs w-4 transition-opacity"
          >✕</button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ''])}
        className="text-[0.65rem] text-muted-foreground hover:text-navy transition-colors flex items-center gap-1 mt-1"
      >+ Add item</button>
    </div>
  )
}

// ── AttendeesEditor ────────────────────────────────────────────────────────────
function AttendeesEditor({ attendees, onChange }) {
  const [newName, setNewName] = useState('')

  const add = () => {
    const name = newName.trim()
    if (!name) return
    const parts    = name.split(' ')
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
    onChange([...attendees, { id: `a${Date.now()}`, name, initials, color: AV_COLORS[attendees.length % AV_COLORS.length] }])
    setNewName('')
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {attendees.map(a => (
          <div key={a.id} className="flex items-center gap-1.5 bg-cream rounded-full pl-1 pr-2 py-0.5 group">
            <Av person={a} />
            <span className="text-xs text-ink">{a.name}</span>
            <button
              onClick={() => onChange(attendees.filter(x => x.id !== a.id))}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 text-[0.6rem] transition-opacity leading-none"
            >✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 text-xs border border-border rounded-md px-2.5 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy"
          placeholder="Add attendee name and press Enter…"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add() }}
        />
        <button onClick={add} className="btn btn-ghost btn-xs">Add</button>
      </div>
    </div>
  )
}

// ── ActionItems ────────────────────────────────────────────────────────────────
function ActionItems({ items, onChange }) {
  const toggle = id => onChange(items.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const upText = (id, text)     => onChange(items.map(x => x.id === id ? { ...x, text } : x))
  const upOwner= (id, assignee) => onChange(items.map(x => x.id === id ? { ...x, assignee } : x))
  const remove = id => onChange(items.filter(x => x.id !== id))
  const add    = () => onChange([...items, { id: `ai${Date.now()}`, text: '', assignee: '', done: false }])

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-2.5 group">
          <button
            onClick={() => toggle(item.id)}
            className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              item.done ? 'bg-sage border-sage' : 'border-border hover:border-navy'
            }`}
          >
            {item.done && <span className="text-white text-[0.5rem] font-bold">✓</span>}
          </button>
          <div className="flex-1 min-w-0 space-y-0.5">
            <input
              className={`w-full text-sm bg-transparent border-b border-transparent hover:border-border focus:border-navy focus:outline-none pb-0.5 transition-colors ${
                item.done ? 'line-through text-muted-foreground' : 'text-ink'
              }`}
              value={item.text}
              onChange={e => upText(item.id, e.target.value)}
              placeholder="Action item…"
            />
            <input
              className="w-full text-[0.62rem] text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-navy focus:outline-none pb-0.5 transition-colors"
              value={item.assignee}
              onChange={e => upOwner(item.id, e.target.value)}
              placeholder="Assignee…"
            />
          </div>
          <button
            onClick={() => remove(item.id)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 text-xs transition-opacity flex-shrink-0 mt-0.5"
          >✕</button>
        </div>
      ))}
      <button onClick={add} className="text-[0.65rem] text-muted-foreground hover:text-navy transition-colors flex items-center gap-1">
        + Add action
      </button>
    </div>
  )
}

// ── RecordingSection ───────────────────────────────────────────────────────────
function RecordingSection({ meeting, onUpdate }) {
  const fileRef = useRef(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcribeErr, setTranscribeErr] = useState('')

  const handleFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (meeting.recordingObjectUrl) URL.revokeObjectURL(meeting.recordingObjectUrl)
    onUpdate({ recordingFile: file, recordingObjectUrl: URL.createObjectURL(file), transcript: '' })
    e.target.value = ''
  }

  const handleTranscribe = async () => {
    setTranscribing(true)
    setTranscribeErr('')
    try {
      const text = await transcribeViaWorker(meeting.recordingFile)
      onUpdate({ transcript: text })
    } catch (e) {
      setTranscribeErr(e.message)
    } finally {
      setTranscribing(false)
    }
  }

  const isAudio = meeting.recordingFile?.type?.startsWith('audio/')

  return (
    <div className="space-y-5">

      {/* NZ consent notice — Crimes Act 1961 s216B */}
      <label className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
        meeting.consentGiven ? 'border-sage bg-sage/10' : 'border-amber-200 bg-amber-50'
      }`}>
        <input
          type="checkbox"
          checked={!!meeting.consentGiven}
          onChange={e => onUpdate({ consentGiven: e.target.checked })}
          className="mt-0.5 flex-shrink-0 accent-navy"
        />
        <p className="text-xs leading-relaxed">
          <span className={`font-semibold ${meeting.consentGiven ? 'text-sage' : 'text-amber-800'}`}>
            {meeting.consentGiven ? '✓ All attendees have consented to this recording' : 'Recording consent required'}
          </span>
          <span className={meeting.consentGiven ? ' text-sage' : ' text-amber-700'}>
            {' '}— under the NZ Crimes Act 1961 (s216B) and Privacy Act 2020, you must have
            the consent of all parties before recording a private communication. Tick to confirm
            consent was given before the recording started.
          </span>
        </p>
      </label>

      {/* Upload */}
      <div className="space-y-1.5">
        <input ref={fileRef} type="file" accept="audio/*,video/*" className="hidden" onChange={handleFile} />
        <button
          onClick={() => meeting.consentGiven && fileRef.current?.click()}
          className={`btn btn-ghost btn-sm ${!meeting.consentGiven ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          ↑ Upload recording
        </button>
        {!meeting.consentGiven && (
          <p className="text-[0.62rem] text-muted-foreground">Confirm consent above before uploading.</p>
        )}
        {meeting.recordingFile && (
          <p className="text-[0.62rem] text-muted-foreground">
            {meeting.recordingFile.name} · {(meeting.recordingFile.size / 1048576).toFixed(1)} MB
          </p>
        )}
      </div>

      {/* External link */}
      <div className="space-y-1.5">
        <SectionLabel>Recording link</SectionLabel>
        <input
          className="form-input w-full text-sm"
          placeholder="https://meet.google.com/recordings/…"
          value={meeting.recordingUrl || ''}
          onChange={e => onUpdate({ recordingUrl: e.target.value })}
        />
      </div>

      {/* Player */}
      {meeting.recordingObjectUrl && (
        <div className="rounded-lg overflow-hidden border border-border bg-cream/50">
          {isAudio
            ? <audio  controls src={meeting.recordingObjectUrl} className="w-full" />
            : <video  controls src={meeting.recordingObjectUrl} className="w-full max-h-56" />
          }
        </div>
      )}

      {/* Generate transcript */}
      {meeting.recordingFile && (
        <div className="space-y-2">
          <button
            onClick={handleTranscribe}
            disabled={transcribing}
            title={!WORKER_URL ? 'Set VITE_AI_WORKER_URL in .env.local to enable' : undefined}
            className={`btn btn-primary btn-sm flex items-center gap-2 ${transcribing ? 'opacity-60' : ''}`}
          >
            {transcribing ? <><span className="spinner" /> Transcribing…</> : '✦ Generate transcript'}
          </button>

          {!WORKER_URL && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.62rem] text-amber-700 leading-relaxed">
              <strong>Not configured yet.</strong> Add{' '}
              <code className="font-mono bg-amber-100 px-0.5 rounded">VITE_AI_WORKER_URL</code>{' '}
              to <code className="font-mono bg-amber-100 px-0.5 rounded">.env.local</code> pointing
              at your Cloudflare Worker. See the setup comment at the top of Meetings.jsx.
            </div>
          )}
          {transcribeErr && (
            <p className="text-[0.62rem] text-red-500">{transcribeErr}</p>
          )}
        </div>
      )}

      {/* Transcript */}
      <div className="space-y-1.5">
        <SectionLabel>Transcript</SectionLabel>
        <textarea
          rows={8}
          className="form-input w-full resize-none text-sm leading-relaxed"
          value={meeting.transcript || ''}
          onChange={e => onUpdate({ transcript: e.target.value })}
          placeholder={
            transcribing
              ? 'Generating transcript…'
              : 'Transcript will appear here after generation, or paste one manually.'
          }
          readOnly={transcribing}
        />
      </div>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({ meeting, onUpdate, onClose }) {
  if (!meeting) return null
  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(50,54,66,0.4)' }}
      onClick={onClose}
    >
      <div
        className="ml-auto h-full w-full max-w-2xl bg-white overflow-y-auto flex flex-col"
        style={{ boxShadow: '-4px 0 24px rgba(50,54,66,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 z-10 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0 space-y-1.5">
              <input
                className="w-full font-display text-xl text-ink bg-transparent border-b border-transparent hover:border-border focus:border-navy focus:outline-none pb-0.5 transition-colors"
                value={meeting.title}
                onChange={e => onUpdate({ title: e.target.value })}
              />
              <input
                type="datetime-local"
                className="text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-navy focus:outline-none pb-0.5 transition-colors"
                value={toInputDt(meeting.date)}
                onChange={e => { if (e.target.value) onUpdate({ date: new Date(e.target.value) }) }}
              />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-ink hover:bg-cream transition-colors text-sm flex-shrink-0 mt-0.5"
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-8">

          <div>
            <SectionLabel>Agenda</SectionLabel>
            <AgendaEditor items={meeting.agenda} onChange={agenda => onUpdate({ agenda })} />
          </div>

          <div className="border-t border-border pt-6">
            <SectionLabel>Attendees</SectionLabel>
            <AttendeesEditor attendees={meeting.attendees} onChange={attendees => onUpdate({ attendees })} />
          </div>

          <div className="border-t border-border pt-6">
            <SectionLabel>Notes</SectionLabel>
            <textarea
              rows={5}
              className="form-input w-full resize-none text-sm leading-relaxed"
              placeholder="Meeting notes…"
              value={meeting.notes}
              onChange={e => onUpdate({ notes: e.target.value })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <SectionLabel>Action Items</SectionLabel>
            <ActionItems items={meeting.actionItems} onChange={actionItems => onUpdate({ actionItems })} />
          </div>

          <div className="border-t border-border pt-6">
            <SectionLabel>Summary</SectionLabel>
            <textarea
              rows={4}
              className="form-input w-full resize-none text-sm leading-relaxed"
              placeholder="Post-meeting summary…"
              value={meeting.summary}
              onChange={e => onUpdate({ summary: e.target.value })}
            />
          </div>

          <div className="border-t border-border pt-6">
            <SectionLabel>Recording &amp; Transcript</SectionLabel>
            <RecordingSection meeting={meeting} onUpdate={onUpdate} />
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Meeting card ───────────────────────────────────────────────────────────────
function MeetingCard({ meeting, upcoming, onClick }) {
  const label  = daysLabel(meeting.date)
  const done   = meeting.actionItems.filter(a => a.done).length
  const total  = meeting.actionItems.length

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-border hover:border-navy/40 hover:shadow-card transition-all p-4 space-y-3"
      style={upcoming ? { borderLeft: '3px solid #424B63' } : {}}
    >
      <div className="flex items-start gap-2 justify-between">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold leading-tight truncate ${upcoming ? 'text-ink' : 'text-ink/70'}`}>
            {meeting.title}
          </div>
          <div className={`text-[0.65rem] mt-1 ${upcoming ? 'text-navy' : 'text-muted-foreground'}`}>
            {fmtShort(meeting.date)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {upcoming && label && <span className="badge badge-teal text-[0.55rem]">{label}</span>}
          {!upcoming && meeting.summary && <span className="badge badge-sage text-[0.55rem]">Notes</span>}
          {!upcoming && meeting.recordingUrl && <span className="badge badge-gray text-[0.55rem]">Recording</span>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AvatarStack attendees={meeting.attendees} />
        {total > 0 && (
          <span className="text-[0.6rem] text-muted-foreground">{done}/{total} actions</span>
        )}
      </div>

      {!upcoming && meeting.summary && (
        <p className="text-[0.65rem] text-muted-foreground leading-relaxed border-t border-border pt-2.5"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {meeting.summary}
        </p>
      )}
    </button>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Meetings({ client }) {
  const [meetings,   setMeetings]   = useState(SEED_MEETINGS)
  const [selectedId, setSelectedId] = useState(null)

  const now      = new Date()
  const upcoming = meetings.filter(m => m.date >= now).sort((a, b) => a.date - b.date)
  const past     = meetings.filter(m => m.date <  now).sort((a, b) => b.date - a.date)

  const updateMeeting = (id, updates) =>
    setMeetings(ms => ms.map(m => m.id === id ? { ...m, ...updates } : m))

  const addMeeting = () => {
    const m = {
      id: Date.now(),
      title: 'New Meeting',
      date: new Date(Date.now() + 7 * 86400000),
      attendees: [],
      agenda: [''],
      notes: '',
      actionItems: [],
      summary: '',
      recordingUrl: '',
      transcript: '',
      consentGiven: false,
      recordingFile: null,
      recordingObjectUrl: null,
    }
    setMeetings(ms => [...ms, m])
    setSelectedId(m.id)
  }

  const selected = meetings.find(m => m.id === selectedId) || null

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Meetings</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <button onClick={addMeeting} className="btn btn-primary btn-sm">+ New Meeting</button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <div className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Upcoming
          </div>
          <div className="grid grid-cols-2 gap-3">
            {upcoming.map(m => (
              <MeetingCard key={m.id} meeting={m} upcoming onClick={() => setSelectedId(m.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
            Past
          </div>
          <div className="grid grid-cols-2 gap-3">
            {past.map(m => (
              <MeetingCard key={m.id} meeting={m} onClick={() => setSelectedId(m.id)} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 && (
        <div className="empty">No meetings yet. Click &ldquo;+ New Meeting&rdquo; to add one.</div>
      )}

      {/* Detail panel */}
      <DetailPanel
        meeting={selected}
        onUpdate={updates => selected && updateMeeting(selected.id, updates)}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
