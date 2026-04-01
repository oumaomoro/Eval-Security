import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, ShieldCheck, DollarSign, Star, ArrowRight, CheckCircle, Lock, Crown, PlusCircle } from 'lucide-react';
import { supabase } from '../contexts/AuthContext';
import BrandingConfig from '../config/branding';

const CATEGORIES = ['data_protection', 'liability', 'termination', 'sla', 'security', 'audit', 'confidentiality', 'other'];

export default function Marketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isSelling, setIsSelling] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [category]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from('marketplace_items').select('*').eq('status', 'active');
    
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query.order('sales_count', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  const handlePurchase = async (itemId) => {
     // TODO: Implement Stripe Checkout session here
     alert('Redirecting to secure manual payout checkout...');
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Hero Section */}
      <div className="relative border-b border-white/5 py-24 px-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Crown size={14} /> Premium Clause Marketplace
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-6 uppercase italic">
              Monetize Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Legal Intelligence</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-lg font-inter">
              The world's first decentralized marketplace for enterprise-grade cybersecurity clauses. Buy premium templates or sell your own.
            </p>
            <div className="flex flex-wrap gap-4 mt-10 justify-center md:justify-start">
              <button className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-cyan-500/20 transition-all font-inter">
                 Browse Premium Library <ArrowRight size={18} />
              </button>
              <button onClick={() => setIsSelling(true)} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold border border-white/5 transition-all font-inter">
                 Become a Seller (30% Commission)
              </button>
            </div>
          </div>

          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-slate-900 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold">C</div>
                  <span className="font-bold text-slate-200">Cyber Resilience v2</span>
                </div>
                <div className="text-xl font-black text-cyan-400">$49.00</div>
              </div>
              <div className="space-y-3 mb-6">
                <p className="text-xs text-slate-400 italic">"Includes state-level breach notification protocols for Nigerian NDPR & Kenya KDPA."</p>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle size={12} /> Verified by Costloci Legal
                </div>
              </div>
              <button className="w-full py-3 bg-white text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-cyan-400 transition-colors">
                Quick Buy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog */}
      <div className="max-w-7xl mx-auto p-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
           <div className="flex-1 w-full relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input
               type="text"
               placeholder="Search by vendor, regulation, or keyword..."
               className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-12 py-4 focus:ring-2 focus:ring-cyan-500 outline-none transition-all text-slate-200 font-inter"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-3">
             <Filter className="text-slate-500" size={18} />
             <select 
               className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-400 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer font-inter uppercase tracking-wide"
               value={category}
               onChange={(e) => setCategory(e.target.value)}
             >
               <option value="all">Every Category</option>
               {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat.replace('_',' ')}</option>)}
             </select>
           </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900 animate-pulse rounded-3xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map(item => (
              <div key={item.id} className="group bg-slate-900 border border-white/5 rounded-3xl p-6 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                    {item.category.replace('_',' ')}
                  </div>
                  <div className="text-xl font-black text-white">${item.price}</div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-200 mb-3 group-hover:text-cyan-400 transition-colors font-inter uppercase tracking-tight">{item.name}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6 font-inter leading-relaxed">{item.description}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-500">
                      {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= Math.round(item.rating) ? 'currentColor' : 'none'} />)}
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.sales_count} Sales</span>
                  </div>
                  <button 
                    onClick={() => handlePurchase(item.id)}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-cyan-400 hover:text-white transition-colors"
                  >
                    View & Purchase <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-900 rounded-3xl">
             <ShoppingCart size={48} className="mx-auto text-slate-800 mb-4" />
             <h3 className="text-xl font-bold text-slate-400">No premium clauses found</h3>
             <p className="text-slate-600 mt-2">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>

      {/* Seller Promo */}
      <div className="bg-slate-900 py-16 px-10 text-center border-t border-white/5">
         <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4 font-inter uppercase">Are you a legal expert?</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto font-inter">Host your battle-tested cybersecurity clause templates on Costloci and earn passive revenue on every sale. We handle everything from indexing to secure delivery.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-10 font-inter">
               <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl">
                  <div className="text-cyan-400 font-black text-2xl mb-2">70%</div>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Seller Payout</p>
               </div>
               <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl">
                  <div className="text-rose-500 font-black text-2xl mb-2">30%</div>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Platform Fee</p>
               </div>
               <div className="p-6 bg-slate-950 border border-white/5 rounded-2xl">
                  <div className="text-emerald-400 font-black text-2xl mb-2">Instant</div>
                  <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Global Exposure</p>
               </div>
            </div>
            <button className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-cyan-400 transition-colors flex items-center gap-2 mx-auto">
              <PlusCircle size={18} /> Apply to be a Seller
            </button>
         </div>
      </div>
    </div>
  );
}
