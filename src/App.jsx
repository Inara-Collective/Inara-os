import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, getUserProfile } from './lib/supabase.js'
import Layout from './components/layout/Layout.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Pipeline from './pages/Pipeline.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import ClientsList from './pages/ClientsList.jsx'
import SystemFlow from './pages/SystemFlow.jsx'
import Delivery from './pages/Delivery.jsx'
import Reporting from './pages/Reporting.jsx'
import SOPs from './pages/SOPs.jsx'
import Outsource from './pages/Outsource.jsx'
import MyBoard from './pages/MyBoard.jsx'
import TeamBoard from './pages/TeamBoard.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import ClientPortal from './pages/ClientPortal.jsx'
import ContentBoard from './pages/ContentBoard.jsx'
import Messaging from './pages/Messaging.jsx'
import GlobalDictation from './components/GlobalDictation.jsx'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function Loader() {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1A1816' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'Georgia,serif', fontSize:'1.5rem', color:'#B8956A', marginBottom:'1rem', letterSpacing:'.06em' }}>Inara Collective</div>
        <div className="spinner" style={{ margin:'0 auto' }}></div>
      </div>
    </div>
  )
}

function RoleRoute({ children, allowedRoles }) {
  const { profile } = useAuth()
  if (!profile) return <Loader />
  if (allowedRoles && !allowedRoles.includes(profile.role)) return <Navigate to="/" />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (user) => {
    try {
      const p = await getUserProfile()
      if (p) {
        setProfile(p)
      } else {
        // Profile exists in auth but not in user_profiles table yet — default to admin
        setProfile({ id: user.id, email: user.email, role: 'admin', name: 'Maxine' })
      }
    } catch (e) {
      // If profile fetch fails entirely, still let the user in as admin
      setProfile({ id: user.id, email: user.email, role: 'admin', name: '' })
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user)
        }
      } catch (e) {
        console.error('Init error:', e)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session)
      if (session?.user) {
        await fetchProfile(session.user)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <Loader />

  if (session && profile?.role === 'client') {
    return (
      <AuthContext.Provider value={{ session, profile, setProfile }}>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<ClientPortal />} />
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ session, profile, setProfile }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Home />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="pipeline/:id" element={<ClientDetail />} />
            <Route path="clients" element={<ClientsList />} />
            <Route path="my-board" element={<MyBoard />} />
            <Route path="messaging" element={<Messaging />} />
            <Route path="team-board" element={<RoleRoute allowedRoles={['admin','internal']}><TeamBoard /></RoleRoute>} />
            <Route path="system" element={<SystemFlow />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="content-board" element={<RoleRoute allowedRoles={['admin','internal']}><ContentBoard /></RoleRoute>} />
            <Route path="reporting" element={<RoleRoute allowedRoles={['admin','internal']}><Reporting /></RoleRoute>} />
            <Route path="sops" element={<RoleRoute allowedRoles={['admin','internal']}><SOPs /></RoleRoute>} />
            <Route path="outsource" element={<RoleRoute allowedRoles={['admin','internal']}><Outsource /></RoleRoute>} />
            <Route path="admin/users" element={<RoleRoute allowedRoles={['admin']}><AdminUsers /></RoleRoute>} />
          </Route>
        </Routes>
        <GlobalDictation />
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
