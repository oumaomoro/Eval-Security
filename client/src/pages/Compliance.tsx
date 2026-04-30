import { Layout } from "@/components/Layout";
import { useComplianceAudits, useRunAudit } from "@/hooks/use-compliance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle, XCircle, AlertCircle, Loader2, Shield, Zap, History as HistoryIcon, Globe, ArrowRight, FileText, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
import { Plus, Activity, Settings2 } from "lucide-react";
import { z } from "zod";

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
    runAudit({ scope: { contractIds: [1, 2], standards: ["KDPA", "IRA Kenya 2025", "POPIA", "NDPR", "SAMA"] } });
  };

  const onMonitoringSubmit = (data: z.infer<typeof insertContinuousMonitoringSchema>) => {
    createMonitoring(data);
  };

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Compliance Hub</h1>
          <p className="text-xs text-muted-foreground mt-1">Sovereign jurisdictional intelligence and audit monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
                <Button 
                    variant="outline"
                    className="rounded-lg h-9 px-4 gap-2 text-xs font-semibold border-slate-200 dark:border-slate-800"
                >
                    <FileText className="w-4 h-4 text-primary" /> 
                    Board Report
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1000px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl">
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
            className="rounded-lg h-9 px-4 gap-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? "Running..." : "Run Global Audit"}
          </Button>
        </div>
      </div>
    }>
      <SEO title="Governance Hub" description="Monitor regulatory updates and enterprise compliance posture." />
      <div className="space-y-8 pb-12 pt-4">

        {/* Autonomic Intelligence Hub */}
        <AutonomicJurisdictionSync />

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={CheckCircle} label="Global Compliance" value="91.2%" color="text-emerald-500" />
          <StatCard icon={AlertCircle} label="Jurisdiction Risk" value="Low" color="text-emerald-500" />
          <StatCard icon={Shield} label="DPO Verified" value="18/20" color="text-blue-500" />
          <StatCard icon={Zap} label="Policy Drift" value="0.02%" color="text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* DPO Registration Tracker */}
            <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Multi-Regional DPO
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        <DPOItem vendor="Apex Cloud" status="registered" expiry="Dec 2026" region="KE" />
                        <DPOItem vendor="SafePay Ltd" status="pending" expiry="RENEWAL REQ" region="NG" />
                        <DPOItem vendor="Global SCM" status="missing" expiry="ACTION REQ" region="KSA" />
                        <DPOItem vendor="Infrastruct" status="registered" expiry="July 2025" region="SA" />
                    </div>
                </CardContent>
            </Card>

            {/* Audit History */}
            <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm rounded-xl flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4" /> Audit Ledger
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto flex-1">
                    {isLoading ? <div className="p-12 text-center text-slate-400 text-sm">Loading Ledger...</div> : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {(!audits || audits.length === 0) && (
                          <div className="p-12 text-center text-slate-400 text-sm">No audit history found.</div>
                        )}
                        {audits?.map((audit) => (
                          <div key={audit.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <Badge variant="secondary" className="text-[10px] font-semibold">{audit.auditName.split(' ')[0]}</Badge>
                                <h3 className="font-bold text-lg text-foreground">{audit.auditName}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> {audit.createdAt ? format(new Date(audit.createdAt), "PPP") : "N/A"}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${Number(audit.overallComplianceScore) > 85 ? 'text-emerald-500' : 'text-blue-500'}`}>{audit.overallComplianceScore}%</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</div>
                              </div>
                            </div>
                            
                            {audit.complianceByStandard && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {Object.entries(audit.complianceByStandard).map(([std, score]) => (
                                  <div key={std} className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] flex items-center gap-2">
                                    <span className="font-semibold text-slate-500 uppercase">{std}</span>
                                    <span className={`font-bold ${Number(score) < 80 ? 'text-rose-500' : 'text-emerald-500'}`}>{score}%</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Continuous Monitoring Section */}
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> Automated Monitoring Pipelines
                    </h2>
                    <p className="text-xs text-muted-foreground italic">Scheduled autonomous audits for high-risk vendors.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="rounded-lg h-9 px-4 gap-2 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                            <Plus className="w-4 h-4" /> Create Pipeline
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold">New Monitoring Config</h3>
                                <p className="text-xs text-slate-500">Configure real-time jurisdictional tracking.</p>
                            </div>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onMonitoringSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="clientId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs uppercase font-bold text-slate-500 tracking-wider">Target Client/Vendor</FormLabel>
                                                <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-primary/20">
                                                            <SelectValue placeholder="Select a vendor" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
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
                                                <FormLabel className="text-xs uppercase font-bold text-slate-500 tracking-wider">Compliance Ruleset</FormLabel>
                                                <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={field.value.toString()}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 h-11 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-primary/20">
                                                            <SelectValue placeholder="Select a ruleset" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
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
                                                    <FormLabel className="text-xs uppercase font-bold text-slate-500 tracking-wider">Frequency (Days)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <input 
                                                                type="number" 
                                                                {...field} 
                                                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 h-11 bg-slate-50/50 dark:bg-slate-900/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                            />
                                                        </div>
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
                                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0 cursor-pointer">Active</FormLabel>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/10">Deploy Monitor</Button>
                                </form>
                            </Form>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-100 dark:border-slate-800/60">
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6">Vendor/Client</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6">Standard</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 text-center">Frequency</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 text-center">Next Run</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 text-center">Status</TableHead>
                            <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isMonitoringLoading ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Synchronizing monitoring state...</TableCell></TableRow>
                        ) : monitoringConfigs?.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">No active monitoring pipelines detected.</TableCell></TableRow>
                        ) : (
                            monitoringConfigs?.map((config) => {
                                const client = clients?.find((c) => c.id === config.clientId);
                                const ruleset = rulesets?.find((r) => r.id === config.rulesetId);
                                return (
                                    <TableRow key={config.id} className="border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <TableCell className="px-6 py-4 font-bold text-foreground">{client?.companyName || 'Unknown Vendor'}</TableCell>
                                        <TableCell className="px-6 py-4">
                                            <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/5 uppercase">
                                                {ruleset?.standard || 'Custom'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center font-semibold text-slate-500 text-xs">Every {config.frequencyDays} days</TableCell>
                                        <TableCell className="px-6 py-4 text-center font-semibold text-slate-500 text-xs italic">
                                            {config.nextRun ? format(new Date(config.nextRun), "MMM d, yyyy") : 'Pending Schedule'}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-center">
                                            <Badge className={config.isActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-slate-100 text-slate-400 border-slate-200"}>
                                                {config.isActive ? 'OPERATIONAL' : 'PAUSED'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Switch 
                                                    checked={!!config.isActive} 
                                                    onCheckedChange={(v) => updateMonitoring({ id: config.id, updates: { isActive: v } })} 
                                                />
                                                 <Button 
                                                     variant="ghost" 
                                                     size="icon" 
                                                     className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                                                     onClick={() => {
                                                         if (window.confirm("Are you sure you want to terminate this monitoring pipeline? This action cannot be undone.")) {
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
        <Card className="border-slate-200 dark:border-slate-800 shadow-md rounded-2xl overflow-hidden border-b-4 border-b-primary/20">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" /> Transborder Data Flows
                    </CardTitle>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 px-3 py-0.5 text-[10px] font-semibold">WHITELISTED</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-4">
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
        <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-primary/40 transition-all shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-1 h-full ${status === 'compliant' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Path</span>
                <Badge variant="outline" className={`${status === 'compliant' ? 'text-emerald-500 border-emerald-500/20' : 'text-amber-500 border-amber-500/20'} font-bold uppercase text-[8px] h-4`}>
                    {status}
                </Badge>
            </div>
            <div className="flex items-center gap-2 justify-between">
                <span className="text-sm font-bold text-foreground">{origin}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-sm font-bold text-foreground">{destination}</span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                <span className="font-semibold uppercase">Standard:</span>
                <span className="font-bold text-foreground">{standard}</span>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string, color: string }) {
    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-4 shadow-sm group hover:shadow-md transition-all">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
          </div>
        </div>
    );
}

function DPOItem({ vendor, status, expiry, region }: { vendor: string, status: 'registered' | 'pending' | 'missing', expiry: string, region: string }) {
    const colors = {
        registered: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        missing: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    };
    return (
        <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
            <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 dark:border-slate-800 uppercase px-1.5 h-4">{region}</Badge>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground leading-tight">{vendor}</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">Expiry: {expiry}</span>
                </div>
            </div>
            <Badge variant="outline" className={`${colors[status]} border font-bold uppercase text-[8px] h-4 px-2`}>
                {status}
            </Badge>
        </div>
    );
}
