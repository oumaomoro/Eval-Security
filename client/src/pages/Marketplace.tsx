import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowRight,
  Plus,
  DollarSign,
  Star,
  Loader2,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

const STANDARDS = [
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
  }
];

export default function Marketplace() {
  const { toast } = useToast();
  const { data: stats } = useDashboardStats();
  const activeStandards = stats?.activeStandards || [];

  const { data: listings, isLoading: listingsLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace/listings"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/listings");
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    }
  });

  const purchaseMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error("Purchase failed");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "The clause has been added to your library.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clauses"] });
    }
  });

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                <Package className="w-3 h-3" /> Digital Asset Hub
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
              Governance <span className="text-primary italic">Marketplace</span>
            </h1>
          </div>
          <div className="flex gap-3">
             <Button className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 rounded-xl font-black uppercase text-xs h-10 px-6 gap-2">
                <Plus className="w-4 h-4" /> Sell Your Clauses
             </Button>
          </div>
        </header>

        <Tabs defaultValue="standards" className="w-full">
           <TabsList className="bg-slate-900/50 border border-slate-800 p-1 h-14 rounded-2xl mb-8">
              <TabsTrigger value="standards" className="rounded-xl px-8 font-black uppercase tracking-tighter italic h-full data-[state=active]:bg-primary data-[state=active]:text-slate-950">
                Playbooks & Standards
              </TabsTrigger>
              <TabsTrigger value="clauses" className="rounded-xl px-8 font-black uppercase tracking-tighter italic h-full data-[state=active]:bg-primary data-[state=active]:text-slate-950">
                Premium Clause Library
              </TabsTrigger>
           </TabsList>

           <TabsContent value="standards">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {STANDARDS.map((pb) => (
                   <Card key={pb.id} className="bg-slate-900/40 border-slate-800 rounded-3xl overflow-hidden group">
                      <CardHeader>
                         <div className="mb-4 text-primary">{pb.icon}</div>
                         <CardTitle className="text-white font-black italic uppercase tracking-tight">{pb.name}</CardTitle>
                         <CardDescription className="text-slate-500 font-bold text-xs uppercase">{pb.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                         <p className="text-xs text-slate-400 font-medium mb-4">{pb.description}</p>
                         <div className="flex gap-2">
                            {pb.tags.map(t => <Badge key={t} variant="outline" className="text-[8px] uppercase">{t}</Badge>)}
                         </div>
                      </CardContent>
                      <CardFooter className="bg-slate-950/40 border-t border-slate-800 flex justify-between">
                         <span className="text-white font-black uppercase italic text-sm">{pb.price}</span>
                         <Button className="rounded-xl font-black uppercase text-xs h-9 px-4">Activate</Button>
                      </CardFooter>
                   </Card>
                 ))}
              </div>
           </TabsContent>

           <TabsContent value="clauses">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {listingsLoading ? (
                    <div className="col-span-full py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                 ) : (
                   listings?.map((listing) => (
                    <Card key={listing.id} className="bg-slate-900/40 border-slate-800 rounded-3xl overflow-hidden group hover:border-primary/40 transition-colors">
                      <CardHeader>
                         <div className="flex justify-between items-start">
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black">{listing.category}</Badge>
                            <div className="flex items-center gap-1 text-yellow-500">
                               <Star className="w-3 h-3 fill-current" />
                               <span className="text-[10px] font-black">Verified</span>
                            </div>
                         </div>
                         <CardTitle className="text-white font-black italic uppercase tracking-tight mt-4">{listing.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                         <p className="text-xs text-slate-400 font-medium line-clamp-3">{listing.description || "Premium pre-vetted legal clause for cybersecurity compliance."}</p>
                         <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Payout</p>
                               <p className="text-white font-black text-xs">Stripe Protected</p>
                            </div>
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                         </div>
                      </CardContent>
                      <CardFooter className="bg-slate-950/40 border-t border-slate-800 flex justify-between items-center">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Price</span>
                            <span className="text-lg font-black text-primary italic tracking-tighter">${listing.price}</span>
                         </div>
                         <Button 
                           onClick={() => purchaseMutation.mutate(listing.id)}
                           disabled={purchaseMutation.isPending}
                           className="bg-primary text-slate-950 rounded-xl font-black uppercase text-xs h-10 px-6 hover:bg-white transition-colors"
                         >
                            {purchaseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                            Buy Now
                         </Button>
                      </CardFooter>
                    </Card>
                   ))
                 )}
              </div>
           </TabsContent>
        </Tabs>

        {/* Info Banner */}
        <section className="bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-12 mt-12 relative overflow-hidden text-slate-950">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
               <div>
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none mb-6">Monetize Your <br/>Legal Expertise</h2>
                  <p className="text-slate-950 font-bold text-lg max-w-md mb-8">List your pre-vetted compliance clauses and earn 70% commission on every purchase from our global base of DPOs.</p>
                  <Button className="bg-slate-950 text-white rounded-2xl h-14 px-10 font-black uppercase italic tracking-tighter hover:bg-slate-800 transition-all">Start Selling Today</Button>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Commission", val: "70%", icon: <DollarSign /> },
                    { label: "Users", val: "15k+", icon: <Users /> },
                    { label: "Regions", val: "42", icon: <Globe /> },
                    { label: "Uptime", val: "99.9%", icon: <Zap /> }
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl">
                       <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center mb-4">{s.icon}</div>
                       <div className="text-2xl font-black">{s.val}</div>
                       <div className="text-[10px] font-black uppercase tracking-widest opacity-60">{s.label}</div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </section>
      </div>
    </Layout>
  );
}
