import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Settings, BookOpen, Trash } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PlaybooksPage() {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const { data: playbooks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/playbooks"],
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      toast({ title: "Success", description: "Playbook created" });
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/playbooks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playbooks"] });
      toast({ title: "Deleted", description: "Playbook removed" });
    }
  });

  const onSubmit = () => {
    if (!formData.name) return;
    createMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-cyan-500" />
              Remediation Playbooks
            </h1>
            
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Playbook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 text-slate-100 border border-slate-800">
                <DialogHeader>
                  <DialogTitle>Create Playbook</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Playbook Name</label>
                    <Input 
                      className="bg-slate-950 border-slate-800"
                      placeholder="e.g. EU GDPR Data Breach Protocol"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      className="bg-slate-950 border-slate-800"
                      placeholder="Triggers redlines enforcing GDPR DPA rules..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={onSubmit} disabled={createMutation.isPending || !formData.name}>
                    Save Playbook
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>

        <p className="text-slate-400">
          Design rule-based automated responses that trigger during AI contract ingestion. Playbooks allow you to enforce systemic redlines across your entire organization seamlessly.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-slate-900 border-slate-800 h-48" />
            ))}
          </div>
        ) : playbooks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-lg bg-slate-900/50">
             <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
             <h3 className="text-xl font-medium text-slate-300">No Playbooks Found</h3>
             <p className="text-slate-500 mt-2">Create your first playbook to automate contract redlines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbooks.map(pb => (
              <Card key={pb.id} className="bg-slate-900 border-slate-800 flex flex-col hover:border-cyan-500/50 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-slate-200">{pb.name}</CardTitle>
                    {pb.isActive ? (
                       <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    ) : (
                       <Badge variant="outline" className="text-slate-400">Draft</Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-slate-400">
                    {pb.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto flex justify-between gap-4">
                  <Link href={`/playbooks/${pb.id}/rules`}>
                    <Button variant="outline" className="w-full flex-1 bg-slate-950 border-slate-800 hover:text-cyan-400">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Rules
                    </Button>
                  </Link>
                  <Button variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => deleteMutation.mutate(pb.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
