import React, { useState, useRef } from 'react'

// ── Progress & status configs ──────────────────────────────────────────────────
const PROGRESS_MAP = {
  'Idea Only':      10,
  'Draft':          25,
  'To Review':      50,
  'Being Reviewed': 65,
  'Needs Changes':  60,
  'Approved':       80,
  'Scheduled':      90,
  'Posted':         100,
}

const STATUS_TAG = {
  'Idea Only':      { bg: '#F4EFE9', color: '#5F6368' },
  'Draft':          { bg: '#E7E2DB', color: '#323642' },
  'To Review':      { bg: '#DAE6F6', color: '#2A3F6A' },
  'Being Reviewed': { bg: '#DCEBDD', color: '#2A4A2C' },
  'Needs Changes':  { bg: '#F6E6C8', color: '#6B4A10' },
  'Approved':       { bg: '#DCEBDD', color: '#2A4A2C' },
  'Scheduled':      { bg: '#DAE6F6', color: '#2A3F6A' },
  'Posted':         { bg: '#DCEBDD', color: '#2A4A2C' },
}

const STATUS_CFG = {
  'Draft':          { bg: '#E8ECF0', color: '#6B7485', label: 'Draft' },
  'Edited':         { bg: '#ECD6CE', color: '#7A4F38', label: 'Edited' },
  'Needs Review':   { bg: '#ECD6CE', color: '#7A4F38', label: 'Needs Review' },
  'Approved':       { bg: '#D4E0CE', color: '#3A5A36', label: 'Approved' },
  'Posted':         { bg: '#BABEAF', color: '#2A3A26', label: 'Posted' },
  'Idea Only':      { bg: '#F4EFE9', color: '#5F6368', label: 'Idea Only' },
  'To Review':      { bg: '#DAE6F6', color: '#2A3F6A', label: 'To Review' },
  'Being Reviewed': { bg: '#DCEBDD', color: '#2A4A2C', label: 'Being Reviewed' },
  'Needs Changes':  { bg: '#F6E6C8', color: '#6B4A10', label: 'Needs Changes' },
  'Scheduled':      { bg: '#DAE6F6', color: '#2A3F6A', label: 'Scheduled' },
}

const CARD_BG = {
  'Idea Only':      '#F4EFE9',
  'Draft':          '#EEF1F4',
  'To Review':      '#E4EDF8',
  'Being Reviewed': '#E0EEE1',
  'Needs Changes':  '#FAF0DC',
  'Approved':       '#E6EBE2',
  'Scheduled':      '#E4EDF8',
  'Posted':         '#E2E7DE',
  'Edited':         '#F5EAE7',
  'Needs Review':   '#F5EAE7',
}
const CARD_BORDER = {
  'Idea Only':      '#DDD8D0',
  'Draft':          '#C8D2DA',
  'To Review':      '#B8CDED',
  'Being Reviewed': '#B8D9BA',
  'Needs Changes':  '#E8D09A',
  'Approved':       '#BFC9BB',
  'Scheduled':      '#B8CDED',
  'Posted':         '#B5C1B0',
  'Edited':         '#DFBFB5',
  'Needs Review':   '#DFBFB5',
}

const PLATFORMS     = ['Instagram','Facebook','LinkedIn','TikTok','Email','Blog','Website','YouTube','Pinterest']
const CONTENT_TYPES = ['Post','Reel','Carousel','Text Post','Story','Email','Blog','Ad','Campaign Asset']
const ALL_STATUSES  = ['Idea Only','Draft','To Review','Being Reviewed','Needs Changes','Approved','Scheduled','Posted']

function isMediaFile(f) {
  return f?.type?.startsWith('image/') || f?.type?.startsWith('video/')
}

