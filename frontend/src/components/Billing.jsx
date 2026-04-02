import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CreditCard, CheckCircle, Zap, Star, Shield, Crown,
  ArrowRight, Loader, Lock, RefreshCw, AlertCircle, ExternalLink
} from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import { twMerge } from 'tailwind-merge'
import { clsx } from 'clsx'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'

/* ─── Plan metadata ─────────────────────────────────────── */
const PLAN_META = {
  Starter: { Icon: Shield, accent: 'slate', badge: null },
  Professional: { Icon: Star, accent: 'blue', badge: 'Most Popular' },
  Enterprise: { Icon: Crown, accent: 'violet', badge: 'Best Value' },
  'API Access': { Icon: Zap, accent: 'indigo', badge: 'Devs Choice' },
}

/* ─── Small helpers ─────────────────────────────────────── */
function StatusBanner({ type, children }) {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    loading: 'bg-blue-50 border-blue-200 text-blue-800',
  }
  const Icons = { error: AlertCircle, success: CheckCircle, loading: Loader }
  const Icon = Icons[type]
  return (
    <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 ${styles[type]}`}>
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${type === 'loading' ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium leading-relaxed">{children}</span>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────── */
export default function Billing() {
  const [plans, setPlans] = useState([])
  const [currentSub, setCurrentSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkingOut, setCheckingOut] = useState(null)   // plan.id being processed
  const [capturing, setCapturing] = useState(false)
  const [banner, setBanner] = useState(null)   // { type, text }
  const [gateway, setGateway] = useState('paypal') // 'paypal' | 'paystack'
  const [billingInterval, setBillingInterval] = useState('month') // 'month' | 'year'
  const location = useLocation()
  const navigate = useNavigate()

  const { user, refreshUser } = useAuth()

  /* ── Load plans & subscription status ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, statusRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/status'),
      ])
      setPlans(plansRes.data || [])
      setCurrentSub(statusRes.data || null)
    } catch (err) {
      console.error('Billing fetch error:', err)
      setBanner({ type: 'error', text: 'Failed to load billing information. Please refresh.' })
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Capture order if returning from PayPal ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')      // PayPal order id in the redirect
    const payerId = params.get('PayerID')

    if (token && payerId) {
      // Clean the URL first so the user doesn't accidentally re-capture
      navigate('/billing/success', { replace: true, state: { token, payerId } })
    } else {
      fetchData()
    }
  }, []) // eslint-disable-line

  /* ── Handle capture on success page ── */
  useEffect(() => {
    if (location.pathname !== '/billing/success') return
    const { token, payerId } = location.state || {}
    if (!token) return

    const capturePayment = async () => {
      setCapturing(true)
      setLoading(false)
      setBanner({ type: 'loading', text: 'Verifying your payment with PayPal. Please wait…' })
      try {
        const res = await api.post('/billing/capture-order', { order_id: token })
        if (res.data?.status === 'COMPLETED' || res.data?.success) {
          setBanner({ type: 'success', text: '🎉 Payment confirmed! Your account has been upgraded.' })
          await refreshUser()
          await fetchData()
        } else {
          setBanner({ type: 'error', text: `Payment could not be confirmed (status: ${res.data?.status}). Contact support@costloci.io.` })
        }
      } catch (err) {
        setBanner({ type: 'error', text: `Capture failed: ${err.response?.data?.error || err.message}` })
      } finally {
        setCapturing(false)
      }
    }
    capturePayment()
  }, [location.pathname]) // eslint-disable-line

  /* ── Initiate checkout ── */
  const handleCheckout = async (plan) => {
    setCheckingOut(plan.id)
    setBanner(null)
    try {
      if (gateway === 'paypal') {
        const payload = await api.post('/billing/create-order', { plan_id: plan.id, interval: billingInterval })
        const approvalUrl = payload?.approval_url || payload?.data?.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action')?.href
        if (approvalUrl) {
          setBanner({ type: 'loading', text: `Order created. Redirecting to PayPal…` })
          setTimeout(() => { window.location.href = approvalUrl }, 800)
        }
      } else {
        // Paystack flow
        const payload = await api.post('/billing/paystack/initialize', { plan_id: plan.id, interval: billingInterval })
        if (payload.authorization_url) {
          setBanner({ type: 'loading', text: `Initializing Paystack secure checkout…` })
          setTimeout(() => { window.location.href = payload.authorization_url }, 800)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setBanner({ type: 'error', text: `Payment initiation failed: ${msg}` })
    } finally {
      setCheckingOut(null)
    }
  }

  const getPriceLabel = (price) => {
    if (gateway === 'paystack') {
      // Approximate conversion for display if multi-currency isn't dynamic yet
      return `₦${(price * 1500).toLocaleString()}` // Nigerian Naira example
    }
    return `$${price}`
  }

  /* ─── Loading skeleton ─────────────────────────────────── */
  if (loading && !capturing) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="h-10 w-64 bg-slate-100 rounded-xl animate-pulse mx-auto mb-3" />
        <div className="h-5 w-96 bg-slate-100 rounded-lg animate-pulse mx-auto mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-slate-100 p-6 bg-white space-y-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-100 rounded-xl" />
              <div className="h-5 w-32 bg-slate-100 rounded" />
              <div className="h-10 w-24 bg-slate-100 rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-slate-100 rounded w-4/5" />)}
              </div>
              <div className="h-11 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ─── Main render ──────────────────────────────────────── */
  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold uppercase tracking-wider mb-5">
          <Zap size={12} /> Secure Checkout via PayPal
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-slate-500 mt-3 max-w-xl mx-auto text-lg leading-relaxed mb-8">
          Every plan includes AI-powered contract analysis, compliance monitoring, and real-time risk detection.
        </p>

        {/* Billing Cycle Selector */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <span className={`text-sm font-bold ${billingInterval === 'month' ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
          <Switch.Root
            checked={billingInterval === 'year'}
            onCheckedChange={(checked) => setBillingInterval(checked ? 'year' : 'month')}
            className={twMerge(
              "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50",
              billingInterval === 'year' ? "bg-blue-600" : "bg-slate-200"
            )}
          >
            <Switch.Thumb
              className={twMerge(
                "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                billingInterval === 'year' ? "translate-x-5" : "translate-x-0"
              )}
            />
          </Switch.Root>
          <span className={`text-sm font-bold flex items-center gap-2 ${billingInterval === 'year' ? 'text-blue-600' : 'text-slate-500'}`}>
            Pay Annually <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
          </span>
        </div>

        {/* Gateway Selector (Regional Solidity) */}
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner mb-6">
          <button
            onClick={() => setGateway('paypal')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${gateway === 'paypal' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <CreditCard size={16} /> Global (PayPal)
          </button>
          <button
            onClick={() => setGateway('paystack')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${gateway === 'paystack' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Zap size={16} /> Regional (Paystack)
          </button>
        </div>
      </div>

      {/* Active subscription banner */}
      {currentSub && (
        <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={22} />
            <div>
              <p className="font-bold text-emerald-900">Active: {currentSub.plan} Plan</p>
              <p className="text-sm text-emerald-700">
                ${currentSub.amount}/{currentSub.billing_cycle || 'month'} &nbsp;·&nbsp; Renews {currentSub.next_billing_date}
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            title="Refresh subscription status"
            className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-700"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* Status banner */}
      {banner && <StatusBanner type={banner.type}>{banner.text}</StatusBanner>}

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map(plan => {
          const meta = PLAN_META[plan.name] || PLAN_META.Starter
          const { Icon, accent, badge } = meta
          const isHighlight = !!badge
          const isCurrentPlan = currentSub?.plan === plan.name
          const isBusy = checkingOut === plan.id

          const accentBg = isHighlight ? `bg-${accent}-600` : 'bg-white'
          const accentText = isHighlight ? 'text-white' : `text-${accent}-700`
          const accentBorder = isHighlight ? `border-${accent}-300` : 'border-slate-200'
          const btnClass = isCurrentPlan
            ? 'bg-emerald-100 text-emerald-700 cursor-default'
            : isHighlight
              ? `bg-${accent}-600 text-white hover:bg-${accent}-700 shadow-lg shadow-${accent}-200`
              : 'bg-slate-900 text-white hover:bg-slate-700'

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl border ${accentBorder} p-7 flex flex-col transition-all duration-300 bg-white ${isHighlight
                  ? `shadow-2xl shadow-${accent}-100 ring-2 ring-${accent}-400 ring-offset-2 scale-[1.03]`
                  : 'shadow-sm hover:shadow-lg hover:-translate-y-0.5'
                }`}
            >
              {badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <span className={`bg-${accent}-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg whitespace-nowrap`}>
                    {badge}
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${accentBg} ${isHighlight ? 'shadow-md' : 'border border-slate-200 bg-slate-50'}`}>
                <Icon size={22} className={accentText} />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
              <div className="mb-5">
                {billingInterval === 'year' ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900">{getPriceLabel(Math.floor(plan.price * 12 * 0.8))}</span>
                      <span className="text-slate-500 text-sm font-medium">/yr</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1 line-through">{getPriceLabel(plan.price)}/mo</div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">({getPriceLabel((Math.floor(plan.price * 12 * 0.8) / 12).toFixed(2))}/mo equivalent)</div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">{getPriceLabel(plan.price)}</span>
                    <span className="text-slate-500 text-sm font-medium">/mo</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-7">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle size={15} className={`flex-shrink-0 mt-0.5 ${isHighlight ? `text-${accent}-500` : 'text-emerald-500'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                id={`checkout-btn-${plan.id}`}
                onClick={() => handleCheckout(plan)}
                disabled={isCurrentPlan || !!checkingOut}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${btnClass} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isBusy ? (
                  <><Loader size={16} className="animate-spin" /> Processing…</>
                ) : isCurrentPlan ? (
                  <><CheckCircle size={16} /> Current Plan</>
                ) : (
                  <>
                    <CreditCard size={16} />
                    {gateway === 'paypal' ? 'Pay with PayPal' : 'Secure Paystack Checkout'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {!isCurrentPlan && !isHighlight && (
                <p className="text-center text-[11px] text-slate-400 mt-3">No long-term commitment</p>
              )}
              {isHighlight && (
                <p className="text-center text-[11px] text-blue-400 mt-3">Cancel anytime · Instant activation</p>
              )}
            </div>
          )
        })}
      </div>

      {/* FAQ row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-sm">
        {[
          { q: 'What counts as a contract?', a: 'Any PDF or text-based legal document — MSAs, DPAs, SLAs, NDA, and vendor agreements.' },
          { q: 'Can I switch plans?', a: 'Yes. Upgrade or downgrade at any time. Billing is prorated so you never overpay.' },
          { q: 'Is my data secure?', a: 'All documents are stored with AES-256 encryption. We never share or sell your contract data.' },
        ].map(item => (
          <div key={item.q} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <p className="font-bold text-slate-900 mb-1">{item.q}</p>
            <p className="text-slate-500 text-xs leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      {/* Trust strip */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5"><Lock size={12} /> 256-bit TLS</span>
        <span>·</span>
        <span className="flex items-center gap-1.5"><Shield size={12} /> SOC 2 Type II</span>
        <span>·</span>
        <span className="flex items-center gap-1.5"><ExternalLink size={12} /> PayPal Verified Merchant</span>
        <span>·</span>
        <span>Cancel anytime, no penalties</span>
      </div>
    </div>
  )
}
