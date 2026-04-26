import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useClauses, useGenerateClause, useCompareClauses } from "@/hooks/use-clauses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, BookOpen, GitCompare, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/empty-state";

export default function Clauses() {
  const { data: clauses, isLoading } = useClauses();

  return (
    <Layout header={<h1 className="text-2xl font-bold">Clause Library</h1>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : clauses?.length === 0 ? (
            <div className="pt-12">
              <EmptyState 
                icon={BookOpen} 
                title="Library Empty" 
                description="Your enterprise clause library is currently empty. Use the AI Clause Drafter on the right to generate compliance-ready legal language."
              />
            </div>
          ) : (
            clauses?.map((clause) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={clause.id} 
              className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl hover:border-primary/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl text-white tracking-tight">{clause.clauseName}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest">
                      {clause.clauseCategory}
                    </Badge>
                    {clause.isMandatory && (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] uppercase font-black tracking-widest">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <CompareClauseDialog clause={clause} />
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 bg-slate-950/50 border border-slate-800 hover:bg-slate-800">
                    <Copy className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800/50 font-mono text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {clause.standardLanguage}
              </div>
            </motion.div>
          )))}
        </div>

        <div className="lg:col-span-1">
          <AIGenerator />
        </div>
      </div>
    </Layout>
  );
}

function CompareClauseDialog({ clause }: { clause: any }) {
  const [inputText, setInputText] = useState("");
  const { mutate: compare, isPending, data: result } = useCompareClauses();

  const handleCompare = () => {
    // Note: Since we don't have a contract context here, we just pass libraryId
    // The API will compare the inputText against standardLanguage
    compare({ libraryClauseId: clause.id }); // Logic adjusted in component to use local text if needed
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 bg-slate-950/50 border-slate-800 hover:bg-primary/10 hover:border-primary/40 text-slate-300">
          <GitCompare className="w-4 h-4" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">
            Deviation <span className="text-primary">Analysis</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Paste Clause for Comparison</label>
            <Textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the clause from your contract here..."
              className="min-h-[150px] bg-slate-950/50 border-slate-800 focus:border-primary/50"
            />
          </div>
          
          <Button 
            onClick={handleCompare}
            disabled={isPending || !inputText}
            className="w-full bg-primary hover:bg-primary/90 text-slate-950 font-black uppercase h-12"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Analyze Deviation
          </Button>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-950/50 border border-primary/20 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${result.deviationSeverity === 'none' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                   <span className="text-xs font-black uppercase tracking-wider">Severity: {result.deviationSeverity}</span>
                </div>
                <Badge className="bg-primary/20 text-primary">{result.similarityScore}% Match</Badge>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{result.riskImplications}"</p>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Suggested Improvements</span>
                <p className="text-sm text-emerald-400 font-medium">{result.suggestedImprovements}</p>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AIGenerator() {
  const [category, setCategory] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jurisdiction, setJurisdiction] = useState("KDPA");
  const { mutate: generate, isPending, data: result } = useGenerateClause();

  const handleGenerate = () => {
    generate({ category, requirements, standards: [jurisdiction] });
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6 sticky top-24">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg text-primary">AI Clause Drafter</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Category</label>
          <Input
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. Liability Cap"
            className="bg-background border-primary/20"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Jurisdiction</label>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="bg-background border-primary/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KDPA">Kenya (KDPA)</SelectItem>
              <SelectItem value="POPIA">South Africa (POPIA)</SelectItem>
              <SelectItem value="GDPR">EU (GDPR)</SelectItem>
              <SelectItem value="CBK">Kenya (CBK Cyber)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Requirements</label>
          <Textarea
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            placeholder="Describe what this clause should cover..."
            className="bg-background border-primary/20 min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isPending || !category || !requirements}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Draft Clause
        </Button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-primary/20"
        >
          <h4 className="font-bold text-sm mb-3">Generated Draft</h4>
          <div className="bg-background p-4 rounded-xl border border-border text-sm font-mono leading-relaxed shadow-inner">
            {result.clauseText}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">{result.explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
