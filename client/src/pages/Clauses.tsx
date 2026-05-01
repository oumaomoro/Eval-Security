import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useClauses, useGenerateClause, useCompareClauses } from "@/hooks/use-clauses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Sparkles, Copy, Check, BookOpen, GitCompare, Zap, ShieldAlert, Cpu, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function Clauses() {
  const { data: clauses, isLoading } = useClauses();

  return (
    <Layout header={<h1 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2"><Scale className="w-6 h-6 text-primary" /> Intelligence Clause Studio</h1>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div>
               <h2 className="text-lg font-black uppercase tracking-widest text-slate-400">Enterprise Library</h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Compliance-Ready Legal Templates</p>
            </div>
            <Badge variant="outline" className="bg-slate-950 border-slate-800 text-[10px] font-mono">{clauses?.length || 0} Assets Loaded</Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clauses?.length === 0 ? (
            <div className="pt-12">
              <EmptyState 
                icon={BookOpen} 
                title="Library Empty" 
                description="Your enterprise clause library is currently empty. Use the Smart Clause Drafter on the right to generate compliance-ready legal language."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {clauses?.map((clause, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={clause.id} 
                  className="bg-slate-950 border border-slate-800 rounded-[2rem] p-8 shadow-2xl hover:border-primary/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BookOpen className="w-24 h-24" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Asset_ID: {clause.id?.toString().padStart(4, '0')}</span>
                      </div>
                      <h3 className="font-black text-2xl text-white tracking-tighter italic uppercase">{clause.clauseName}</h3>
                      <div className="flex gap-2 mt-4">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest px-3 h-6">
                          {clause.clauseCategory}
                        </Badge>
                        {clause.isMandatory && (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] uppercase font-black tracking-widest px-3 h-6">
                            Mandatory
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-500 text-[10px] uppercase font-black px-3 h-6">
                          {clause.jurisdiction || 'Universal'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ErrorBoundary>
                        <CompareClauseDialog clause={clause} />
                      </ErrorBoundary>
                      <Button variant="outline" size="sm" className="h-10 w-10 p-0 bg-slate-900 border-slate-800 hover:bg-slate-800 rounded-xl">
                        <Copy className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 font-mono text-sm text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors relative z-10">
                    <div className="absolute top-4 right-4 opacity-20">
                       <Zap className="w-4 h-4 text-primary" />
                    </div>
                    {clause.standardLanguage}
                  </div>
                  
                  {clause.applicableStandards && (
                    <div className="mt-6 flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Standards Alignment:</span>
                       <div className="flex gap-2">
                         {Array.isArray(clause.applicableStandards) && clause.applicableStandards.map((s: string) => (
                           <Badge key={s} variant="secondary" className="bg-slate-900 text-[9px] font-black text-slate-500 border-slate-800">{s}</Badge>
                         ))}
                       </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <ErrorBoundary>
            <IntelligenceGenerator />
          </ErrorBoundary>
        </div>
      </div>
    </Layout>
  );
}

function CompareClauseDialog({ clause }: { clause: any }) {
  const [inputText, setInputText] = useState("");
  const { mutate: compare, isPending, data: result } = useCompareClauses();

  const handleCompare = () => {
    compare({ libraryClauseId: clause.id, contractText: inputText });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 bg-slate-900 border-slate-800 hover:bg-primary/10 hover:border-primary/40 text-slate-300 rounded-xl px-4">
          <GitCompare className="w-4 h-4" />
          <span className="text-xs font-black uppercase">Analyze Deviation</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-200 rounded-[2.5rem] shadow-2xl p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
            <Cpu className="w-6 h-6 text-primary" /> Clause <span className="text-primary">Intelligence Review</span>
          </DialogTitle>
          <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Cross-referencing against enterprise library standard</CardDescription>
        </DialogHeader>
        <div className="space-y-6 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Input_Buffer (Paste Contract Text)</label>
              <Badge variant="outline" className="text-[8px] bg-slate-900">PENDING_ANALYSIS</Badge>
            </div>
            <Textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the target clause for intelligence comparison..."
              className="min-h-[180px] bg-slate-900/50 border-slate-800 focus:border-primary/50 rounded-2xl p-4 text-sm font-medium leading-relaxed"
            />
          </div>
          
          <Button 
            onClick={handleCompare}
            disabled={isPending || !inputText}
            className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-black uppercase h-14 rounded-2xl shadow-xl shadow-primary/10 group"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <Zap className="w-5 h-5 mr-2 group-hover:scale-125 transition-transform" />
                Initiate Neural Comparison
              </>
            )}
          </Button>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="p-6 rounded-[2rem] bg-slate-900 border border-primary/20 space-y-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldAlert className="w-16 h-16 text-primary" />
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${result.deviationSeverity === 'none' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Similarity Index</span>
                        <span className="text-xl font-black text-white italic">{result.similarityScore}% Precision</span>
                      </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 h-8 px-4 font-black italic">{result.deviationSeverity?.toUpperCase()} RISK</Badge>
                </div>

                <div className="space-y-2 relative z-10">
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest font-mono">INTELLIGENCE_REMARKS:</span>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium italic bg-slate-950/50 p-4 rounded-xl border border-slate-800">"{result.riskImplications}"</p>
                </div>

                <div className="space-y-2 relative z-10">
                  <span className="text-[10px] font-black uppercase text-emerald-500/70 tracking-widest font-mono">REMEDIATION_GUIDANCE:</span>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <p className="text-sm text-emerald-400 font-bold leading-relaxed">{result.suggestedImprovements}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IntelligenceGenerator() {
  const [category, setCategory] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jurisdiction, setJurisdiction] = useState("KDPA");
  const { mutate: generate, isPending, data: result } = useGenerateClause();

  const handleGenerate = () => {
    generate({ category, requirements, standards: [jurisdiction] });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-8 sticky top-24 shadow-2xl relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
           <h3 className="font-black text-xl text-white tracking-tighter uppercase italic leading-none">Smart Drafter</h3>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Autonomous Legal Logic</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Asset Category</label>
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Data Sovereignty Cap"
            className="h-12 bg-slate-900 border-slate-800 rounded-xl focus:border-primary/50 text-slate-200"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Jurisdiction Protocol</label>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="h-12 bg-slate-900 border-slate-800 rounded-xl focus:border-primary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800">
              <SelectItem value="KDPA">Kenya (KDPA Standard)</SelectItem>
              <SelectItem value="POPIA">South Africa (POPIA)</SelectItem>
              <SelectItem value="GDPR">European Union (GDPR)</SelectItem>
              <SelectItem value="CBK">Central Bank (CBK Cyber)</SelectItem>
              <SelectItem value="ISO27001">ISO-27001 Annex A</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Operational Requirements</label>
          <Textarea
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            placeholder="Describe the logic parameters..."
            className="bg-slate-900 border-slate-800 rounded-xl focus:border-primary/50 min-h-[120px] p-4 text-sm"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isPending || !category || !requirements}
          className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black uppercase h-14 rounded-2xl shadow-xl active:scale-95 transition-all"
        >
          {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
          DRAFT WITH INTELLIGENCE
        </Button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-slate-900"
          >
            <div className="flex items-center justify-between mb-4">
               <h4 className="font-black text-[10px] uppercase text-primary tracking-widest">Draft_Response:</h4>
               <Button variant="ghost" size="sm" className="h-6 text-[8px] font-black text-slate-500 hover:text-primary">
                 <Copy className="w-3 h-3 mr-1" /> COPY_DRAFT
               </Button>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-primary/10 text-xs font-mono text-slate-400 leading-relaxed shadow-inner">
              {result.clauseText}
            </div>
            <div className="mt-4 flex items-start gap-2">
               <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
               <p className="text-[10px] text-slate-500 font-bold italic leading-tight">{result.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
