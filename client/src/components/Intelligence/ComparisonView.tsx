import { useState } from "react";
import { useContractComparisons, useRunComparison, useMultiComparison } from "@/hooks/use-comparisons";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Info, Loader2, Sparkles, History, Globe, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

interface ComparisonViewProps {
    contractId: number;
}

export function ComparisonView({ contractId }: ComparisonViewProps) {
    const { data: comparisons, isLoading } = useContractComparisons(contractId);
    const { data: rulesets } = useQuery({
        queryKey: [api.auditRulesets.list.path],
        queryFn: async () => {
            const res = await fetch(api.auditRulesets.list.path);
            if (!res.ok) throw new Error("Failed to fetch rulesets");
            return res.json();
        }
    });

    const runComparison = useRunComparison();
    const multiCompare = useMultiComparison();

    const [activeCompId, setActiveCompId] = useState<number | null>(null);
    const [selectedStandards, setSelectedStandards] = useState<string[]>([]);

    const activeComp = comparisons && comparisons.length > 0
        ? (comparisons.find(c => c.id === activeCompId) || comparisons[0])
        : null;

    const handleRunSingle = async (type: string) => {
        await runComparison.mutateAsync({ contractId, comparisonType: type });
    };

    const handleRunMulti = async () => {
        if (selectedStandards.length === 0) return;
        await multiCompare.mutateAsync({ contractId, standards: selectedStandards });
        setSelectedStandards([]);
    };

    const toggleStandard = (standard: string) => {
        setSelectedStandards(prev =>
            prev.includes(standard) ? prev.filter(s => s !== standard) : [...prev, standard]
        );
    };

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Sidebar: History & Selection */}
            <Card className="col-span-4 bg-slate-950 border-slate-800 h-fit">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-slate-100 font-semibold font-black">
                        <History className="w-4 h-4 text-primary" /> Intelligence Hub
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Run Options */}
                    <div className="space-y-3">
                        <Button
                            onClick={() => handleRunSingle('standard_library')}
                            disabled={runComparison.isPending}
                            className="w-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 h-10"
                        >
                            <Sparkles className="w-4 h-4 mr-2" /> Single Standard Scan
                        </Button>

                        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                            <h4 className="text-[10px] font-bold font-semibold flex items-center gap-2">
                                <Globe className="w-3 h-3" /> Multi-Jurisdictional
                            </h4>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin">
                                {rulesets?.map((rs: any) => (
                                    <div key={rs.id} className="flex items-center space-x-2 group">
                                        <Checkbox
                                            id={`std-${rs.id}`}
                                            checked={selectedStandards.includes(rs.standard)}
                                            onCheckedChange={() => toggleStandard(rs.standard)}
                                            className="border-slate-700 data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor={`std-${rs.id}`} className="text-xs text-slate-400 group-hover:text-slate-200 cursor-pointer transition-colors font-medium">
                                            {rs.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <Button
                                size="sm"
                                className="w-full h-9 bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 shadow-sm"
                                disabled={selectedStandards.length === 0 || multiCompare.isPending}
                                onClick={handleRunMulti}
                            >
                                {multiCompare.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
                                Parallel Benchmark
                            </Button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold font-semibold block mb-2 px-1">Analysis History</label>
                        <ScrollArea className="h-[250px] pr-4">
                            <div className="space-y-2">
                                {comparisons?.map((c) => (
                                    <div
                                        key={c.id}
                                        onClick={() => setActiveCompId(c.id)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${activeComp?.id === c.id
                                                ? 'bg-primary/5 border-primary/30'
                                                : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-tighter truncate max-w-[140px] ${activeComp?.id === c.id ? 'text-primary' : 'text-slate-400'}`}>
                                                {c.comparisonType.replace('multi_standard_', '').replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-100">{c.overallScore}%</span>
                                        </div>
                                        <div className="text-[9px] text-slate-600 font-mono">
                                            {format(new Date(c.createdAt), "MMM d, HH:mm")}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content: Results */}
            <div className="col-span-8">
                {activeComp ? (
                    <Card className="bg-slate-950 border-slate-800 border-l-4 border-l-primary h-[calc(100vh-200px)] overflow-hidden flex flex-col">
                        <CardHeader className="flex-none pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded bg-primary/10 border border-primary/20 mb-2">
                                        <ShieldCheck className="w-3 h-3 text-primary" />
                                        <span className="text-[10px] font-bold text-primary font-semibold">Active Analysis</span>
                                    </div>
                                    <CardTitle className="text-2xl text-slate-100 font-extrabold uppercase tracking-tight">
                                        {activeComp.comparisonType.replace('multi_standard_', '').replace('_', ' ')} Intelligence
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 text-xs">Jurisdictional benchmark and gap analysis results.</CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-5xl font-black text-slate-100 tracking-tighter">{activeComp.overallScore}%</div>
                                    <div className="text-[10px] text-slate-500 font-semibold font-black">Score</div>
                                </div>
                            </div>
                            <Progress value={activeComp.overallScore} className="h-1.5 bg-slate-900 mt-6" indicatorClassName="bg-gradient-to-r from-primary to-cyan-500" />
                        </CardHeader>

                        <CardContent className="flex-1 min-h-0 pt-2 px-6 pb-6">
                            <Tabs defaultValue="deviations" className="h-full flex flex-col">
                                <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6 flex-none">
                                    <TabsTrigger value="deviations" className="flex-1 data-[state=active]:bg-slate-950 data-[state=active]:text-primary rounded-lg text-xs font-bold transition-all">DEVIATIONS</TabsTrigger>
                                    <TabsTrigger value="missing" className="flex-1 data-[state=active]:bg-slate-950 data-[state=active]:text-primary rounded-lg text-xs font-bold transition-all">MISSING</TabsTrigger>
                                    <TabsTrigger value="recommendations" className="flex-1 data-[state=active]:bg-slate-950 data-[state=active]:text-primary rounded-lg text-xs font-bold transition-all">REMEDIES</TabsTrigger>
                                </TabsList>

                                <div className="flex-1 min-h-0">
                                    <ScrollArea className="h-full pr-4">
                                        <TabsContent value="deviations" className="mt-0 space-y-4">
                                            {activeComp.clauseAnalysis?.map((item: any, i: number) => (
                                                <div key={i} className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800/80 hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-extrabold text-slate-100 text-sm tracking-tight group-hover:text-primary transition-colors">{item.clause}</h4>
                                                        <Badge variant={item.severity === 'Critical' ? 'destructive' : 'secondary'} className="text-[9px] font-black px-1.5 h-4 uppercase tracking-tighter">
                                                            {item.severity}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.deviation}</p>
                                                    {item.foundText && (
                                                        <div className="mt-4 p-3 rounded-lg bg-black/40 border-l-2 border-primary/20 text-[10px] text-slate-500 italic">
                                                            "{item.foundText}"
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </TabsContent>

                                        <TabsContent value="missing" className="mt-0 space-y-4">
                                            {activeComp.missingClauses?.map((clause: any, i: number) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-red-950/5 border border-red-900/20 group hover:border-red-900/40 transition-all">
                                                    <div className="w-8 h-8 rounded-full bg-red-900/10 flex items-center justify-center shrink-0 border border-red-900/20">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-extrabold text-slate-100 tracking-tight">{clause.name || clause}</div>
                                                        <div className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                                                            {clause.impact || 'Critical regulatory requirement missing from the contract corpus. Significant compliance risk identified.'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </TabsContent>

                                        <TabsContent value="recommendations" className="mt-0 space-y-4">
                                            {activeComp.keyRecommendations?.map((rec: string, i: number) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 group hover:border-primary/20 transition-all">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1.5">{rec}</p>
                                                </div>
                                            ))}
                                        </TabsContent>
                                    </ScrollArea>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-slate-950/20 border border-slate-900 border-dashed">
                        <div className="w-20 h-20 rounded-full bg-slate-900/50 flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                            <Sparkles className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-xl font-black text-slate-300 uppercase tracking-tight">Intelligence Standby</h3>
                        <p className="text-sm text-slate-500 max-w-[320px] mt-2 font-medium">Select a comparison from the history or define standards for a new parallel benchmark.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
