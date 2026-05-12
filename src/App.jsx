import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase.js'
import Layout from './components/layout/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Pipeline from './pages/Pipeline.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import Delivery from './pages/Delivery.jsx'
import Modules from './pages/Modules.jsx'
import Reporting from './pages/Reporting.jsx'
import SOPs from './pages/SOPs.jsx'
import Outsource from './pages/Outsource.jsx'
import SystemFlow from './pages/SystemFlow.jsx'

export const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1816' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#B8956A', marginBottom: '1rem' }}>Inara Collective</div>
        <div style={{ width: 24, height: 24, border: '2px solid #333', borderTopColor: '#B8956A', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto' }}></div>
      </div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ session, supabase }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="pipeline/:id" element={<ClientDetail />} />
            <Route path="delivery" element={<Delivery />} />
            <Route path="modules" element={<Modules />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="sops" element={<SOPs />} />
            <Route path="outsource" element={<Outsource />} />
            <Route path="system" element={<SystemFlow />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
