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
import { Loader2, FileText, Download, Plus } from "lucide-react";
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
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Generate Report
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Generate Regulatory Report</DialogTitle>
                            <DialogDescription>
                                Create a specialized compliance report for a specific regulatory body.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Report Title</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Annual DPIA Review" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Report Type</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="compliance">Compliance</SelectItem>
                                        <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                                        <SelectItem value="audit">Full Audit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Regulatory Body</Label>
                                <Select value={regulatoryBody} onValueChange={setRegulatoryBody}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ODPC">ODPC (Kenya KDPA)</SelectItem>
                                        <SelectItem value="CBK">CBK (Kenya Cyber Security)</SelectItem>
                                        <SelectItem value="POPIA">Information Regulator (SA POPIA)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => generateReport.mutate({ title, type, regulatoryBody })}
                                disabled={!title || generateReport.isPending}
                            >
                                {generateReport.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Generate
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
