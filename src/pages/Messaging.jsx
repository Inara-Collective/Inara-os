import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../App.jsx'
import { supabase, getUsers, getMessages, sendMessage, markMessagesRead, getClients, getAllTasks } from '../lib/supabase.js'

export default function Messaging() {
  const { profile, session } = useAuth()
  const myId = session?.user?.id || profile?.id
  const myName = profile?.name || profile?.email?.split('@')[0] || 'You'

  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [tagClient, setTagClient] = useState('')
  const [tagTask, setTagTask] = useState('')
  const [showTagPanel, setShowTagPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const channelRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    Promise.all([getUsers(), getClients(), getAllTasks()])
      .then(([u, c, t]) => {
        setUsers(u.filter(u => u.id !== myId))
        setClients(c)
        setTasks(t)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [myId])

  useEffect(() => {
    if (!selectedUser || !myId) return
    setMessages([])

    getMessages(myId, selectedUser.id)
      .then(msgs => { setMessages(msgs); markMessagesRead(myId, selectedUser.id) })
      .catch(() => {})

    // Realtime subscription
    const channelName = `dm-${[myId, selectedUser.id].sort().join('-')}`
    if (channelRef.current) channelRef.current.unsubscribe()

    channelRef.current = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new
        if (
          (m.sender_id === myId && m.recipient_id === selectedUser.id) ||
          (m.sender_id === selectedUser.id && m.recipient_id === myId)
        ) {
          setMessages(prev => [...prev, m])
          if (m.sender_id !== myId) markMessagesRead(myId, selectedUser.id)
        }
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [selectedUser?.id, myId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!draft.trim() || !selectedUser || !myId) return
    setSending(true)
    try {
      const msg = await sendMessage({
        sender_id: myId,
        recipient_id: selectedUser.id,
        body: draft.trim(),
        client_id: tagClient || null,
        task_id: tagTask || null,
      })
      setMessages(prev => [...prev, msg])
      setDraft('')
      setTagClient('')
      setTagTask('')
      setShowTagPanel(false)
    } catch (e) {
      console.error('Send failed', e)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const getClientName = (id) => clients.find(c => c.id === id)?.name
  const getTaskName = (id) => tasks.find(t => t.id === id)?.name
  const getUserName = (id) => id === myId ? myName : (users.find(u => u.id === id)?.name || id?.slice(0, 6))

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading...</div></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="topbar">
        <div className="topbar-title">Messaging</div>
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* User list */}
        <aside style={{ width: 220, flexShrink: 0, borderRight: '.5px solid var(--border)', background: 'var(--warm)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '.75rem 1rem', fontSize: '.58rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, borderBottom: '.5px solid var(--border)' }}>Team</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {users.length === 0 && (
              <div style={{ padding: '1.5rem 1rem', fontSize: '.75rem', color: 'var(--muted)', textAlign: 'center' }}>No other team members yet.</div>
            )}
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                style={{
                  padding: '.7rem 1rem',
                  cursor: 'pointer',
                  borderBottom: '.5px solid var(--border)',
                  background: selectedUser?.id === u.id ? 'var(--gold-bg)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.625rem',
                  transition: 'background .15s',
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pale-cloud)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 600, color: 'var(--mist-blue)', flexShrink: 0 }}>
                  {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: '.78rem', fontWeight: selectedUser?.id === u.id ? 600 : 400 }}>{u.name || u.email}</div>
                  <div style={{ fontSize: '.62rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{u.role || 'team'}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Conversation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedUser ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ fontSize: '2rem', opacity: .3 }}>◎</div>
              <div style={{ fontSize: '.78rem' }}>Select a team member to message</div>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div style={{ padding: '.75rem 1.25rem', borderBottom: '.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--warm)', flexShrink: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--pale-cloud)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.62rem', fontWeight: 600, color: 'var(--mist-blue)' }}>
                  {(selectedUser.name || selectedUser.email || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '.85rem', fontWeight: 500 }}>{selectedUser.name || selectedUser.email}</div>
                  <div style={{ fontSize: '.62rem', color: 'var(--muted)', textTransform: 'capitalize' }}>{selectedUser.role || 'team member'}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '.75rem', marginTop: '2rem' }}>No messages yet. Say hi 👋</div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.sender_id === myId
                  const taggedClient = m.client_id ? getClientName(m.client_id) : null
                  const taggedTask = m.task_id ? getTaskName(m.task_id) : null
                  const showSender = i === 0 || messages[i - 1]?.sender_id !== m.sender_id
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {showSender && (
                        <div style={{ fontSize: '.6rem', color: 'var(--muted)', marginBottom: '.2rem', paddingLeft: isMe ? 0 : '.25rem', paddingRight: isMe ? '.25rem' : 0 }}>
                          {getUserName(m.sender_id)} · {new Date(m.created_at).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <div style={{
                        maxWidth: '65%',
                        background: isMe ? 'var(--mist-blue)' : 'var(--warm)',
                        color: isMe ? '#fff' : 'var(--dark)',
                        border: isMe ? 'none' : '.5px solid var(--border)',
                        borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        padding: '.6rem .875rem',
                        fontSize: '.8rem',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                      }}>
                        {m.body}
                        {(taggedClient || taggedTask) && (
                          <div style={{ marginTop: '.4rem', display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                            {taggedClient && (
                              <span style={{ fontSize: '.6rem', background: isMe ? 'rgba(255,255,255,.2)' : 'var(--gold-bg)', color: isMe ? '#fff' : 'var(--amber)', padding: '.12rem .45rem', borderRadius: '4px', fontWeight: 500 }}>
                                ◎ {taggedClient}
                              </span>
                            )}
                            {taggedTask && (
                              <span style={{ fontSize: '.6rem', background: isMe ? 'rgba(255,255,255,.2)' : 'var(--pale-cloud)', color: isMe ? '#fff' : 'var(--mist-blue)', padding: '.12rem .45rem', borderRadius: '4px', fontWeight: 500 }}>
                                ◈ {taggedTask}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Compose */}
              <div style={{ borderTop: '.5px solid var(--border)', padding: '.75rem 1.25rem', background: 'var(--warm)', flexShrink: 0 }}>
                {(tagClient || tagTask) && (
                  <div style={{ display: 'flex', gap: '.35rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
                    {tagClient && (
                      <span style={{ fontSize: '.62rem', background: 'var(--gold-bg)', color: 'var(--amber)', padding: '.15rem .5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                        ◎ {getClientName(tagClient)}
                        <button onClick={() => setTagClient('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--amber)', padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    )}
                    {tagTask && (
                      <span style={{ fontSize: '.62rem', background: 'var(--pale-cloud)', color: 'var(--mist-blue)', padding: '.15rem .5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                        ◈ {getTaskName(tagTask)}
                        <button onClick={() => setTagTask('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mist-blue)', padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    )}
                  </div>
                )}
                {showTagPanel && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '.5rem' }}>
                    <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={tagClient} onChange={e => setTagClient(e.target.value)}>
                      <option value="">Tag a client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="form-select" style={{ fontSize: '.72rem', padding: '.3rem .5rem' }} value={tagTask} onChange={e => setTagTask(e.target.value)}>
                      <option value="">Tag a task...</option>
                      {tasks.slice(0, 50).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => setShowTagPanel(p => !p)}
                    title="Tag client or task"
                    style={{ background: showTagPanel ? 'var(--pale-cloud)' : 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '6px', padding: '.5rem .625rem', cursor: 'pointer', fontSize: '.75rem', color: 'var(--muted)', flexShrink: 0 }}
                  >
                    ◈
                  </button>
                  <textarea
                    className="form-textarea"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedUser.name || selectedUser.email}…`}
                    rows={1}
                    style={{ flex: 1, resize: 'none', minHeight: 38, fontSize: '.82rem', lineHeight: 1.5, padding: '.5rem .75rem' }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    style={{ flexShrink: 0, padding: '.5rem 1rem' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
