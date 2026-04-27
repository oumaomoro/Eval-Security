import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, GripVertical, Trash } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export default function PlaybookRulesPage() {
  const [, params] = useRoute("/playbooks/:id/rules");
  const playbookId = Number(params?.id);
  const { toast } = useToast();

  const [newRuleMode, setNewRuleMode] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<any>({
    name: "",
    condition: { field: "intelligenceAnalysis.riskScore", operator: "greaterThan", value: "" },
    action: { type: "suggestClause", message: "" }
  });

  const { data: rules = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/playbooks/${playbookId}/rules`],
  });

  const createRuleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/playbooks/${playbookId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/playbooks/${playbookId}/rules`] });
      setNewRuleMode(false);
      toast({ title: "Rule Created", description: "Successfully added rule to playbook." });
    }
  });

  const updateRuleMutation = useMutation({
      mutationFn: async (payload: {id: number, updates: any}) => {
          const res = await fetch(`/api/playbooks/${playbookId}/rules/${payload.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload.updates)
          });
          if (!res.ok) throw new Error("Update failed");
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/playbooks/${playbookId}/rules`] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/playbooks/${playbookId}/rules/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/playbooks/${playbookId}/rules`] })
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const items = Array.from(rules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Save priorities
    items.forEach((item, index) => {
      const priority = items.length - index;
      if (item.priority !== priority) {
          updateRuleMutation.mutate({ id: item.id, updates: { priority } });
      }
    });
  };

  const handleSaveDraft = () => {
    if (!ruleDraft.name || !ruleDraft.condition.value) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and condition value are required" });
      return;
    }
    createRuleMutation.mutate({
      ...ruleDraft,
      priority: rules.length + 1
    });
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center space-x-4">
          <Link href="/playbooks">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-100">Playbook Workflow Rules</h1>
             <p className="text-slate-400 mt-1">Configure logic paths and sequence ordering via drag-and-drop.</p>
          </div>
        </div>

        {!newRuleMode ? (
           <Button className="w-fit bg-cyan-600 hover:bg-cyan-700" onClick={() => setNewRuleMode(true)}>
             <Plus className="w-4 h-4 mr-2" /> Add Rule
           </Button>
        ) : (
           <Card className="p-6 bg-slate-900 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <h3 className="text-xl font-medium mb-4 text-slate-100">Draft New Rule Workflow</h3>
              <div className="space-y-6">
                <div>
                  <Label>Rule Name</Label>
                  <Input 
                    className="bg-slate-950 mt-2" 
                    value={ruleDraft.name} 
                    onChange={e => setRuleDraft({...ruleDraft, name: e.target.value})} 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4 p-4 border border-slate-800 bg-slate-950/50 rounded-lg">
                  <div className="col-span-3 pb-2 border-b border-slate-800 text-sm font-semibold text-cyan-400">If: (Condition)</div>
                  <div>
                    <Label className="text-xs text-slate-400">Analysis Field</Label>
                    <Select value={ruleDraft.condition.field} onValueChange={v => setRuleDraft({...ruleDraft, condition: {...ruleDraft.condition, field: v}})}>
                      <SelectTrigger className="mt-1 bg-slate-900"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intelligenceAnalysis.riskScore">Risk Score</SelectItem>
                        <SelectItem value="intelligenceAnalysis.complianceGrade">Compliance Grade</SelectItem>
                        <SelectItem value="missingClauses">Missing Clauses Contains</SelectItem>
                        <SelectItem value="vendorName">Vendor Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Operator</Label>
                    <Select value={ruleDraft.condition.operator} onValueChange={v => setRuleDraft({...ruleDraft, condition: {...ruleDraft.condition, operator: v}})}>
                      <SelectTrigger className="mt-1 bg-slate-900"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greaterThan">Greater Than &gt;</SelectItem>
                        <SelectItem value="lessThan">Less Than &lt;</SelectItem>
                        <SelectItem value="not_exists">Does Not Exist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Target Value</Label>
                    <Input className="mt-1 bg-slate-900" value={ruleDraft.condition.value} onChange={e => setRuleDraft({...ruleDraft, condition: {...ruleDraft.condition, value: e.target.value}})} disabled={ruleDraft.condition.operator === 'not_exists'} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 border border-slate-800 bg-slate-950/50 rounded-lg">
                  <div className="col-span-2 pb-2 border-b border-slate-800 text-sm font-semibold text-cyan-400">Then: (Action)</div>
                  <div>
                    <Label className="text-xs text-slate-400">Action Type</Label>
                    <Select value={ruleDraft.action.type} onValueChange={v => setRuleDraft({...ruleDraft, action: {...ruleDraft.action, type: v}})}>
                      <SelectTrigger className="mt-1 bg-slate-900"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggestClause">Suggest Contract Redline</SelectItem>
                        <SelectItem value="createTask">Create Remediation Task</SelectItem>
                        <SelectItem value="updateRisk">Log to Risk Register</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                     <Label className="text-xs text-slate-400">Generated Text / Message</Label>
                     <Input className="mt-1 bg-slate-900" value={ruleDraft.action.message} onChange={e => setRuleDraft({...ruleDraft, action: {...ruleDraft.action, message: e.target.value}})} />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="ghost" onClick={() => setNewRuleMode(false)}>Cancel</Button>
                  <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={handleSaveDraft} disabled={createRuleMutation.isPending}><Save className="w-4 h-4 mr-2"/> Save</Button>
                </div>
              </div>
           </Card>
        )}

        <div className="mt-8">
           <DragDropContext onDragEnd={handleDragEnd}>
             <Droppable droppableId="rules">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {rules.map((rule: any, index: number) => (
                      <Draggable key={rule.id.toString()} draggableId={rule.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`p-4 border rounded-lg flex items-center gap-4 transition-all ${snapshot.isDragging ? 'bg-slate-800 border-cyan-500 z-50' : 'bg-slate-900 border-slate-800'}`}
                          >
                            <div {...provided.dragHandleProps} className="cursor-grab text-slate-500 hover:text-cyan-400 p-2">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-200">{rule.name}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                <span><span className="text-cyan-500/70">If:</span> {rule.condition?.field} {rule.condition?.operator} {rule.condition?.value}</span>
                                <span className="text-slate-600">•</span>
                                <span><span className="text-cyan-500/70">Then:</span> {rule.action?.type}</span>
                              </div>
                            </div>
                            <Button variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => deleteMutation.mutate(rule.id)}>
                              <Trash className="w-4 h-4" />
                            </Button>
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
    </Layout>
  );
}
