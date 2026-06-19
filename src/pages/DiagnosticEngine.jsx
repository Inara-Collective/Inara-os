import React, { useState, useEffect } from 'react'
import { updateClient } from '../lib/supabase.js'

const ALL_MODULES_LIST = ['Brand Positioning & Messaging','Customer Journey Mapping','Content Strategy & Direction','Social Media Systems','Short-Form Video','Website Optimisation','Email Marketing','Lead Generation & Funnels','Photography & Visual Identity','CRM & Automation','Reporting & Analytics','Campaign Planning & Execution','Paid Ads','Event Marketing','SEO & Discoverability','Community & Engagement','Sales Enablement Content','Team Training & Enablement','PR & Earned Media','Partnership & Referral Systems','Long-Form Content','On-Camera Coaching & Presence']

const SYSTEM = `You are Maxine from Inara Collective — a strategy-first marketing consultancy. You diagnose businesses and map their gaps to specific Inara modules.

Your job is to analyse all available information about a business and produce a comprehensive marketing diagnostic.

Score out of 100 across 5 dimensions (20 points each):
1. Brand Clarity & Positioning — is the brand clearly defined, differentiated, and compelling?
2. Digital Presence & Consistency — website, social, visual identity, professional quality
3. Content Strategy — is content strategic, funnel-mapped, and purposeful or random and reactive?
4. Lead Generation & Funnel — is there a clear system pulling in and converting the right clients?
5. Commercial Readiness — does the marketing match the quality and tier of the business?

For each identified gap, recommend a specific Inara module and provide:
- What the problem actually is (specific, not generic)
- The impact it is having on the business right now
- Exactly what Inara would do to fix it (specific actions)
- How long it will take to fix (be realistic: Quick Win = 2-4 weeks, Medium = 4-8 weeks, Deep Build = 2-3 months)
- Priority level: Critical / High / Medium

Available Inara modules: ${ALL_MODULES_LIST.join(', ')}

Also include these additional sections:

FUNNEL DIAGNOSIS — rate each stage as one of: Strong / Weak / Leaking / Missing
BUSINESS SNAPSHOT — quick overview fields
CONVERSATION PROMPTS — specific questions the connector should ask on the call based on what was found
OPPORTUNITY STATEMENT — 1-2 sentences that frame the opportunity without giving away the strategy

Return ONLY this JSON with no preamble or backticks:
{
  "totalScore": 72,
  "scoreLabel": "Warm — Strong Potential, Structural Gaps",
  "verdict": "2-3 sentence honest summary of where this business is and why. Specific. No fluff.",
  "leakStage": "B — After enquiry",
  "leakExplain": "one sentence on why",
  "recommendedPackage": "Stage 2 — Structure",
  "snapshot": {
    "industry": "what industry they are in",
    "estimatedSize": "small / medium / established",
    "onlinePresence": "strong / moderate / weak",
    "mainPlatforms": ["Instagram", "Website"],
    "websiteQuality": "professional / basic / outdated / none",
    "googleReviews": "strong / few / none / unknown",
    "adActivity": "active / occasional / none / unknown",
    "founderVisibility": "high / some / none",
    "brandConsistency": "consistent / inconsistent / none"
  },
  "funnelDiagnosis": {
    "awareness": {"status": "Weak", "note": "one sentence specific observation"},
    "trust": {"status": "Missing", "note": "one sentence specific observation"},
    "conversion": {"status": "Leaking", "note": "one sentence specific observation"},
    "retention": {"status": "Missing", "note": "one sentence specific observation"}
  },
  "dimensions": {
    "brandClarity": {"score": 14, "label": "Brand Clarity & Positioning", "status": "Needs work", "note": "Specific observation about their brand clarity"},
    "digitalPresence": {"score": 13, "label": "Digital Presence & Consistency", "status": "Patchy", "note": "Specific observation"},
    "contentStrategy": {"score": 12, "label": "Content Strategy", "status": "Reactive", "note": "Specific observation"},
    "leadGeneration": {"score": 10, "label": "Lead Generation & Funnel", "status": "Missing", "note": "Specific observation"},
    "commercialReadiness": {"score": 16, "label": "Commercial Readiness", "status": "Strong", "note": "Specific observation"}
  },
  "modules": [
    {
      "name": "Brand Positioning & Messaging",
      "priority": "Critical",
      "problem": "Specific description of the actual problem identified from their content",
      "impact": "What this is costing the business right now — leads, revenue, perception",
      "whatInaraDoes": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"],
      "timeline": "4-6 weeks",
      "timelineLabel": "Medium",
      "quickWin": "One thing they could do immediately before Inara starts"
    }
  ],
  "topThreeWins": ["Most impactful immediate change", "Second most impactful", "Third"],
  "conversationPrompts": [
    {
      "trigger": "what gap triggered this question e.g. weak founder visibility",
      "question": "The exact question to ask on the call — natural, curious, not salesy",
      "why": "one sentence on why this question matters and what it reveals"
    }
  ],
  "opportunityStatement": "1-2 sentences that frame the opportunity in a premium way without giving away the full strategy. Should make the business owner feel seen and understood.",
  "openingLine": "The exact line the connector would use to open the call — specific to this business, uses what was found",
  "closingStatement": "One powerful sentence on what becomes possible when this is fixed"
}`

