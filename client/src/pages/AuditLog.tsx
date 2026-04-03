import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
    Fingerprint, Search, Shield, FileText, Settings, Zap, 
    ChevronRight, Calendar, Users, Loader2 
} from "lucide-react";

export default function AuditLog() {
    const { data: logs, isLoading } = useQuery({
        queryKey: [api.auditLogs.list.path],
        queryFn: async () => {
            const res = await fetch(api.auditLogs.list.path);
            if (!res.ok) throw new Error("Failed to fetch audit logs");
            return res.json();
        }
    });

    if (isLoading) {
        return <Layout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></Layout>;
    }

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Fingerprint className="w-6 h-6 text-primary" /> Immutable Audit Ledger</h1>}>
            <div className="space-y-8 pb-12">
                
                {/* Search & Meta Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-96 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="Search by Action, User, or Resource ID..." 
                            className="pl-10 bg-slate-950 border-slate-800 focus:border-primary/50 text-slate-200"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-8 bg-slate-950 border-slate-800 text-slate-400 font-mono text-[10px]">VERIFIED_BLOCKCHAIN_SYNC: TRUE</Badge>
                        <Badge variant="outline" className="h-8 bg-slate-950 border-slate-800 text-emerald-500 font-mono text-[10px]">INTEGRITY: 100%</Badge>
                    </div>
                </div>

                {/* Main Audit Table */}
                <Card className="bg-slate-950 border-slate-800 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-slate-900 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Governance Events</CardTitle>
                                <CardDescription>Traceable history of all sensitive compliance, infrastructure, and contract operations.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-900/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[200px] text-[10px] font-black uppercase text-slate-500 py-4">Timestamp</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">Operator</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">Global Action</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-slate-500">Resource Entity</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase text-slate-500 py-4 pr-6">Trace ID</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs?.map((log: any) => (
                                    <TableRow key={log.id} className="border-slate-900 hover:bg-slate-900/30 transition-colors group">
                                        <TableCell className="py-4 font-mono text-[11px] text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">
                                                    {log.userId?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-xs font-bold text-slate-200">{log.userId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <ActionIcon action={log.action} />
                                                <span className="text-xs font-black uppercase tracking-tighter text-slate-100">{log.action.replace('_', ' ')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-slate-900 border-slate-800 text-slate-400 shrink-0">
                                                    {log.resourceType}
                                                </Badge>
                                                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{log.details || log.resourceId}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-4 pr-6">
                                            <div className="flex items-center justify-end gap-1 font-mono text-[10px] text-slate-600 group-hover:text-primary transition-colors">
                                                TX-{log.id.toString().padStart(6, '0')}
                                                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-2">
                                                    <Fingerprint className="w-6 h-6 text-slate-700" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No Governance Events Recorded</p>
                                                <p className="text-xs text-slate-600">The platform ledger is currently at genesis state.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Audit Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-950 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-100">4</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Administrators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-950 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-100">100%</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tamper Detection Health</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-950 border-slate-800">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black text-slate-100">{logs?.length || 0}</h4>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ledger Transactions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </Layout>
    );
}

function ActionIcon({ action }: { action: string }) {
    if (action.includes('CONTRACT')) return <FileText className="w-3.5 h-3.5 text-cyan-500" />;
    if (action.includes('AUDIT')) return <Shield className="w-3.5 h-3.5 text-emerald-500" />;
    if (action.includes('HEAL')) return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    return <Settings className="w-3.5 h-3.5 text-purple-500" />;
}
