import React, { useState, useEffect, useRef } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { api } from '../utils/api'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
      setUnreadCount(res.count)
    } catch (err) {
      console.warn('Failed to fetch notifications')
    }
  }

  const markAsRead = async (id = null) => {
    try {
      await api.post('/notifications/mark-read', { id })
      if (id) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.warn('Failed to mark notification(s) as read')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs">{unreadCount} New</span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAsRead()} 
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Check size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <Bell size={24} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 transition-colors relative group ${notif.is_read ? 'bg-white dark:bg-slate-900 opacity-70' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      onClick={() => { if (!notif.is_read) markAsRead(notif.id) }}
                    >
                      {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                      <h4 className={`text-sm tracking-tight ${notif.is_read ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-900 dark:text-white font-bold'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                        {notif.link_url && (
                           <Link 
                             to={notif.link_url} 
                             onClick={() => setIsOpen(false)}
                             className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500"
                           >
                             View Details
                           </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
