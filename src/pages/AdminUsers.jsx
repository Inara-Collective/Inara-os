import React, { useState, useEffect } from 'react'
import { getUsers, updateUserRole } from '../lib/supabase.js'

const ROLES = ['admin', 'internal', 'client']
const ROLE_COLOR = { admin: 'var(--gold)', internal: 'var(--blue)', client: 'var(--teal)' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { getUsers().then(d => { setUsers(d); setLoading(false) }).catch(e => { setError(e.message); setLoading(false) }) }, [])

  const handleRoleChange = async (id, role) => {
    setSaving(id)
    try {
      const updated = await updateUserRole(id, role)
      setUsers(p => p.map(u => u.id === id ? updated : u))
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div>Loading users...</div></div>

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Users & Roles</div>
      </div>
      <div className="page">
        {error && (
          <div style={{ background: 'var(--red-bg)', border: '.5px solid var(--red-b)', borderRadius: '8px', padding: '.875rem 1.25rem', marginBottom: '1rem', fontSize: '.78rem', color: 'var(--red)' }}>
            {error}
          </div>
        )}
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '.5px solid var(--border)', background: 'var(--bg)' }}>
                {['User', 'Email', 'Role', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '.625rem 1rem', textAlign: 'left', fontSize: '.58rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.78rem' }}>
                    No user profiles found. Users are created when they first sign in.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom: '.5px solid var(--border)' }}>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 500, color: 'var(--amber)', flexShrink: 0 }}>
                        {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '.82rem', fontWeight: 500 }}>{u.name || '—'}</div>
                    </div>
                  </td>
                  <td style={{ padding: '.75rem 1rem', fontSize: '.78rem', color: 'var(--muted)' }}>{u.email}</td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <span style={{ fontSize: '.7rem', fontWeight: 500, color: ROLE_COLOR[u.role] || 'var(--muted)', background: 'var(--warm)', border: `.5px solid ${ROLE_COLOR[u.role] || 'var(--border)'}`, borderRadius: '12px', padding: '.2rem .65rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      {ROLES.filter(r => r !== u.role).map(r => (
                        <button
                          key={r}
                          onClick={() => handleRoleChange(u.id, r)}
                          disabled={saving === u.id}
                          className="btn btn-ghost btn-xs"
                          style={{ fontSize: '.64rem', opacity: saving === u.id ? .5 : 1 }}
                        >
                          {saving === u.id ? '...' : `→ ${r}`}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', background: 'var(--warm)', border: '.5px solid var(--border)', borderRadius: '8px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500, marginBottom: '.65rem' }}>Role permissions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            {[
              { role: 'admin', desc: 'Full access — all pages, all data, user management.' },
              { role: 'internal', desc: 'Team view — delivery boards, reporting, SOPs, outsource network.' },
              { role: 'client', desc: 'Client portal only — view their own tasks and project status.' },
            ].map(({ role, desc }) => (
              <div key={role} style={{ display: 'flex', gap: '.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '.7rem', fontWeight: 500, color: ROLE_COLOR[role], background: 'var(--bg)', border: `.5px solid ${ROLE_COLOR[role]}`, borderRadius: '12px', padding: '.2rem .65rem', flexShrink: 0 }}>{role}</span>
                <div style={{ fontSize: '.74rem', color: 'var(--muted)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
