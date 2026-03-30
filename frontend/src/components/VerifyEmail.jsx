import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import BrandingConfig from '../config/branding'
import { supabase } from '../contexts/AuthContext'

export default function VerifyEmail() {
  const location = useLocation()
  const email = location.state?.email || ''
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const resendConfirmation = async () => {
    if (!email) {
      setError('Email address is unidentifiable. Please login again.')
      return
    }
    
    setLoading(true)
    setMessage('')
    setError('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      })
      if (error) throw error
      setMessage('Confirmation email resent! Please check your inbox.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100/50 p-8 text-center relative">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white shadow-lg shadow-blue-500/20 text-3xl font-bold bg-blue-600">
            ✉️
          </div>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Check your email</h1>
        
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          We've sent a verification link to <span className="font-semibold text-slate-700">{email || 'your email'}</span>. 
          Please click the link to verify your account and access your Command Center.
        </p>
        
        {message && (
          <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl mb-6 text-sm border border-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm border border-rose-100">
            {error}
          </div>
        )}

        <button
          onClick={resendConfirmation}
          disabled={loading || !email}
          className="w-full relative flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all shadow-md mb-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'Resend confirmation email'
          )}
        </button>

        <div className="mt-6 text-sm text-slate-600">
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  )
}
