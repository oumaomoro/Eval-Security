import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n.js'
import * as Sentry from '@sentry/react'
import { initSentry, initPostHog } from './utils/analytics.js'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

// Initialize Production Telemetry
initSentry()
initPostHog()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 p-6">
        <div className="max-w-md w-full text-center space-y-4 border border-slate-200 shadow-sm p-8 rounded-2xl bg-white">
          <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
          <p className="text-slate-600">A critical error occurred. Our engineering team has been notified.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 font-medium text-white rounded-xl hover:bg-blue-700 transition">Refresh Page</button>
        </div>
      </div>
    }>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
)
