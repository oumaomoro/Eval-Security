import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { Shield, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

export default function Webhooks() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      // Ensure only admins can fetch this due to RLS
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to fetch webhooks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id) => {
    // Simulated retry logic
    const { error } = await supabase
      .from('webhook_events')
      .update({ processed: true, error: null, processed_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchWebhooks();
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white flex items-center gap-3">
            <Shield className="text-blue-500" />
            Webhook Monitoring
          </h1>
          <p className="text-slate-500 mt-2">Audit trail and diagnostics for payment gateways.</p>
        </div>
        <button onClick={fetchWebhooks} className="p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800">
          <RefreshCw size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 uppercase text-xs tracking-wider text-slate-500 font-semibold">
              <th className="p-4">Provider / Event</th>
              <th className="p-4">Time</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {events.map(ev => (
              <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4">
                  <span className="font-semibold capitalize text-sm dark:text-white">{ev.provider}</span>
                  <div className="text-xs text-slate-500 font-mono mt-1">{ev.event_type}</div>
                </td>
                <td className="p-4">
                  <div className="text-sm dark:text-white flex items-center gap-2">
                    <Clock size={14} className="text-slate-400" />
                    {new Date(ev.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="p-4">
                  {ev.processed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400">
                      <CheckCircle size={14} /> Processed
                    </span>
                  ) : ev.error ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
                      <AlertTriangle size={14} /> Failed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400">
                      <Clock size={14} /> Pending
                    </span>
                  )}
                  {ev.error && <p className="text-[10px] text-red-500 mt-2 max-w-xs truncate" title={ev.error}>{ev.error}</p>}
                </td>
                <td className="p-4">
                  {!ev.processed && (
                    <button 
                      onClick={() => handleRetry(ev.id)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">
                  No webhook events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
