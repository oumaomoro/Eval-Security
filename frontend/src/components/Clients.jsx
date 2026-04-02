import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Building, Phone, PieChart, Info, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', industry: 'Technology', contact_name: '', contact_email: '', contact_phone: '', annual_budget: ''
  });

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.clients || []);
    } catch (err) {
      console.error('Clients fetch error:', err);
      const isMissing = err.response?.data?.code === 'ERR_TABLE_MISSING';
      setError(isMissing ? 'INFRASTRUCTURE_MISSING' : 'Failed to load clients. Check server configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleRepair = () => {
    window.open('https://app.supabase.com', '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setShowModal(false);
      setFormData({ company_name: '', industry: 'Technology', contact_name: '', contact_email: '', contact_phone: '', annual_budget: '' });
      fetchClients();
    } catch (err) { alert(err.message); }
  };

  const removeClient = async (id) => {
    if (!confirm('Are you sure you want to decouple this CRM map? Contracts associated will lose foreign strictness.')) return;
    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Client Matrix...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" /> Client Management
          </h1>
          <p className="text-slate-500 mt-2">Oversee organizational relationships and map contract telemetry precisely per entity.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">
          <Plus size={18} /> New Client
        </button>
      </div>

      {error === 'INFRASTRUCTURE_MISSING' ? (
        <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800/50 rounded-3xl p-10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="text-rose-600 dark:text-rose-400 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Infrastructure Setup Required</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8">
            The Client Management sub-system requires its database infrastructure to be initialized.
            Please apply the <strong>Master Infrastructure Patch</strong> in your Supabase SQL Editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={handleRepair} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-xl transition-all flex items-center gap-2 justify-center">
              Open Supabase Dashboard
            </button>
            <button onClick={() => window.alert('Please copy the content of database/migrations/FINAL_PATCH_v1.3.sql and run it in the Supabase SQL Editor.')} className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 transition-all">
              View SQL Script
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl uppercase font-black text-[10px] tracking-widest">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <Building className="mx-auto w-12 h-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">No active clients bound</h3>
            <p className="text-slate-500 mt-2">Initialize your CRM by adding a corporate entity mapping.</p>
          </div>
        ) : (
          clients.map(client => (
            <div key={client.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent -mr-10 -mt-10 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{client.company_name}</h3>
                  <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {client.industry}
                  </span>
                </div>
                <button onClick={() => removeClient(client.id)} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Info size={16} className="text-slate-400" /> {client.contact_name || 'No POV established'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Mail size={16} className="text-slate-400" /> {client.contact_email || '—'}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Phone size={16} className="text-slate-400" /> {client.contact_phone || '—'}
                </div>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <PieChart size={16} className="text-emerald-500" />
                  <span className="text-xs font-bold text-slate-500">Quarterly Budget Alloc</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">${Number(client.annual_budget || 0).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Register Corporate Entity</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500">Company Name *</label>
                <input required value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mt-1 focus:ring-2 focus:ring-blue-500" placeholder="Acme Global Inc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Industry Sector</label>
                  <select value={formData.industry} onChange={e => setFormData({ ...formData, industry: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mt-1">
                    <option>Technology</option><option>Healthcare</option><option>Financial</option><option>Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Annual Budget ($)</label>
                  <input type="number" value={formData.annual_budget} onChange={e => setFormData({ ...formData, annual_budget: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mt-1" placeholder="100000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Contact Lead</label>
                  <input value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Email Reference</label>
                  <input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none mt-1" />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">Save Mapping</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
