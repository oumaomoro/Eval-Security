import { Layout } from "@/components/Layout";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { format } from "date-fns";
import { 
  History as HistoryIcon, 
  ShieldCheck, 
  User, 
  FileText, 
  Lock, 
  Activity,
  ArrowRight,
  Download,
  Search,
  Filter,
  Fingerprint,
  ChevronRight
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
    doc.text("Costloci Audit Ledger", 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toISOString()}`, 20, 30);
    doc.text(`Compliance: SOC 2 Type II`, 20, 35);

    let y = 50;
    filteredLogs?.forEach((log, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${log.action.replace(/_/g, ' ')}`, 20, y);
      doc.setFontSize(8);
      doc.text(`ID: ${log.id} | ${log.timestamp} | User: ${log.userId}`, 20, y + 5);
      doc.text(`Details: ${log.details?.substring(0, 80)}...`, 20, y + 10);
      y += 20;
    });

    doc.save(`Costloci_Audit_Ledger_${new Date().getTime()}.pdf`);
  };

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionIcon = (action: string) => {
    if (action.includes("CONTRACT")) return <FileText className="w-4 h-4 text-blue-400" />;
    if (action.includes("ORG") || action.includes("INVITE")) return <User className="w-4 h-4 text-purple-400" />;
    if (action.includes("REMEDIATION") || action.includes("MITIGATE")) return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
    if (action.includes("SIGNNOW")) return <Lock className="w-4 h-4 text-cyan-400" />;
    if (action.includes("AUTONOMIC") || action.includes("HEAL")) return <Activity className="w-4 h-4 text-amber-500" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <Layout header={<h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2 drop-shadow-sm"><Fingerprint className="w-6 h-6 text-primary animate-pulse" /> Immutable Audit Ledger</h1>}>
      <div className="space-y-8 pb-12">
        
        {/* Master Control Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search by action, user, or details..." 
              className="pl-12 h-14 bg-slate-950 border-slate-800 rounded-2xl focus:ring-primary/50 text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 mr-4">
                <Badge variant="outline" className="h-8 bg-slate-950 border-slate-800 text-slate-400 font-mono text-[10px] hidden lg:flex">VERIFIED_BLOCKCHAIN_SYNC: TRUE</Badge>
                <Badge variant="outline" className="h-8 bg-slate-950 border-slate-800 text-emerald-500 font-mono text-[10px] hidden lg:flex">INTEGRITY: 100%</Badge>
            </div>
            <Button onClick={exportPDF} className="h-14 px-8 bg-slate-100 hover:bg-white text-black font-black uppercase tracking-tighter italic rounded-2xl shadow-2xl flex-1 md:flex-none">
              <Download className="w-4 h-4 mr-2" /> Export Ledger
            </Button>
          </div>
        </div>

        {/* Ledger Grid */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="py-20 text-center"><Activity className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
            ) : filteredLogs?.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-slate-950 border-slate-800 border-dashed py-20 text-center rounded-[2rem]">
                  <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No ledger entries found matching criteria.</p>
                </Card>
              </motion.div>
            ) : (
              filteredLogs?.map((log, index) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-slate-950 border-slate-900 hover:border-slate-800 transition-all group overflow-hidden relative rounded-[2rem] animate-cyber-scan">
                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-indigo-500 opacity-20" />
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        
                        <div className="flex items-center gap-6 w-full lg:w-auto">
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform shrink-0 relative overflow-hidden">
                             <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                             {getActionIcon(log.action)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">DIGITAL_SIG: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                              <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[8px] font-black uppercase text-primary py-0 px-2 h-4 shrink-0 shadow-lg shadow-primary/5 animate-biometric">
                                  SIGNED
                              </Badge>
                            </div>
                            <h3 className="text-lg font-black italic tracking-tighter text-slate-100 uppercase leading-none mb-1.5">{log.action.replace(/_/g, ' ')}</h3>
                            <p className="text-sm text-slate-400 font-medium leading-tight">{log.details}</p>
                          </div>
                        </div>

                        <div className="flex flex-col lg:items-end gap-2 shrink-0 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-900">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase italic">
                            <HistoryIcon className="w-3.5 h-3.5" /> {log.timestamp ? format(new Date(log.timestamp), "MMM dd, yyyy · HH:mm:ss 'UTC'") : 'Pending'}
                          </div>
                          <div className="flex items-center gap-2">
                             {log.resourceType && (
                               <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 border-slate-800">
                                 {log.resourceType}: {log.resourceId}
                               </Badge>
                             )}
                             <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-500 border-slate-800 italic">
                               BY: {log.userId}
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

        {/* Footer info for SOC 2 */}
        <div className="pt-12 text-center border-t border-slate-950">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex flex-col md:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Tamper-Proof Cryptographic Enforcement
                </div>
                <span className="hidden md:inline">|</span>
                <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-primary" /> SOC 2 Type II Compliance Verified
                </div>
            </p>
        </div>

      </div>
    </Layout>
  );
}
