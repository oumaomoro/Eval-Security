import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Download, Plus, ShieldAlert, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";

export default function Reports() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [type, setType] = useState("compliance");
    const [regulatoryBody, setRegulatoryBody] = useState("ODPC");

    const { data: reports, isLoading } = useQuery({
        queryKey: [api.reports.list.path],
        queryFn: async () => {
            const res = await fetch(api.reports.list.path);
            if (!res.ok) throw new Error("Failed to fetch reports");
            return res.json();
        }
    });

    const generateReport = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.reports.generate.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to generate report");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
            toast({ title: "Report generated successfully" });
            setOpen(false);
        },
        onError: () => {
            toast({ title: "Failed to generate report", variant: "destructive" });
        }
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Layout header={<h1 className="text-2xl font-black uppercase tracking-tighter italic drop-shadow-sm flex items-center gap-2"><FileText className="w-6 h-6 text-primary" /> Regulatory Reports</h1>}>
            <SEO title="Regulatory Reports" description="Manage and export specialized compliance reports for ODPC, CBK, and POPIA." />
            <div className="space-y-8 pb-12">
                <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-3xl">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Report Generation Hub</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-tight text-sm mt-2">
                            Engineered for high-fidelity compliance transparency and jurisdictional verification.
                        </p>
                    </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-tighter">
                            <Plus className="w-4 h-4 mr-2" />
                            Initialize Report
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-slate-950 border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-white uppercase tracking-tighter italic">Generate Regulatory Intelligence</DialogTitle>
                            <DialogDescription className="text-slate-500 font-bold uppercase text-[10px]">
                                Configure jurisdictional parameters for autonomic report generation.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Report Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Q3 Jurisdictional Audit" className="bg-slate-900 border-slate-800" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Analytical Framework</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="compliance">Jurisdictional Compliance</SelectItem>
                                        <SelectItem value="risk_assessment">Forrensic Risk Assessment</SelectItem>
                                        <SelectItem value="evidence_pack">Strategic Evidence Pack</SelectItem>
                                        <SelectItem value="audit">Full Autonomic Audit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Regulatory Standard</Label>
                                <Select value={regulatoryBody} onValueChange={setRegulatoryBody}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800">
                                        <SelectItem value="KDPA">KDPA (Kenya Act 2019)</SelectItem>
                                        <SelectItem value="CBK">CBK (Cybersecurity Guidance)</SelectItem>
                                        <SelectItem value="POPIA">POPIA (South Africa)</SelectItem>
                                        <SelectItem value="GDPR">GDPR (EU Standard)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="ghost" onClick={() => setOpen(false)} className="text-[10px] font-black uppercase text-slate-500 hover:text-white tracking-widest">Abort</Button>
                            <Button
                                onClick={() => generateReport.mutate({ title, type, regulatoryBody: regulatoryBody })}
                                disabled={!title || generateReport.isPending}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase italic tracking-tighter"
                            >
                                {generateReport.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cpu className="w-4 h-4 mr-2" />}
                                Begin Generation
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Evidence Pack Strategic Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="bg-slate-950 border-slate-800 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-32 h-32 text-emerald-500" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg font-black uppercase tracking-tighter italic flex items-center gap-2">
                             <Cpu className="w-5 h-5 text-emerald-500" /> Strategic Evidence Pack
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase text-[10px]">
                            Generate a board-ready executive brief for jurisdictional verification.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Compiles all recent autonomic rescans, risk mitigations, and legal speed metrics into a cryptographically signed PDF dashboard.
                        </p>
                        <div className="flex items-center gap-4">
                            <Select value={regulatoryBody} onValueChange={setRegulatoryBody}>
                                <SelectTrigger className="w-48 bg-slate-900 border-slate-800 text-[10px] font-bold uppercase h-9"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="KDPA">Standard: KDPA</SelectItem>
                                    <SelectItem value="POPIA">Standard: POPIA</SelectItem>
                                    <SelectItem value="CBK">Standard: CBK</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button 
                                variant="outline" 
                                className="h-9 border-slate-800 hover:bg-slate-900 text-slate-300 font-black uppercase text-[10px] tracking-widest italic"
                                onClick={() => generateReport.mutate({ 
                                    title: `Board Evidence Pack - ${regulatoryBody}`, 
                                    type: "evidence_pack", 
                                    standard: regulatoryBody 
                                })}
                                disabled={generateReport.isPending}
                            >
                                {generateReport.isPending ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : "Deploy Pack"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-500/5 border-emerald-500/20 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Integrity Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                            Every generated report is indexed against the Sovereign Integrity Ledger. Reports can be verified using the unique Forensic Hash found in the document footer.
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase italic">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ledger Sync Active: Node-Cluster-01
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/50">
                                <TableHead>Title</TableHead>
                                <TableHead>Regulatory Body</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date Generated</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No reports generated yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {reports?.map((r: any) => (
                                <TableRow key={r.id} className="border-border/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-primary/70" />
                                            {r.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{r.regulatoryBody}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{r.type.replace('_', ' ')}</TableCell>
                                    <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            r.status === 'generated' ? 'default' :
                                                r.status === 'failed' ? 'destructive' : 'secondary'
                                        }>
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={r.status !== 'generated'}
                                            onClick={() => window.open(`/api/reports/${r.id}/export`, "_blank")}
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </Button>

                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        </Layout>
    );
}
