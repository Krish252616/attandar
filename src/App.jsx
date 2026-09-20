import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import MemberPage from './components/MemberPage'
import AdminDashboard from './components/AdminDashboard'
import AdminLogin from './components/AdminLogin'
import './App.css'

export default function App() {
  const [page, setPage] = useState('loading')
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    const isAdmin = window.location.pathname === '/admin'

    if (isAdmin) {
      setPage('admin-login')
      // Check if already logged in
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAdminLoggedIn(true)
          setPage('admin-dashboard')
        }
      })
    } else if (urlToken) {
      setToken(urlToken)
      setPage('validating-token')
      validateToken(urlToken)
    } else {
      setPage('no-token')
    }
  }, [])

  const validateToken = async (tok) => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('token', tok)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        setPage('invalid-token')
        return
      }

      // Check if expired
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        setPage('expired-token')
        return
      }

      setPage('member-page')
    } catch (err) {
      console.error('Token validation error:', err)
      setPage('invalid-token')
    }
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    setIsAdminLoggedIn(false)
    setPage('admin-login')
  }

  if (page === 'loading') {
    return <div className="loading">Initializing...</div>
  }

  if (page === 'no-token') {
    return (
      <div className="error-page">
        <h1>No Access</h1>
        <p>Please use the link provided by the admin.</p>
      </div>
    )
  }

  if (page === 'invalid-token') {
    return (
      <div className="error-page">
        <h1>Invalid Link</h1>
        <p>This link is not valid. Ask your admin for a new one.</p>
      </div>
    )
  }

  if (page === 'expired-token') {
    return (
      <div className="error-page">
        <h1>Link Expired</h1>
        <p>This link has expired (24 hours have passed).</p>
        <p>Ask your admin for a new link.</p>
      </div>
    )
  }

  if (page === 'validating-token') {
    return <div className="loading">Validating access...</div>
  }

  if (page === 'member-page') {
    return <MemberPage token={token} />
  }

  if (page === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true)
          setPage('admin-dashboard')
        }}
      />
    )
  }

  if (page === 'admin-dashboard' && isAdminLoggedIn) {
    return <AdminDashboard onLogout={handleLogout} />
  }

  return <div className="loading">Loading...</div>
}
