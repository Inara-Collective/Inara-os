import React, { useState, useRef } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
  useDraggable, useDroppable, pointerWithin,
} from '@dnd-kit/core'
import {
  SortableContext, horizontalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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
  'Draft':          { bg: '#E7E2DB', color: '#000000' },
  'To Review':      { bg: '#DAE6F6', color: '#000000' },
  'Being Reviewed': { bg: '#DCEBDD', color: '#000000' },
  'Needs Changes':  { bg: '#F6E6C8', color: '#000000' },
  'Approved':       { bg: '#DCEBDD', color: '#000000' },
  'Scheduled':      { bg: '#DAE6F6', color: '#000000' },
  'Posted':         { bg: '#DCEBDD', color: '#000000' },
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

const PLATFORMS     = ['Instagram','Facebook','LinkedIn','LinkedIn Repost','TikTok','Email','Blog','Website','YouTube','Pinterest']
const CONTENT_TYPES = ['Post','Reel','Carousel','Text Post','Story','Email','Blog','Ad','Campaign Asset']
const ALL_STATUSES  = ['Idea Only','Draft','To Review','Being Reviewed','Needs Changes','Approved','Scheduled','Posted']
const PILLARS       = ['Brand Story','Authority','Education','Behind the Scenes','Social Proof']

// Platforms that get per-platform caption fields
const CAPTION_PLATFORMS = ['Instagram','Facebook','LinkedIn','LinkedIn Repost','TikTok']

const PLATFORM_META = {
  Instagram:          { bg: '#FCF0F7', color: '#C13584' },
  Facebook:           { bg: '#EEF5FF', color: '#1877F2' },
  LinkedIn:           { bg: '#E8F0F9', color: '#0A66C2' },
  'LinkedIn Repost':  { bg: '#EBF0F8', color: '#0A54A1' },
  TikTok:             { bg: '#F0F0F2', color: '#323642' },
  Blog:               { bg: '#F4F4F4', color: '#5F6368' },
  Email:              { bg: '#F4F4F4', color: '#5F6368' },
}
const PLATFORM_META_DEFAULT = { bg: '#F4F4F4', color: '#5F6368' }

const APPROVAL_STATUS_META = {
  'Pending':           { bg: '#E8ECF0', color: '#6B7485' },
  'Approved':          { bg: '#DCEBDD', color: '#2E6B33' },
  'Changes Requested': { bg: '#F6E6C8', color: '#7A4F00' },
}

function isMediaFile(f) {
  return f?.type?.startsWith('image/') || f?.type?.startsWith('video/')
}

// ── Seed posts (June 2026, spread across month) ────────────────────────────────
const SEED_POSTS = [
  {
    id: 1, title: 'Why We Do What We Do',
    status: 'Posted', pillar: 'Brand Story', contentType: 'Post',
    platforms: ['Instagram', 'Facebook'],
    isVideo: false, gradientFrom: '#ECD6CE', gradientTo: '#D4B8AD',
    caption: 'Every business has a reason it exists. Here\'s ours.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 1), scheduleTime: '9:00 AM',
    owner: 'Maxine', updatedAgo: '3 weeks ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 2, title: "Client Success: Sarah's Rebrand",
    status: 'Posted', pillar: 'Social Proof', contentType: 'Carousel',
    platforms: ['Instagram', 'LinkedIn'],
    isVideo: false, gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: 'Before and after — Sarah\'s brand transformation in 6 weeks.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 3), scheduleTime: '10:00 AM',
    owner: 'Tanya H.', updatedAgo: '3 weeks ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 3, title: '5 Caption Mistakes to Avoid',
    status: 'Posted', pillar: 'Education', contentType: 'Carousel',
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    isVideo: false, gradientFrom: '#C8D8E8', gradientTo: '#B0C4D8',
    caption: 'We see these every day. Don\'t let them happen to you.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 5), scheduleTime: '11:00 AM',
    owner: 'Tanya H.', updatedAgo: '2 weeks ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 4, title: 'Studio Morning Routine',
    status: 'Posted', pillar: 'Behind the Scenes', contentType: 'Reel',
    platforms: ['Instagram', 'TikTok'],
    isVideo: true, gradientFrom: '#D8E0E8', gradientTo: '#C5CDD8',
    caption: 'This is what 6am looks like when you love what you do.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 9), scheduleTime: '8:00 AM',
    owner: 'Maxine', updatedAgo: '2 weeks ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 5, title: 'What Makes Content Convert',
    status: 'Posted', pillar: 'Authority', contentType: 'Post',
    platforms: ['LinkedIn', 'Instagram'],
    isVideo: false, gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
    caption: 'Three things that turn scrollers into buyers.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 11), scheduleTime: '10:00 AM',
    owner: 'Maxine', updatedAgo: '2 weeks ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 6, title: 'The Inara Story',
    status: 'Posted', pillar: 'Brand Story', contentType: 'Reel',
    platforms: ['Instagram', 'TikTok'],
    isVideo: true, gradientFrom: '#E8E0D8', gradientTo: '#D8CCC0',
    caption: 'We started Inara because we believed small businesses deserved better.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 15), scheduleTime: '9:00 AM',
    owner: 'Maxine', updatedAgo: '1 week ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 7, title: 'Client Love: Margot & Co.',
    status: 'Posted', pillar: 'Social Proof', contentType: 'Post',
    platforms: ['Instagram', 'Facebook'],
    isVideo: false, gradientFrom: '#ECD6CE', gradientTo: '#D4B8AD',
    caption: '"Working with Inara changed everything about how I show up online." — Margot',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 17), scheduleTime: '11:00 AM',
    owner: 'Tanya H.', updatedAgo: '1 week ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 8, title: 'Behind Our Strategy Process',
    status: 'To Review', pillar: 'Behind the Scenes', contentType: 'Carousel',
    platforms: ['Instagram', 'LinkedIn'],
    isVideo: false, gradientFrom: '#C8D8E8', gradientTo: '#B0C4D8',
    concept: 'Show the audience what actually goes into building a content strategy. Demystify the process and position Inara as strategic, not just creative. The goal is trust — clients should feel confident we know what we\'re doing.',
    caption: "We don't guess. Here's how we build a content strategy from scratch.",
    platformCaptions: {
      Instagram: "We don't guess. Here's how we build a content strategy from scratch. 🎯\n\nEvery client gets a bespoke strategy — not a template. Swipe to see our 5-step process. #contentstrategy #socialmedia #smallbusiness",
      LinkedIn: "At Inara, we believe great content starts with a great strategy — not the other way around.\n\nHere's the exact process we use with every client to build content that actually moves the needle. No guesswork, no templates.",
    },
    files: [], comments: [
      { author: '@Tanya H', text: 'Love this — can we add the client onboarding step?', time: '2 days ago' },
    ], notes: 'Pending Maxine review.',
    approvers: [
      { id: 1, name: 'Maxine', status: 'Approved', comments: [{ text: 'Love the direction — approved from my end!', time: '1 day ago' }] },
      { id: 2, name: 'Tanya H.', status: 'Pending', comments: [] },
    ],
    publishDate: new Date(2026, 5, 19), scheduleTime: '2:00 PM',
    owner: 'Tanya H.', updatedAgo: '2 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 9, title: 'How to Batch Your Content',
    status: 'To Review', pillar: 'Education', contentType: 'Blog',
    platforms: ['Blog', 'Instagram'],
    isVideo: false, gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: 'Batching saved us 6 hours a week. Here\'s the exact system we use.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 20), scheduleTime: null,
    owner: 'Maxine', updatedAgo: '1 day ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 10, title: 'Showroom Changes',
    status: 'Needs Changes', pillar: 'Brand Story', contentType: 'Reel',
    platforms: ['Instagram', 'Facebook'],
    isVideo: true, gradientFrom: '#B7C1CB', gradientTo: '#9FAABD',
    caption: 'Big changes at the showroom — come and see what\'s new.',
    files: [{ name: 'Showroom Changes.mov', size: '76.9 MB', ext: 'mov' }],
    comments: [
      { author: '@Maxine',  text: 'Love this! Can we add the store hours too?', time: '2h ago' },
      { author: '@Tanya H', text: 'Good call — caption updated. Ready to go.',  time: '45m ago' },
    ],
    notes: 'Client wants to review thumbnail before we post.',
    publishDate: new Date(2026, 5, 22), scheduleTime: '9:00 AM',
    owner: 'Tanya H.', updatedAgo: '2h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 11, title: 'Triumph Demo Day',
    status: 'Approved', pillar: 'Social Proof', contentType: 'Post',
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    isVideo: false, gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: 'Demo Day is THIS Saturday! Come test ride the full range.',
    files: [{ name: 'Demo Day Flyer.pdf', size: '2.3 MB', ext: 'pdf' }],
    comments: [{ author: '@Maxine', text: 'Approved! Post it Saturday morning.', time: 'Yesterday' }],
    notes: '',
    publishDate: new Date(2026, 5, 23), scheduleTime: '10:00 AM',
    owner: 'Maxine', updatedAgo: 'Yesterday',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 12, title: 'Behind the Scenes',
    status: 'Posted', pillar: 'Behind the Scenes', contentType: 'Reel',
    platforms: ['Instagram', 'TikTok'],
    isVideo: true, gradientFrom: '#ECD6CE', gradientTo: '#D4B8AD',
    caption: 'A little look behind the scenes at what goes into keeping your bike running perfectly.',
    files: [{ name: 'Workshop BTS.mov', size: '112 MB', ext: 'mov' }],
    comments: [
      { author: '@Tanya H', text: 'Great engagement — 847 likes so far!', time: '3 days ago' },
    ],
    notes: 'High performer — repurpose this format.',
    publishDate: new Date(2026, 5, 24), scheduleTime: '11:00 AM',
    owner: 'Tanya H.', updatedAgo: '3 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 13, title: 'June Newsletter',
    status: 'Draft', pillar: 'Authority', contentType: 'Email',
    platforms: ['Email'],
    isVideo: false, gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
    caption: 'Subject: What\'s new at the showroom this June.',
    files: [],
    comments: [{ author: '@Maxine', text: 'Need client to confirm the June specials.', time: '4 days ago' }],
    notes: 'Waiting on client input. Follow up Thursday.',
    publishDate: new Date(2026, 5, 25), scheduleTime: null,
    owner: 'Maxine', updatedAgo: '4 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 14, title: 'To Review: Weekend Ride Caption',
    status: 'To Review', pillar: 'Brand Story', contentType: 'Post',
    platforms: ['Instagram'],
    isVideo: false, gradientFrom: '#D8E0E8', gradientTo: '#C5CDD8',
    caption: 'Weekend ride vibes.',
    files: [], comments: [], notes: 'Needs creative brief.',
    publishDate: new Date(2026, 5, 26), scheduleTime: null,
    owner: 'Maxine', updatedAgo: '1h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 15, title: 'Service Special Carousel',
    status: 'To Review', pillar: 'Education', contentType: 'Carousel',
    platforms: ['Instagram', 'Facebook'],
    isVideo: false, gradientFrom: '#C8D8E8', gradientTo: '#B0C4D8',
    caption: 'Keep your bike in peak condition this winter.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 27), scheduleTime: '2:00 PM',
    owner: 'Tanya H.', updatedAgo: '30m ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 16, title: 'Sunday Inspiration Quote',
    status: 'Scheduled', pillar: 'Brand Story', contentType: 'Text Post',
    platforms: ['Instagram', 'Facebook', 'LinkedIn'],
    isVideo: false, gradientFrom: '#E8E0D8', gradientTo: '#D8CCC0',
    caption: '"The journey is the destination." — Sunday inspiration.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 28), scheduleTime: '8:00 AM',
    owner: 'Tanya H.', updatedAgo: '5h ago',
    attachedFile: null, attachedObjectUrl: null,
  },
  {
    id: 17, title: 'Mid-Year Content Reset',
    status: 'Scheduled', pillar: 'Authority', contentType: 'Blog',
    platforms: ['Blog', 'LinkedIn'],
    isVideo: false, gradientFrom: '#BABEAF', gradientTo: '#9EA89A',
    caption: 'Halfway through the year. Time to check in on your content strategy.',
    files: [], comments: [], notes: '',
    publishDate: new Date(2026, 5, 30), scheduleTime: '9:00 AM',
    owner: 'Maxine', updatedAgo: '2 days ago',
    attachedFile: null, attachedObjectUrl: null,
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtShort(d) {
  return new Date(d).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtDayLabel(d) {
  return new Date(d).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })
}
function toDateInput(d) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function toTimeInput(t) {
  if (!t) return ''
  const match = String(t).match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match) return t
  let h = parseInt(match[1])
  const min = match[2]
  const period = match[3].toUpperCase()
  if (period === 'PM' && h !== 12) h += 12
  if (period === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}
function fromTimeInput(t) {
  if (!t) return null
  const [h, min] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(min).padStart(2, '0')} ${period}`
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

// ── Shared sub-components ──────────────────────────────────────────────────────
function StatusPill({ status, size = 'sm' }) {
  const tag = STATUS_TAG[status] || STATUS_TAG['Draft']
  const style = size === 'xs'
    ? { padding: '3px 8px', fontSize: '0.65rem', borderRadius: 999, border: '1px solid #E7E2DB', background: tag.bg, color: tag.color, fontWeight: 500 }
    : { padding: '5px 10px', fontSize: '13px',    borderRadius: 999, border: '1px solid #E7E2DB', background: tag.bg, color: tag.color, fontWeight: 500 }
  return <span className="inline-flex items-center whitespace-nowrap" style={style}>{status}</span>
}

function TypePill({ type }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap"
      style={{ padding: '5px 10px', fontSize: '13px', borderRadius: 999, fontWeight: 500, background: '#FFFFFF', color: '#000000', border: '1px solid #A6AAB5' }}>
      {type}
    </span>
  )
}

function PlatformPill({ platform }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap"
      style={{ padding: '5px 10px', fontSize: '13px', borderRadius: 999, fontWeight: 500, background: '#F4EFE9', color: '#000000', border: '1px solid #E7E2DB' }}>
      {platform}
    </span>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium border transition-all whitespace-nowrap"
      style={{
        background:  active ? '#424B63' : '#fff',
        color:       active ? '#fff'    : '#6B7485',
        borderColor: active ? '#424B63' : '#E7E2DB',
      }}>
      {label}
    </button>
  )
}

function PillarChip({ label, active, onClick }) {
  const PILLAR_COLORS = {
    'Brand Story':        { bg: '#F4EFE9', active: '#ECD6CE', color: '#5F4030' },
    'Authority':          { bg: '#E8ECF0', active: '#B7C1CB', color: '#323642' },
    'Education':          { bg: '#DAE6F6', active: '#424B63', color: '#2A3F6A' },
    'Behind the Scenes':  { bg: '#DCEBDD', active: '#BABEAF', color: '#2A4A2C' },
    'Social Proof':       { bg: '#F6E6C8', active: '#D4A84B', color: '#6B4A10' },
  }
  const c = PILLAR_COLORS[label] || { bg: '#E8ECF0', active: '#B7C1CB', color: '#323642' }
  return (
    <button onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all whitespace-nowrap"
      style={{
        background:  active ? c.active : c.bg,
        color:       active ? (label === 'Education' ? '#fff' : label === 'Social Proof' ? '#fff' : c.color) : c.color,
        borderColor: active ? c.active  : 'transparent',
      }}>
      {label}
    </button>
  )
}

const FILTER_PLATFORMS = ['Instagram','Facebook','LinkedIn','TikTok','Email','Blog','Website','YouTube','Pinterest']

function PlatformFilterRow({ value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {['All', ...FILTER_PLATFORMS].map(p => {
        const active = p === 'All' ? !value : value === p
        return (
          <button
            key={p}
            onClick={() => onChange(active && p !== 'All' ? '' : p === 'All' ? '' : p)}
            className="rounded-full px-3 py-1 text-xs font-medium border transition-all whitespace-nowrap"
            style={{
              background:  active ? '#DAE6F6' : '#FFFFFF',
              color:       active ? '#2A3F6A' : '#8C95A3',
              borderColor: active ? '#B8CDED' : '#E7E2DB',
            }}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}

function AvatarInitial({ name, size = 6 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`w-${size} h-${size} rounded-full bg-navy flex items-center justify-center text-white flex-shrink-0`}
      style={{ fontSize: size <= 6 ? '0.55rem' : '0.7rem' }}>
      {initials}
    </div>
  )
}

// ── Board: shared sub-components ──────────────────────────────────────────────
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
          <span className="text-[0.58rem] text-white font-medium">{(post.platforms||[]).join(', ')}</span>
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
        <span className="text-[0.58rem] text-white font-medium">{(post.platforms||[]).join(', ')}</span>
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

function StickyNote({ note }) {
  if (!note) return null
  return (
    <div className="rounded-md p-3" style={{ background: '#FEFACC' }}>
      <div className="text-[0.55rem] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#92700A' }}>Internal note</div>
      <div className="text-xs leading-relaxed" style={{ color: '#5A4208' }}>{note}</div>
    </div>
  )
}

function BoardColumn({ post, onSelect, dragHandleProps }) {
  return (
    <div className="w-[272px] flex-shrink-0 flex flex-col gap-2.5">
      <div className="flex items-start gap-1.5">
        {dragHandleProps && (
          <div {...dragHandleProps}
            className="flex-shrink-0 mt-0.5 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground/80 hover:bg-cream cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder">
            <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
              <circle cx="3" cy="2"  r="1.2"/><circle cx="7" cy="2"  r="1.2"/>
              <circle cx="3" cy="7"  r="1.2"/><circle cx="7" cy="7"  r="1.2"/>
              <circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/>
            </svg>
          </div>
        )}
        <button onClick={() => onSelect(post)} className="text-left min-w-0 group flex-1">
          <div className="text-sm font-semibold text-ink group-hover:text-navy transition-colors leading-tight">{post.title}</div>
          <div className="text-[0.58rem] text-muted-foreground mt-0.5">{fmtDate(post.publishDate)}</div>
        </button>
        <button className="text-muted-foreground hover:text-ink text-base leading-none flex-shrink-0 mt-0.5 px-1">···</button>
      </div>
      <StatusBanner post={post} />
      <MediaCard post={post} />
      {post.files.map((f, i) => <FileCard key={i} file={f} />)}
      <div className="rounded-md border border-border bg-white p-3">
        <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Caption</div>
        <div className="text-xs text-ink leading-relaxed whitespace-pre-line">{post.caption.slice(0, 140)}{post.caption.length > 140 ? '…' : ''}</div>
      </div>
      {post.comments.length > 0 && (
        <div className="rounded-md border border-border bg-white p-3">
          <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Comments ({post.comments.length})</div>
          {post.comments.slice(0,2).map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <AvatarInitial name={c.author.replace('@','')} size={5} />
              <div><span className="text-[0.62rem] font-semibold text-navy">{c.author}</span><div className="text-xs text-ink mt-0.5">{c.text}</div></div>
            </div>
          ))}
        </div>
      )}
      <StickyNote note={post.notes} />
      <button className="text-[0.65rem] text-muted-foreground hover:text-ink border border-dashed border-border rounded-md py-2 transition-colors w-full">+ Add card</button>
    </div>
  )
}

// ── Board view (dnd-kit drag-to-reorder) ─────────────────────────────────────
function SortableBoardColumn({ post, onSelect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: post.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        flexShrink: 0,
        zIndex: isDragging ? 20 : 1,
      }}>
      {/* Actual column — hidden while dragging (keeps layout / height) */}
      <div style={{ visibility: isDragging ? 'hidden' : 'visible', pointerEvents: isDragging ? 'none' : undefined }}>
        <BoardColumn post={post} onSelect={onSelect} dragHandleProps={{ ...attributes, ...listeners }} />
      </div>

      {/* Placeholder outline shown in the gap while dragging */}
      {isDragging && (
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px dashed #B7C1CB',
          borderRadius: 12,
          background: 'rgba(183,193,203,0.10)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  )
}

function BoardView({ posts, onSelect }) {
  const [order, setOrder]     = useState(() => posts.map(p => p.id))
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const orderedPosts = order.map(id => posts.find(p => p.id === id)).filter(Boolean)
  const activePost   = posts.find(p => p.id === activeId) || null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        setActiveId(null)
        if (!over || active.id === over.id) return
        setOrder(prev => arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id)))
      }}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={order} strategy={horizontalListSortingStrategy}>
        <div className="overflow-x-auto pb-6 -mx-6 px-6" style={{ scrollbarWidth: 'thin' }}>
          <div className="flex gap-4 min-w-max items-stretch">
            {orderedPosts.map(post => (
              <SortableBoardColumn key={post.id} post={post} onSelect={onSelect} />
            ))}
            <div className="w-[220px] flex-shrink-0">
              <button className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors">
                + Add column
              </button>
            </div>
          </div>
        </div>
      </SortableContext>

      <DragOverlay
        dropAnimation={{
          duration: 220,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
        {activePost && (
          <div style={{
            opacity: 0.75,
            borderRadius: 12,
            transform: 'rotate(0.75deg) scale(1.015)',
            boxShadow: '0 8px 24px rgba(50,54,66,0.18), 0 24px 56px rgba(50,54,66,0.22)',
            cursor: 'grabbing',
          }}>
            <BoardColumn post={activePost} onSelect={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function ApproverCard({ approver, onUpdateStatus, onSubmitComment, onRemove }) {
  const [comment, setComment] = useState('')
  const meta = APPROVAL_STATUS_META[approver.status] || APPROVAL_STATUS_META.Pending

  function submit() {
    if (!comment.trim()) return
    onSubmitComment(comment)
    setComment('')
  }

  return (
    <div className="rounded-lg p-3.5 space-y-2.5" style={{ background: '#FAFAF9', border: '1px solid #EDE9E5' }}>
      {/* Header: avatar + name + status dropdown + quick approve + remove */}
      <div className="flex items-center gap-2">
        <AvatarInitial name={approver.name} size={7} />
        <span className="text-sm font-semibold text-ink flex-1 leading-none min-w-0 truncate">{approver.name}</span>
        {/* Status dropdown */}
        <div className="relative">
          <select
            value={approver.status}
            onChange={e => onUpdateStatus(e.target.value)}
            className="text-[0.62rem] font-semibold rounded-full pl-2.5 pr-6 py-1 border-0 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-navy/30"
            style={{ background: meta.bg, color: meta.color }}>
            <option>Pending</option>
            <option>Approved</option>
            <option>Changes Requested</option>
          </select>
          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[0.45rem]"
            style={{ color: meta.color }}>▾</span>
        </div>
        {/* Quick approve shortcut */}
        {approver.status !== 'Approved' && (
          <button
            onClick={() => onUpdateStatus('Approved')}
            title="Approve"
            className="w-6 h-6 flex items-center justify-center rounded-full text-[0.7rem] font-bold flex-shrink-0 transition-colors"
            style={{ background: '#DCEBDD', color: '#2E6B33' }}>
            ✓
          </button>
        )}
        {/* Remove approver */}
        <button
          onClick={onRemove}
          title="Remove approver"
          className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-ink hover:bg-cream transition-colors text-sm flex-shrink-0">
          ×
        </button>
      </div>

      {/* Approver comment history */}
      {(approver.comments || []).map((c, i) => (
        <div key={i} className="ml-9 text-xs text-ink leading-relaxed bg-white rounded-md px-3 py-2 border border-border/60">
          {c.text}
          <span className="text-muted-foreground text-[0.58rem] ml-2">{c.time}</span>
        </div>
      ))}

      {/* Per-approver comment input */}
      <div className="flex items-center gap-2 ml-9">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
          className="flex-1 text-xs border border-border rounded-md px-2.5 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy bg-white"
          placeholder="Add a comment…"
        />
        <button onClick={submit}
          className="text-[0.65rem] font-medium text-navy hover:underline px-1">
          Send
        </button>
      </div>
    </div>
  )
}

function DetailPanel({ post, onClose, onStatusChange, onUpdatePost }) {
  const [showAddApprover, setShowAddApprover] = useState(false)
  const [newApproverName, setNewApproverName] = useState('')
  const [conceptOpen, setConceptOpen] = useState(false)
  const [captionTab, setCaptionTab] = useState('')  // '' = All

  if (!post) return null

  const progress       = PROGRESS_MAP[post.status] || 0
  const hasVideo       = post.attachedObjectUrl && post.attachedFile?.type?.startsWith('video/')
  const hasImage       = post.attachedObjectUrl && !hasVideo
  const platforms      = post.platforms || []
  const approvers      = post.approvers || []
  const captionPlats   = platforms.filter(p => CAPTION_PLATFORMS.includes(p))

  function togglePlatform(p) {
    const updated = platforms.includes(p)
      ? platforms.filter(x => x !== p)
      : [...platforms, p]
    onUpdatePost(post.id, { platforms: updated })
  }
  function patchApprover(approverId, patch) {
    onUpdatePost(post.id, {
      approvers: approvers.map(a => a.id === approverId ? { ...a, ...patch } : a),
    })
  }
  function handleApproverComment(approverId, text) {
    if (!text.trim()) return
    patchApprover(approverId, {
      comments: [...((approvers.find(a => a.id === approverId)?.comments) || []), { text, time: 'Just now' }],
    })
  }
  function removeApprover(approverId) {
    onUpdatePost(post.id, { approvers: approvers.filter(a => a.id !== approverId) })
  }
  function addApprover() {
    if (!newApproverName.trim()) return
    onUpdatePost(post.id, {
      approvers: [...approvers, { id: Date.now(), name: newApproverName.trim(), status: 'Pending', comments: [] }],
    })
    setNewApproverName('')
    setShowAddApprover(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'rgba(50,54,66,0.38)' }} onClick={onClose}>
      <div
        className="ml-auto h-full w-full max-w-2xl bg-white overflow-y-auto flex flex-col"
        style={{ boxShadow: '-4px 0 32px rgba(50,54,66,0.14)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Sticky header: editable title + platform toggles + close ── */}
        <div className="sticky top-0 bg-white border-b border-border px-6 pt-4 pb-3 z-10 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <input
                value={post.title}
                onChange={e => onUpdatePost(post.id, { title: e.target.value })}
                className="font-display text-xl text-ink leading-tight bg-transparent w-full border-b border-transparent hover:border-border focus:border-navy focus:outline-none transition-colors pb-0.5"
                placeholder="Post title…"
              />
              {/* Platform toggle pills — all platforms, active = coloured */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {PLATFORMS.map(p => {
                  const active = platforms.includes(p)
                  const m = PLATFORM_META[p] || PLATFORM_META_DEFAULT
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold transition-all border"
                      style={active
                        ? { background: m.bg, color: m.color, borderColor: m.color + '33' }
                        : { background: 'transparent', color: '#C4C9D4', borderColor: '#E8ECF0' }
                      }
                    >{p}</button>
                  )
                })}
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-ink hover:bg-cream transition-colors text-sm flex-shrink-0 mt-0.5">
              ✕
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="p-6 space-y-5 flex-1">

          {/* Status + Content Type + Pillar + progress % */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status */}
            <div className="relative">
              <select
                value={post.status}
                onChange={e => onStatusChange(post.id, e.target.value)}
                className="text-xs font-semibold rounded-full pl-3 pr-7 py-1.5 border-0 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy/25"
                style={{ background: STATUS_TAG[post.status]?.bg || '#E7E2DB', color: STATUS_TAG[post.status]?.color || '#323642' }}>
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.48rem]"
                style={{ color: STATUS_TAG[post.status]?.color || '#323642' }}>▾</span>
            </div>
            {/* Content Type */}
            <div className="relative">
              <select
                value={post.contentType || ''}
                onChange={e => onUpdatePost(post.id, { contentType: e.target.value })}
                className="text-xs font-medium rounded-full pl-3 pr-7 py-1.5 border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-navy/30 transition-colors"
                style={{ background: '#fff', color: '#323642', borderColor: '#B7C1CB' }}>
                {CONTENT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
              </select>
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.48rem] text-muted-foreground">▾</span>
            </div>
            {post.pillar && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: '#F4EFE9', color: '#5F4030' }}>{post.pillar}</span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#E8ECF0' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: progress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>

          {/* Schedule */}
          <div className="rounded-md border border-border bg-white p-4">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Schedule</div>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <label className="text-[0.6rem] text-muted-foreground">Publish date</label>
                <input
                  type="date"
                  value={toDateInput(post.publishDate)}
                  onChange={e => {
                    if (!e.target.value) return
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    onUpdatePost(post.id, { publishDate: new Date(y, m - 1, d) })
                  }}
                  className="text-sm border border-border rounded-md px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-navy cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[0.6rem] text-muted-foreground">Time</label>
                <input
                  type="time"
                  value={toTimeInput(post.scheduleTime)}
                  onChange={e => onUpdatePost(post.id, { scheduleTime: fromTimeInput(e.target.value) })}
                  className="text-sm border border-border rounded-md px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-navy cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Concept — collapsible accordion */}
          <div className="rounded-md border border-border bg-white overflow-hidden">
            <button
              onClick={() => setConceptOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left group hover:bg-cream/60 transition-colors"
            >
              <span className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-ink transition-colors">Concept</span>
              <span
                className="text-muted-foreground text-xs transition-transform duration-200"
                style={{ transform: conceptOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
              >▾</span>
            </button>
            {conceptOpen && (
              <div className="px-4 pb-4">
                <textarea
                  autoFocus
                  value={post.concept || ''}
                  onChange={e => onUpdatePost(post.id, { concept: e.target.value })}
                  placeholder="What's the idea or thinking behind this content?"
                  rows={5}
                  className="w-full text-sm text-ink leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-navy rounded-sm placeholder:text-muted-foreground/50"
                />
              </div>
            )}
          </div>

          {/* Media */}
          {hasVideo && <video controls src={post.attachedObjectUrl} className="w-full rounded-md max-h-64 bg-black" />}
          {hasImage && <img src={post.attachedObjectUrl} alt={post.title} className="w-full rounded-md object-cover" style={{ maxHeight: 260 }} />}
          {!post.attachedObjectUrl && <MediaCard post={post} />}

          {/* Files */}
          {(post.files || []).map((f, i) => <FileCard key={i} file={f} />)}

          {/* Per-platform captions */}
          {captionPlats.length > 0 && (
            <div className="space-y-3">
              {/* Header row: label + platform tabs */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">Captions</div>
                <div className="flex items-center gap-1 flex-wrap">
                  {/* All tab */}
                  <button
                    onClick={() => setCaptionTab('')}
                    className="rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold border transition-all whitespace-nowrap"
                    style={{
                      background:  !captionTab ? '#DAE6F6' : '#FFFFFF',
                      color:       !captionTab ? '#2A3F6A' : '#8C95A3',
                      borderColor: !captionTab ? '#B8CDED' : '#E7E2DB',
                    }}
                  >All</button>
                  {/* One tab per platform */}
                  {captionPlats.map(platform => {
                    const m      = PLATFORM_META[platform] || PLATFORM_META_DEFAULT
                    const active = captionTab === platform
                    return (
                      <button
                        key={platform}
                        onClick={() => setCaptionTab(active ? '' : platform)}
                        className="rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold border transition-all whitespace-nowrap"
                        style={{
                          background:  active ? m.bg      : '#FFFFFF',
                          color:       active ? m.color   : '#8C95A3',
                          borderColor: active ? m.color + '55' : '#E7E2DB',
                        }}
                      >{platform}</button>
                    )
                  })}
                </div>
              </div>

              {/* Caption fields — filtered by tab */}
              {captionPlats
                .filter(p => !captionTab || captionTab === p)
                .map(platform => {
                  const m = PLATFORM_META[platform] || PLATFORM_META_DEFAULT
                  return (
                    <div key={platform} className="rounded-md border border-border bg-white p-4">
                      <div className="mb-2.5">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold"
                          style={{ background: m.bg, color: m.color }}>{platform}</span>
                      </div>
                      <textarea
                        value={(post.platformCaptions || {})[platform] || ''}
                        onChange={e => onUpdatePost(post.id, {
                          platformCaptions: { ...(post.platformCaptions || {}), [platform]: e.target.value },
                        })}
                        placeholder={`Caption for ${platform}…`}
                        rows={4}
                        className="w-full text-sm text-ink leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-navy rounded-sm placeholder:text-muted-foreground/50"
                      />
                    </div>
                  )
                })
              }
            </div>
          )}

          {/* Approvals */}
          <div className="rounded-md border border-border bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Approvals{approvers.length > 0 ? ` (${approvers.length})` : ''}
              </div>
              <button onClick={() => setShowAddApprover(true)}
                className="text-[0.65rem] font-medium text-navy hover:underline">
                + Add approver
              </button>
            </div>

            {approvers.length === 0 && !showAddApprover && (
              <p className="text-xs text-muted-foreground py-1">No approvers assigned yet.</p>
            )}

            <div className="space-y-2.5">
              {approvers.map(approver => (
                <ApproverCard
                  key={approver.id}
                  approver={approver}
                  onUpdateStatus={status => patchApprover(approver.id, { status })}
                  onSubmitComment={text => handleApproverComment(approver.id, text)}
                  onRemove={() => removeApprover(approver.id)}
                />
              ))}
            </div>

            {showAddApprover && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  autoFocus
                  value={newApproverName}
                  onChange={e => setNewApproverName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addApprover()
                    if (e.key === 'Escape') { setShowAddApprover(false); setNewApproverName('') }
                  }}
                  className="flex-1 text-sm border border-border rounded-md px-3 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy"
                  placeholder="Approver name…"
                />
                <button onClick={addApprover}
                  className="text-xs font-semibold px-3 py-1.5 rounded-md bg-navy text-white hover:bg-navy/90 transition-colors">
                  Add
                </button>
                <button onClick={() => { setShowAddApprover(false); setNewApproverName('') }}
                  className="text-xs text-muted-foreground hover:text-ink">
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* General comments */}
          <div className="rounded-md border border-border bg-white p-4">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Comments{post.comments?.length > 0 ? ` (${post.comments.length})` : ''}
            </div>
            {post.comments?.length > 0 && (
              <div className="space-y-4 mb-4">
                {post.comments.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <AvatarInitial name={c.author.replace('@', '')} size={7} />
                    <div>
                      <span className="text-xs font-semibold text-navy">{c.author}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.time}</span>
                      <div className="text-sm text-ink mt-0.5 leading-relaxed">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input
              className="w-full text-sm border border-border rounded-md px-3 py-2 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy"
              placeholder="Type a comment…"
            />
          </div>

          <StickyNote note={post.notes} />
        </div>
      </div>
    </div>
  )
}

// ── Overview ──────────────────────────────────────────────────────────────────
function ContentHubOverview({ posts, month, year, onGoToMonth, onGoToWeek, weekStart }) {
  const thisMonthPosts = posts.filter(p => {
    const d = new Date(p.publishDate)
    return d.getMonth() === month && d.getFullYear() === year
  })
  const stats = [
    { icon: '📅', value: thisMonthPosts.length,                                          label: 'This Month' },
    { icon: '👁',  value: thisMonthPosts.filter(p => p.status === 'To Review').length,    label: 'To Review' },
    { icon: '🗓',  value: thisMonthPosts.filter(p => p.status === 'Scheduled').length,    label: 'Scheduled' },
    { icon: '✓',  value: thisMonthPosts.filter(p => p.status === 'Posted').length,        label: 'Published' },
  ]
  const nextMonth = month === 11 ? 0 : month + 1
  const nextYear  = month === 11 ? year + 1 : year

  const quickLinks = [
    { title: `This Month`,        sub: `${MONTHS[month]} ${year}`,        icon: '📅', action: onGoToMonth },
    { title: 'Next Month',        sub: `${MONTHS[nextMonth]} ${nextYear}`, icon: '📆', action: onGoToMonth },
    { title: 'Content Calendar',  sub: 'View full calendar',               icon: '◫',  action: onGoToMonth },
    { title: 'Content Ideas',     sub: 'Upcoming topics',                  icon: '💡', action: () => {} },
  ]

  return (
    <div className="space-y-7">
      <div>
        <h2 className="font-display text-3xl text-ink">Content Hub Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Here you can see all content planned, in progress and published.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <button key={i} onClick={onGoToMonth}
            className="card p-5 text-left hover:shadow-md transition-all group flex flex-col gap-2">
            <div className="text-2xl">{s.icon}</div>
            <div className="font-display text-4xl text-ink leading-none">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick links</div>
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((l, i) => (
            <button key={i} onClick={l.action}
              className="card p-5 text-left hover:shadow-md transition-all group flex flex-col gap-2">
              <div className="text-xl">{l.icon}</div>
              <div className="text-sm font-semibold text-ink group-hover:text-navy transition-colors leading-snug">{l.title}</div>
              <div className="text-xs text-muted-foreground">{l.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quote banner */}
      <div className="rounded-xl p-7 flex items-center gap-8" style={{ background: 'linear-gradient(120deg, #F4EFE9 0%, #ECD6CE 100%)' }}>
        <div className="flex-1">
          <p className="font-display text-xl text-ink leading-relaxed">
            "Consistent, aligned content creates clarity, connection and long-term growth."
          </p>
          <p className="text-sm text-muted-foreground mt-3">— Maxine xx</p>
        </div>
        <div className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center text-4xl"
          style={{ background: 'rgba(255,255,255,0.5)' }}>
          ✦
        </div>
      </div>

      {/* Recent content preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Recent content</div>
          <button onClick={onGoToMonth} className="text-xs text-navy hover:underline">View all →</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...posts]
            .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
            .slice(0, 3)
            .map(post => <MonthGridCard key={post.id} post={post} onSelect={() => {}} compact />)
          }
        </div>
      </div>
    </div>
  )
}

// ── Month grid card ────────────────────────────────────────────────────────────
function MonthGridCard({ post, onSelect, compact }) {
  const tag      = STATUS_TAG[post.status] || STATUS_TAG['Draft']
  const dayLabel = fmtDayLabel(post.publishDate)
  const pillar   = post.pillar || ''

  return (
    <div
      onClick={() => onSelect(post)}
      className="bg-white rounded-xl overflow-hidden cursor-pointer group transition-all hover:shadow-md"
      style={{ boxShadow: '0 1px 4px rgba(50,54,66,0.07)', border: '1px solid #EDE9E5' }}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden flex items-center justify-center"
        style={{ height: compact ? 100 : 140, background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}
      >
        {post.attachedObjectUrl && !post.attachedFile?.type?.startsWith('video/') && (
          <img src={post.attachedObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {post.isVideo && (
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
            <span className="text-white text-sm ml-0.5">▶</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Body */}
      <div className="p-3 space-y-1.5">
        <div className="text-[0.6rem] text-muted-foreground leading-tight">
          {dayLabel}{pillar ? ` — ${pillar}` : ''}
        </div>
        <div className="text-sm font-semibold text-ink leading-snug group-hover:text-navy transition-colors line-clamp-2">
          {post.title}
        </div>
        <StatusPill status={post.status} size="xs" />
      </div>
    </div>
  )
}

// ── Month mini card ────────────────────────────────────────────────────────────
function MonthMiniCard({ post, onSelect }) {
  const cfg = STATUS_CFG[post.status] || STATUS_CFG.Draft
  return (
    <div
      onClick={() => onSelect(post)}
      className="rounded-md overflow-hidden cursor-pointer group transition-all hover:shadow-sm"
      style={{ border: '1px solid #EDE9E5', background: '#fff' }}>
      {/* Thumbnail */}
      <div className="relative overflow-hidden flex items-center justify-center"
        style={{ height: 38, background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}>
        {post.attachedObjectUrl && !post.attachedFile?.type?.startsWith('video/') && (
          <img src={post.attachedObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        {post.isVideo && (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.4)' }}>
            <span className="text-white" style={{ fontSize: '0.38rem', marginLeft: 1 }}>▶</span>
          </div>
        )}
        {/* Thin status strip at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: cfg.bg }} />
      </div>
      {/* Info */}
      <div className="px-1.5 pt-1 pb-1.5">
        <div className="text-[0.62rem] font-semibold text-ink leading-tight line-clamp-2 group-hover:text-navy transition-colors mb-1">
          {post.title}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <StatusPill status={post.status} size="xs" />
          {post.platforms?.[0] && (
            <span className="text-[0.5rem] text-muted-foreground leading-none truncate">{post.platforms[0]}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableMonthMiniCard({ post, onSelect, isActiveDrag }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: post.id })
  const startPos = useRef(null)

  // dnd-kit's PointerSensor can suppress the 'click' event via preventDefault on
  // pointerdown. Track pointer movement manually: if pointer didn't move more than
  // 5px between down and up, treat it as a click and open the detail panel.
  function handlePointerDown(e) {
    startPos.current = { x: e.clientX, y: e.clientY }
    listeners?.onPointerDown?.(e)
  }
  function handlePointerUp(e) {
    if (!startPos.current) return
    const moved = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y)
    startPos.current = null
    if (moved < 5) onSelect(post)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        visibility: isActiveDrag ? 'hidden' : 'visible',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <MonthMiniCard post={post} onSelect={() => {}} />
    </div>
  )
}

function DroppableDayCell({ day, inMonth, isToday, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey(day), disabled: !inMonth })
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col transition-colors duration-150 ${
        !inMonth
          ? 'bg-cream/60'
          : isOver
          ? 'bg-navy/5'
          : isToday
          ? ''
          : 'bg-white'
      }`}
      style={{
        minHeight: 140,
        boxShadow: isOver && inMonth ? 'inset 0 0 0 2px rgba(66,75,99,0.25)' : undefined,
      }}
    >
      {children}
    </div>
  )
}