function scoreColor(s) {
  if (s >= 75) return '#1A6B4A'
  if (s >= 50) return '#B8956A'
  return '#8B2A1A'
}

function dimColor(s, max) {
  const pct = s / max
  if (pct >= 0.75) return 'var(--teal)'
  if (pct >= 0.5) return 'var(--gold)'
  return 'var(--red)'
}

function priorityStyle(p) {
  if (p === 'Critical') return 'background:var(--red-bg);color:var(--red);border-color:var(--red-b)'
  if (p === 'High') return 'background:var(--amber-bg);color:var(--amber);border-color:var(--amber-b)'
  return 'background:var(--blue-bg);color:var(--blue);border-color:var(--blue-b)'
}

function tlColor(label) {
  if (label === 'Quick Win') return 'var(--teal)'
  if (label === 'Medium') return 'var(--gold)'
  return 'var(--amber)'
}

function renderDiagnostic(r, bn) {
  const sc = r.totalScore || 0
  const col = scoreColor(sc)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (sc / 100) * circumference
  const dims = r.dimensions || {}
  const dimList = Object.values(dims)
  const mods = r.modules || []

  return `
  <div style="background:var(--warm);border:.5px solid var(--border);border-radius:10px;padding:1.25rem;margin-bottom:1.5rem">
    <div style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.875rem">Business Snapshot</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem">
      ${[
        ['Industry', r.snapshot?.industry],
        ['Size', r.snapshot?.estimatedSize],
        ['Online Presence', r.snapshot?.onlinePresence],
        ['Website Quality', r.snapshot?.websiteQuality],
        ['Google Reviews', r.snapshot?.googleReviews],
        ['Ad Activity', r.snapshot?.adActivity],
        ['Founder Visibility', r.snapshot?.founderVisibility],
        ['Brand Consistency', r.snapshot?.brandConsistency],
        ['Main Platforms', (r.snapshot?.mainPlatforms || []).join(', ')],
      ].map(([label, val]) => val ? `<div style="padding:.5rem .75rem;background:var(--bg);border-radius:6px;border:.5px solid var(--border)">
        <div style="font-size:.54rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.2rem">${label}</div>
        <div style="font-size:.8rem;color:var(--dark);font-weight:500;text-transform:capitalize">${val}</div>
      </div>` : '').join('')}
    </div>
  </div>

  <div class="score-hero">
    <div class="score-ring">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke="${col}" stroke-width="10" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <div class="score-num">
        <div class="score-val" style="color:${col}">${sc}</div>
        <div class="score-pct">/100</div>
      </div>
    </div>
    <div>
      <div class="score-label" style="color:#F6F2EA">${r.scoreLabel || ''}</div>
      <div class="score-verdict">${r.verdict || ''}</div>
      <div style="display:flex;gap:.5rem;margin-top:.875rem;flex-wrap:wrap">
        <span class="score-tag" style="background:rgba(184,149,106,.15);color:var(--gold);border:.5px solid rgba(184,149,106,.3)">Leak Stage: ${r.leakStage || ''}</span>
        <span class="score-tag" style="background:rgba(26,107,74,.15);color:#6DB89A;border:.5px solid rgba(26,107,74,.3)">→ ${r.recommendedPackage || ''}</span>
      </div>
      ${r.leakExplain ? `<div style="font-size:.72rem;color:rgba(255,255,255,.32);margin-top:.5rem;line-height:1.6">${r.leakExplain}</div>` : ''}
    </div>
  </div>

  <div style="margin-bottom:1.5rem">
    <div style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.875rem">Dimension Scores</div>
    <div class="dim-grid">
      ${dimList.map(d => {
        const dc = dimColor(d.score, 20)
        return `<div class="dim-card">
          <div class="dim-name">${d.label}</div>
          <div class="dim-row">
            <div class="dim-bar"><div class="dim-fill" style="width:${Math.round(d.score / 20 * 100)}%;background:${dc}"></div></div>
            <div class="dim-score" style="color:${dc}">${d.score}/20</div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem">
            <div class="dim-note">${d.note || ''}</div>
            <span style="font-size:.58rem;font-weight:500;color:${dc};white-space:nowrap">${d.status || ''}</span>
          </div>
        </div>`
      }).join('')}
    </div>
  </div>

  ${r.funnelDiagnosis ? `
  <div style="margin-bottom:1.5rem">
    <div style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.875rem">Funnel Diagnosis</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem">
      ${Object.entries(r.funnelDiagnosis).map(([key, val]) => {
        const statusColors = { Strong: 'var(--teal)', Weak: 'var(--amber)', Leaking: 'var(--red)', Missing: 'var(--muted)' }
        const statusBg = { Strong: 'var(--teal-bg)', Weak: 'var(--amber-bg)', Leaking: 'var(--red-bg)', Missing: 'var(--border)' }
        const statusBorder = { Strong: 'var(--teal-b)', Weak: 'var(--amber-b)', Leaking: 'var(--red-b)', Missing: 'var(--border)' }
        const fc = statusColors[val.status] || 'var(--muted)'
        const fb = statusBg[val.status] || 'var(--bg)'
        const fbd = statusBorder[val.status] || 'var(--border)'
        const labels = { awareness: 'Awareness', trust: 'Trust', conversion: 'Conversion', retention: 'Retention' }
        return `<div style="background:${fb};border:.5px solid ${fbd};border-radius:8px;padding:1rem">
          <div style="font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;color:${fc};font-weight:600;margin-bottom:.35rem">${labels[key] || key}</div>
          <div style="font-size:1.1rem;font-weight:500;color:${fc};margin-bottom:.35rem">${val.status}</div>
          <div style="font-size:.72rem;color:var(--muted);line-height:1.55">${val.note || ''}</div>
        </div>`
      }).join('')}
    </div>
  </div>` : ''}

  ${r.topThreeWins && r.topThreeWins.length ? `
  <div style="background:var(--warm);border:.5px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:1.5rem;border-left:3px solid var(--teal)">
    <div style="padding:.875rem 1.25rem;border-bottom:.5px solid var(--border)"><div style="font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:var(--teal)">Top 3 Immediate Wins</div></div>
    <div style="padding:1.25rem">
      ${r.topThreeWins.map((w, i) => `<div style="display:flex;align-items:flex-start;gap:.75rem;padding:.5rem 0;border-bottom:.5px solid var(--border)${i === r.topThreeWins.length - 1 ? ';border-bottom:none' : ''}">
        <div style="width:22px;height:22px;border-radius:50%;background:var(--teal-bg);border:.5px solid var(--teal-b);display:flex;align-items:center;justify-content:center;font-size:.62rem;font-weight:600;color:var(--teal);flex-shrink:0;margin-top:1px">${i + 1}</div>
        <div style="font-size:.82rem;color:var(--dark2);line-height:1.6">${w}</div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  <div style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.875rem">Module Stack — ${mods.length} Modules Identified</div>
  <div class="module-grid">
    ${mods.map((m, i) => `
    <div class="module-card" style="border-left:3px solid ${m.priority === 'Critical' ? 'var(--red)' : m.priority === 'High' ? 'var(--gold)' : 'var(--blue)'}">
      <div class="module-head" onclick="diagToggleModule(${i})">
        <span class="module-priority pill" style="${priorityStyle(m.priority)}">${m.priority}</span>
        <span class="module-name">${m.name}</span>
        <span class="module-urgency" style="color:${tlColor(m.timelineLabel)}">⏱ ${m.timeline}</span>
        <span class="module-chevron" id="diag-chev-${i}">›</span>
      </div>
      <div class="module-body" id="diag-mbody-${i}">
        <div class="mb-section">
          <div class="mb-label">The Problem</div>
          <div class="mb-text">${m.problem || ''}</div>
        </div>
        <div class="mb-section">
          <div class="mb-label">Impact on the Business Right Now</div>
          <div class="mb-text" style="color:var(--red)">${m.impact || ''}</div>
        </div>
        <div class="mb-section">
          <div class="mb-label">What Inara Does to Fix It</div>
          <div class="what-card">
            ${(m.whatInaraDoes || []).map(w => `<div class="what-item"><div class="what-dot"></div><div class="what-text">${w}</div></div>`).join('')}
          </div>
        </div>
        <div class="mb-section">
          <div class="mb-label">Timeline to Fix</div>
          <div style="display:flex;align-items:center;gap:.75rem">
            <span class="pill" style="background:var(--gold-bg);color:var(--amber);border-color:var(--gold-b)">${m.timeline}</span>
            <span style="font-size:.78rem;color:var(--muted)">${m.timelineLabel === 'Quick Win' ? 'Results visible within 4 weeks' : m.timelineLabel === 'Medium' ? 'Solid foundation within 2 months' : 'Full system built over 3 months'}</span>
          </div>
        </div>
        ${m.quickWin ? `<div class="mb-section" style="background:var(--teal-bg);border:.5px solid var(--teal-b);border-radius:6px;padding:.75rem">
          <div class="mb-label" style="color:var(--teal)">Quick Win — Do This Now</div>
          <div class="mb-text">${m.quickWin}</div>
        </div>` : ''}
      </div>
    </div>`).join('')}
  </div>

  ${r.conversationPrompts && r.conversationPrompts.length ? `
  <div style="margin-bottom:1.5rem">
    <div style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);font-weight:500;margin-bottom:.875rem">Conversation Prompts — Questions to Ask on Call 1</div>
    <div style="display:flex;flex-direction:column;gap:.75rem">
      ${r.conversationPrompts.map((p, i) => `
      <div style="background:var(--warm);border:.5px solid var(--border);border-radius:8px;padding:1rem 1.25rem;border-left:3px solid var(--blue)">
        <div style="display:flex;align-items:flex-start;gap:.875rem">
          <div style="width:24px;height:24px;border-radius:50%;background:var(--blue-bg);border:.5px solid var(--blue-b);display:flex;align-items:center;justify-content:center;font-size:.62rem;color:var(--blue);font-weight:600;flex-shrink:0;margin-top:1px">${i + 1}</div>
          <div style="flex:1">
            <div style="font-size:.56rem;letter-spacing:.14em;text-transform:uppercase;color:var(--blue);font-weight:500;margin-bottom:.25rem">Ask this if: ${p.trigger || ''}</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:1rem;font-style:italic;color:var(--dark);line-height:1.6;margin-bottom:.35rem">&ldquo;${p.question || ''}&rdquo;</div>
            <div style="font-size:.72rem;color:var(--muted);line-height:1.55">${p.why || ''}</div>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>` : ''}

  ${r.opportunityStatement ? `
  <div style="background:var(--dark2);border:.5px solid rgba(255,255,255,.08);border-radius:10px;padding:1.5rem 1.75rem;margin-bottom:1rem">
    <div style="font-size:.56rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:500;margin-bottom:.625rem">Opportunity Statement — Use This in Outreach</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-style:italic;color:rgba(247,243,236,.9);line-height:1.75">${r.opportunityStatement}</div>
  </div>` : ''}

  ${r.openingLine ? `
  <div style="background:var(--dark);border-radius:10px;padding:1.5rem 1.75rem;margin-bottom:1rem">
    <div style="font-size:.56rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:500;margin-bottom:.625rem">Opening Line for the Sales Call</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-style:italic;color:rgba(247,243,236,.88);line-height:1.75">&ldquo;${r.openingLine}&rdquo;</div>
  </div>` : ''}

  ${r.closingStatement ? `
  <div style="background:var(--gold-bg);border:.5px solid var(--gold-b);border-radius:10px;padding:1.25rem 1.5rem;text-align:center;margin-bottom:1.5rem">
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-style:italic;color:var(--dark)">${r.closingStatement}</div>
  </div>` : ''}`
}

export default function DiagnosticEngine({ client, clientId, onUpdate }) {
  const [form, setForm] = useState({
    url: client?.website || '',
    revenue: '',
    instagram_url: client?.instagram || '',
    facebook_url: '',
    company_linkedin: '',
    personal_linkedin: client?.linkedin || '',
    tiktok_url: '',
    web: '',
    soc: '',
    rev: '',
    extra: '',
  })
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(client?.diagnostic_result || null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!client?.diagnostic_result)
  const [showForm, setShowForm] = useState(!client?.diagnostic_result)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = React.useRef(null)

  useEffect(() => {
    window.diagToggleModule = function(i) {
      const body = document.getElementById('diag-mbody-' + i)
      const chev = document.getElementById('diag-chev-' + i)
      if (!body || !chev) return
      const isOpen = body.classList.contains('open')
      body.classList.toggle('open', !isOpen)
      chev.style.transform = isOpen ? 'none' : 'rotate(90deg)'
    }
    return () => { delete window.diagToggleModule }
  }, [])

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      if (file.type.startsWith('image/')) {
        reader.onload = e => {
          const dataUrl = e.target.result
          setUploads(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            isImage: true,
            mediaType: file.type,
            data: dataUrl.split(',')[1],
            preview: dataUrl,
          }])
        }
        reader.readAsDataURL(file)
      } else {
        reader.onload = e => {
          setUploads(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            isImage: false,
            content: e.target.result,
          }])
        }
        reader.readAsText(file)
      }
    })
  }

  const runDiagnostic = async () => {
    const hasContent = form.web || form.soc || form.rev || form.extra || uploads.length > 0
    if (!hasContent) {
      setError('Please paste at least some business information — website copy, social media, or upload a file.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    const bn = client?.name || 'this business'

    const socialUrls = [
      form.instagram_url && `Instagram: ${form.instagram_url}`,
      form.facebook_url && `Facebook: ${form.facebook_url}`,
      form.company_linkedin && `Company LinkedIn: ${form.company_linkedin}`,
      form.personal_linkedin && `Personal LinkedIn: ${form.personal_linkedin}`,
      form.tiktok_url && `TikTok: ${form.tiktok_url}`,
    ].filter(Boolean).join('\n')

    const textDocs = uploads.filter(u => !u.isImage).map(u => `[DOCUMENT: ${u.name}]\n${u.content}`).join('\n\n')

    const prompt = `Run a full marketing diagnostic on this business:

BUSINESS: ${bn}
INDUSTRY: ${client?.industry || 'Not specified'}
WEBSITE URL: ${form.url || client?.website || 'Not provided'}
REVENUE: ${form.revenue || 'Not specified'}

SOCIAL MEDIA PROFILE URLS:
${socialUrls || 'Not provided'}

WEBSITE CONTENT:
${form.web || 'Not provided'}

SOCIAL MEDIA CONTENT:
${form.soc || 'Not provided'}

REVIEWS & TESTIMONIALS:
${form.rev || 'Not provided'}

ADDITIONAL INFORMATION:
${form.extra || 'None'}${textDocs ? `\n\nUPLOADED DOCUMENTS:\n${textDocs}` : ''}

Based on all of the above, produce the comprehensive diagnostic JSON. Be specific to THIS business — reference actual things you found in their content. Do not give generic advice.`

    try {
      const imageBlocks = uploads.filter(u => u.isImage).map(u => ({
        type: 'image',
        source: { type: 'base64', media_type: u.mediaType, data: u.data }
      }))
      const msgContent = imageBlocks.length > 0
        ? [{ type: 'text', text: prompt }, ...imageBlocks]
        : prompt

      const resp = await fetch('https://inara-api-proxy.maxine-44c.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: SYSTEM,
          messages: [{ role: 'user', content: msgContent }]
        })
      })
      if (!resp.ok) { const t = await resp.text(); throw new Error('API ' + resp.status + ': ' + t) }
      const data = await resp.json()
      const raw = data.content.map(b => b.text || '').join('').trim()
      const r = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setResult(r)
      setSaved(false)
      setShowForm(false)
      setTimeout(() => {
        r.modules?.forEach((m, i) => { if (m.priority === 'Critical') window.diagToggleModule?.(i) })
      }, 150)
    } catch (e) {
      setError('Error running diagnostic: ' + e.message)
    }
    setLoading(false)
  }

  const saveToClient = async () => {
    if (!result || saving) return
    setSaving(true)
    try {
      const updates = { diagnostic_result: result }
      if (result.leakStage) updates.lead_leak_stage = result.leakStage
      if (result.recommendedPackage) updates.recommended_package = result.recommendedPackage
      await updateClient(clientId, updates)
      onUpdate?.(updates)
      setSaved(true)
    } catch (e) {
      setError('Failed to save: ' + e.message)
    }
    setSaving(false)
  }

  const bn = client?.name || 'this business'

  return (
    <div>
      {/* Form toggle bar */}
      <div style={{ background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div className="card-head" style={{ cursor: 'pointer' }} onClick={() => setShowForm(v => !v)}>
          <div className="card-title">Marketing Diagnostic Engine</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            {result && (
              <span style={{ fontSize: '.65rem', color: saved ? 'var(--teal)' : 'var(--amber)', fontWeight: 500 }}>
                {saved ? '✓ Saved to client' : '● Unsaved result'}
              </span>
            )}
            <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{showForm ? '▲' : '▼'}</span>
          </div>
        </div>

        {showForm && (
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Paste in any business information — website copy, Instagram bio, social media content, reviews, anything you can find. Upload screenshots or documents. The engine scores them out of 100, maps every marketing gap to an Inara module, and shows exactly what needs to change.
            </div>

            {/* Business basics */}
            <div>
              <div style={{ fontSize: '.52rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Business basics</div>
              <div className="g2">
                <div className="form-group">
                  <label className="form-label">Website URL</label>
                  <input className="form-input" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="e.g. refreshrenovations.co.nz" />
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated annual revenue (optional)</label>
                  <input className="form-input" value={form.revenue} onChange={e => setForm(f => ({ ...f, revenue: e.target.value }))} placeholder="e.g. $1.6M" />
                </div>
              </div>
            </div>

            {/* Social media profile URLs */}
            <div>
              <div style={{ fontSize: '.52rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Social media profile URLs</div>
              <div className="g2" style={{ marginBottom: '.625rem' }}>
                <div className="form-group">
                  <label className="form-label">Instagram</label>
                  <input className="form-input" value={form.instagram_url} onChange={e => setForm(f => ({ ...f, instagram_url: e.target.value }))} placeholder="instagram.com/handle" />
                </div>
                <div className="form-group">
                  <label className="form-label">Facebook</label>
                  <input className="form-input" value={form.facebook_url} onChange={e => setForm(f => ({ ...f, facebook_url: e.target.value }))} placeholder="facebook.com/page" />
                </div>
              </div>
              <div className="g2" style={{ marginBottom: '.625rem' }}>
                <div className="form-group">
                  <label className="form-label">Company LinkedIn</label>
                  <input className="form-input" value={form.company_linkedin} onChange={e => setForm(f => ({ ...f, company_linkedin: e.target.value }))} placeholder="linkedin.com/company/name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Personal LinkedIn</label>
                  <input className="form-input" value={form.personal_linkedin} onChange={e => setForm(f => ({ ...f, personal_linkedin: e.target.value }))} placeholder="linkedin.com/in/name" />
                </div>
              </div>
              <div style={{ maxWidth: '48%', paddingRight: '.3rem' }}>
                <div className="form-group">
                  <label className="form-label">TikTok</label>
                  <input className="form-input" value={form.tiktok_url} onChange={e => setForm(f => ({ ...f, tiktok_url: e.target.value }))} placeholder="tiktok.com/@handle" />
                </div>
              </div>
            </div>

            {/* Pasted content */}
            <div>
              <div style={{ fontSize: '.52rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Paste their content</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Website copy — homepage, about page, services page</label>
                  <textarea className="form-textarea" style={{ minHeight: 100 }} value={form.web} onChange={e => setForm(f => ({ ...f, web: e.target.value }))} placeholder="Paste any copy from their website here. Homepage hero text, about us section, services descriptions, anything." />
                </div>
                <div className="form-group">
                  <label className="form-label">Social media — Instagram bio, captions, LinkedIn posts, TikTok</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }} value={form.soc} onChange={e => setForm(f => ({ ...f, soc: e.target.value }))} placeholder="Paste their Instagram bio, recent captions, LinkedIn summary, any social content you can find." />
                </div>
                <div className="form-group">
                  <label className="form-label">Reviews & testimonials (Google, Facebook, any platform)</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }} value={form.rev} onChange={e => setForm(f => ({ ...f, rev: e.target.value }))} placeholder="Paste any Google reviews, Facebook reviews, testimonials on their website..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Anything else — ads, email content, press, notes from calls</label>
                  <textarea className="form-textarea" style={{ minHeight: 80 }} value={form.extra} onChange={e => setForm(f => ({ ...f, extra: e.target.value }))} placeholder="Any Meta ad copy, email newsletters, press mentions, notes from connector calls, anything additional." />
                </div>
              </div>
            </div>

            {/* File upload */}
            <div>
              <div style={{ fontSize: '.52rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: '.5rem' }}>Upload images & documents</div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `.5px dashed ${dragOver ? 'var(--gold)' : 'var(--border)'}`, borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--gold-bg)' : 'var(--bg)', transition: 'all .15s' }}
              >
                <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '.25rem' }}>Drag & drop or click to upload</div>
                <div style={{ fontSize: '.68rem', color: 'var(--muted)' }}>Screenshots, photos, PDFs, text files — images are analysed visually</div>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv,.doc,.docx" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
              </div>

              {uploads.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.625rem' }}>
                  {uploads.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', padding: '.3rem .6rem .3rem .4rem', fontSize: '.7rem' }}>
                      {u.isImage
                        ? <img src={u.preview} alt={u.name} style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                        : <span style={{ fontSize: '.8rem', lineHeight: 1 }}>📄</span>
                      }
                      <span style={{ color: 'var(--dark)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                      <button onClick={e => { e.stopPropagation(); setUploads(prev => prev.filter(x => x.id !== u.id)) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '.7rem', padding: '0 .1rem', lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red-b)', borderRadius: '6px', padding: '.625rem .875rem', fontSize: '.76rem', color: 'var(--red)' }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={runDiagnostic} disabled={loading}>
                {loading ? 'Running diagnostic...' : 'Run diagnostic →'}
              </button>
              {result && !saved && (
                <button className="btn btn-gold" onClick={saveToClient} disabled={saving}>
                  {saving ? 'Saving...' : 'Save to client'}
                </button>
              )}
              {result && saved && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setSaved(false); setShowForm(true) }}>
                  Run again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: 32, height: 32 }}></div>
          <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', color: 'var(--dark)', marginBottom: '.5rem' }}>Running the diagnostic...</div>
          <div style={{ fontSize: '.78rem', lineHeight: 1.6 }}>Scoring brand clarity, digital presence, content strategy,<br/>funnel structure, and commercial readiness.</div>
        </div>
      )}

      {result && !loading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '.56rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
              Diagnostic Results — {bn}
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {!saved && (
                <button className="btn btn-gold" onClick={saveToClient} disabled={saving}>
                  {saving ? 'Saving...' : 'Save to client'}
                </button>
              )}
              {saved && <span style={{ fontSize: '.72rem', color: 'var(--teal)', alignSelf: 'center' }}>✓ Saved</span>}
              <button className="btn btn-ghost btn-sm" onClick={() => { setResult(null); setSaved(false); setShowForm(true) }}>Re-run</button>
            </div>
          </div>
          <div dangerouslySetInnerHTML={{ __html: renderDiagnostic(result, bn) }} />
        </>
      )}
    </div>
  )
}
