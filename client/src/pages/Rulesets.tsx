import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Edit2, Trash2, ListChecks, Shield, Globe, GripVertical, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { getApiUrl } from "@/lib/api-config";
import { useRulesets, useCreateRuleset } from "@/hooks/use-rulesets";

interface Ruleset {
    id: number;
    name: string;
    description: string;
    standard: string;
    rules: any[];
    isCustom: boolean;
}

export default function Rulesets() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [standard, setStandard] = useState("");
    const [rules, setRules] = useState<any[]>([]);

    const { data: rulesets, isLoading } = useRulesets();
    const createRuleset = useCreateRuleset();


    const updateRuleset = useMutation({
        mutationFn: async ({ id, data }: { id: number, data: any }) => {
            const res = await fetch(getApiUrl(`/api/audit-rulesets/${id}`), {
                method: "PUT",
                credentials: "include",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to update ruleset");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.auditRulesets.list.path] });
            toast({ title: "Ruleset updated successfully" });
            resetForm();
        }
    });

    const deleteRuleset = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(getApiUrl(`/api/audit-rulesets/${id}`), { 
                method: "DELETE",
                credentials: "include"
            });
            if (!res.ok) throw new Error("Failed to delete ruleset");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.auditRulesets.list.path] });
            toast({ title: "Ruleset deleted" });
        }
    });

    const generateEvidencePack = useMutation({
        mutationFn: async () => {
            const res = await fetch(getApiUrl("/api/reports/evidence-pack"), {
                method: "POST",
                credentials: "include",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ standard: "SOC 2 / ISO 27001", type: "Enterprise Verification" })
            });
            if (!res.ok) throw new Error("Failed to generate pack");
            return res.json();
        },
        onSuccess: (data) => {
            if (data?.evidence) {
                // Trigger an automatic download of the JSON evidence file
                const blob = new Blob([JSON.stringify(data.evidence, null, 2)], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `SOC2_Evidence_Pack_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
            toast({ title: "Evidence Pack Downloaded", description: "The compliance evidence JSON has been saved." });
        }
    });

    const triggerRescan = useMutation({
        mutationFn: async () => {
            const res = await fetch(getApiUrl("/api/regulatory-alerts/trigger-rescan"), {
                method: "POST",
                credentials: "include",
                headers: { 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ standard: "Global", alertTitle: "Autonomic Compliance Rescan" })
            });
            if (!res.ok) throw new Error("Failed to trigger rescan");
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Autonomic Rescan Initiated", description: "Reviewing compliance drifts organically." });
        }
    });

    const resetForm = () => {
        setName("");
        setDescription("");
        setStandard("");
        setRules([]);
        setEditingId(null);
        setOpen(false);
    };

    const handleEditAction = (rs: any) => {
        setEditingId(rs.id);
        setName(rs.name);
        setDescription(rs.description || "");
        setStandard(rs.standard);
        setRules(rs.rules || []);
        setOpen(true);
    };

    const addRule = () => {
        setRules([...rules, { id: `rule_${Date.now()}`, requirement: "", description: "", severity: "medium" }]);
    };

    const updateRuleField = (index: number, field: string, value: string) => {
        const newRules = [...rules];
        newRules[index][field] = value;
        setRules(newRules);
    };

    const removeRuleAction = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const onFormSubmit = () => {
        const payload = { name, description, standard, rules, isCustom: true };
        if (editingId) {
            updateRuleset.mutate({ id: editingId, data: payload });
        } else {
            createRuleset.mutate(payload);
        }
    };

    return (
        <Layout header={<h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Compliance Policies</h1>}>
            <div className="space-y-8 pb-12">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Ruleset Library</h2>
                        <p className="text-muted-foreground text-sm">Define and manage jurisdictional standards and internal compliance checklists.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="bg-slate-900 border-slate-800 hover:border-primary/50 text-slate-300 hover:text-primary transition-all shadow-sm"
                            onClick={() => triggerRescan.mutate()}
                            disabled={triggerRescan.isPending}
                        >
                            {triggerRescan.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2 text-primary" />}
                            Initiate Rescan
                        </Button>
                        <Button 
                            variant="outline" 
                            className="bg-slate-900 border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all shadow-sm"
                            onClick={() => generateEvidencePack.mutate()}
                            disabled={generateEvidencePack.isPending}
                        >
                            {generateEvidencePack.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-cyan-400" />}
                            Evidence Pack
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Custom Ruleset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] bg-slate-950 border-slate-800 text-slate-100">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <ListChecks className="w-5 h-5 text-primary" />
                                    {editingId ? "Edit Ruleset" : "Create Custom Ruleset"}
                                </DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Define a new compliance standard or policy checklist for Intelligence analysis.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Ruleset Name</Label>
                                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Internal Intelligence Ethics" className="bg-slate-900 border-slate-800" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Standard Code</Label>
                                        <Input value={standard} onChange={(e) => setStandard(e.target.value)} placeholder="e.g., AI-ETH-2026" className="bg-slate-900 border-slate-800" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Description</Label>
                                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this policy cover?" className="bg-slate-900 border-slate-800 h-20" />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Rules & Requirements</h3>
                                        <Button size="sm" variant="outline" onClick={addRule} className="h-8 border-primary/30 text-primary hover:bg-primary/10">
                                            <Plus className="w-3 h-3 mr-1" /> Add Rule
                                        </Button>
                                    </div>
                                    <DragDropContext onDragEnd={(result) => {
                                        if (!result.destination) return;
                                        const items = Array.from(rules);
                                        const [reorderedItem] = items.splice(result.source.index, 1);
                                        items.splice(result.destination.index, 0, reorderedItem);
                                        setRules(items);
                                    }}>
                                        <Droppable droppableId="ruleset-builder">
                                            {(provided) => (
                                                <div 
                                                    {...provided.droppableProps} 
                                                    ref={provided.innerRef}
                                                    className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800"
                                                >
                                                    {rules.map((rule, idx) => (
                                                        <Draggable key={rule.id} draggableId={rule.id} index={idx}>
                                                            {(provided, snapshot) => (
                                                                <div 
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    className={`p-4 rounded-xl border space-y-3 relative group transition-all duration-300 ${snapshot.isDragging ? 'bg-slate-800/90 border-primary shadow-2xl scale-[1.02] z-50 ring-1 ring-primary/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700/80 shadow-md'}`}
                                                                >
                                                                    <div {...provided.dragHandleProps} className="absolute left-2 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab text-slate-600 hover:text-slate-300">
                                                                        <GripVertical className="w-4 h-4" />
                                                                    </div>
                                                                    <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 text-slate-500 hover:text-red-400" onClick={() => removeRuleAction(idx)}>
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                    <div className="grid grid-cols-4 gap-3 pl-8">
                                                                        <div className="col-span-3">
                                                                            <Label className="text-[10px] text-slate-500 uppercase font-bold">Requirement</Label>
                                                                            <Input value={rule.requirement} onChange={(e) => updateRuleField(idx, "requirement", e.target.value)} placeholder="e.g., Data Residency" className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-[10px] text-slate-500 uppercase font-bold">Severity</Label>
                                                                            <select value={rule.severity} onChange={(e) => updateRuleField(idx, "severity", e.target.value)} className={`w-full h-8 bg-slate-950 border-slate-800 text-xs rounded-md px-2 outline-none appearance-none font-bold ${rule.severity === 'critical' ? 'text-red-500' : rule.severity === 'high' ? 'text-orange-400' : rule.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                                                <option value="critical">Critical</option>
                                                                                <option value="high">High</option>
                                                                                <option value="medium">Medium</option>
                                                                                <option value="low">Low</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="pl-8">
                                                                        <Label className="text-[10px] text-slate-500 uppercase font-bold">Detailed Description</Label>
                                                                        <Input value={rule.description} onChange={(e) => updateRuleField(idx, "description", e.target.value)} placeholder="Specific details for Intelligence detection" className="h-8 bg-slate-950 border-slate-800 text-xs" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button variant="ghost" onClick={resetForm} className="text-slate-400 hover:text-white hover:bg-slate-900">Cancel</Button>
                                <Button onClick={onFormSubmit} disabled={createRuleset.isPending || updateRuleset.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]">
                                    {(createRuleset.isPending || updateRuleset.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save Changes" : "Create Ruleset"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>

                <div className="grid gap-6">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(rulesets as Ruleset[])?.map((rs: Ruleset) => (
                                <Card key={rs.id} className="bg-slate-950 border-slate-800 hover:border-primary/50 transition-all duration-300 group">
                                    <CardHeader className="pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <Globe className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10" onClick={() => handleEditAction(rs)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10" onClick={() => deleteRuleset.mutate(rs.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="mt-4 text-lg">{rs.name}</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs h-8 line-clamp-2">{rs.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-mono">{rs.standard}</span>
                                                <Badge variant={rs.isCustom ? "secondary" : "outline"} className={rs.isCustom ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" : ""}>
                                                    {rs.isCustom ? "Custom" : "Standard"}
                                                </Badge>
                                            </div>
                                            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{rs.rules?.length || 0} Intelligence Rules</span>
                                                <Button variant="link" className="text-xs text-primary h-auto p-0" onClick={() => handleEditAction(rs)}>View Rules →</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