// ── Month week row ─────────────────────────────────────────────────────────────
const MAX_MINI_CARDS = 3

function MonthWeekRow({ weekDays, weekNum, month, posts, filterPillar, filterPlatform, onSelect, onAddPost, activeId }) {
  const today = new Date()

  // Date range label — only days within this month
  const monthDays  = weekDays.filter(d => d.getMonth() === month)
  const rangeStart = monthDays[0]?.getDate()
  const rangeEnd   = monthDays[monthDays.length - 1]?.getDate()
  const abbr       = MONTHS[month].slice(0, 3)
  const rangeLabel = rangeStart === rangeEnd ? `${rangeStart} ${abbr}` : `${rangeStart}–${rangeEnd} ${abbr}`

  return (
    <div className="card overflow-hidden">
      {/* Week label strip */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border" style={{ background: 'rgba(244,240,238,0.5)' }}>
        <span className="text-xs font-semibold text-ink">Week {weekNum}</span>
        <span className="text-[0.65rem] text-muted-foreground">· {rangeLabel}</span>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 divide-x divide-border">
        {weekDays.map((day, i) => {
          const inMonth  = day.getMonth() === month
          const isToday  = sameDay(day, today)
          const dayPosts = !inMonth ? [] : posts.filter(p => {
            if (filterPillar  && p.pillar !== filterPillar)           return false
            if (filterPlatform && !(p.platforms||[]).includes(filterPlatform)) return false
            return sameDay(new Date(p.publishDate), day)
          })
          const visible  = dayPosts.slice(0, MAX_MINI_CARDS)
          const overflow = dayPosts.length - MAX_MINI_CARDS

          return (
            <DroppableDayCell key={i} day={day} inMonth={inMonth} isToday={isToday}>
              {/* Day header */}
              <div className={`px-2 py-2 flex items-center justify-between border-b border-border/60 flex-shrink-0 ${isToday ? 'bg-navy' : ''}`}>
                <div>
                  <div className={`text-[0.5rem] font-semibold uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {WEEKDAYS[i]}
                  </div>
                  <div className={`text-sm font-semibold font-display leading-tight mt-0.5 ${isToday ? 'text-white' : inMonth ? 'text-ink' : 'text-muted-foreground/40'}`}>
                    {day.getDate()}
                  </div>
                </div>
                {inMonth && (
                  <button
                    onClick={() => onAddPost(day)}
                    className={`w-5 h-5 flex items-center justify-center rounded text-sm leading-none transition-colors ${isToday ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-muted-foreground/40 hover:text-ink hover:bg-ink/5'}`}
                    title="Add content">+</button>
                )}
              </div>

              {/* Cards */}
              <div className="p-1.5 space-y-1.5 flex-1">
                {visible.map(post => (
                  <DraggableMonthMiniCard
                    key={post.id}
                    post={post}
                    onSelect={onSelect}
                    isActiveDrag={activeId === post.id}
                  />
                ))}
                {overflow > 0 && (
                  <button className="text-[0.58rem] font-medium text-navy hover:underline px-0.5 block">
                    +{overflow} more
                  </button>
                )}
              </div>
            </DroppableDayCell>
          )
        })}
      </div>
    </div>
  )
}

// ── Month view ─────────────────────────────────────────────────────────────────
function MonthView({ posts, onSelect, month, year, onPrev, onNext, onGoToWeek, onAddPost, onMovePost }) {
  const [filterPillar,   setFilterPillar]   = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const activePost = posts.find(p => p.id === activeId) || null

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over) return
    const [y, m, d] = over.id.split('-').map(Number)
    const newDate = new Date(y, m, d)
    const post = posts.find(p => p.id === active.id)
    if (!post || sameDay(new Date(post.publishDate), newDate)) return
    onMovePost(post.id, newDate)
  }

  // Build full Mon–Sun weeks that cover every day of the month
  const firstDay    = new Date(year, month, 1)
  const lastDay     = new Date(year, month + 1, 0)
  const startMonday = getMonday(firstDay)

  const weeks = []
  let ws = new Date(startMonday)
  while (ws <= lastDay) {
    weeks.push(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ws); d.setDate(ws.getDate() + i); return d
    }))
    ws = new Date(ws); ws.setDate(ws.getDate() + 7)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <button onClick={onPrev}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">←</button>
            <h2 className="font-display text-3xl text-ink">{MONTHS[month]} {year}</h2>
            <button onClick={onNext}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">→</button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 ml-11">This month's content at a glance.</p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="mb-3">
        <PlatformFilterRow value={filterPlatform} onChange={setFilterPlatform} />
      </div>

      {/* Content pillars filter */}
      <div className="flex items-center flex-wrap gap-2 mb-5">
        <span className="text-xs text-muted-foreground mr-1">Content Pillars</span>
        <PillarChip label="All" active={!filterPillar} onClick={() => setFilterPillar('')} />
        {PILLARS.map(p => (
          <PillarChip key={p} label={p} active={filterPillar === p}
            onClick={() => setFilterPillar(filterPillar === p ? '' : p)} />
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-4">
        {weeks.map((weekDays, idx) => (
          <MonthWeekRow
            key={idx}
            weekDays={weekDays}
            weekNum={idx + 1}
            month={month}
            posts={posts}
            filterPillar={filterPillar}
            filterPlatform={filterPlatform}
            onSelect={onSelect}
            onAddPost={onAddPost}
            activeId={activeId}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <button onClick={onGoToWeek} className="text-sm text-navy hover:underline font-medium">
          View full week calendar →
        </button>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activePost && (
          <div style={{
            width: 120,
            opacity: 0.82,
            transform: 'rotate(1.5deg) scale(1.04)',
            boxShadow: '0 8px 24px rgba(50,54,66,0.20), 0 2px 6px rgba(50,54,66,0.12)',
            borderRadius: 6,
            cursor: 'grabbing',
            pointerEvents: 'none',
          }}>
            <MonthMiniCard post={activePost} onSelect={() => {}} />
          </div>
        )}
      </DragOverlay>
    </div>
    </DndContext>
  )
}

// ── Week view card (rich Board-style) ─────────────────────────────────────────
function WeekCard({ post, onSelect, onFileDrop }) {
  const [dragOver, setDragOver] = useState(false)
  const cfg      = STATUS_CFG[post.status] || STATUS_CFG.Draft
  const progress = PROGRESS_MAP[post.status] || 0
  const isAttachedImage = post.attachedObjectUrl && !post.attachedFile?.type?.startsWith('video/')
  const isAttachedVideo = post.attachedObjectUrl && post.attachedFile?.type?.startsWith('video/')

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData('postId', String(post.id)); e.dataTransfer.effectAllowed = 'move' }}
      onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
      onDragOver={e  => { e.preventDefault(); e.stopPropagation() }}
      onDragLeave={e => { e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
      onDrop={e => {
        e.preventDefault(); e.stopPropagation(); setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (isMediaFile(file)) onFileDrop?.(file)
      }}
      className="rounded-xl overflow-hidden select-none transition-all"
      style={{
        background: '#FFFFFF',
        border: `1.5px solid ${dragOver ? '#424B63' : '#E7E2DB'}`,
        boxShadow: dragOver ? '0 0 0 2px rgba(66,75,99,0.2), 0 4px 16px rgba(50,54,66,0.12)' : '0 1px 4px rgba(50,54,66,0.07)',
      }}
    >
      {/* Status banner */}
      <div className="px-3 py-2" style={{ background: cfg.bg }}>
        <span className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      {/* Media thumbnail */}
      <div className="relative overflow-hidden flex items-center justify-center"
        style={{ height: 110, background: `linear-gradient(135deg, ${post.gradientFrom}, ${post.gradientTo})` }}>
        {isAttachedImage && <img src={post.attachedObjectUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        {(isAttachedVideo || post.isVideo) && !isAttachedImage && (
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.3)' }}>
            <span className="text-white text-sm ml-0.5">▶</span>
          </div>
        )}
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(66,75,99,0.6)' }}>
            <span className="text-white text-xs font-semibold">+ Attach media</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 py-1.5" style={{ background: 'rgba(50,54,66,0.35)' }}>
          <span className="text-[0.55rem] text-white font-medium">{(post.platforms||[]).join(', ')}</span>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Title + time — click opens detail panel */}
        <button onClick={() => onSelect(post)} className="text-left w-full group">
          <div className="text-sm font-semibold text-ink group-hover:text-navy transition-colors leading-snug line-clamp-2">{post.title}</div>
          {post.scheduleTime && (
            <div className="text-[0.58rem] text-muted-foreground mt-0.5">{fmtShort(post.publishDate)} · {post.scheduleTime}</div>
          )}
        </button>

        {/* Attached files */}
        {post.files.map((f, i) => <FileCard key={i} file={f} />)}

        {/* Caption */}
        {post.caption && (
          <div className="rounded-md border border-border bg-white p-2.5">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Caption</div>
            <div className="text-xs text-ink leading-relaxed">
              {post.caption.length > 100 ? post.caption.slice(0, 100) + '…' : post.caption}
            </div>
            {post.caption.length > 100 && (
              <button onClick={() => onSelect(post)}
                className="text-[0.6rem] text-navy mt-1 hover:underline">Read more</button>
            )}
          </div>
        )}

        {/* Comments */}
        {post.comments.length > 0 && (
          <div className="rounded-md border border-border bg-white p-2.5">
            <div className="text-[0.55rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Comments ({post.comments.length})
            </div>
            {post.comments.slice(0, 2).map((c, i) => (
              <div key={i} className="flex gap-1.5 mb-2">
                <AvatarInitial name={c.author.replace('@', '')} size={5} />
                <div className="min-w-0">
                  <span className="text-[0.6rem] font-semibold text-navy">{c.author}</span>
                  <span className="text-[0.55rem] text-muted-foreground ml-1">{c.time}</span>
                  <div className="text-xs text-ink mt-0.5 leading-snug line-clamp-2">{c.text}</div>
                </div>
              </div>
            ))}
            <input
              className="w-full text-xs border border-border rounded-md px-2 py-1.5 text-ink placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-navy mt-0.5"
              placeholder="Type a comment…"
              onClick={e => e.stopPropagation()}
            />
          </div>
        )}

        {/* Internal note */}
        <StickyNote note={post.notes} />

        {/* Progress bar + owner */}
        <div>
          <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(50,54,66,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[0.6rem] text-muted-foreground">{post.owner || ''}{post.updatedAgo ? ` — ${post.updatedAgo}` : ''}</span>
            <span className="text-[0.6rem] font-medium text-muted-foreground">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Week view ──────────────────────────────────────────────────────────────────
function WeekView({ posts, onSelect, weekStart, onPrev, onNext, onAttachFile, onCreatePost, onMovePost, onGoToBoard }) {
  const today      = new Date()
  const [dragOverKey,    setDragOverKey]    = useState(null)
  const [showFilters,    setShowFilters]    = useState(false)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterType,     setFilterType]     = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')

  const boardRef   = useRef(null)
  const dragScroll = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
  })

  const weekEnd    = days[6]
  const rangeLabel = `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`

  const weekPosts   = posts.filter(p => days.some(d => sameDay(new Date(p.publishDate), d)))
  const avgProgress = weekPosts.length
    ? Math.round(weekPosts.reduce((s, p) => s + (PROGRESS_MAP[p.status] || 0), 0) / weekPosts.length)
    : 0
  const postedCount  = weekPosts.filter(p => p.status === 'Posted').length
  const activeFilters = [filterType, filterStatus].filter(Boolean).length

  const filtered = posts.filter(p => {
    if (filterPlatform && !(p.platforms||[]).includes(filterPlatform)) return false
    if (filterType     && p.contentType !== filterType)                return false
    if (filterStatus   && p.status      !== filterStatus)              return false
    return true
  })

  const goToToday = () => {
    const d = new Date(); d.setHours(0,0,0,0)
    // find the Monday of today's week and set weekStart via the parent
    // We call onPrev/onNext indirectly — instead just set weekStart
    // Since we can't setState here directly, emit it via a synthetic sequence
    // (parent controls weekStart so we navigate relative to it)
    const todayMonday = getMonday(new Date())
    const currentMonday = getMonday(weekStart)
    const diff = Math.round((todayMonday - currentMonday) / (7 * 24 * 60 * 60 * 1000))
    if (diff > 0) for (let i = 0; i < diff; i++) onNext()
    else if (diff < 0) for (let i = 0; i < -diff; i++) onPrev()
  }

  const onMouseDown = e => {
    if (e.button !== 0) return
    dragScroll.current = { active: true, startX: e.pageX, scrollLeft: boardRef.current.scrollLeft }
    boardRef.current.style.cursor = 'grabbing'
    boardRef.current.style.userSelect = 'none'
  }
  const onMouseMove = e => {
    if (!dragScroll.current.active) return
    boardRef.current.scrollLeft = dragScroll.current.scrollLeft - (e.pageX - dragScroll.current.startX)
  }
  const onMouseUp = () => {
    dragScroll.current.active = false
    if (boardRef.current) { boardRef.current.style.cursor = 'grab'; boardRef.current.style.userSelect = '' }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: title + subtext */}
          <div>
            <h2 className="font-display text-3xl text-ink leading-tight">{weekLabel(weekStart)}</h2>
            <div className="text-sm text-muted-foreground mt-0.5">{rangeLabel}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Plan, review and approve this week's content.</div>
          </div>

          {/* Right: Filter + nav */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(f => !f)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-all"
              style={{
                background:  showFilters ? '#424B63' : '#fff',
                color:       showFilters ? '#fff'    : '#6B7485',
                borderColor: showFilters ? '#424B63'  : '#E7E2DB',
              }}>
              {/* filter icon */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 2h10M3 6h6M5 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filter{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </button>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button onClick={onPrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">←</button>
              <button onClick={goToToday}
                className="px-3 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-xs font-medium text-ink hover:border-navy/30 transition-colors">
                Today
              </button>
              <button onClick={onNext}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white text-muted-foreground hover:text-ink hover:border-ink/30 transition-colors text-sm">→</button>
            </div>
          </div>
        </div>

        {/* Week progress bar */}
        <div className="mt-4 card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">Week Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{avgProgress}%</span>
              <span className="text-xs text-muted-foreground">{postedCount} of {weekPosts.length} items completed</span>
              {avgProgress === 100 && <span className="text-xs text-muted-foreground">✓</span>}
            </div>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: '#E8ECF0' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${avgProgress}%`, background: avgProgress === 100 ? '#BABEAF' : '#424B63' }} />
          </div>
        </div>

        {/* Platform filter row — always visible */}
        <div className="mt-3">
          <PlatformFilterRow value={filterPlatform} onChange={v => setFilterPlatform(v)} />
        </div>
      </div>

      {/* ── Collapsible filter bar (Type + Status) ── */}
      {showFilters && (
        <div className="card p-4 mb-4 space-y-3">
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
      )}

      {/* ── Board ── */}
      <div ref={boardRef} className="overflow-x-auto pb-3 rounded-xl"
        style={{ cursor: 'grab', scrollbarWidth: 'thin' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <div className="flex gap-0 min-w-max rounded-xl overflow-hidden border border-border bg-white" style={{ minHeight: 480 }}>
          {days.map((day, i) => {
            const isToday      = sameDay(day, today)
            const key          = dateKey(day)
            const dayFiltered  = filtered.filter(p => sameDay(new Date(p.publishDate), day))
            const isDropTarget = dragOverKey === key

            return (
              <div key={i}
                className={`flex flex-col border-r border-border last:border-r-0 relative transition-colors ${isToday ? 'bg-navy/[0.025]' : 'bg-white'}`}
                style={{ width: 220, minWidth: 220 }}
                onDragEnter={e => { e.preventDefault(); setDragOverKey(key) }}
                onDragOver={e  => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverKey(null) }}
                onDrop={e => {
                  e.preventDefault(); setDragOverKey(null)
                  const postId = e.dataTransfer.getData('postId')
                  const file   = e.dataTransfer.files?.[0]
                  if (postId) onMovePost(parseInt(postId, 10), day)
                  else if (isMediaFile(file)) onCreatePost(day, file)
                }}
              >
                {/* Day header */}
                <div className={`px-4 py-3 border-b border-border flex-shrink-0 ${isToday ? 'bg-navy' : 'bg-cream/40'}`}>
                  <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][i]}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className={`text-2xl font-semibold leading-tight font-display ${isToday ? 'text-white' : 'text-ink'}`}>
                      {day.getDate()}
                    </div>
                    <button
                      onClick={() => onCreatePost(day, null)}
                      className={`w-6 h-6 flex items-center justify-center rounded-md text-base leading-none transition-colors ${
                        isToday
                          ? 'text-white/60 hover:text-white hover:bg-white/10'
                          : 'text-muted-foreground/50 hover:text-ink hover:bg-ink/5'
                      }`}
                      title="Add content">+</button>
                  </div>
                  <div className={`text-xs mt-0.5 ${isToday ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {MONTHS[day.getMonth()].slice(0,3)}
                  </div>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3">
                  {dayFiltered.map(p => (
                    <WeekCard key={p.id} post={p} onSelect={onSelect} onFileDrop={file => onAttachFile(p.id, file)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center mt-3 text-xs text-muted-foreground">
        Drag board to move across · Drag cards between days to reschedule
      </div>
    </div>
  )
}

// ── Main ContentBoard ──────────────────────────────────────────────────────────
export default function ContentBoard({ client }) {
  const [view,       setView]      = useState('overview')
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

  // ── STORAGE PLACEHOLDER ─── replace URL.createObjectURL with Supabase upload
  const attachFileToPosts = (postId, file) => {
    const objectUrl = URL.createObjectURL(file)
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, attachedFile: file, attachedObjectUrl: objectUrl, isVideo: file.type.startsWith('video/') } : p))
  }
  const createPostFromDrop = (date, file) => {
    const objectUrl = URL.createObjectURL(file)
    const newPost = {
      id: Date.now(), title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      status: 'Draft', pillar: 'Brand Story', contentType: 'Post',
      platforms: ['Instagram'], isVideo: file.type.startsWith('video/'),
      gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
      caption: '', files: [], comments: [], notes: '',
      publishDate: date, scheduleTime: null,
      owner: 'Maxine', updatedAgo: 'Just now',
      attachedFile: file, attachedObjectUrl: objectUrl,
    }
    setPosts(ps => [...ps, newPost])
    setSelectedId(newPost.id)
  }
  const movePost    = (postId, newDate) => setPosts(ps => ps.map(p => p.id === postId ? { ...p, publishDate: newDate } : p))
  const updateStatus = (postId, status) => setPosts(ps => ps.map(p => p.id === postId ? { ...p, status } : p))
  const updatePost   = (postId, patch)  => setPosts(ps => ps.map(p => p.id === postId ? { ...p, ...patch } : p))
  const addEmptyPost = (date) => {
    const newPost = {
      id: Date.now(), title: 'New Post',
      status: 'Draft', pillar: 'Brand Story', contentType: 'Post',
      platforms: ['Instagram'], isVideo: false,
      gradientFrom: '#D1D8DE', gradientTo: '#B7C1CB',
      caption: '', files: [], comments: [], notes: '',
      publishDate: date, scheduleTime: null,
      owner: 'Maxine', updatedAgo: 'Just now',
      attachedFile: null, attachedObjectUrl: null,
    }
    setPosts(ps => [...ps, newPost])
    setSelectedId(newPost.id)
  }

  const VIEW_TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'month',    label: 'Month' },
    { key: 'week',     label: 'Week' },
  ]

  return (
    <div>
      {/* Top nav */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="font-display text-2xl text-ink">Content Hub</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Plan, track and collaborate on every piece of content.</p>
        </div>
        <div className="flex items-center gap-1 bg-cream rounded-lg p-1 border border-border">
          {VIEW_TABS.map(t => (
            <button key={t.key} onClick={() => setView(t.key)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${view === t.key ? 'bg-white text-ink shadow-sm' : 'text-muted-foreground hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Views */}
      {view === 'overview' && (
        <ContentHubOverview
          posts={posts} month={month} year={year} weekStart={weekStart}
          onGoToMonth={() => setView('month')}
          onGoToWeek={() => setView('week')}
        />
      )}

      {view === 'month' && (
        <MonthView
          posts={posts} onSelect={p => setSelectedId(p.id)}
          month={month} year={year}
          onPrev={prevMonth} onNext={nextMonth}
          onGoToWeek={() => setView('week')}
          onAddPost={addEmptyPost}
          onMovePost={movePost}
        />
      )}

      {view === 'week' && (
        <WeekView
          posts={posts} onSelect={p => setSelectedId(p.id)}
          weekStart={weekStart} onPrev={prevWeek} onNext={nextWeek}
          onAttachFile={attachFileToPosts} onCreatePost={createPostFromDrop} onMovePost={movePost}
        />
      )}

      <DetailPanel post={selected} onClose={() => setSelectedId(null)} onStatusChange={updateStatus} onUpdatePost={updatePost} />
    </div>
  )
}
