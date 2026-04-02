import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Home from './components/Home'
import Onboarding from './components/Onboarding'
import Dashboard from './components/Dashboard'
import Contracts from './components/Contracts'
import Upload from './components/Upload'
import Compliance from './components/Compliance'
import RiskManagement from './components/RiskManagement'
import ClauseIntelligence from './components/ClauseIntelligence'
import CostOptimization from './components/CostOptimization'
import Reports from './components/Reports'
import Billing from './components/Billing'
import Settings from './components/Settings'
import TrustPanel from './components/TrustPanel'
import AdminDashboard from './components/AdminDashboard'
import Clients from './components/Clients'
import AdminBilling from './components/AdminBilling'
import Marketplace from './components/Marketplace'
import ReportBuilder from './components/ReportBuilder'
import Layout from './components/Layout'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/VerifyEmail'
import WordTaskpane from './components/WordTaskpane'
import GoldStandard from './components/GoldStandard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/" element={!user ? <Home /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/contracts" element={user ? <Layout><Contracts /></Layout> : <Navigate to="/login" />} />
        <Route path="/compliance" element={user ? <Layout><Compliance /></Layout> : <Navigate to="/login" />} />
        <Route path="/risk" element={user ? <Layout><RiskManagement /></Layout> : <Navigate to="/login" />} />
        <Route path="/clauses" element={user ? <Layout><ClauseIntelligence /></Layout> : <Navigate to="/login" />} />
        <Route path="/savings" element={user ? <Layout><CostOptimization /></Layout> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <Layout><Reports /></Layout> : <Navigate to="/login" />} />
        <Route path="/billing" element={user ? <Layout><Billing /></Layout> : <Navigate to="/login" />} />
        <Route path="/billing/success" element={user ? <Layout><Billing /></Layout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
        <Route path="/trust" element={user ? <Layout><TrustPanel /></Layout> : <Navigate to="/login" />} />
        <Route path="/upload" element={user ? <Layout><Upload /></Layout> : <Navigate to="/login" />} />
        <Route path="/clients" element={user ? <Layout><Clients /></Layout> : <Navigate to="/login" />} />
        <Route path="/marketplace" element={user ? <Layout><Marketplace /></Layout> : <Navigate to="/login" />} />
        <Route path="/reports/builder" element={user ? <Layout><ReportBuilder /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <Layout><AdminDashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/admin/billing" element={user ? <Layout><AdminBilling /></Layout> : <Navigate to="/login" />} />
        <Route path="/addin" element={<WordTaskpane />} />
        <Route path="/gold-standard" element={<GoldStandard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
