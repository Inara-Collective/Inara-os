import React, { useState } from 'react'

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  Draft:       { bg: '#E8ECF0', color: '#6B7485',  label: 'Draft' },
  Edited:      { bg: '#ECD6CE', color: '#7A4F38',  label: 'Edited' },
  'Needs Review': { bg: '#ECD6CE', color: '#7A4F38', label: 'Needs Review' },
  Approved:    { bg: '#D4E0CE', color: '#3A5A36',  label: 'Approved' },
  Posted:      { bg: '#BABEAF', color: '#2A3A26',  label: 'Posted' },
}

const STATUS_EDGE = {
  Draft:       '#B7C1CB',
  Edited:      '#ECD6CE',
  'Needs Review': '#ECD6CE',
  Approved:    '#BABEAF',
  Posted:      '#BABEAF',
}

// ── Placeholder posts ──────────────────────────────────────────────────────────
const SEED_POSTS = [
  {
    id: 1,
    title: 'Showroom Changes',
    status: 'Edited',
    statusNote: 'Edited – post up Friday 12/06/26',
    isVideo: true,
    gradientFrom: '#B7C1CB', gradientTo: '#9FAABD',
    caption: `Big changes at the showroom — come and see what's new. 🏍️\n\nWe've refreshed the floor layout and added exciting new arrivals you won't want to miss.\n\n📍 42 Victoria Street, Auckland CBD\n📞 09 123 4567\n\n#motorcycles #triumph #showroom #auckland #newstock`,
    files: [{ name: 'Showroom Changes.mov', size: '76.9 MB', ext: 'mov' }],
    comments: [
      { author: '@Maxine',  text: 'Love this! Can we add the store hours too?', time: '2h ago' },
      { author: '@Tanya H', text: 'Good call — caption updated. Ready to go.', time: '45m ago' },
    ],
    notes: 'Client wants to review thumbnail before we post. Book in a quick approval call.',
    publishDate: new Date(2026, 5, 12),
    platform: 'Instagram',
  },
  {
    id: 2,
    title: 'Triumph Demo Day',
    status: 'Approved',
    statusNote: 'Approved – going live Saturday 14/06/26',
    isVideo: false,
    gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: `Demo Day is THIS Saturday! 🏁\n\nCome test ride the full Triumph range at our Auckland showroom. No booking required — just turn up and ride.\n\nSaturday 14 June · 9am – 3pm\n📍 42 Victoria Street, Auckland\n\n#triumphmotorcycles #demoday #ridetriumph #aucklandmotorcycles`,
    files: [
      { name: 'Demo Day Flyer.pdf',  size: '2.3 MB', ext: 'pdf' },
      { name: 'Event Photos.zip',    size: '48.1 MB', ext: 'zip' },
    ],
    comments: [
      { author: '@Maxine', text: 'Approved! This looks amazing. Post it Saturday morning.', time: 'Yesterday' },
    ],
    notes: '',
    publishDate: new Date(2026, 5, 14),
    platform: 'Instagram, Facebook',
  },
  {
    id: 3,
    title: 'Behind the Scenes',
    status: 'Posted',
    statusNote: 'Completed – Posted 10/06/26',
    isVideo: true,
    gradientFrom: '#ECD6CE', gradientTo: '#D4B8AD',
    caption: `A little look behind the scenes at what goes into keeping your bike running perfectly. 🔧\n\nOur workshop team put in the hours so you can focus on the ride.\n\n#bikelife #workshop #motorcyclemaintenance #triumph`,
    files: [{ name: 'Workshop BTS.mov', size: '112 MB', ext: 'mov' }],
    comments: [
      { author: '@Tanya H', text: 'Great engagement — 847 likes so far!', time: '3 days ago' },
      { author: '@Maxine',  text: "Brilliant. Let's do another one next week.", time: '3 days ago' },
    ],
    notes: 'High performer — repurpose this format for the next BTS post.',
    publishDate: new Date(2026, 5, 10),
    platform: 'Instagram, TikTok',
  },
  {
    id: 4,
    title: 'June Newsletter',
    status: 'Draft',
    statusNote: 'Draft',
    isVideo: false,
    gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
    caption: `Subject: What's new at the showroom this June 🏍️\n\nHi [First Name],\n\nJune has been a big month for us — new stock, a demo day, and some exciting changes to the showroom...\n\n[Body copy TBC — waiting on client to confirm June specials]\n\nSee you on the road,\nThe Team`,
    files: [],
    comments: [
      { author: '@Maxine', text: 'Need client to confirm the June specials before we finish this.', time: '4 days ago' },
    ],
    notes: 'Waiting on client input. Follow up Thursday.',
    publishDate: new Date(2026, 5, 20),
    platform: 'Email',
  },
]

