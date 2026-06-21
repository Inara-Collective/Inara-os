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
      { to: '/messaging', label: 'Messaging', icon: '◉' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/pipeline', label: 'Leads', icon: '◈', exact: true },
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
    <div className="flex h-screen overflow-hidden bg-cream">

      {/* Sidebar */}
      <aside className="flex flex-col w-56 bg-white border-r border-border flex-shrink-0 overflow-y-auto">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-border">
          <div className="font-display text-xl text-ink leading-tight tracking-wide">
            Inara<br />Collective
          </div>
          <div className="text-[0.58rem] tracking-[0.18em] uppercase text-muted-foreground mt-1.5">
            Ecosystem OS
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {NAV_SECTIONS.map(section => {
            const visible = section.items.filter(canSee)
            if (visible.length === 0) return null
            return (
              <div key={section.label} className="mb-5">
                <div className="px-2 mb-1.5 text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/50">
                  {section.label}
                </div>
                {visible.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs mb-0.5 transition-colors no-underline ${
                        isActive
                          ? 'bg-navy text-white font-medium'
                          : 'text-ink/65 hover:bg-cream hover:text-ink'
                      }`
                    }
                  >
                    <span className="text-sm leading-none">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-navy text-white text-[0.6rem] font-semibold flex items-center justify-center flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.67rem] text-ink truncate">{email}</div>
              <button
                onClick={handleSignOut}
                className="text-[0.58rem] text-muted-foreground hover:text-ink transition-colors cursor-pointer mt-0.5 bg-transparent border-0 p-0"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
