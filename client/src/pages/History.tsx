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
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

export default function History() {
  const { data: logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");

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
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  return (
    <Layout header={<h1 className="text-2xl font-black uppercase tracking-tighter italic">Governance Audit Ledger</h1>}>
      <div className="space-y-8 pb-12">
        
        {/* Master Control Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input 
              placeholder="Search immutable ledger..." 
              className="pl-12 h-14 bg-slate-900/50 border-slate-800 rounded-2xl focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button variant="outline" className="h-14 px-6 bg-slate-900 border-slate-800 rounded-2xl flex-1 md:flex-none">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <Button className="h-14 px-8 bg-slate-100 hover:bg-white text-black font-black uppercase tracking-tighter italic rounded-2xl shadow-xl flex-1 md:flex-none">
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
          </div>
        </div>

        {/* Ledger Grid */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="py-20 text-center"><Activity className="w-8 h-8 animate-spin mx-auto text-primary" /></div>
          ) : filteredLogs?.length === 0 ? (
            <Card className="bg-slate-950 border-slate-800 border-dashed py-20 text-center">
              <p className="text-slate-500 font-bold font-semibold text-xs">No ledger entries found matching criteria.</p>
            </Card>
          ) : (
            filteredLogs?.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-950 border-slate-900 hover:border-slate-800 transition-all group overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-indigo-500 opacity-20" />
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                      
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-slate-500 font-semibold">TX-ID: {log.id.toString().padStart(6, '0')}</span>
                            <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[8px] font-black uppercase text-primary py-0 px-2 h-4 shrink-0">
                                PERSISTENT
                            </Badge>
                          </div>
                          <h3 className="text-lg font-black italic tracking-tight text-slate-100 uppercase">{log.action.replace(/_/g, ' ')}</h3>
                          <p className="text-sm text-slate-400 font-medium mt-1">{log.details}</p>
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase italic">
                          <HistoryIcon className="w-3 h-3" /> {log.timestamp ? format(new Date(log.timestamp), "MMM dd, yyyy · HH:mm:ss 'UTC'") : 'Pending'}
                        </div>
                        <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 border-slate-800">
                             {log.resourceType}: {log.resourceId}
                           </Badge>
                           <Badge variant="secondary" className="bg-slate-900 text-[9px] font-black uppercase text-slate-500 border-slate-800 italic">
                             ID: {log.userId}
                           </Badge>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer info for SOC 2 */}
        <div className="pt-12 text-center border-t border-slate-900">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> This ledger is cryptographically enforced and immutable. All governance actions are logged for SOC 2 Type II compliance.
            </p>
        </div>

      </div>
    </Layout>
  );
}