// ── Shared helpers ─────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function sameDay(a, b) {
  return a.getDate() === b.getDate() &&
         a.getMonth() === b.getMonth() &&
         a.getFullYear() === b.getFullYear()
}

// ── Card components ────────────────────────────────────────────────────────────
function StatusBanner({ post }) {
  const cfg = STATUS_CFG[post.status] || STATUS_CFG.Draft
  return (
    <div className="rounded-md px-3 py-2.5" style={{ background: cfg.bg }}>
      <div className="text-[0.65rem] font-bold" style={{ color: cfg.color }}>{cfg.label}</div>
      {post.statusNote && post.statusNote !== post.status && (
        <div className="text-[0.6rem] mt-0.5" style={{ color: cfg.color, opacity: 0.75 }}>{post.statusNote}</div>
      )}
    </div>
  )
}

function MediaCard({ post, large }) {
  const h = large ? 'aspect-video' : 'aspect-video'
  return (
    <div className={`rounded-md overflow-hidden ${h} flex items-center justify-center relative`}
      style={{ background: `linear-gradient(135deg, ${post.gradientFrom} 0%, ${post.gradientTo} 100%)` }}>
      {post.isVideo ? (
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
          <span className="text-white text-base ml-0.5">▶</span>
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
          <span className="text-lg">🖼</span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5" style={{ background: 'rgba(50,54,66,0.35)' }}>
        <span className="text-[0.58rem] text-white font-medium">{post.isVideo ? 'Video' : 'Image'} · {post.platform}</span>
      </div>
    </div>
  )
}

function FileCard({ file }) {
  return (
    <div className="rounded-md border border-border bg-cream flex items-center gap-2.5 px-3 py-2.5">
      <div className="w-7 h-7 rounded bg-white flex items-center justify-center text-base flex-shrink-0 shadow-sm">
        {fileIcon(file.ext)}
      </div>
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
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        Comments ({comments.length})
      </div>
      <div className="space-y-3 mb-3">
        {(compact ? comments.slice(0, 2) : comments).map((c, i) => (
          <div key={i} className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center text-[0.5rem] text-white font-bold flex-shrink-0 mt-0.5">
              {c.author.replace('@', '').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span className="text-[0.62rem] font-semibold text-navy">{c.author}</span>
              <span className="text-[0.58rem] text-muted-foreground ml-1.5">{c.time}</span>
              <div className="text-xs text-ink mt-0.5 leading-snug">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <input
        className="w-full text-xs border border-border rounded-md px-2.5 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy"
        placeholder="Type a comment…"
      />
    </div>
  )
}

function StickyNote({ note }) {
  if (!note) return null
  return (
    <div className="rounded-md p-3" style={{ background: '#FEFACC' }}>
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#92700A' }}>
        Internal note
      </div>
      <div className="text-xs leading-relaxed" style={{ color: '#5A4208' }}>{note}</div>
    </div>
  )
}

// ── Board column ───────────────────────────────────────────────────────────────
function BoardColumn({ post, onSelect }) {
  const cardCount = 2 + post.files.length + (post.comments.length ? 1 : 0) + (post.notes ? 1 : 0)
  return (
    <div className="w-[272px] flex-shrink-0 flex flex-col gap-2.5">
      {/* Column header */}
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onSelect(post)} className="text-left min-w-0 group">
          <div className="text-sm font-semibold text-ink group-hover:text-navy transition-colors leading-tight">{post.title}</div>
          <div className="text-[0.58rem] text-muted-foreground mt-0.5">
            {cardCount} cards{post.files.length > 0 ? `, ${post.files.length} file${post.files.length > 1 ? 's' : ''}` : ''} · {fmtDate(post.publishDate)}
          </div>
        </button>
        <button className="text-muted-foreground hover:text-ink text-base leading-none flex-shrink-0 mt-0.5 px-1">···</button>
      </div>

      <StatusBanner post={post} />
      <MediaCard post={post} />
      {post.files.map((f, i) => <FileCard key={i} file={f} />)}
      <CaptionCard caption={post.caption} />
      {post.comments.length > 0 && <CommentThread comments={post.comments} compact />}
      <StickyNote note={post.notes} />

      <button className="text-[0.65rem] text-muted-foreground hover:text-ink border border-dashed border-border rounded-md py-2 transition-colors w-full">
        + Add card
      </button>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({ post, onClose }) {
  if (!post) return null
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(50,54,66,0.4)' }} onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-2xl bg-white overflow-y-auto"
        style={{ boxShadow: '-4px 0 24px rgba(50,54,66,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Panel header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl text-ink leading-tight">{post.title}</h2>
            <div className="text-xs text-muted-foreground mt-0.5">
              {post.platform} · {fmtDate(post.publishDate)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-ink hover:bg-cream transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <StatusBanner post={post} />
          <MediaCard post={post} large />
          {post.files.map((f, i) => <FileCard key={i} file={f} />)}

          {/* Full caption */}
          <div className="rounded-md border border-border bg-white p-4">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Caption</div>
            <div className="text-sm text-ink leading-relaxed whitespace-pre-line">{post.caption}</div>
          </div>

          {/* Comments */}
          {post.comments.length > 0 && (
            <div className="rounded-md border border-border bg-white p-4">
              <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Comments ({post.comments.length})
              </div>
              <div className="space-y-4 mb-4">
                {post.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-[0.58rem] text-white font-bold flex-shrink-0">
                      {c.author.replace('@', '').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div>
                        <span className="text-xs font-semibold text-navy">{c.author}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.time}</span>
                      </div>
                      <div className="text-sm text-ink mt-0.5 leading-relaxed">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <input
                className="w-full text-sm border border-border rounded-md px-3 py-2 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy"
                placeholder="Type a comment…"
              />
            </div>
          )}

          <StickyNote note={post.notes} />
        </div>
      </div>
    </div>
  )
}

// ── Calendar: chip ─────────────────────────────────────────────────────────────
function PostChip({ post, onSelect, withThumb }) {
  const edge = STATUS_EDGE[post.status] || '#B7C1CB'
  return (
    <button
      onClick={() => onSelect(post)}
      className="w-full text-left rounded overflow-hidden hover:opacity-80 transition-opacity"
      style={{ borderLeft: `2.5px solid ${edge}`, background: 'white', boxShadow: '0 1px 2px rgba(50,54,66,0.07)' }}
    >
      {withThumb && (
        <div className="h-10 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${post.gradientFrom} 0%, ${post.gradientTo} 100%)` }}>
          <span className="text-sm opacity-70">{post.isVideo ? '▶' : '🖼'}</span>
        </div>
      )}
      <div className={withThumb ? 'px-1.5 py-1' : 'px-1.5 py-0.5'}>
        <div className="text-[0.6rem] font-medium text-ink truncate">{post.title}</div>
        {withThumb && <div className="text-[0.55rem] text-muted-foreground truncate">{post.platform}</div>}
      </div>
    </button>
  )
}

// ── Calendar: month ────────────────────────────────────────────────────────────
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarMonth({ posts, onSelect, month, year, onPrev, onNext }) {
  const firstDow  = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMo  = new Date(year, month + 1, 0).getDate()
  const today     = new Date()

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMo }, (_, i) => new Date(year, month, i + 1)),
  ]
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
            <div key={d} className="py-2 text-center text-[0.57rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map((date, di) => {
              const dayPosts = date ? posts.filter(p => sameDay(new Date(p.publishDate), date)) : []
              const isToday  = date && sameDay(date, today)
              return (
                <div
                  key={di}
                  className={`min-h-[88px] p-1.5 border-r border-border last:border-r-0 ${!date ? 'bg-cream/40' : ''} ${isToday ? 'bg-navy/[0.04]' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-[0.65rem] font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-navy text-white' : 'text-muted-foreground'}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.map(p => <PostChip key={p.id} post={p} onSelect={onSelect} />)}
                      </div>
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

// ── Calendar: week ─────────────────────────────────────────────────────────────
function CalendarWeek({ posts, onSelect, weekStart, onPrev, onNext }) {
  const today = new Date()
  const days  = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const weekEnd = days[6]
  const rangeLabel = `${weekStart.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrev} className="btn btn-ghost btn-sm px-3">← Prev</button>
        <span className="font-display text-xl text-ink">{rangeLabel}</span>
        <button onClick={onNext} className="btn btn-ghost btn-sm px-3">Next →</button>
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayPosts = posts.filter(p => sameDay(new Date(p.publishDate), day))
            const isToday  = sameDay(day, today)
            return (
              <div key={i} className={`border-r border-border last:border-r-0 flex flex-col ${isToday ? 'bg-navy/[0.03]' : ''}`}>
                <div className={`py-2.5 border-b border-border text-center flex-shrink-0 ${isToday ? 'bg-navy' : 'bg-cream/40'}`}>
                  <div className={`text-[0.55rem] font-semibold uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {WEEKDAYS[i]}
                  </div>
                  <div className={`text-base font-semibold mt-0.5 leading-none ${isToday ? 'text-white' : 'text-ink'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {dayPosts.map(p => <PostChip key={p.id} post={p} onSelect={onSelect} withThumb />)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main ContentBoard ──────────────────────────────────────────────────────────
export default function ContentBoard({ client }) {
  const [view,     setView]     = useState('board')
  const [calView,  setCalView]  = useState('month')
  const [month,    setMonth]    = useState(new Date().getMonth())
  const [year,     setYear]     = useState(new Date().getFullYear())
  const [weekStart, setWeekStart] = useState(getMonday(new Date()))
  const [selected, setSelected] = useState(null)
  const [posts]                 = useState(SEED_POSTS)

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }
  const prevWeek  = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const nextWeek  = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

  return (
    <div>
      {/* Section header + view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-ink">Content Hub</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Plan, track and collaborate on every piece of content.</p>
        </div>
        <div className="flex items-center gap-1 bg-cream rounded-lg p-1 border border-border">
          {['board', 'calendar'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                view === v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'
              }`}
            >
              {v === 'board' ? '⊞ Board' : '◫ Calendar'}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOARD VIEW ── */}
      {view === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6" style={{ scrollbarWidth: 'thin' }}>
          {posts.map(post => (
            <BoardColumn key={post.id} post={post} onSelect={setSelected} />
          ))}
          {/* Add column */}
          <div className="w-[220px] flex-shrink-0">
            <button className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors">
              + Add column
            </button>
          </div>
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div>
          {/* Month / Week sub-toggle */}
          <div className="flex gap-1 mb-5 bg-cream rounded-lg p-1 border border-border w-fit">
            {['month', 'week'].map(v => (
              <button
                key={v}
                onClick={() => setCalView(v)}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  calView === v ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {calView === 'month' && (
            <CalendarMonth
              posts={posts}
              onSelect={setSelected}
              month={month}
              year={year}
              onPrev={prevMonth}
              onNext={nextMonth}
            />
          )}
          {calView === 'week' && (
            <CalendarWeek
              posts={posts}
              onSelect={setSelected}
              weekStart={weekStart}
              onPrev={prevWeek}
              onNext={nextWeek}
            />
          )}
        </div>
      )}

      {/* ── DETAIL PANEL ── */}
      <DetailPanel post={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
