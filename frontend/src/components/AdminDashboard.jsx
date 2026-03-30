import React, { useState, useEffect } from 'react';
import { Activity, Webhook, MessageSquare, Briefcase, FileSearch, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '../utils/api';

// Reusable Dashboard Card Layout encapsulating Admin lists securely
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('audit');
  const [data, setData] = useState({ logs: [], webhooks: [], feedback: [], partners: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminContext = async () => {
      try {
        const [logsRes, hooksRes, fdkRes, ptrRes] = await Promise.all([
          api.get('/admin/audit-logs'),
          api.get('/admin/webhooks'),
          api.get('/admin/feedback'),
          api.get('/admin/partners')
        ]);
        
        setData({
          logs: logsRes.data.logs || [],
          webhooks: hooksRes.data.webhooks || [],
          feedback: fdkRes.data.metadata || [],
          partners: ptrRes.data.partners || [],
        });
      } catch (err) {
        // Automatically redirects unauthorized accesses inherently via AXIOS interceptors 
        // tracking `403 Access Denied`.
        setError(err.response?.data?.error || "Error fetching Enterprise tables");
      } finally { setLoading(false); }
    };
    fetchAdminContext();
  }, []);

  if (loading) return <div className="p-12 text-center animate-pulse tracking-widest uppercase font-bold text-slate-400">Loading Superuser Matrices...</div>;
  if (error) return <div className="p-12 text-rose-500 font-bold bg-rose-50 m-8 rounded-xl">{error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-rose-600 dark:text-rose-500 flex items-center gap-3 uppercase tracking-tight">
          <ShieldAlert size={28} /> Enterprise Admin Control Matrix
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Restricted Operational Overviews mapping strict telemetry across the SaaS deployment.</p>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
        <button onClick={() => setActiveTab('audit')} className={`py-3 px-6 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'audit' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
          <FileSearch size={16} /> Audit Trails
        </button>
        <button onClick={() => setActiveTab('webhooks')} className={`py-3 px-6 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'webhooks' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
          <Webhook size={16} /> Webhook Events
        </button>
        <button onClick={() => setActiveTab('feedback')} className={`py-3 px-6 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'feedback' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
          <MessageSquare size={16} /> Feedback CRM
        </button>
        <button onClick={() => setActiveTab('partners')} className={`py-3 px-6 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'partners' ? 'border-rose-500 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}>
          <Briefcase size={16} /> Founding Partners
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[500px]">
        {activeTab === 'audit' && (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-950/50"><tr><th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Log ID</th><th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Action Vector</th><th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Executing Profile</th></tr></thead>
            <tbody>
              {data.logs.map((log, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-6 py-4 font-mono text-xs">{log.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-blue-500">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'webhooks' && (
          <div className="p-6">
            {data.webhooks.length === 0 ? <p className="text-slate-500 italic">Zero unhandled webhook crashes detected.</p> : 
              <ul className="space-y-4">
                 {data.webhooks.map((wh, idx) => (
                   <li key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                     <div>
                       <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${wh.provider === 'stripe' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{wh.provider}</span>
                       <span className="ml-3 text-sm font-bold">{wh.event_type}</span>
                     </div>
                     <span className="text-emerald-500 flex items-center gap-1 text-xs font-bold"><CheckCircle2 size={14}/> {wh.processed ? 'Processed' : 'Halted'}</span>
                   </li>
                 ))}
              </ul>
            }
          </div>
        )}

        {/* Dynamic renders for Feedback and Partners mapping directly to Admin DB Arrays */}
        {activeTab === 'feedback' && (
           <div className="p-6">
              {data.feedback.map((fb, idx) => (
                <div key={idx} className="mb-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                   <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{fb.profiles?.email || 'Anonymous'}</span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 rounded-full font-bold">Rating: {fb.rating}/5</span>
                   </div>
                   <p className="text-slate-600 dark:text-slate-400 text-sm">{fb.comments}</p>
                   {fb.feature_request && <span className="mt-3 inline-block text-[10px] uppercase tracking-widest font-black text-rose-500 bg-rose-50 px-2 py-1 rounded">Feature Request Escelation</span>}
                </div>
              ))}
           </div>
        )}

        {activeTab === 'partners' && (
           <div className="p-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.partners.map((ptr, idx) => (
                  <div key={idx} className="flex gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                     <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 uppercase">{ptr.company_name.substring(0,2)}</div>
                     <div>
                       <h3 className="font-bold text-slate-900 dark:text-white">{ptr.company_name}</h3>
                       <p className="text-xs text-slate-500 mt-1">{ptr.contact_email}</p>
                       <div className="mt-4 flex gap-2">
                         <span className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">Rev-Share: {ptr.discount_percent}%</span>
                         {ptr.case_study_approved && <span className="px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 font-bold text-[10px] uppercase">Public Reference Valid</span>}
                       </div>
                     </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
