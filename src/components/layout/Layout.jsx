import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../App.jsx'
import { signOut } from '../../lib/supabase.js'

const NAV_SECTIONS = [
  {
    label: 'Command Centre',
    items: [
      { to: '/', label: 'Home', icon: '⬡', exact: true },
      { to: '/my-board', label: 'My Board', icon: '◫' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/pipeline', label: 'Pipeline', icon: '◈' },
      { to: '/clients', label: 'Clients', icon: '◎' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { to: '/delivery', label: 'Delivery Board', icon: '▦' },
      { to: '/content-board', label: 'Content Board', icon: '◈', roles: ['admin', 'internal'] },
      { to: '/team-board', label: 'Team Board', icon: '◉', roles: ['admin', 'internal'] },
      { to: '/reporting', label: 'Reporting', icon: '◌', roles: ['admin', 'internal'] },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/sops', label: 'SOPs', icon: '☰' },
      { to: '/outsource', label: 'Outsource Network', icon: '◇' },
      { to: '/system', label: 'System Flow', icon: '→' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { to: '/admin/users', label: 'Users & Roles', icon: '◑', roles: ['admin'] },
    ],
  },
]

export default function Layout() {
  const { session, profile } = useAuth()
  const navigate = useNavigate()
  const email = session?.user?.email || ''
  const initials = email.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const canSee = (item) => !item.roles || item.roles.includes(profile?.role)

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sb-brand">
          <div className="sb-logo">Inara<br />Collective</div>
          <div className="sb-tag">Ecosystem OS</div>
        </div>
        <nav className="sb-nav">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(canSee)
            if (visible.length === 0) return null
            return (
              <div key={section.label}>
                <div className="sb-section">{section.label}</div>
                {visible.map(item => (
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
              </div>
            )
          })}
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
