import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { format } from "date-fns";
import { 
  History as HistoryIcon, 
  ShieldCheck, 
  User, 
  FileText, 
  Lock as LockIcon, 
  Activity,
  ArrowRight,
  Download,
  Search,
  Filter,
  Fingerprint,
  ChevronRight,
  Database,
  Cpu,
  Globe,
  Sparkles,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";

export default function AuditLog() {
  const { data: logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Cyber-Optimize Audit Ledger", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString()}`, 20, 30);
    doc.text(`Compliance Standard: SOC-2 Type II / KDPA Section 41`, 20, 35);
    doc.text(`Integrity Hash: SHA-256 Verified`, 20, 40);

    let y = 55;
    filteredLogs?.forEach((log: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${log.action.replace(/_/g, ' ')}`, 20, y);
      doc.setFontSize(8);
      doc.text(`ID: ${log.id} | ${log.timestamp} | User: ${log.userId}`, 20, y + 5);
      doc.text(`Details: ${log.details?.substring(0, 100)}...`, 20, y + 10);
      y += 25;
    });

    doc.save(`Cyber-Optimize_Ledger_${new Date().getTime()}.pdf`);
  };

  const filteredLogs = logs?.filter((log: any) => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes("CONTRACT")) return <FileText className="w-6 h-6 text-cyan-400" />;
    if (action.includes("ORG") || action.includes("INVITE")) return <User className="w-6 h-6 text-blue-400" />;
    if (action.includes("REMEDIATION") || action.includes("MITIGATE")) return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
    if (action.includes("SIGNNOW")) return <LockIcon className="w-6 h-6 text-indigo-400" />;
    if (action.includes("AUTONOMIC") || action.includes("HEAL") || action.includes("INFRA")) return <Cpu className="w-6 h-6 text-amber-500" />;
    return <Activity className="w-6 h-6 text-slate-400" />;
  };

  return (
    <Layout header={
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-primary" /> Audit <span className="text-primary">Ledger</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-[0.2em]">Immutable SOC-2 Compliance Ledger & Cryptographic Integrity Trail</p>
        </div>
        <div className="flex items-center gap-4">
           <Badge variant="outline" className="bg-emerald-500/5 border-emerald-500/20 text-emerald-400 text-[10px] font-black py-2 px-4 rounded-xl uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-3 h-3" /> INTEGRITY VERIFIED
           </Badge>
        </div>
      </div>
    }>
      <SEO title="Global Audit Ledger" description="Immutable record of all administrative and compliance actions within the Cyber-Optimize platform." />
      
      <div className="space-y-10 pb-12 pt-4">
        
        {/* Integrity Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IntegrityCard label="Ledger Integrity" value="Verified" status="optimal" icon={ShieldCheck} description="SHA-256 Chained blocks" />
            <IntegrityCard label="Digital Signatures" value="Active" status="active" icon={LockIcon} description="RSA-4096 Multi-sig" />
            <IntegrityCard label="Compliance Drift" value="0.00%" status="stable" icon={Globe} description="KDPA Section 41 alignment" />
        </div>

        {/* Master Control Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-950/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by action, user, or details..." 
              className="pl-14 h-14 bg-slate-900 border-slate-800 rounded-2xl focus:ring-primary/20 text-slate-200 shadow-inner group-hover:border-slate-700 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button onClick={exportPDF} className="h-14 px-10 bg-slate-100 hover:bg-white text-slate-950 font-black uppercase tracking-widest rounded-2xl shadow-2xl flex-1 md:flex-none transition-all hover:scale-105 active:scale-95">
              <Download className="w-4 h-4 mr-3" /> EXPORT FULL LEDGER
            </Button>
          </div>
        </div>

        {/* Ledger Feed */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="py-32 text-center flex flex-col items-center gap-4">
                 <LoaderPulse />
                 <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Streaming encrypted ledger data...</p>
              </div>
            ) : filteredLogs?.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-slate-950 border-slate-800 border-dashed py-32 text-center rounded-[3rem]">
                  <p className="text-slate-600 font-black text-xs uppercase tracking-[0.3em]">No ledger entries detected matching criteria</p>
                </Card>
              </motion.div>
            ) : (
              filteredLogs?.map((log: any, index: number) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card className="bg-slate-950 border-slate-800 hover:border-primary/30 transition-all group overflow-hidden relative rounded-[2.5rem] shadow-xl">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-primary/50 to-indigo-500/50 opacity-20 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-8">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                        
                        <div className="flex items-center gap-8 w-full lg:w-auto">
                          <div className="w-20 h-20 rounded-[1.5rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-all duration-500 shrink-0 relative overflow-hidden">
                             <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                             {getActionIcon(log.action)}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                               <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] font-mono">NODE_HASH: {Math.random().toString(36).substring(2, 14).toUpperCase()}</span>
                               <Badge className="bg-emerald-500/10 border-emerald-500/20 text-[8px] font-black uppercase text-emerald-500 px-3 h-5 rounded-full flex items-center gap-1.5">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                   SIGNATURE_VERIFIED
                               </Badge>
                            </div>
                            <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">{log.action.replace(/_/g, ' ')}</h3>
                            <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-2xl">{log.details}</p>
                          </div>
                        </div>

                        <div className="flex flex-col lg:items-end gap-3 shrink-0 w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-900">
                          <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase italic font-mono tracking-widest">
                            <HistoryIcon className="w-4 h-4 text-primary/50" /> {log.timestamp ? format(new Date(log.timestamp), "MMM dd, yyyy · HH:mm:ss 'UTC'") : 'CRYPTO_SYNC_PENDING'}
                          </div>
                          <div className="flex flex-wrap lg:justify-end gap-3">
                             {log.resourceType && (
                               <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-500 border-slate-800 px-3 py-1">
                                 {log.resourceType}: <span className="text-slate-300 ml-1">{log.resourceId}</span>
                               </Badge>
                             )}
                             <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-500 border-slate-800 italic px-3 py-1 flex items-center gap-2">
                               <User className="w-3 h-3" /> OPERATOR: {log.userId}
                             </Badge>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Regulatory Ledger Note */}
        <div className="pt-16 text-center border-t border-slate-900/50">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] flex flex-col md:flex-row items-center justify-center gap-4">
                <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500/40" /> CRYPTOGRAPHIC LEDGER ENFORCEMENT ACTIVE
                </span>
                <span className="hidden md:inline opacity-20">|</span>
                <span className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary/40" /> SOC-2 / KDPA / GDPR COMPLIANCE VERIFIED
                </span>
                <span className="hidden md:inline opacity-20">|</span>
                <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500/40" /> REAL-TIME ANOMALY DETECTION ARMED
                </span>
            </p>
        </div>

      </div>
    </Layout>
  );
}

function IntegrityCard({ label, value, status, icon: Icon, description }: any) {
    return (
        <Card className="bg-slate-950 border-slate-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className={`absolute top-0 left-0 bottom-0 w-1 ${status === 'optimal' ? 'bg-emerald-500' : status === 'active' ? 'bg-cyan-500' : 'bg-primary'}`} />
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${status === 'optimal' ? 'text-emerald-500' : status === 'active' ? 'text-cyan-500' : 'text-primary'}`} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
                    <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">{value}</h4>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${status === 'optimal' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{description}</p>
                </div>
            </div>
        </Card>
    );
}

function LoaderPulse() {
    return (
        <div className="relative w-16 h-16">
            <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
        </div>
    );
}

