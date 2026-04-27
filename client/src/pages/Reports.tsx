import { useState } from "react";
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar, 
  Trash2, 
  Clock, 
  ShieldCheck, 
  Filter,
  ChevronRight,
  RefreshCw,
  Zap
} from "lucide-react";
import { 
  useReports, 
  useGenerateReport, 
  useReportSchedules, 
  useCreateReportSchedule, 
  useDeleteReportSchedule 
} from "@/hooks/use-reports";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Reports() {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  
  // Manual Report State
  const [title, setTitle] = useState("");
  const [type, setType] = useState("compliance");
  const [regulatoryBody, setRegulatoryBody] = useState("KDPA");
  
  // Schedule State
  const [schedTitle, setSchedTitle] = useState("");
  const [schedFrequency, setSchedFrequency] = useState("monthly");
  const [recipientEmail, setRecipientEmail] = useState("");

  const { data: reports, isLoading: isLoadingReports } = useReports();
  const { data: schedules, isLoading: isLoadingSchedules } = useReportSchedules();
  const generateReport = useGenerateReport();
  const createSchedule = useCreateReportSchedule();
  const deleteSchedule = useDeleteReportSchedule();

  const handleGenerate = async () => {
    await generateReport.mutateAsync({ title, type, regulatoryBody });
    setReportDialogOpen(false);
    setTitle("");
  };

  const handleCreateSchedule = async () => {
    await createSchedule.mutateAsync({ 
      title: schedTitle, 
      type: "compliance", 
      frequency: schedFrequency,
      regulatoryBodies: [regulatoryBody],
      recipientEmail,
      isActive: true
    });
    setScheduleDialogOpen(false);
    setSchedTitle("");
  };

  return (
    <Layout header={
      <div className="flex w-full items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reporting Bureau</h1>
          <p className="text-xs text-muted-foreground mt-1">Enterprise regulatory intelligence and automated compliance exports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> New Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate Intelligence Report</DialogTitle>
                <DialogDescription>Configure jurisdictional parameters for on-demand report generation.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Report Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q3 Compliance Audit" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Framework</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliance">Jurisdictional Compliance</SelectItem>
                      <SelectItem value="risk_assessment">Operational Risk Assessment</SelectItem>
                      <SelectItem value="evidence_pack">Strategic Evidence Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="body" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regulatory Standard</Label>
                  <Select value={regulatoryBody} onValueChange={setRegulatoryBody}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KDPA">KDPA (Kenya Act 2019)</SelectItem>
                      <SelectItem value="CBK">CBK (Cyber Guidelines)</SelectItem>
                      <SelectItem value="POPIA">POPIA (South Africa)</SelectItem>
                      <SelectItem value="GDPR">GDPR (EU Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={!title || generateReport.isPending}>
                  {generateReport.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Generate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    }>
      <SEO title="Reporting Bureau" description="Automated regulatory intelligence and evidence generation." />
      
      <div className="space-y-6">
        {/* Intelligence Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#0f172a]/80 backdrop-blur-xl border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <ShieldCheck className="w-16 h-16 text-blue-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                Active Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tracking-tighter italic">
                {schedules?.filter(s => s.isActive).length || 0}
                <span className="text-blue-500/50 text-sm ml-1 not-italic font-medium">PIPELINES</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Automated intelligence engaged.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a]/80 backdrop-blur-xl border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <FileText className="w-16 h-16 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                Evidence Exported
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tracking-tighter italic">
                {reports?.length || 0}
                <span className="text-emerald-500/50 text-sm ml-1 not-italic font-medium">DOCS</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Verified sovereign repository.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a]/80 backdrop-blur-xl border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <Clock className="w-16 h-16 text-amber-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                Last Audit Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tracking-tighter italic">
                {reports?.[0]?.createdAt ? format(new Date(reports[0].createdAt as string | Date), "MMM d") : "NEVER"}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Jurisdictional verification sync.</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a]/80 backdrop-blur-xl border-primary/20 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
              <Zap className="w-16 h-16 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Optimization ROI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white tracking-tighter italic">
                ${reports?.reduce((sum, r) => sum + ((r.content as any)?.identifiedSavings || 0), 0).toLocaleString() || "0"}
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Identified annual cost savings.</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-px">
            <TabsList className="bg-transparent h-auto p-0 gap-6">
              <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium transition-none">
                Generated Reports
              </TabsTrigger>
              <TabsTrigger value="schedules" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-3 text-sm font-medium transition-none">
                Automated Schedules
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-3 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filter Repository
            </div>
          </div>

          <TabsContent value="reports" className="mt-0 outline-none">
            <Card className="bg-card/50 border-border/50 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[300px] text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-6">Report Detail</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Jurisdiction</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Format</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">Status</TableHead>
                    <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingReports ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="border-border/40">
                        <TableCell className="px-6 py-4"><Skeleton className="h-4 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[70px] rounded-full" /></TableCell>
                        <TableCell className="text-right px-6"><Skeleton className="h-8 w-[100px] ml-auto rounded-md" /></TableCell>
                      </TableRow>
                    ))
                  ) : reports?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">No reports generated</p>
                            <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">Generate your first jurisdictional report to see it here.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports?.map((report) => (
                      <TableRow key={report.id} className="group border-border/40 hover:bg-muted/20 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{report.title}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 uppercase font-medium">
                              {report.type.replace('_', ' ')} • {report.createdAt ? format(new Date(report.createdAt as string | Date), "MMM d, yyyy") : "Unknown Date"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight bg-muted/20 border-border/50 text-muted-foreground">
                            {report.regulatoryBody || 'General'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground uppercase">{report.format}</TableCell>
                        <TableCell>
                          <Badge 
                            className={`text-[9px] font-bold uppercase tracking-tight rounded-md px-1.5 py-0.5 ${
                              report.status === 'generated' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              report.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'
                            }`}
                            variant="secondary"
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            disabled={report.status !== 'generated'}
                            onClick={() => window.open(`/api/reports/${report.id}/export`, "_blank")}
                          >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="mt-0 outline-none">
             <Card className="bg-card/50 border-border/50 shadow-sm">
                <div className="p-6 flex items-center justify-between border-b border-border/50">
                  <div>
                    <h3 className="text-sm font-semibold">Report Automation</h3>
                    <p className="text-xs text-muted-foreground mt-1">Configure automated reporting windows for your organization.</p>
                  </div>
                  <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 border-border/50 hover:bg-muted/50">
                        <Calendar className="w-4 h-4 mr-2" /> Schedule Automation
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure Automation</DialogTitle>
                        <DialogDescription>Engage recurrent Intelligence report generation for active monitoring.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sched-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule Title</Label>
                          <Input id="sched-title" value={schedTitle} onChange={(e) => setSchedTitle(e.target.value)} placeholder="e.g., Monthly Executive Evidence" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="freq" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</Label>
                          <Select value={schedFrequency} onValueChange={setSchedFrequency}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily Snapshot</SelectItem>
                              <SelectItem value="weekly">Weekly Operational</SelectItem>
                              <SelectItem value="monthly">Monthly Executive</SelectItem>
                              <SelectItem value="quarterly">Quarterly Jurisdictional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sched-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recipient Email</Label>
                          <Input id="sched-email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="e.g., dpo@organization.com" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateSchedule} disabled={!schedTitle || createSchedule.isPending}>
                          {createSchedule.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                          Activate Schedule
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="p-0">
                   <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <TableHead className="px-6 py-3">Schedule Configuration</TableHead>
                          <TableHead>Frequency</TableHead>
                          <TableHead>Next Deployment</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right px-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingSchedules ? (
                           Array(3).fill(0).map((_, i) => (
                             <TableRow key={i} className="border-border/40">
                               <TableCell className="px-6 py-4"><Skeleton className="h-4 w-[150px]" /></TableCell>
                               <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                               <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                               <TableCell><Skeleton className="h-5 w-[50px] rounded-full" /></TableCell>
                               <TableCell className="text-right px-6"><Skeleton className="h-8 w-[30px] ml-auto rounded-md" /></TableCell>
                             </TableRow>
                           ))
                        ) : schedules?.length === 0 ? (
                           <TableRow>
                             <TableCell colSpan={5} className="py-24 text-center">
                               <div className="flex flex-col items-center gap-3">
                                 <Clock className="w-10 h-10 text-muted-foreground/30" />
                                 <p className="text-sm font-semibold">No active schedules found</p>
                                 <Button variant="link" onClick={() => setScheduleDialogOpen(true)} className="text-primary text-xs font-semibold">Initiate first schedule <ChevronRight className="w-3 h-3 ml-1" /></Button>
                               </div>
                             </TableCell>
                           </TableRow>
                        ) : (
                          schedules?.map((schedule) => (
                            <TableRow key={schedule.id} className="border-border/40 hover:bg-muted/10 transition-colors">
                              <TableCell className="px-6 py-4">
                                <span className="text-sm font-semibold">{schedule.title}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="bg-muted/30 text-muted-foreground border-border/50 text-[10px] font-bold uppercase">
                                  {schedule.frequency}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-muted-foreground">
                                {schedule.nextRun ? format(new Date(schedule.nextRun), "MMM d, HH:mm") : "Pending"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${schedule.isActive ? 'bg-emerald-500 shadow-emerald-500/50 shadow-sm' : 'bg-muted-foreground'}`} />
                                  <span className="text-xs font-semibold">{schedule.isActive ? 'Engaged' : 'Paused'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right px-6 py-4">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500"
                                  onClick={() => deleteSchedule.mutate(schedule.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                   </Table>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
