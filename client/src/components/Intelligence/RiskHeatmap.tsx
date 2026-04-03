import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface RiskPoint {
    name: string;
    risk: number; // 0-100 (lower is higher risk in some contexts, but here let's say score)
    compliance: number; // 0-100
    impact: number; // 0-100 (determines size)
}

interface RiskHeatmapProps {
    data: RiskPoint[];
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
    const renderTooltip = (props: any) => {
        const { active, payload } = props;
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                    <div className="text-xs font-black uppercase text-primary mb-1 tracking-widest">{data.name}</div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between gap-4 text-[10px]">
                            <span className="text-slate-500 font-bold">COMPLIANCE</span>
                            <span className="text-slate-100">{data.compliance}%</span>
                        </div>
                        <div className="flex justify-between gap-4 text-[10px]">
                            <span className="text-slate-500 font-bold">RISK SCORE</span>
                            <span className="text-slate-100">{data.risk}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-slate-950 border-slate-900 shadow-2xl overflow-hidden group">
            <CardHeader className="pb-2 border-b border-slate-900/50">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-primary" /> Strategic Risk Posture
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">LIVE ENGINE</Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <XAxis
                                type="number"
                                dataKey="compliance"
                                name="Compliance"
                                unit="%"
                                stroke="#475569"
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <YAxis
                                type="number"
                                dataKey="risk"
                                name="Risk"
                                stroke="#475569"
                                fontSize={10}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                            />
                            <ZAxis type="number" dataKey="impact" range={[50, 400]} />
                            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
                            <Scatter data={data}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.compliance < 50 ? '#ef4444' : entry.compliance < 80 ? '#f59e0b' : '#06b6d4'}
                                        fillOpacity={0.6}
                                        stroke={entry.compliance < 50 ? '#ef4444' : entry.compliance < 80 ? '#f59e0b' : '#06b6d4'}
                                        strokeWidth={2}
                                    />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[9px] font-black text-red-500 uppercase">Critical Impact</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-black text-amber-500 uppercase">Elevated Risk</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                        <span className="text-[9px] font-black text-cyan-500 uppercase">Resilient Zone</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
