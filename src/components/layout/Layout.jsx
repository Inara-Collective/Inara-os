import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../App.jsx'
import { signOut } from '../../lib/supabase.js'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '⬡', exact: true },
  { to: '/pipeline', label: 'Pipeline', icon: '◈' },
  { to: '/delivery', label: 'Delivery Board', icon: '▦' },
  { to: '/modules', label: 'Module Library', icon: '◉' },
  { to: '/reporting', label: 'Reporting', icon: '◎' },
  { to: '/sops', label: 'SOP Library', icon: '☰' },
  { to: '/outsource', label: 'Outsource Network', icon: '◌' },
  { to: '/system', label: 'Full System Flow', icon: '→' },
]

export default function Layout() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const email = session?.user?.email || ''
  const initials = email.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo">Inara<br />Collective</div>
          <div className="sb-tag">Ecosystem OS</div>
        </div>
        <nav className="sb-nav">
          <div className="sb-section">Navigation</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sb-footer">
          <div className="user-row">
            <div className="user-av">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="truncate" style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.45)' }}>{email}</div>
              <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.22)', fontSize: '.6rem', cursor: 'pointer', padding: 0, marginTop: '.1rem' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <div className="main">
        <Outlet />
      </div>
    </div>
  )
}