// ── Seed posts ─────────────────────────────────────────────────────────────────
const SEED_POSTS = [
  {
    id: 1,
    title: 'Showroom Changes',
    status: 'Needs Changes',
    contentType: 'Reel',
    platforms: ['Instagram', 'Facebook'],
    isVideo: true,
    gradientFrom: '#B7C1CB', gradientTo: '#9FAABD',
    caption: `Big changes at the showroom — come and see what's new. 🏍️\n\nWe've refreshed the floor layout and added exciting new arrivals you won't want to miss.\n\n📍 42 Victoria Street, Auckland CBD\n📞 09 123 4567\n\n#motorcycles #triumph #showroom #auckland #newstock`,
    files: [{ name: 'Showroom Changes.mov', size: '76.9 MB', ext: 'mov' }],
    comments: [
      { author: '@Maxine',  text: 'Love this! Can we add the store hours too?', time: '2h ago' },
      { author: '@Tanya H', text: 'Good call — caption updated. Ready to go.',  time: '45m ago' },
    ],
    notes: 'Client wants to review thumbnail before we post.',
    publishDate: new Date(2026, 5, 22),
    scheduleTime: '9:00 AM',
    owner: 'Tanya H.',
    updatedAgo: '2h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 2,
    title: 'Triumph Demo Day',
    status: 'Approved',
    contentType: 'Post',
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    isVideo: false,
    gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: `Demo Day is THIS Saturday! 🏁\n\nCome test ride the full Triumph range at our Auckland showroom. No booking required — just turn up and ride.\n\nSaturday 14 June · 9am – 3pm\n📍 42 Victoria Street, Auckland`,
    files: [{ name: 'Demo Day Flyer.pdf', size: '2.3 MB', ext: 'pdf' }],
    comments: [
      { author: '@Maxine', text: 'Approved! This looks amazing. Post it Saturday morning.', time: 'Yesterday' },
    ],
    notes: '',
    publishDate: new Date(2026, 5, 23),
    scheduleTime: '10:00 AM',
    owner: 'Maxine',
    updatedAgo: 'Yesterday',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 3,
    title: 'Behind the Scenes',
    status: 'Posted',
    contentType: 'Reel',
    platforms: ['Instagram', 'TikTok'],
    isVideo: true,
    gradientFrom: '#ECD6CE', gradientTo: '#D4B8AD',
    caption: `A little look behind the scenes at what goes into keeping your bike running perfectly. 🔧\n\nOur workshop team put in the hours so you can focus on the ride.\n\n#bikelife #workshop #motorcyclemaintenance #triumph`,
    files: [{ name: 'Workshop BTS.mov', size: '112 MB', ext: 'mov' }],
    comments: [
      { author: '@Tanya H', text: 'Great engagement — 847 likes so far!', time: '3 days ago' },
      { author: '@Maxine',  text: "Brilliant. Let's do another one next week.", time: '3 days ago' },
    ],
    notes: 'High performer — repurpose this format.',
    publishDate: new Date(2026, 5, 24),
    scheduleTime: '11:00 AM',
    owner: 'Tanya H.',
    updatedAgo: '3 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 4,
    title: 'June Newsletter',
    status: 'Draft',
    contentType: 'Email',
    platforms: ['Email'],
    isVideo: false,
    gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
    caption: `Subject: What's new at the showroom this June 🏍️\n\nHi [First Name],\n\nJune has been a big month for us — new stock, a demo day, and some exciting changes to the showroom...`,
    files: [],
    comments: [
      { author: '@Maxine', text: 'Need client to confirm the June specials before we finish this.', time: '4 days ago' },
    ],
    notes: 'Waiting on client input. Follow up Thursday.',
    publishDate: new Date(2026, 5, 25),
    scheduleTime: null,
    owner: 'Maxine',
    updatedAgo: '4 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 5,
    title: 'Weekend Ride Caption',
    status: 'Idea Only',
    contentType: 'Post',
    platforms: ['Instagram'],
    isVideo: false,
    gradientFrom: '#D8E0E8', gradientTo: '#C5CDD8',
    caption: 'Weekend ride vibes — just an idea for now.',
    files: [],
    comments: [],
    notes: 'Initial idea — needs creative brief.',
    publishDate: new Date(2026, 5, 26),
    scheduleTime: null,
    owner: 'Maxine',
    updatedAgo: '1h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 6,
    title: 'Service Special Carousel',
    status: 'To Review',
    contentType: 'Carousel',
    platforms: ['Instagram', 'Facebook'],
    isVideo: false,
    gradientFrom: '#C8D8E8', gradientTo: '#B0C4D8',
    caption: 'Keep your bike in peak condition this winter. 🔧 Our service specials are here — book now.',
    files: [],
    comments: [],
    notes: '',
    publishDate: new Date(2026, 5, 27),
    scheduleTime: '2:00 PM',
    owner: 'Tanya H.',
    updatedAgo: '30m ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 7,
    title: 'Sunday Inspiration Quote',
    status: 'Scheduled',
    contentType: 'Text Post',
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    isVideo: false,
    gradientFrom: '#E8E0D8', gradientTo: '#D8CCC0',
    caption: '"The journey is the destination." — Sunday inspiration for every rider.',
    files: [],
    comments: [],
    notes: '',
    publishDate: new Date(2026, 5, 28),
    scheduleTime: '8:00 AM',
    owner: 'Tanya H.',
    updatedAgo: '5h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fileIcon(ext) {
  if (ext === 'pdf') return '📄'
  if (ext === 'mov' || ext === 'mp4') return '🎥'
  if (ext === 'zip') return '📦'
  return '📎'
}
function getMonday(d) {
  const date = new Date(d)
  const day  = date.getDay()
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
  date.setHours(0, 0, 0, 0)
  return date
}
function sameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const MONTHS    = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const WEEK_NAMES = ['One','Two','Three','Four','Five']

function weekLabel(ws) {
  const n = Math.ceil(ws.getDate() / 7)
  return `${MONTHS[ws.getMonth()]} — Week ${WEEK_NAMES[n - 1] || n}`
}

// ── Board components (unchanged) ───────────────────────────────────────────────
function StatusBanner({ post }) {
  const cfg = STATUS_CFG[post.status] || STATUS_CFG.Draft
  return (
    <div className="rounded-md px-3 py-2.5" style={{ background: cfg.bg }}>
      <div className="text-[0.65rem] font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
    </div>
  )
}

function MediaCard({ post }) {
  if (post.attachedObjectUrl) {
    const isVid = post.attachedFile?.type?.startsWith('video/')
    return (
      <div className="rounded-md overflow-hidden aspect-video relative flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}>
        {isVid
          ? <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}><span className="text-white text-base ml-0.5">▶</span></div>
          : <img src={post.attachedObjectUrl} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5" style={{ background: 'rgba(50,54,66,0.35)' }}>
          <span className="text-[0.58rem] text-white font-medium">{isVid ? 'Video' : 'Image'} · {(post.platforms||[]).join(', ')}</span>
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-md overflow-hidden aspect-video flex items-center justify-center relative"
      style={{ background: `linear-gradient(135deg, ${post.gradientFrom} 0%, ${post.gradientTo} 100%)` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
        <span className="text-lg">{post.isVideo ? '▶' : '🖼'}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5" style={{ background: 'rgba(50,54,66,0.35)' }}>
        <span className="text-[0.58rem] text-white font-medium">{post.isVideo ? 'Video' : 'Image'} · {(post.platforms||[post.platform]).join(', ')}</span>
      </div>
    </div>
  )
}

function FileCard({ file }) {
  return (
    <div className="rounded-md border border-border bg-cream flex items-center gap-2.5 px-3 py-2.5">
      <div className="w-7 h-7 rounded bg-white flex items-center justify-center text-base flex-shrink-0 shadow-sm">{fileIcon(file.ext)}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-ink truncate">{file.name}</div>
        <div className="text-[0.58rem] text-muted-foreground">{file.size}</div>
      </div>
      <button className="text-muted-foreground hover:text-ink text-sm leading-none">↓</button>
    </div>
  )
}

function CaptionCard({ caption, full }) {
  const [expanded, setExpanded] = useState(false)
  const limit  = 140
  const isLong = caption.length > limit
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Caption</div>
      <div className="text-xs text-ink leading-relaxed whitespace-pre-line">
        {full || expanded || !isLong ? caption : caption.slice(0, limit) + '…'}
      </div>
      {!full && isLong && (
        <button onClick={() => setExpanded(e => !e)} className="text-[0.6rem] text-navy mt-1.5 hover:underline">
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}

function CommentThread({ comments, compact }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Comments ({comments.length})</div>
      <div className="space-y-3 mb-3">
        {(compact ? comments.slice(0, 2) : comments).map((c, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center text-[0.5rem] text-white font-bold flex-shrink-0 mt-0.5">
              {c.author.replace('@','').slice(0,1).toUpperCase()}
            </div>
            <div>
              <span className="text-[0.62rem] font-semibold text-navy">{c.author}</span>
              <span className="text-[0.58rem] text-muted-foreground ml-1.5">{c.time}</span>
              <div className="text-xs text-ink mt-0.5 leading-snug">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <input className="w-full text-xs border border-border rounded-md px-2.5 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy" placeholder="Type a comment…" />
    </div>
  )
}

function StickyNote({ note }) {
  if (!note) return null
  return (
    <div className="rounded-md p-3" style={{ background: '#FEFACC' }}>
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#92700A' }}>Internal note</div>
      <div className="text-xs leading-relaxed" style={{ color: '#5A4208' }}>{note}</div>
    </div>
  )
}

function BoardColumn({ post, onSelect }) {
  return (
    <div className="w-[272px] flex-shrink-0 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onSelect(post)} className="text-left min-w-0 group">
          <div className="text-sm font-semibold text-ink group-hover:text-navy transition-colors leading-tight">{post.title}</div>
          <div className="text-[0.58rem] text-muted-foreground mt-0.5">{fmtDate(post.publishDate)}</div>
        </button>
        <button className="text-muted-foreground hover:text-ink text-base leading-none flex-shrink-0 mt-0.5 px-1">···</button>
      </div>
      <StatusBanner post={post} />
      <MediaCard post={post} />
      {post.files.map((f, i) => <FileCard key={i} file={f} />)}
      <CaptionCard caption={post.caption} />
      {post.comments.length > 0 && <CommentThread comments={post.comments} compact />}
      <StickyNote note={post.notes} />
      <button className="text-[0.65rem] text-muted-foreground hover:text-ink border border-dashed border-border rounded-md py-2 transition-colors w-full">+ Add card</button>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({ post, onClose, onStatusChange }) {
  if (!post) return null
  const hasVideo = post.attachedObjectUrl && post.attachedFile?.type?.startsWith('video/')
  const hasImage = post.attachedObjectUrl && !hasVideo
  const tag = STATUS_TAG[post.status] || STATUS_TAG['Draft']
  const progress = PROGRESS_MAP[post.status] || 0

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(50,54,66,0.4)' }} onClick={onClose}>
      <div className="ml-auto h-full w-full max-w-2xl bg-white overflow-y-auto" style={{ boxShadow: '-4px 0 24px rgba(50,54,66,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl text-ink leading-tight">{post.title}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">{(post.platforms||[]).join(', ')} · {fmtDate(post.publishDate)}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-ink hover:bg-cream transition-colors text-sm">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Status + progress */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{ background: tag.bg, color: tag.color }}>{post.status}</span>
            {post.contentType && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border" style={{ background: '#fff', color: '#323642', borderColor: '#A6AAB5' }}>{post.contentType}</span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{progress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E8ECF0' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>

          {/* Change status */}
          <div>
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Change status</div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map(s => {
                const t = STATUS_TAG[s]
                return (
                  <button key={s} onClick={() => onStatusChange(post.id, s)}
                    className="rounded-full px-3 py-1 text-xs font-medium border transition-all"
                    style={{
                      background: post.status === s ? t.bg : '#fff',
                      color: post.status === s ? t.color : '#6B7485',
                      borderColor: post.status === s ? t.color + '40' : '#E7E2DB',
                      fontWeight: post.status === s ? 600 : 400,
                    }}>
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Media */}
          {hasVideo && <video controls src={post.attachedObjectUrl} className="w-full rounded-md max-h-64 bg-black" />}
          {hasImage && <img src={post.attachedObjectUrl} alt={post.title} className="w-full rounded-md object-cover" style={{ maxHeight: 260 }} />}
          {!post.attachedObjectUrl && <MediaCard post={post} />}

          {post.files.map((f, i) => <FileCard key={i} file={f} />)}

          <div className="rounded-md border border-border bg-white p-4">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Caption</div>
            <div className="text-sm text-ink leading-relaxed whitespace-pre-line">{post.caption}</div>
          </div>

          {post.comments.length > 0 && (
            <div className="rounded-md border border-border bg-white p-4">
              <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Comments ({post.comments.length})</div>
              <div className="space-y-4 mb-4">
                {post.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-[0.58rem] text-white font-bold flex-shrink-0">
                      {c.author.replace('@','').slice(0,1).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-navy">{c.author}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.time}</span>
                      <div className="text-sm text-ink mt-0.5 leading-relaxed">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <input className="w-full text-sm border border-border rounded-md px-3 py-2 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy" placeholder="Type a comment…" />
            </div>
          )}

          <StickyNote note={post.notes} />
        </div>
      </div>
    </div>
  )
}

// ── Month calendar post chip (status bg + file drop) ──────────────────────────
function PostChip({ post, onSelect, onFileDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const bg     = CARD_BG[post.status]     || '#EEF1F4'
  const border = CARD_BORDER[post.status] || '#C8D2DA'
  const isAttachedImage = post.attachedObjectUrl && !post.attachedFile?.type?.startsWith('video/')

  return (
    <button
      onClick={() => onSelect(post)}
      onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
      onDragOver={e  => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy' }}
      onDragLeave={e => { e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (isMediaFile(file)) onFileDrop?.(file)
      }}
      className="w-full text-left rounded-md overflow-hidden transition-all"
      style={{
        background: bg,
        border: `1.5px solid ${dragOver ? '#424B63' : border}`,
        boxShadow: dragOver ? '0 0 0 2px rgba(66,75,99,0.25)' : '0 1px 2px rgba(50,54,66,0.06)',
      }}
    >
      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 32, background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}>
        {isAttachedImage
          ? <img src={post.attachedObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <span className="text-xs opacity-50 relative z-10">{post.isVideo ? '▶' : '🖼'}</span>}
        {dragOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: 'rgba(66,75,99,0.62)' }}>
            <span className="text-white text-[0.58rem] font-semibold">+ Attach</span>
          </div>
        )}
      </div>
      <div className="px-1.5 py-1.5">
        <div className="text-[0.6rem] font-medium text-ink truncate leading-tight">{post.title}</div>
        <div className="text-[0.55rem] text-muted-foreground truncate mt-0.5">{(post.platforms||[]).join(', ')}</div>
      </div>
    </button>
  )
}

// ── Week view card ─────────────────────────────────────────────────────────────
function WeekCard({ post, onSelect, onFileDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const bg     = CARD_BG[post.status]     || '#EEF1F4'
  const border = CARD_BORDER[post.status] || '#C8D2DA'
  const tag    = STATUS_TAG[post.status]  || STATUS_TAG['Draft']
  const progress = PROGRESS_MAP[post.status] || 0
  const isAttachedImage = post.attachedObjectUrl && !post.attachedFile?.type?.startsWith('video/')
  const isAttachedVideo = post.attachedObjectUrl && post.attachedFile?.type?.startsWith('video/')

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('postId', String(post.id)); e.dataTransfer.effectAllowed = 'move' }}
      onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
      onDragOver={e  => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = isMediaFile(e.dataTransfer.files?.[0]) ? 'copy' : 'move' }}
      onDragLeave={e => { e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (isMediaFile(file)) onFileDrop?.(file)
      }}
      className="rounded-xl overflow-hidden cursor-pointer transition-all select-none"
      style={{
        background: bg,
        border: `1.5px solid ${dragOver ? '#424B63' : border}`,
        boxShadow: dragOver ? '0 0 0 2px rgba(66,75,99,0.2), 0 4px 16px rgba(50,54,66,0.12)' : '0 1px 4px rgba(50,54,66,0.07)',
      }}
      onClick={() => onSelect(post)}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden flex items-center justify-center" style={{ height: 52, background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}>
        {isAttachedImage && <img src={post.attachedObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        {(isAttachedVideo || post.isVideo) && !isAttachedImage && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.28)' }}>
            <span className="text-white text-xs ml-0.5">▶</span>
          </div>
        )}
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(66,75,99,0.6)' }}>
            <span className="text-white text-[0.6rem] font-semibold">+ Attach media</span>
          </div>
        )}
      </div>

      <div className="p-2 space-y-1.5">
        {/* Title */}
        <div className="text-[0.7rem] font-semibold text-ink leading-snug line-clamp-2">{post.title}</div>

        {/* Status pill */}
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.58rem] font-medium border border-transparent" style={{ background: tag.bg, color: tag.color, borderColor: tag.color + '30' }}>
            {post.status}
          </span>
          {post.contentType && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.58rem] font-medium border" style={{ background: '#fff', color: '#323642', borderColor: '#A6AAB5' }}>
              {post.contentType}
            </span>
          )}
        </div>

        {/* Platform pills */}
        {post.platforms?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.platforms.map(p => (
              <span key={p} className="inline-flex items-center rounded-full px-2 py-0.5 text-[0.55rem] font-medium border" style={{ background: '#F4EFE9', color: '#323642', borderColor: '#E7E2DB' }}>
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Schedule time */}
        {post.scheduleTime && (
          <div className="text-[0.58rem] text-muted-foreground">
            {fmtShort(post.publishDate)} at {post.scheduleTime}
          </div>
        )}

        {/* Caption preview */}
        {post.caption && (
          <div className="text-[0.6rem] text-ink/70 leading-snug line-clamp-2 italic">
            {post.caption.slice(0, 70)}{post.caption.length > 70 ? '…' : ''}
          </div>
        )}

        {/* Progress bar */}
        <div className="pt-0.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[0.52rem] text-muted-foreground">{post.owner || ''}</span>
            <span className="text-[0.52rem] text-muted-foreground">{progress}%</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(50,54,66,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>
          {post.updatedAgo && <div className="text-[0.52rem] text-muted-foreground mt-0.5">{post.updatedAgo}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Filter chip ────────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium border transition-all whitespace-nowrap"
      style={{
        background:   active ? '#424B63' : '#fff',
        color:        active ? '#fff'     : '#6B7485',
        borderColor:  active ? '#424B63'  : '#E7E2DB',
      }}
    >
      {label}
    </button>
  )
}

// ── Calendar: month ────────────────────────────────────────────────────────────
function CalendarMonth({ posts, onSelect, month, year, onPrev, onNext, onAttachFile, onCreatePost }) {
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMo = new Date(year, month + 1, 0).getDate()
  const today    = new Date()
  const [dragOverKey, setDragOverKey] = useState(null)

  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => new Date(year, month, i + 1))]
  while (cells.length % 7) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="btn btn-ghost btn-sm px-3">← Prev</button>
        <span className="font-display text-xl text-ink">{MONTHS[month]} {year}</span>
        <button onClick={onNext} className="btn btn-ghost btn-sm px-3">Next →</button>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-center text-[0.57rem] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((date, di) => {
              const dayPosts     = date ? posts.filter(p => sameDay(new Date(p.publishDate), date)) : []
              const isToday      = date && sameDay(date, today)
              const key          = date ? dateKey(date) : null
              const isDropTarget = key && dragOverKey === key && dayPosts.length === 0

              return (
                <div
                  key={di}
                  className={`min-h-[88px] p-1.5 border-r border-border last:border-r-0 relative transition-colors ${!date ? 'bg-cream/40' : isToday ? 'bg-navy/[0.04]' : ''}`}
                  onDragEnter={e => { if (!date || dayPosts.length > 0) return; e.preventDefault(); setDragOverKey(key) }}
                  onDragOver={e  => { if (!date) return; e.preventDefault(); e.dataTransfer.dropEffect = dayPosts.length === 0 ? 'copy' : 'none' }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverKey(null) }}
                  onDrop={e => {
                    e.preventDefault(); setDragOverKey(null)
                    if (date && dayPosts.length === 0) {
                      const file = e.dataTransfer.files?.[0]
                      if (isMediaFile(file)) onCreatePost(date, file)
                    }
                  }}
                >
                  {date && (
                    <>
                      <div className={`text-[0.65rem] font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-navy text-white' : 'text-muted-foreground'}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.map(p => (
                          <PostChip key={p.id} post={p} onSelect={onSelect} onFileDrop={file => onAttachFile(p.id, file)} />
                        ))}
                      </div>
                      {isDropTarget && (
                        <div className="absolute inset-x-1 bottom-1 rounded-md border-2 border-dashed border-navy/40 flex items-center justify-center pointer-events-none" style={{ top: 28, background: 'rgba(66,75,99,0.06)' }}>
                          <span className="text-[0.58rem] text-navy/60 font-medium">+ Drop to create</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Calendar: week (full rebuild) ──────────────────────────────────────────────
function CalendarWeek({ posts, onSelect, weekStart, onPrev, onNext, onAttachFile, onCreatePost, onMovePost }) {
  const today  = new Date()
  const [dragOverKey, setDragOverKey] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterType,     setFilterType]     = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')

  const boardRef  = useRef(null)
  const dragScroll = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
  })

  const weekEnd = days[6]
  const rangeLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  // Week progress
  const weekPosts = posts.filter(p => days.some(d => sameDay(new Date(p.publishDate), d)))
  const avgProgress = weekPosts.length
    ? Math.round(weekPosts.reduce((s, p) => s + (PROGRESS_MAP[p.status] || 0), 0) / weekPosts.length)
    : 0
  const postedCount = weekPosts.filter(p => p.status === 'Posted').length

  // Filtered posts
  const filtered = posts.filter(p => {
    if (filterPlatform && !(p.platforms||[]).includes(filterPlatform)) return false
    if (filterType   && p.contentType !== filterType)                  return false
    if (filterStatus && p.status      !== filterStatus)                return false
    return true
  })

  // Board mouse-drag scroll
  const onMouseDown = e => {
    if (e.button !== 0) return
    dragScroll.current = { active: true, startX: e.pageX, scrollLeft: boardRef.current.scrollLeft }
    boardRef.current.style.cursor = 'grabbing'
    boardRef.current.style.userSelect = 'none'
  }
  const onMouseMove = e => {
    if (!dragScroll.current.active) return
    const dx = e.pageX - dragScroll.current.startX
    boardRef.current.scrollLeft = dragScroll.current.scrollLeft - dx
  }
  const onMouseUp = () => {
    dragScroll.current.active = false
    if (boardRef.current) { boardRef.current.style.cursor = 'grab'; boardRef.current.style.userSelect = '' }
  }

  return (
    <div>
      {/* Week header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-2xl text-ink leading-tight">{weekLabel(weekStart)}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{rangeLabel}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Plan, review and approve this week's content.</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">←</button>
            <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">→</button>
          </div>
        </div>

        {/* Week progress bar */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-ink">Week Progress</span>
            <span className="text-xs text-muted-foreground">{avgProgress}% · {postedCount} of {weekPosts.length} items completed</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#E8ECF0' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avgProgress}%`, background: avgProgress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">Platform</span>
          <FilterChip label="All" active={!filterPlatform} onClick={() => setFilterPlatform('')} />
          {PLATFORMS.map(p => <FilterChip key={p} label={p} active={filterPlatform === p} onClick={() => setFilterPlatform(filterPlatform === p ? '' : p)} />)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">Type</span>
          <FilterChip label="All" active={!filterType} onClick={() => setFilterType('')} />
          {CONTENT_TYPES.map(t => <FilterChip key={t} label={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? '' : t)} />)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground w-14 flex-shrink-0">Status</span>
          <FilterChip label="All" active={!filterStatus} onClick={() => setFilterStatus('')} />
          {ALL_STATUSES.map(s => <FilterChip key={s} label={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} />)}
        </div>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="overflow-x-auto pb-2 rounded-xl"
        style={{ cursor: 'grab', scrollbarWidth: 'thin' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <div className="flex gap-0 min-w-max rounded-xl overflow-hidden border border-border bg-white" style={{ minHeight: 400 }}>
          {days.map((day, i) => {
            const isToday      = sameDay(day, today)
            const key          = dateKey(day)
            const dayFiltered  = filtered.filter(p => sameDay(new Date(p.publishDate), day))
            const isDropTarget = dragOverKey === key

            return (
              <div
                key={i}
                className={`flex flex-col border-r border-border last:border-r-0 relative ${isToday ? 'bg-navy/[0.03]' : 'bg-white'}`}
                style={{ width: 200, minWidth: 200 }}
                onDragEnter={e => { e.preventDefault(); setDragOverKey(key) }}
                onDragOver={e  => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverKey(null) }}
                onDrop={e => {
                  e.preventDefault(); setDragOverKey(null)
                  const postId = e.dataTransfer.getData('postId')
                  const file   = e.dataTransfer.files?.[0]
                  if (postId) {
                    onMovePost(parseInt(postId, 10), day)
                  } else if (isMediaFile(file)) {
                    onCreatePost(day, file)
                  }
                }}
              >
                {/* Day header */}
                <div className={`px-3 py-2.5 border-b border-border flex-shrink-0 ${isToday ? 'bg-navy' : 'bg-cream/40'}`}>
                  <div className={`text-[0.57rem] font-semibold uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {WEEKDAYS[i]}
                  </div>
                  <div className={`text-lg font-semibold leading-tight mt-0.5 ${isToday ? 'text-white' : 'text-ink'}`}>
                    {day.getDate()}
                  </div>
                  <div className={`text-[0.58rem] ${isToday ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {MONTHS[day.getMonth()].slice(0, 3)}
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 flex-1">
                  {dayFiltered.map(p => (
                    <WeekCard
                      key={p.id}
                      post={p}
                      onSelect={onSelect}
                      onFileDrop={file => onAttachFile(p.id, file)}
                    />
                  ))}
                  {dayFiltered.length === 0 && (
                    <div className={`h-full min-h-[80px] rounded-lg border-2 border-dashed flex items-center justify-center transition-colors ${isDropTarget ? 'border-navy/40 bg-navy/[0.04]' : 'border-transparent'}`}>
                      {isDropTarget && <span className="text-[0.6rem] text-navy/60 font-medium">+ Drop here</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="text-center mt-3 text-[0.62rem] text-muted-foreground">
        Drag board to move across · Drag cards between days to reschedule
      </div>
    </div>
  )
}

// ── Main ContentBoard ──────────────────────────────────────────────────────────
export default function ContentBoard({ client }) {
  const [view,       setView]      = useState('board')
  const [calView,    setCalView]   = useState('month')
  const [month,      setMonth]     = useState(new Date().getMonth())
  const [year,       setYear]      = useState(new Date().getFullYear())
  const [weekStart,  setWeekStart] = useState(getMonday(new Date()))
  const [selectedId, setSelectedId] = useState(null)
  const [posts,      setPosts]     = useState(SEED_POSTS)

  const selected = posts.find(p => p.id === selectedId) || null

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1) } else setMonth(m => m + 1) }
  const prevWeek  = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek  = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  // ── STORAGE PLACEHOLDER ────────────────────────────────────────────────────
  // Both functions below use URL.createObjectURL for local preview only.
  // Replace with Supabase storage upload:
  //   const { data } = await supabase.storage.from('content-media').upload(...)
  //   const objectUrl = supabase.storage.from('content-media').getPublicUrl(data.path).data.publicUrl
  // ──────────────────────────────────────────────────────────────────────────

  const attachFileToPosts = (postId, file) => {
    const objectUrl = URL.createObjectURL(file) // ← STORAGE PLACEHOLDER
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, attachedFile: file, attachedObjectUrl: objectUrl, isVideo: file.type.startsWith('video/') } : p))
  }

  const createPostFromDrop = (date, file) => {
    const objectUrl = URL.createObjectURL(file) // ← STORAGE PLACEHOLDER
    const isVideo   = file.type.startsWith('video/')
    const newPost   = {
      id: Date.now(),
      title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      status: 'Draft', contentType: 'Post',
      platforms: ['Instagram'],
      isVideo, gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
      caption: '', files: [], comments: [], notes: '',
      publishDate: date, scheduleTime: null,
      owner: 'Maxine', updatedAgo: 'Just now',
      attachedFile: file, attachedObjectUrl: objectUrl,
    }
    setPosts(ps => [...ps, newPost])
    setSelectedId(newPost.id)
  }

  const movePost = (postId, newDate) => {
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, publishDate: newDate } : p))
  }

  const updateStatus = (postId, status) => {
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, status } : p))
  }

  return (
    <div>
      {/* Header + view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Content Hub</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Plan, track and collaborate on every piece of content.</p>
        </div>
        <div className="flex items-center gap-1 bg-cream rounded-lg p-1 border border-border">
          {['board', 'calendar'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${view === v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'}`}>
              {v === 'board' ? '⊞ Board' : '◫ Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* Board view */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6" style={{ scrollbarWidth: 'thin' }}>
          {posts.map(post => (
            <BoardColumn key={post.id} post={post} onSelect={p => setSelectedId(p.id)} />
          ))}
          <div className="w-[220px] flex-shrink-0">
            <button className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors">+ Add column</button>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <div>
          <div className="flex gap-1 mb-5 bg-cream rounded-lg p-1 border border-border w-fit">
            {['month', 'week'].map(v => (
              <button key={v} onClick={() => setCalView(v)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${calView === v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'}`}>
                {v}
              </button>
            ))}
          </div>

          {calView === 'month' && (
            <CalendarMonth posts={posts} onSelect={p => setSelectedId(p.id)} month={month} year={year} onPrev={prevMonth} onNext={nextMonth} onAttachFile={attachFileToPosts} onCreatePost={createPostFromDrop} />
          )}
          {calView === 'week' && (
            <CalendarWeek posts={posts} onSelect={p => setSelectedId(p.id)} weekStart={weekStart} onPrev={prevWeek} onNext={nextWeek} onAttachFile={attachFileToPosts} onCreatePost={createPostFromDrop} onMovePost={movePost} />
          )}
        </div>
      )}

      {/* Detail panel */}
      <DetailPanel post={selected} onClose={() => setSelectedId(null)} onStatusChange={updateStatus} />
    </div>
  )
}
