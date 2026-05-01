import { Layout } from "@/components/Layout";
import { useComplianceAudits, useRunAudit, useRemediationSuggestions, useAcceptRemediation, useDismissRemediation } from "@/hooks/use-compliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  Shield, 
  Zap, 
  History as HistoryIcon, 
  Globe, 
  ArrowRight, 
  FileText, 
  Clock, 
  Trash2,
  Activity,
  Settings2,
  Plus,
  Cpu,
  Fingerprint,
  Scale
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExecutiveSummary } from "@/components/Intelligence/ExecutiveSummary";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { SEO } from "@/components/SEO";
import { AutonomicJurisdictionSync } from "@/components/Intelligence/AutonomicJurisdictionSync";
import { useMonitoringConfigs, useCreateMonitoringConfig, useUpdateMonitoringConfig, useDeleteMonitoringConfig } from "@/hooks/use-monitoring";
import { useClients } from "@/hooks/use-clients";
import { useAuditRulesets } from "@/hooks/use-rulesets";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContinuousMonitoringSchema } from "@shared/schema";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function Compliance() {
  const { data: audits, isLoading } = useComplianceAudits();
  const { data: stats } = useDashboardStats();
  const { data: monitoringConfigs, isLoading: isMonitoringLoading } = useMonitoringConfigs();
  const { data: clients } = useClients();
  const { data: rulesets } = useAuditRulesets();
  
  const { mutate: runAudit, isPending: isRunning } = useRunAudit();
  const { mutate: createMonitoring } = useCreateMonitoringConfig();
  const { mutate: updateMonitoring } = useUpdateMonitoringConfig();
  const { mutate: deleteMonitoring } = useDeleteMonitoringConfig();
  const { data: suggestions, isLoading: isSuggestionsLoading } = useRemediationSuggestions();
  const { mutate: acceptRemediation } = useAcceptRemediation();
  const { mutate: dismissRemediation } = useDismissRemediation();

  const form = useForm({
    resolver: zodResolver(insertContinuousMonitoringSchema),
    defaultValues: {
      clientId: 0,
      rulesetId: 0,
      frequencyDays: 7,
      isActive: true
    }
  });

  const handleRunAudit = () => {
    runAudit({ scope: { contractIds: [], standards: ["KDPA", "CBK", "GDPR", "ISO27001", "IRA Kenya 2025"], categories: [] } });
  };

  const onMonitoringSubmit = (data: z.infer<typeof insertContinuousMonitoringSchema>) => {
    createMonitoring(data);
  };

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Governance Hub
          </h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sovereign Jurisdictional Intelligence & Audit Monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 px-6 rounded-2xl bg-slate-950 border-slate-800 hover:bg-slate-900 text-xs font-black uppercase tracking-widest gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Board Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto p-0 rounded-[2.5rem] border-none shadow-2xl bg-slate-950">
                {stats && (
                    <ExecutiveSummary 
                        stats={{
                            ...stats,
                            risksMitigated: stats.userMetrics?.risksMitigated || 0,
                            timeSavedHours: stats.userMetrics?.timeSavedHours || 0
                        }} 
                    />
                )}
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleRunAudit} 
            disabled={isRunning} 
            className="h-12 px-8 rounded-2xl bg-slate-100 hover:bg-white text-slate-950 font-black uppercase tracking-tighter italic gap-2 shadow-xl shadow-primary/10"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            {isRunning ? "PROCESSING..." : "RUN GLOBAL AUDIT"}
          </Button>
        </div>
      </div>
    }>
      <SEO title="Governance Hub" description="Monitor regulatory updates and enterprise compliance posture." />
      
      <div className="space-y-10 pb-12">
        {/* Autonomic Intelligence Hub */}
        <AutonomicJurisdictionSync />

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={CheckCircle} label="Aggregated Compliance" value="91.2%" color="text-emerald-500" trend="+1.4%" />
          <StatCard icon={AlertCircle} label="Jurisdiction Risk" value="Optimal" color="text-emerald-400" trend="Safe" />
          <StatCard icon={Shield} label="Operator Verification" value="100%" color="text-blue-500" trend="DPO+" />
          <StatCard icon={Zap} label="Policy Drift" value="0.02%" color="text-primary" trend="Nominal" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* DPO Registration Tracker */}
            <Card className="lg:col-span-4 bg-slate-950 border-slate-800 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col group">
                <CardHeader className="pb-4 border-b border-slate-900">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Multi-Regional DPO Matrix
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <div className="divide-y divide-slate-900">
                        <DPOItem vendor="Apex Cloud Infrastructure" status="registered" expiry="Dec 2026" region="KE" />
                        <DPOItem vendor="SafePay Sovereign" status="pending" expiry="RENEWAL REQ" region="NG" />
                        <DPOItem vendor="Global SCM Hub" status="missing" expiry="ACTION REQ" region="KSA" />
                        <DPOItem vendor="Infrastruct Grid" status="registered" expiry="July 2025" region="SA" />
                    </div>
                </CardContent>
            </Card>

            {/* Audit History */}
            <Card className="lg:col-span-8 bg-slate-950 border-slate-800 shadow-2xl rounded-[2.5rem] flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Activity className="w-24 h-24" />
                </div>
                <CardHeader className="pb-4 border-b border-slate-900">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4 text-primary" /> Immutable Audit Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[480px] overflow-y-auto flex-1 scrollbar-hide">
                    {isLoading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div> : (
                        <div className="divide-y divide-slate-900">
                        {(!audits || audits.length === 0) && (
                          <div className="p-12 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">No audit history found in local node.</div>
                        )}
                        {audits?.map((audit, idx) => (
                          <motion.div 
                            key={audit.id} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 hover:bg-slate-900/40 transition-all group relative overflow-hidden"
                          >
                            <div className="flex justify-between items-start relative z-10">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                   <Badge variant="outline" className="bg-slate-900 border-slate-800 text-[8px] font-black uppercase text-primary py-0 px-2 h-4">{audit.auditType || 'SYSTEM'}</Badge>
                                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">ID: {audit.id?.toString().padStart(6, '0')}</span>
                                </div>
                                <h3 className="font-black text-xl text-slate-100 uppercase tracking-tighter italic">{audit.auditName}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                                  <Clock className="w-3.5 h-3.5" /> {audit.createdAt ? format(new Date(audit.createdAt), "PPP · HH:mm:ss 'UTC'") : "Sync Pending"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-3xl font-black italic tracking-tighter ${Number(audit.overallComplianceScore) > 85 ? 'text-emerald-500' : 'text-primary'}`}>{audit.overallComplianceScore}%</div>
                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1">Audit Score</div>
                              </div>
                            </div>
                            
                            {audit.complianceByStandard && (
                              <div className="flex flex-wrap gap-2 mt-6">
                                {Object.entries(audit.complianceByStandard).map(([std, score]) => (
                                  <div key={std} className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[9px] flex items-center gap-3 group/std hover:border-primary/30 transition-colors">
                                    <span className="font-black text-slate-500 uppercase tracking-widest">{std}</span>
                                    <div className="w-[2px] h-3 bg-slate-800" />
                                    <span className={`font-black ${Number(score) < 80 ? 'text-rose-500' : 'text-emerald-400'}`}>{score}%</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* AI Remediation Insights */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-100 flex items-center gap-3">
                        <Cpu className="w-6 h-6 text-primary" /> AI Remediation Insights
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Self-Healing Compliance Recommendations</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {isSuggestionsLoading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="h-48 rounded-[2rem] bg-slate-900/50 animate-pulse border border-slate-800" />
                        ))
                    ) : (!suggestions || (suggestions as any[]).filter((s: any) => s.status === 'pending').length === 0) ? (
                        <Card className="col-span-full bg-slate-950 border-slate-800 p-12 text-center rounded-[2rem]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Optimal: No pending remediation tasks detected.</p>
                        </Card>
                    ) : (
                        (suggestions as any[]).filter((s: any) => s.status === 'pending').map((suggestion: any) => (
                            <RemediationSuggestionItem 
                                key={suggestion.id}
                                suggestion={suggestion}
                                onAccept={() => acceptRemediation(suggestion.id)}
                                onDismiss={() => dismissRemediation(suggestion.id)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>

        {/* Continuous Monitoring Section */}
        <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-100 flex items-center gap-3">
                        <Cpu className="w-6 h-6 text-primary" /> Autonomous Monitoring Pipelines
                    </h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scheduled Real-time Jurisdictional Tracking</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-8 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-black uppercase text-xs tracking-widest gap-2">
                            <Plus className="w-4 h-4" /> Create Pipeline
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[2.5rem] border-slate-800 shadow-2xl bg-slate-950 p-8">
                        <DialogHeader className="pb-4">
                            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                                <Plus className="w-6 h-6 text-primary" /> New Monitoring <span className="text-primary">Node</span>
                            </DialogTitle>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Configure autonomic compliance pulse</p>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onMonitoringSubmit)} className="space-y-6 pt-4">
                                <FormField
                                    control={form.control}
                                    name="clientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Infrastructure/Vendor</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-800 h-12 bg-slate-900 focus:ring-primary/20">
                                                        <SelectValue placeholder="Select target entity" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-950 border-slate-800">
                                                    {clients?.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>{c.companyName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="rulesetId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Compliance Ruleset Protocol</FormLabel>
                                            <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-slate-800 h-12 bg-slate-900 focus:ring-primary/20">
                                                        <SelectValue placeholder="Select ruleset protocol" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-slate-950 border-slate-800">
                                                    {rulesets?.map((r) => (
                                                        <SelectItem key={r.id} value={r.id.toString()}>{r.name} ({r.standard})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="frequencyDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Frequency (Days)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="number" 
                                                        {...field} 
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value))}
                                                        className="h-12 bg-slate-900 border-slate-800 rounded-xl focus:border-primary/50 text-slate-200"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="isActive"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col justify-end pb-3">
                                                <div className="flex items-center gap-3">
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                    <FormLabel className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0 cursor-pointer">Active Node</FormLabel>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full rounded-2xl h-14 bg-slate-100 hover:bg-white text-slate-950 font-black uppercase tracking-widest shadow-xl">Deploy Autonomous Monitor</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-slate-950 border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden border-b-4 border-b-primary/20">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="border-slate-800 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8 h-14">Infrastructure Target</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8">Standard protocol</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8 text-center">Frequency</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8 text-center">Next Run</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8 text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-8 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isMonitoringLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : monitoringConfigs?.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">No active monitoring pipelines detected in grid.</TableCell></TableRow>
                        ) : (
                            monitoringConfigs?.map((config) => {
                                const client = clients?.find((c) => c.id === config.clientId);
                                const ruleset = rulesets?.find((r) => r.id === config.rulesetId);
                                return (
                                    <TableRow key={config.id} className="border-slate-900 hover:bg-slate-900/30 transition-colors">
                                        <TableCell className="px-8 py-6">
                                           <div className="flex flex-col">
                                             <span className="font-black text-slate-100 uppercase tracking-tight">{client?.companyName || 'Undefined_Entity'}</span>
                                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">UID: {config.id?.toString().padStart(4, '0')}</span>
                                           </div>
                                        </TableCell>
                                        <TableCell className="px-8">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5 px-3 h-6">
                                                {ruleset?.standard || 'CUSTOM_PROTOCOL'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 text-center font-black text-slate-400 text-[10px] uppercase">Every {config.frequencyDays}D</TableCell>
                                        <TableCell className="px-8 text-center font-black text-slate-500 text-[10px] uppercase italic">
                                            {config.nextRun ? format(new Date(config.nextRun), "MMM dd, yyyy") : 'UNSCHEDULED'}
                                        </TableCell>
                                        <TableCell className="px-8 text-center">
                                            <Badge className={config.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black text-[9px]" : "bg-slate-900 text-slate-600 border-slate-800 font-black text-[9px]"}>
                                                {config.isActive ? 'OPERATIONAL' : 'OFFLINE'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Switch 
                                                    checked={!!config.isActive} 
                                                    onCheckedChange={(v) => updateMonitoring({ id: config.id, updates: { isActive: v } })} 
                                                />
                                                 <Button 
                                                     variant="outline" 
                                                     size="icon" 
                                                     className="h-9 w-9 rounded-xl bg-slate-900 border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/30"
                                                     onClick={() => {
                                                         if (window.confirm("CRITICAL: Terminate monitoring pipeline?")) {
                                                             deleteMonitoring(config.id);
                                                         }
                                                     }}
                                                 >
                                                     <Trash2 className="w-4 h-4" />
                                                 </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>

        {/* TDF Visualizer */}
        <Card className="bg-slate-950 border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden border-l-4 border-l-primary/30 group">
            <CardHeader className="pb-4 border-b border-slate-900">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" /> Transborder Data Flow (TDF) Matrix
                    </CardTitle>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest">Global_Adequacy: Active</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TDFNode 
                        origin="KSA (Riyadh)" 
                        destination="Dublin (AWS)" 
                        status="compliant" 
                        standard="NDMO / Adequacy" 
                    />
                    <TDFNode 
                        origin="Nigeria (Lagos)" 
                        destination="ADGM (UAE)" 
                        status="warning" 
                        standard="NDPR Art. 12" 
                    />
                    <TDFNode 
                        origin="Kenya (NRB)" 
                        destination="Frankfurt" 
                        status="compliant" 
                        standard="KDPA Sec. 48" 
                    />
                </div>
            </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function TDFNode({ origin, destination, status, standard }: { origin: string, destination: string, status: 'compliant' | 'warning', standard: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-primary/40 transition-all shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-1 h-full ${status === 'compliant' ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`} />
            <div className="flex items-center justify-between mb-6">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">NODE_ROUTE</span>
                <Badge variant="outline" className={`${status === 'compliant' ? 'text-emerald-500 border-emerald-500/20' : 'text-amber-500 border-amber-500/20'} font-black uppercase text-[8px] h-4`}>
                    {status}
                </Badge>
            </div>
            <div className="flex items-center gap-3 justify-between">
                <span className="text-sm font-black text-slate-100 uppercase tracking-tight">{origin}</span>
                <div className="flex-1 border-b border-dashed border-slate-800 relative">
                   <ArrowRight className="w-3 h-3 text-primary absolute left-1/2 -top-1.5 -translate-x-1/2" />
                </div>
                <span className="text-sm font-black text-slate-100 uppercase tracking-tight">{destination}</span>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[9px]">
                <span className="font-black text-slate-600 uppercase tracking-widest">Protocol:</span>
                <span className="font-black text-primary uppercase">{standard}</span>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, trend }: { icon: any, label: string, value: string, color: string, trend?: string }) {
    return (
        <Card className="bg-slate-950 border-slate-800 rounded-2xl shadow-xl overflow-hidden group hover:border-primary/20 transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 group-hover:scale-110 transition-transform">
                 <Icon className={`w-5 h-5 ${color}`} />
               </div>
               {trend && (
                 <Badge variant="secondary" className="bg-slate-900 text-[8px] font-black uppercase text-slate-500 tracking-tighter">
                   {trend}
                 </Badge>
               )}
            </div>
            <div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">{label}</div>
              <div className="text-2xl font-black tracking-tighter text-slate-100 italic uppercase">{value}</div>
            </div>
          </CardContent>
        </Card>
    );
}

function DPOItem({ vendor, status, expiry, region }: { vendor: string, status: 'registered' | 'pending' | 'missing', expiry: string, region: string }) {
    const colors = {
        registered: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        missing: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };
    return (
        <div className="p-5 flex items-center justify-between hover:bg-slate-900/40 transition-colors group">
            <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-[8px] font-black text-slate-500 border-slate-800 uppercase px-2 h-4">{region}</Badge>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-200 uppercase tracking-tight group-hover:text-primary transition-colors">{vendor}</span>
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Exp: {expiry}</span>
                </div>
            </div>
            <Badge variant="outline" className={`${colors[status]} border font-black uppercase text-[8px] h-4 px-2`}>
                {status}
            </Badge>
        </div>
    );
}

function RemediationSuggestionItem({ suggestion, onAccept, onDismiss }: { suggestion: any, onAccept: () => void, onDismiss: () => void }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative"
        >
            <Card className="bg-slate-950 border-slate-800 rounded-[2rem] overflow-hidden hover:border-primary/40 transition-all shadow-2xl flex flex-col h-full border-b-4 border-b-primary/10">
                <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-slate-900 border-slate-800 text-primary text-[8px] font-black uppercase px-2 h-5 tracking-widest">
                            {suggestion.category || "General Compliance"}
                        </Badge>
                        <Badge className={`text-[8px] font-black uppercase h-5 px-2 ${
                            suggestion.severity === 'critical' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                            suggestion.severity === 'high' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                            {suggestion.severity || "Medium"}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg font-black italic tracking-tighter uppercase text-slate-100 mt-4 leading-tight">
                        {suggestion.title || "Remediation Action Required"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-6">
                    <p className="text-xs text-slate-400 font-medium line-clamp-3">
                        {suggestion.description}
                    </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-slate-900 grid grid-cols-2 gap-3 bg-slate-900/20">
                    <Button 
                        variant="ghost" 
                        onClick={onDismiss}
                        className="rounded-xl h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-100 hover:bg-slate-800"
                    >
                        Dismiss
                    </Button>
                    <Button 
                        onClick={onAccept}
                        className="rounded-xl h-10 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <Zap className="w-3 h-3 fill-current" /> Apply Fix
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
