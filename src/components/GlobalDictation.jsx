import React, { useState, useRef, useEffect } from 'react'

export default function GlobalDictation() {
  const [active, setActive] = useState(false)
  const [interim, setInterim] = useState('')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef(null)
  const isActiveRef = useRef(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) setSupported(false)
  }, [])

  // Track the last focused input/textarea so we know where to inject
  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        targetRef.current = e.target
      }
    }
    document.addEventListener('focusin', handleFocus, true)
    return () => document.removeEventListener('focusin', handleFocus, true)
  }, [])

  const injectText = (el, text) => {
    if (!el || !text) return
    const isTA = el.tagName === 'TEXTAREA'
    const proto = isTA ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? start
    const newVal = el.value.slice(0, start) + text + el.value.slice(end)
    if (setter) setter.call(el, newVal)
    else el.value = newVal
    el.dispatchEvent(new Event('input', { bubbles: true }))
    const pos = start + text.length
    try { el.setSelectionRange(pos, pos) } catch (_) {}
  }

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice dictation requires Chrome or Edge.'); return }

    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-NZ'

    r.onresult = (e) => {
      let finalText = '', interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalText += t + ' '
        else interimText += t
      }
      if (finalText && targetRef.current) {
        injectText(targetRef.current, finalText)
        try { targetRef.current.focus() } catch (_) {}
      }
      setInterim(interimText)
    }

    r.onerror = (ev) => {
      if (ev.error !== 'no-speech') {
        isActiveRef.current = false
        setActive(false)
        setInterim('')
      }
    }

    r.onend = () => { if (isActiveRef.current) r.start() }

    isActiveRef.current = true
    r.start()
    recognitionRef.current = r
    setActive(true)
    setInterim('')
  }

  const stop = () => {
    isActiveRef.current = false
    recognitionRef.current?.stop()
    setActive(false)
    setInterim('')
  }

  const toggle = () => { if (active) stop(); else start() }

  if (!supported) return null

  return (
    <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.4rem', pointerEvents:'none' }}>
      {interim && (
        <div style={{ background:'rgba(26,24,22,.92)', color:'rgba(255,255,255,.85)', borderRadius:'8px', padding:'.45rem .875rem', fontSize:'.75rem', maxWidth:240, lineHeight:1.5, fontStyle:'italic', pointerEvents:'none' }}>
          {interim}
        </div>
      )}
      {active && (
        <div style={{ fontSize:'.58rem', letterSpacing:'.1em', textTransform:'uppercase', color:'#fff', textAlign:'center', background:'var(--red)', borderRadius:'4px', padding:'.15rem .5rem', pointerEvents:'none' }}>
          Dictating…
        </div>
      )}
      <button
        onMouseDown={(e) => { e.preventDefault(); toggle() }}
        title={active ? 'Stop dictation' : 'Start voice dictation — speaks into whatever field you last typed in'}
        style={{
          width:46, height:46, borderRadius:'50%', border:'none', cursor:'pointer', pointerEvents:'auto',
          background: active ? 'var(--red)' : 'var(--dark)',
          color: active ? 'white' : 'var(--gold)',
          fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: active
            ? '0 0 0 4px rgba(139,42,26,.25), 0 4px 20px rgba(0,0,0,.35)'
            : '0 4px 20px rgba(0,0,0,.35)',
          transition:'all .18s',
        }}
      >
        {active ? '■' : '🎤'}
      </button>
    </div>
  )
}
