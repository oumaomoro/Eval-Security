import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { LayoutDashboard, FileText, UploadCloud, LogOut, Shield, ShieldAlert, AlertTriangle, BookOpen, DollarSign, Layers, Crown, ShieldCheck, Settings, Moon, Sun, Users } from 'lucide-react'
import OnboardingTour from './OnboardingTour'
import LanguageSwitcher from './LanguageSwitcher'
import BrandingConfig from '../config/branding'

export default function Layout({ children }) {
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  
  const branding = user?.user_metadata?.branding_config || {};
  const primaryColor = branding.primaryColor || '#2563eb';
  const logoUrl = branding.logoUrl;

  const handleLogout = async () => {
    await signOut()
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/contracts', label: 'Contracts', icon: FileText },
    { path: '/compliance', label: 'Compliance', icon: ShieldAlert },
    { path: '/risk', label: 'Risks', icon: AlertTriangle },
    { path: '/clauses', label: 'Clause Intelligence', icon: BookOpen },
    { path: '/savings', label: 'Cost Optimizer', icon: DollarSign },
    { path: '/reports', label: 'Reports', icon: Layers },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/billing', label: 'Billing', icon: DollarSign },
    { path: '/settings', label: 'Settings & APIs', icon: Settings },
    { path: '/trust', label: 'Security & Trust', icon: ShieldCheck }
  ]

  const adminMenu = [
    { icon: ShieldCheck, label: 'Admin Panel', path: '/admin' },
    { path: '/admin/billing', label: 'Admin Billing', icon: DollarSign },
    { path: '/upload', label: 'Upload', icon: UploadCloud } // Moved upload to adminMenu
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      {/* Dynamic Branding Styles */}
      <style>{`
        :root {
          --brand-primary: ${primaryColor};
          --brand-primary-soft: ${primaryColor}20;
        }
      `}</style>

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all">
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            {BrandingConfig.logoUrl ? (
              <img src={BrandingConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20" style={{ backgroundColor: BrandingConfig.primaryColor }}>
                <Shield size={20} strokeWidth={2.5} />
              </div>
            )}
            <span className="text-xl font-bold tracking-tight text-white">{BrandingConfig.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Toggle Enterprise Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-700">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-200 truncate flex items-center gap-1.5">
                {user?.email?.split('@')[0]}
                {user?.tier && user.tier !== 'free' && (
                  <Crown size={12} className="text-amber-500 fill-amber-500" />
                )}
              </p>
              <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                {user?.tier ? (user.tier.charAt(0).toUpperCase() + user.tier.slice(1)) : 'Free'} Plan
              </p>
            </div>
            <button 
              onClick={signOut}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const active = location.pathname.startsWith(item.path)
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    active ? 'text-white shadow-md' : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }`}
                  style={active ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}40` } : {}}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          { (user?.role === 'admin' || user?.tier === 'admin') && (
            <div className="mt-8">
              <p className="px-6 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Administration</p>
              <nav className="flex-1 px-4 space-y-1">
                {adminMenu.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-rose-500/10 text-rose-500' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-rose-500' : 'text-slate-500'} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">SOC 2 Verified</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight tracking-tight">Active Data Isolation & Vault Encryption</p>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-2 justify-center text-rose-400 hover:text-white px-4 py-2 hover:bg-rose-500/10 rounded-lg transition-colors font-medium border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative text-slate-900 dark:text-slate-100 transition-colors duration-200 z-0">
        {children}
      </main>

      {/* Global Overlays */}
      <OnboardingTour />
    </div>
  )
}
