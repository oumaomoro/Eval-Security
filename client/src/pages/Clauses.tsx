import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useClauses, useGenerateClause } from "@/hooks/use-clauses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function Clauses() {
  const { data: clauses, isLoading } = useClauses();

  return (
    <Layout header={<h1 className="text-2xl font-bold">Clause Library</h1>}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? <div>Loading...</div> : clauses?.map((clause) => (
            <div key={clause.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{clause.clauseName}</h3>
                  <span className="text-xs bg-secondary px-2 py-1 rounded border border-border text-muted-foreground mt-1 inline-block">
                    {clause.clauseCategory}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-background/50 p-4 rounded-xl border border-border font-mono text-sm text-muted-foreground leading-relaxed">
                {clause.standardLanguage}
              </div>
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <AIGenerator />
        </div>
      </div>
    </Layout>
  );
}

function AIGenerator() {
  const [category, setCategory] = useState("");
  const [requirements, setRequirements] = useState("");
  const { mutate: generate, isPending, data: result } = useGenerateClause();

  const handleGenerate = () => {
    generate({ category, requirements });
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
