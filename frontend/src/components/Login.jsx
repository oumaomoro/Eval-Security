import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import BrandingConfig from '../config/branding'
import { supabase } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  // Handle ?signup=true URL parameter for landing page deep-links
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('signup') === 'true') {
      setIsLogin(false)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        navigate('/dashboard')
      } else {
        const data = await signUp(email, password)
        if (data && data.requiresVerification) {
          navigate('/verify-email', { state: { email } })
        } else {
          navigate('/dashboard')
        }
      }
    } catch (error) {
      if (error.message === 'EMAIL_NOT_CONFIRMED') {
        navigate('/verify-email', { state: { email } })
      } else {
        setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <div className="max-w-4xl w-full flex rounded-3xl shadow-2xl overflow-hidden bg-white mx-4 border border-slate-100/50">
        
        {/* Left Side (Branding/Graphics) */}
        <div className="hidden lg:flex w-1/2 bg-slate-900 p-12 flex-col justify-between relative overflow-hidden">
          {/* Abstract decoration */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white shadow-lg mb-6 shadow-blue-500/20 text-2xl font-bold" style={{ backgroundColor: BrandingConfig.primaryColor }}>
              {BrandingConfig.appName.substring(0,1)}
            </div>
            <h1 className="text-4xl text-white font-bold tracking-tight mb-4">
              AI-Powered <br/><span className="text-blue-400">Contract Analysis</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Automate vendor agreement reviews, identify risks instantly, and optimize your cybersecurity spend.
            </p>
          </div>
          
          <div className="relative z-10 text-slate-500 text-sm">
            &copy; {BrandingConfig.copyrightYear} {BrandingConfig.companyName}
          </div>
        </div>

        {/* Right Side (Form) */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">
          <div className="mb-10 lg:hidden text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-white shadow-lg shadow-blue-500/20 text-xl font-bold mb-4" style={{ backgroundColor: BrandingConfig.primaryColor }}>
              {BrandingConfig.appName.substring(0,1)}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{BrandingConfig.appName}</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start automating your contract analysis today.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm border border-rose-100 flex items-center gap-2">
              <span className="font-semibold block shrink-0">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Work Email</label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {isLogin && <Link to="/forgot-password" title="Forgot Password" className="text-xs font-semibold text-blue-600 hover:text-blue-500">Forgot password?</Link>}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
              <button
                type="submit"
                disabled={loading}
                className="w-full relative flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all shadow-md mt-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isLogin ? 'Sign in to workspace' : 'Create account'
                )}
              </button>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="bg-white px-4 text-slate-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
                  } catch (err) { setError(err.message); }
                }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all mt-4"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>
            </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Demo Access</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setEmail('test@example.com'); setPassword('test123456'); setIsLogin(true); }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                Standard User
              </button>
              <button
                type="button"
                onClick={() => { setEmail('admin@example.com'); setPassword('admin123456'); setIsLogin(true); }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-blue-100 bg-blue-50/30 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                Platform Admin
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-blue-600 hover:text-blue-500 transition-colors underline decoration-blue-500/30 underline-offset-4"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
