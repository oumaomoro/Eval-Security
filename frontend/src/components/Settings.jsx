import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Zap, Link as LinkIcon, Lock, Slack, CheckCircle, Palette, Download, ShieldCheck, Archive } from 'lucide-react'
import { api } from '../utils/api'
import { useAuth, supabase } from '../contexts/AuthContext'

export default function Settings() {
  const [integrations, setIntegrations] = useState([
    { id: 'docusign', name: 'DocuSign', desc: 'Automatically import signed DPAs and MSAs.', status: 'loading', icon: '📝' },
    { id: 'slack', name: 'Slack', desc: 'Receive real-time risk alerts in your channels.', status: 'loading', icon: '💬' },
    { id: 'jira', name: 'Atlassian Jira', desc: 'One-click ticket generation for mitigation workflows.', status: 'loading', icon: '🎫' },
    { id: 'ironclad', name: 'Ironclad', desc: 'Sync clause libraries across your legal team.', status: 'loading', icon: '⚖️' }
  ])
  const { user, refreshUser } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  
  const [branding, setBranding] = useState({
    logoUrl: user?.user_metadata?.branding_config?.logoUrl || '',
    primaryColor: user?.user_metadata?.branding_config?.primaryColor || '#2563eb',
    companyName: user?.user_metadata?.company_name || 'Costloci Partner',
    ip_rights_holder: user?.user_metadata?.branding_config?.ip_rights_holder || 'Costloci Partner',
    watermark_enabled: user?.user_metadata?.branding_config?.watermark_enabled || false,
    watermark_text: user?.user_metadata?.branding_config?.watermark_text || 'CONFIDENTIAL'
  });

  const [globalProfile, setGlobalProfile] = useState({
    sector: user?.user_metadata?.global_profile?.sector || 'general',
    jurisdiction: user?.user_metadata?.global_profile?.jurisdiction || 'global',
    target_language: user?.user_metadata?.global_profile?.target_language || 'en'
  });

  const [regionCode, setRegionCode] = useState('KE');

  const [apiAccess, setApiAccess] = useState(false);
  const [apiKey, setApiKey] = useState('');
  
  const navigate = useNavigate();

  const [webhookUrl, setWebhookUrl] = useState(user?.user_metadata?.webhook_url || '');
  const [signnowToken, setSignnowToken] = useState(user?.user_metadata?.signnow_token || '');

  const handleSaveWebhook = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          webhook_url: webhookUrl,
          signnow_token: signnowToken 
        }
      });
      if (error) throw error;
      await refreshUser();
      alert('Integration configuration saved successfully.');
    } catch (err) {
      alert('Error updating integrations: ' + err.message);
    }
  };

  const handleSaveBranding = async () => {
    try {
      setIsSavingBranding(true);
      const { error } = await supabase.auth.updateUser({
        data: { 
          branding_config: branding,
          global_profile: globalProfile,
          company_name: branding.companyName 
        }
      });
      if (error) throw error;
      
      // Phase 2: Save Region Code to public.profiles
      await supabase.from('profiles').update({ region_code: regionCode }).eq('id', user?.id);
      
      await refreshUser();
      alert('Branding updated successfully across your workspace.');
    } catch (err) {
      console.error('Failed to save branding:', err);
      alert('Error updating branding: ' + err.message);
    } finally {
      setIsSavingBranding(false);
    }
  };

  useEffect(() => {
    const fetchRegion = async () => {
      try {
        if (user?.id) {
        if (user?.id) {
          const { data } = await supabase.from('profiles').select('region_code, api_access, api_key').eq('id', user.id).single();
          if (data) {
             if (data.region_code) setRegionCode(data.region_code);
             if (data.api_access) setApiAccess(data.api_access);
             if (data.api_key) setApiKey(data.api_key);
          }
        }
        }
      } catch (err) {}
    };
    fetchRegion();

    const handleIntegrations = async () => {
      try {
        // 1. Check if returning from an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');

        if (code && state) {
          // Clear URL to prevent re-triggering on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          await api.post('/integrations/callback', { code, state });
        }

        // 2. Fetch current integration status
        const res = await api.get('/integrations');
        const activeTokens = res.integrations || {};

        setIntegrations(ints => ints.map(int => ({
          ...int,
          status: activeTokens[int.id] ? 'connected' : 'disconnected'
        })));
      } catch (error) {
        console.error('Integration sync failed:', error);
        setIntegrations(ints => ints.map(int => ({ ...int, status: 'disconnected' })));
      } finally {
        setIsInitializing(false);
      }
    };

    handleIntegrations();
  }, []);

  const toggleIntegration = async (id) => {
    const target = integrations.find(i => i.id === id);
    if (!target) return;

    if (target.status === 'connected') {
      // Disconnect
      setIntegrations(ints => ints.map(int => int.id === id ? { ...int, status: 'loading' } : int));
      try {
        await api.get(`/integrations/${id}`, { method: 'DELETE' }); // api wrapper uses standard GET/POST. Oh wait, my wrapper doesn't support DELETE directly.
        await fetch(`${import.meta.env.VITE_API_URL}/integrations/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('costloci_token')}` }
        });
        setIntegrations(ints => ints.map(int => int.id === id ? { ...int, status: 'disconnected' } : int));
      } catch (err) {
        setIntegrations(ints => ints.map(int => int.id === id ? { ...int, status: 'connected' } : int));
      }
    } else {
      // Connect (Redirect to OAuth)
      setIntegrations(ints => ints.map(int => int.id === id ? { ...int, status: 'loading' } : int));
      try {
        const res = await api.get(`/integrations/${id}/auth-url`);
        if (res.auth_url) {
          window.location.href = res.auth_url;
        } else {
          throw new Error('No auth URL returned');
        }
      } catch (err) {
        console.error('Failed to init OAuth:', err);
        setIntegrations(ints => ints.map(int => int.id === id ? { ...int, status: 'disconnected' } : int));
      }
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 border-b border-slate-200 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-slate-400" size={28}/> Workspace Settings
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your team, profile, and active integrations.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon size={20} className="text-blue-600"/> Connected Integrations
          </h2>
          <p className="text-sm text-slate-500 mt-1">Boost automation by syncing Costloci with your existing security stack.</p>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30">
          {integrations.map(int => (
            <div key={int.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {int.icon}
                </div>
                <button 
                  onClick={() => toggleIntegration(int.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    int.status === 'connected' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                      : int.status === 'loading'
                      ? 'bg-slate-100 text-slate-500 cursor-wait'
                      : 'bg-slate-900 text-white hover:bg-blue-600 shadow-md'
                  }`}
                >
                  {int.status === 'connected' ? <><CheckCircle size={14}/> Connected</> : int.status === 'loading' ? 'Authenticating...' : 'Connect App'}
                </button>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{int.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{int.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Palette size={20} className="text-indigo-600"/> MSP White-Labeling <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full ml-1">Enterprise</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">Customize the platform and PDF reports with your own agency branding.</p>
          </div>
          <button 
            onClick={handleSaveBranding}
            disabled={isSavingBranding}
            className="px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold text-sm transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {isSavingBranding ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Company Logo URL</label>
            <input 
              type="text" 
              value={branding.logoUrl}
              onChange={e => setBranding({...branding, logoUrl: e.target.value})}
              placeholder="https://yourcompany.com/logo.png" 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">Will be displayed on the top left of all generated PDF reports.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Brand Color</label>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <input 
                  type="color" 
                  value={branding.primaryColor}
                  onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                  className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent absolute inset-0 opacity-0 z-10"
                />
                <div 
                  className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm"
                  style={{ backgroundColor: branding.primaryColor }}
                ></div>
              </div>
              <input 
                type="text" 
                value={branding.primaryColor}
                onChange={e => setBranding({...branding, primaryColor: e.target.value})}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Used for buttons, highlights, and report headers.</p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Legal IP Rights Holder</label>
              <input 
                type="text" 
                value={branding.ip_rights_holder}
                onChange={e => setBranding({...branding, ip_rights_holder: e.target.value})}
                placeholder="e.g. Acme Corp Law Firm" 
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-2 italic">This name will appear on the footer of all generated PDF reports.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2 font-bold flex items-center gap-2">
                Future-Proof Watermarking {branding.watermark_enabled && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
              </label>
              <div className="flex gap-4 items-center mb-2">
                <button 
                  onClick={() => setBranding({...branding, watermark_enabled: !branding.watermark_enabled})}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${branding.watermark_enabled ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}
                >
                  {branding.watermark_enabled ? 'Watermark: ON' : 'Watermark: OFF'}
                </button>
                {branding.watermark_enabled && (
                  <input 
                    type="text" 
                    value={branding.watermark_text}
                    onChange={e => setBranding({...branding, watermark_text: e.target.value})}
                    placeholder="CONFIDENTIAL" 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                )}
              </div>
              <p className="text-xs text-slate-500">Adds an immutable text watermark to every page of the analysis report.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-600"/> Global Compliance Profile
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure your organization's primary industry and legal jurisdiction for hyper-accurate AI analysis.</p>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/30">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Industry Sector</label>
            <select 
              value={globalProfile.sector}
              onChange={e => setGlobalProfile({...globalProfile, sector: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="general">General Corporate</option>
              <option value="healthcare">Healthcare (HIPAA/HITECH)</option>
              <option value="fintech">Financial Services (FinTech/Banking)</option>
              <option value="saas">Software as a Service (SaaS)</option>
              <option value="government">Government & Defense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Primary Jurisdiction</label>
            <select 
              value={globalProfile.jurisdiction}
              onChange={e => setGlobalProfile({...globalProfile, jurisdiction: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="global">Global (General Standards)</option>
              <option value="GDPR">European Union (GDPR)</option>
              <option value="CCPA">United States - California (CCPA/CPRA)</option>
              <option value="UK">United Kingdom (UK GDPR)</option>
              <option value="USA-NY">United States - New York (DFS 500)</option>
            </select>
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Regional Compliance Framework <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded ml-2 uppercase">Deep Scan</span></label>
            <select 
              value={regionCode}
              onChange={e => setRegionCode(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="KE">Kenya (KDPA, CBK, IRA, CMA)</option>
              <option value="NG">Nigeria (NDPR)</option>
              <option value="EG">Egypt (PDPL)</option>
              <option value="AE">UAE (UAE Data Law)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">Executive Reports will dynamically pivot to focus on these regional frameworks.</p>
          </div>

          <div className="md:col-span-2 border-t border-slate-100 pt-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">Output Target Language <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded ml-2 uppercase">AI Multi-Lang</span></label>
            <select 
              value={globalProfile.target_language}
              onChange={e => setGlobalProfile({...globalProfile, target_language: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="English">English</option>
              <option value="French">French (Français)</option>
              <option value="Arabic">Arabic (العربية)</option>
              <option value="Swahili">Swahili (Kiswahili)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="German">German (Deutsch)</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">All verbatim extracts, summaries, and AI redlines will be seamlessly translated into this language.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Security & Privacy</h3>
          <p className="text-sm text-slate-500 mb-6">Costloci maintains strict data isolation boundaries. Your contracts are never used to train generalized AI models without explicit opt-in.</p>
          <div className="space-y-3">
            <button className="px-5 py-2.5 bg-slate-100 font-semibold text-slate-600 text-sm rounded-xl w-full hover:bg-slate-200 transition-colors">View Audit Logs</button>
            <div className="pt-4 border-t border-slate-100">
               <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                 <Archive size={16} className="text-blue-600" /> Data Portability (Audit Pack)
               </h4>
               <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                 Generate a consolidated ZIP archive containing all original PDFs and full metadata logs for regulator audits (IRA, CMA, KDPA).
               </p>
               <button 
                 onClick={() => {
                   const token = localStorage.getItem('costloci_token');
                   const url = `${import.meta.env.VITE_API_URL}/reports/export/audit-pack`;
                   window.open(url + `?token=${token}`, '_blank');
                 }}
                 className="px-5 py-2.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl w-full border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
               >
                 <Download size={14} /> Download Strategic Audit Pack (.zip)
               </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl border border-slate-800 shadow-xl shadow-blue-900/10 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-300 mb-6 relative z-10 backdrop-blur-sm">
            <Zap size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 relative z-10">API Access & Integrations</h3>
          <p className="text-sm text-blue-200 mb-4 relative z-10">Configure real-time event webhooks and global digital signature gateways.</p>
          
          <div className="relative z-10 mb-6 pb-6 border-b border-white/10">
            <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
               <ShieldCheck size={16} className="text-blue-400" /> Programmatic API Access
            </h4>
            {apiAccess ? (
              <div>
                <p className="text-xs text-blue-200 mb-3">Your API key provides unrestricted access to the <code>/api/external/analyze</code> endpoint.</p>
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    readOnly
                    value={apiKey || '********************************'}
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white outline-none font-mono text-xs opacity-70"
                  />
                  <button 
                    onClick={() => { navigator.clipboard.writeText(apiKey); alert('Copied!'); }}
                    className="px-4 py-2.5 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 rounded-xl font-bold text-xs transition-all border border-emerald-500/30"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={async () => {
                       const confirmRegen = window.confirm("Regenerate API Key? Existing integrations will immediately break.");
                       if (confirmRegen) {
                         try {
                           const res = await api.post('/auth/regenerate-api-key');
                           if(res?.api_key) setApiKey(res.api_key);
                         } catch(e) { alert('Failed to regenerate: ' + e.message) }
                       }
                    }}
                    className="px-4 py-2.5 bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 rounded-xl font-bold text-xs transition-all border border-rose-500/30"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div>
                   <h5 className="text-sm font-bold text-white mb-1">Get API Access for $299/mo</h5>
                   <p className="text-xs text-blue-200">Unlock programmatic endpoints for your custom internal systems.</p>
                 </div>
                 <button 
                   onClick={() => navigate('/billing?plan=api')}
                   className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-900/50 flex flex-shrink-0"
                 >
                   Subscribe
                 </button>
              </div>
            )}
          </div>

          <div className="relative z-10 mb-4">
            <label className="block text-xs font-semibold text-blue-300 mb-2">Contract Analyzed Webhook URL</label>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white/20 transition-all font-mono text-xs"
            />
          </div>

          <div className="relative z-10 mb-6">
            <label className="block text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1">SignNow API Token <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase">E-Signature</span></label>
            <input 
              type="password" 
              value={signnowToken}
              onChange={e => setSignnowToken(e.target.value)}
              placeholder="Bearer Token (e.g. 1ee4d1313f0940c9523a5...)"
              className="w-full px-4 py-3 bg-white/10 border border-emerald-500/30 rounded-xl text-white placeholder-emerald-300/30 outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-emerald-900/30 transition-all font-mono text-xs"
            />
          </div>

          <button onClick={handleSaveWebhook} className="px-5 py-3 bg-blue-600 hover:bg-blue-500 font-bold text-white text-sm rounded-xl w-full transition-colors relative z-10">Save Integrations Config</button>
        </div>
      </div>
    </div>
  )
}
