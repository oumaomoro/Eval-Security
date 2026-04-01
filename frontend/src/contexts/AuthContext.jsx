import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { identifyUser, resetAnalyticsUser } from '../utils/analytics.js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
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
              role: 'user',
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
    const token = localStorage.getItem('costloci_token')
    if (!token) return

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/billing/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const { data } = await res.json()
      if (data) {
        setUser(prev => ({
          ...prev,
          tier: data.tier,
          plan: data.plan,
          email: prev?.email || data.email
        }))
        // Seed telemetry profiling
        identifyUser(
          { id: data?.user?.id || data?.id || 'unknown', email: data.email }, 
          data
        )
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      
      if (data.requiresVerification) {
        return data; // Return directly if verification needed, don't set user session locally
      }

      localStorage.setItem('costloci_token', data.token)
      setUser(data.user)
      return data
    } catch (err) {
      console.warn('API registration failed, checking Supabase...', err.message)
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      
      if (!data.session) {
        return { requiresVerification: true, message: 'Please check your email.' };
      }

      localStorage.setItem('costloci_token', data.session.access_token)
      setUser(data.user)
      return data
    }
  }

  const signIn = async (email, password) => {
    try {
      // Favor local API for E2E testing/login flow
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
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
      setUser(data.user)
      
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
    signOut,
    refreshUser,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
