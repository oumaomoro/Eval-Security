import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { identifyUser, resetAnalyticsUser } from '../utils/analytics.js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://ulercnwyckrcjnrenzz.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Phase 7: Unified Anchor Reconstruction
  // Frontend Anchor: www.costloci.com
  // Backend Anchor: api.costloci.com
  const BASE_API_URL = window.location.hostname.includes('costloci.com') 
    ? 'https://api.costloci.com/api' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // If we have a session, favor the custom profile for tiered roles
        await refreshUser()
      } else {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Auto-provision profile for SSO users if missing
        if (event === 'SIGNED_IN') {
          const { data: profile } = await supabase.from('profiles').select('id').eq('id', session.user.id).single()
          if (!profile) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email,
              role: 'analyst',
              tier: 'free'
            })
          }
        }
        await refreshUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshUser = async () => {
    try {
      let token = localStorage.getItem('costloci_token')
      let sessionUser = null

      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setUser(null)
          setLoading(false)
          return
        }
        token = session.access_token
        sessionUser = session.user
        localStorage.setItem('costloci_token', token)
      } else {
        // Even if we have a token, we need a base user object for route guards
        const { data: { session } } = await supabase.auth.getSession()
        if (session) sessionUser = session.user
      }

      // Proactively set user info so route guards (user ? <App/> : <Login/>) don't bounce the user
      // while we're fetching high-latency metadata like billing/tier.
      if (sessionUser) {
        setUser(prev => prev || sessionUser)
      }

      const res = await fetch(`${BASE_API_URL}/billing/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const { data } = await res.json()
        if (data) {
          setUser(prev => ({
            ...sessionUser,
            ...prev,
            id: data.user?.id || data.id || sessionUser?.id,
            tier: data.tier,
            plan: data.plan,
            organization_id: data.user?.organization_id || data.organization_id || prev?.organization_id,
            email: data.email || sessionUser?.email || prev?.email
          }))
          identifyUser(
            { id: data?.user?.id || data?.id || sessionUser?.id || 'unknown', email: data.email || sessionUser?.email, organization_id: data.organization_id },
            data
          )
        }
      } else {
        console.warn(`Billing status returned ${res.status}. Proceeding with session-only user.`);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
      // Keep session alive even if billing check fails
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    try {
      // Enforce Absolute Production API Gateway (Unified Prefix)
      const res = await fetch(`${BASE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')

      if (data.token) {
        localStorage.setItem('costloci_token', data.token)
        setUser(data.user)
      } else {
        // Standard Supabase flow where user is created but unconfirmed
        return { success: true, message: 'VERIFICATION_REQUIRED' };
      }
      return data
    } catch (err) {
      console.error('[AuthContext] Registration failed:', err.message);
      // Only fall back if specifically needed for local development, but in prod we want the backend to handle it
      if (import.meta.env.DEV) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        return data
      }
      throw err;
    }
  }

  const signIn = async (email, password) => {
    try {
      // Favor absolute production gateway for identity
      const res = await fetch(`${BASE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.requiresVerification) {
          throw new Error('EMAIL_NOT_CONFIRMED');
        }
        throw new Error(data.error || 'Login failed')
      }

      // Store token for subsequent API calls
      localStorage.setItem('costloci_token', data.token)
      setUser({
        ...data.user,
        organization_id: data.user?.organization_id || data.organization_id
      })

      // Initialize unified analytics profile
      identifyUser(data.user, data.user)

      return data
    } catch (err) {
      if (err.message === 'EMAIL_NOT_CONFIRMED') throw err;

      console.warn('API login failed, checking Supabase...', err.message)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) throw new Error('EMAIL_NOT_CONFIRMED');
        throw error;
      }
      if (data.session) localStorage.setItem('costloci_token', data.session.access_token)
      setUser(data.user)
      return data
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.hostname.includes('costloci.com') 
            ? 'https://www.costloci.com/dashboard' 
            : `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
      return data
    } catch (err) {
      console.error('[AuthContext] Google SSO failed:', err.message)
      throw err
    }
  }

  const signOut = async () => {
    localStorage.removeItem('costloci_token')
    await supabase.auth.signOut()
    setUser(null)
    resetAnalyticsUser()
  }

  const value = {
    user,
    token: localStorage.getItem('costloci_token'),
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshUser,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
