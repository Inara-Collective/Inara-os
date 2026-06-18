import React, { useState, useEffect } from 'react'
import { useAuth } from '../App.jsx'
import { supabase, signOut } from '../lib/supabase.js'

const STATUS_COLOR = { 'To Do': 'var(--blue)', 'In Progress': 'var(--amber)', 'Awaiting Approval': 'var(--purple)', 'Blocked': 'var(--red)', 'Complete': 'var(--teal)' }
const STATUS_LABEL = { 'To Do': 'To do', 'In Progress': 'In progress', 'Awaiting Approval': 'Awaiting your approval', 'Blocked': 'Blocked', 'Complete': 'Done' }

export default function ClientPortal() {
  const { session, profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('contact_email', session?.user?.email)
          .single()

        if (clientData) {
          setClient(clientData)
          const { data: taskData } = await supabase
            .from('tasks')
            .select('*')
            .eq('client_id', clientData.id)
            .order('due_date')
          setTasks(taskData || [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session])

  const handleSignOut = () => signOut()

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1816' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', color: '#B8956A', marginBottom: '1rem', letterSpacing: '.06em' }}>Inara Collective</div>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
      </div>
    </div>
  )

  const open = tasks.filter(t => t.status !== 'Complete')
  const done = tasks.filter(t => t.status === 'Complete')
  const awaitingApproval = tasks.filter(t => t.status === 'Awaiting Approval')

  return (
    <div style={{ minHeight: '100vh', background: '#1A1816', color: '#E8E0D5' }}>
      <div style={{ borderBottom: '.5px solid rgba(255,255,255,.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', color: '#B8956A', letterSpacing: '.06em' }}>Inara Collective</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>{session?.user?.email}</span>
          <button onClick={handleSignOut} style={{ background: 'none', border: '.5px solid rgba(255,255,255,.15)', color: 'rgba(255,255,255,.4)', fontSize: '.68rem', cursor: 'pointer', padding: '.3rem .75rem', borderRadius: '4px' }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {client ? (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '.58rem', letterSpacing: '.22em', textTransform: 'uppercase', color: '#B8956A', marginBottom: '.4rem' }}>Your project</div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 300, marginBottom: '.4rem' }}>{client.name}</div>
              {client.stage && <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.45)', background: 'rgba(255,255,255,.06)', border: '.5px solid rgba(255,255,255,.12)', borderRadius: '4px', padding: '.2rem .6rem' }}>{client.stage}</span>}
            </div>

            {awaitingApproval.length > 0 && (
              <div style={{ background: 'rgba(139,92,190,.08)', border: '.5px solid rgba(139,92,190,.3)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--purple, #8B5CBE)', fontWeight: 500, marginBottom: '.65rem' }}>
                  Action required — {awaitingApproval.length} item{awaitingApproval.length > 1 ? 's' : ''} awaiting your approval
                </div>
                {awaitingApproval.map(t => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,.04)', border: '.5px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '.65rem .875rem', marginBottom: '.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 500 }}>{t.name}</div>
                    {t.due_date && <span style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)' }}>Due {new Date(t.due_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</span>}
                  </div>
                ))}
              </div>
            )}

            {open.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', fontWeight: 500, marginBottom: '.875rem' }}>Active work</div>
                {open.map(t => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,.03)', border: '.5px solid rgba(255,255,255,.08)', borderRadius: '8px', padding: '.875rem 1.1rem', marginBottom: '.5rem', borderLeft: `2px solid ${STATUS_COLOR[t.status] || 'rgba(255,255,255,.1)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 500, marginBottom: '.3rem' }}>{t.name}</div>
                        {t.description && <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.42)', lineHeight: 1.55 }}>{t.description}</div>}
                      </div>
                      <span style={{ fontSize: '.64rem', color: STATUS_COLOR[t.status], background: 'rgba(255,255,255,.04)', border: `.5px solid ${STATUS_COLOR[t.status]}`, borderRadius: '12px', padding: '.2rem .6rem', flexShrink: 0 }}>
                        {STATUS_LABEL[t.status] || t.status}
                      </span>
                    </div>
                    {t.due_date && (
                      <div style={{ fontSize: '.66rem', color: 'rgba(255,255,255,.3)', marginTop: '.5rem' }}>
                        Due {new Date(t.due_date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {done.length > 0 && (
              <div>
                <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', fontWeight: 500, marginBottom: '.875rem' }}>Completed</div>
                {done.slice(0, 10).map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.55rem 0', borderBottom: '.5px solid rgba(255,255,255,.05)', opacity: .55 }}>
                    <span style={{ color: '#4CAF8A', fontSize: '.8rem' }}>✓</span>
                    <span style={{ fontSize: '.78rem', textDecoration: 'line-through' }}>{t.name}</span>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.3)', fontSize: '.82rem' }}>
                No tasks yet. Your Inara team will add them here as work begins.
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.4)', fontSize: '.82rem' }}>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', color: '#B8956A', marginBottom: '1rem' }}>Welcome</div>
            <div>Your project portal will appear here once your Inara team sets up your account.</div>
            <div style={{ marginTop: '.5rem', fontSize: '.72rem' }}>Signed in as {session?.user?.email}</div>
          </div>
        )}
      </div>
    </div>
  )
}
