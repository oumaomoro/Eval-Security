import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { LayoutDashboard, FileText, UploadCloud, LogOut, Shield, ShieldAlert, AlertTriangle, BookOpen, DollarSign, Layers, Crown, ShieldCheck, Settings, Moon, Sun, Users } from 'lucide-react'
import OnboardingTour from './OnboardingTour'
import LanguageSwitcher from './LanguageSwitcher'
import BrandingConfig from '../config/branding'
import NotificationBell from './NotificationBell'

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
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { path: '/savings', label: 'Cost Optimizer', icon: DollarSign },
    { path: '/reports', label: 'Reports', icon: Layers },
    { path: '/reports/builder', label: 'Report Designer', icon: BarChart },
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
      <aside className="w-64 glass dark:glass border-r border-slate-800 text-slate-300 flex flex-col transition-all z-20">
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10 bg-slate-900 border border-white/5 overflow-hidden">
              {BrandingConfig.logoUrl ? (
                <img src={BrandingConfig.logoUrl} alt={BrandingConfig.appName} className="w-full h-full object-cover" />
              ) : (
                <Shield className="text-cyan-400" size={18} strokeWidth={2.5} />
              )}
            </div>
            <span className="text-xl font-bold tracking-tight text-white">{BrandingConfig.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Toggle Enterprise Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-3 px-2">
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
              className="p-1.5 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all group ${
                    active 
                      ? 'text-white border-l-2 border-cyan-400 bg-white/5 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                      : 'hover:bg-white/5 hover:text-white text-slate-400'
                  }`}
                  style={active ? { textShadow: '0 0 8px rgba(34,211,238,0.5)' } : {}}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-cyan-400' : 'group-hover:text-white'} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          { (user?.role === 'admin' || user?.tier === 'admin') && (
            <div className="mt-8">
              <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Administration Portal</p>
              <nav className="space-y-1">
                {adminMenu.map((item) => {
                  const isActive = location.pathname.startsWith(item.path)
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-rose-500/10 text-rose-500 border-l-2 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon size={18} className={isActive ? 'text-rose-500' : 'text-slate-500 group-hover:text-white'} />
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
