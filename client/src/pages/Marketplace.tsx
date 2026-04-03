import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Search, 
  Filter, 
  Heart, 
  Package, 
  CheckCircle2, 
  Briefcase, 
  HeartPulse, 
  Database, 
  Microscope,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PLAYBOOKS = [
  {
    id: 1,
    name: "CBK Framework v2.0",
    description: "Central Bank of Kenya IT & Cybersecurity guidelines for Financial Institutions.",
    category: "Financial Services",
    price: "Free",
    icon: <Briefcase className="w-8 h-8 text-blue-500" />,
    stats: "24.5k active",
    tags: ["CBK", "Banking", "Kenya"]
  },
  {
    id: 2,
    name: "Healthcare Privacy Plus",
    description: "Advanced HIPAA & POPIA alignment for medical data processing centers.",
    category: "Healthcare",
    price: "Premium",
    icon: <HeartPulse className="w-8 h-8 text-rose-500" />,
    stats: "12k active",
    tags: ["POPIA", "HIPAA", "EU-MDR"]
  },
  {
    id: 3,
    name: "AI Governance Pack",
    description: "Ethical AI alignment and EU AI Act compliance monitoring for agentic systems.",
    category: "AI Ethics",
    price: "Premium",
    icon: <Zap className="w-8 h-8 text-amber-500" />,
    stats: "8.2k active",
    tags: ["EU AI Act", "NIST", "Cortex"]
  },
  {
    id: 4,
    name: "GDPR Global Shield",
    description: "The gold standard for European data protection with automated DPA generation.",
    category: "Data Privacy",
    price: "Free",
    icon: <Globe className="w-8 h-8 text-cyan-500" />,
    stats: "45k active",
    tags: ["GDPR", "Privacy", "EU"]
  },
  {
    id: 5,
    name: "ISO 27001 Hub",
    description: "Standardized Information Security Management System (ISMS) controls and audit trails.",
    category: "Security Standard",
    price: "Enterprise",
    icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
    stats: "31k active",
    tags: ["ISO", "Security", "Audit"]
  }
];

export default function Marketplace() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const handleActivate = (name: string) => {
    toast({
      title: "Playbook Activated",
      description: `${name} has been merged into your active governance engine.`,
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                <Package className="w-3 h-3" /> Governance Ecosystem
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              Governance <span className="text-primary underline decoration-tighter underline-offset-4">Marketplace</span>
            </h1>
            <p className="text-muted-foreground font-bold text-sm max-w-xl">
              Equip your enterprise with regional compliance playbooks and specialized risk rulesets designed for global profitability and regulatory resilience.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search standards..." 
                    className="bg-slate-950 border border-slate-900 rounded-xl pl-10 pr-4 py-2 text-xs font-bold w-64 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all" 
                />
             </div>
             <Button variant="outline" size="icon" className="rounded-xl bg-slate-950 border-slate-900">
                <Filter className="w-4 h-4" />
             </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
          {PLAYBOOKS.map((pb, idx) => (
            <motion.div
              key={pb.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="bg-slate-950/50 border-slate-900 hover:border-primary/50 transition-all group relative overflow-hidden rounded-3xl h-full flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-900/50 backdrop-blur-md">
                        <Heart className="w-4 h-4" />
                    </Button>
                </div>
                
                <CardHeader>
                  <div className="mb-4 bg-slate-900/50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                    {pb.icon}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-black text-white italic tracking-tight uppercase">{pb.name}</CardTitle>
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                        {pb.category}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-1">
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">{pb.description}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {pb.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-black text-slate-500 uppercase tracking-tighter bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                            #{tag}
                        </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-900 p-6 flex items-center justify-between bg-slate-900/10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing</span>
                    <span className="text-sm font-black text-white italic tracking-tight">{pb.price}</span>
                  </div>
                  <Button 
                    onClick={() => handleActivate(pb.name)}
                    className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-tighter italic h-10 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all hover:translate-x-1"
                  >
                    Activate <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="bg-blue-600 rounded-[2.5rem] p-12 relative overflow-hidden mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 space-y-6">
                <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-[0.2em] border border-white/30">
                    Enterprise Request
                </div>
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                    Can't find a <br/>specific standard?
                </h2>
                <p className="text-white/80 font-bold text-lg max-w-md">
                    Our compliance engineers can digitize custom regional frameworks or internal corporate standards within 48 hours.
                </p>
                <Button className="bg-white hover:bg-blue-50 text-blue-600 font-black uppercase italic tracking-tighter rounded-2xl h-14 px-10 shadow-xl shadow-black/20">
                    Contact Specialist <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl space-y-4">
                    <Database className="w-8 h-8 text-white" />
                    <div className="space-y-1">
                        <div className="text-white font-black text-sm italic uppercase tracking-tight">Active Nodes</div>
                        <div className="text-3xl font-black text-white">4,281</div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl space-y-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                    <div className="space-y-1">
                        <div className="text-white font-black text-sm italic uppercase tracking-tight">Rules Digitzed</div>
                        <div className="text-3xl font-black text-white">125k+</div>
                    </div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl space-y-4">
                    <Microscope className="w-8 h-8 text-white" />
                    <div className="space-y-1">
                        <div className="text-white font-black text-sm italic uppercase tracking-tight">Audit Precision</div>
                        <div className="text-3xl font-black text-white">99.9%</div>
                    </div>
                </div>
                 <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl space-y-4">
                    <Globe className="w-8 h-8 text-white" />
                    <div className="space-y-1">
                        <div className="text-white font-black text-sm italic uppercase tracking-tight">Markets Managed</div>
                        <div className="text-3xl font-black text-white">82</div>
                    </div>
                </div>
            </div>
        </section>
      </div>
    </Layout>
  );
}
