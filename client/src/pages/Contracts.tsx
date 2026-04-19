import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useContracts, useCreateContract, useUploadContractFile } from "@/hooks/use-contracts";
import { useClients } from "@/hooks/use-clients";
import { useWorkspace } from "@/hooks/use-workspace";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, UploadCloud, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { InsertContract } from "@shared/schema";
import { EmptyState } from "@/components/ui/empty-state";
import { SEO } from "@/components/SEO";

export default function Contracts() {
  const [search, setSearch] = useState("");
  const { data: contracts, isLoading } = useContracts();
  
  const filteredContracts = useMemo(() => {
    return contracts?.filter(c => 
      c.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [contracts, search]);

  return (
    <Layout 
      header={
        <div className="flex items-center justify-between w-full">
          <SEO title="Contract Inventory" description="Manage and analyze your master service agreements and vendor contracts with precision." />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Contracts</h1>
            <p className="text-sm text-muted-foreground">Manage and analyze your enterprise agreements with AI-powered precision.</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search vendor or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>
            <CreateContractDialog />
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
      ) : (
        <div className="space-y-6">
          <div className="bg-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Vendor</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Category</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Term</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Annual Cost</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-center">Renewal Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredContracts?.map((contract) => (
                    <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{contract.vendorName}</div>
                        <div className="text-xs text-slate-500">{contract.productService}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                          {contract.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                        {contract.contractTermMonths} mo
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-slate-100">
                        ${contract.annualCost?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {contract.renewalDate}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={contract.status || "active"} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/5">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(!filteredContracts || filteredContracts.length === 0) && (
              <div className="py-12 border-t border-slate-100 dark:border-slate-800">
                <EmptyState 
                  icon={FileText} 
                  title="No Contracts Found" 
                  description="Start by adding your first vendor contract or MSA for automated AI analysis."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

function CreateContractDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadContractFile();
  const { mutate: createContract, isPending: isCreating } = useCreateContract();
  const { data: clients } = useClients();
  const { activeWorkspaceId } = useWorkspace();
  const { register, handleSubmit } = useForm<InsertContract>();
  const { toast } = useToast();

  const onSubmit = async (data: InsertContract) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (activeWorkspaceId) formData.append("workspaceId", String(activeWorkspaceId));
        
        toast({ title: "Analyzing File", description: "Our AI is extracting contract terms." });
        await uploadFile(formData);
        setIsOpen(false);
        return;
      }
      
      const defaultClientId = clients && clients.length > 0 ? clients[0].id : undefined;

      if (!defaultClientId) {
        toast({ title: "Configuration Error", description: "No client profile found for this workspace. Please create a client profile first.", variant: "destructive" });
        return;
      }
      
      createContract({
        ...data,
        fileUrl: "",
        clientId: defaultClientId,
        workspaceId: activeWorkspaceId || undefined,
        annualCost: Number(data.annualCost),
        contractTermMonths: Number(data.contractTermMonths),
      }, {
        onSuccess: () => {
          setIsOpen(false);
          toast({ title: "Contract Added", description: "Contract has been successfully registered." });
        },
        onError: (err: any) => {
          toast({ title: "Submission Failed", description: err.message || "Failed to process contract", variant: "destructive" });
        }
      });
    } catch (e: any) {
      toast({ title: "Unexpected Error", description: e.message || "An error occurred during upload.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm ring-1 ring-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 sm:max-w-xl p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
          <DialogTitle className="text-xl font-bold tracking-tight">Add New Contract</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor Name</label>
              <Input {...register("vendorName", { required: true })} placeholder="e.g. Amazon Web Services" className="h-10 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Product/Service</label>
              <Input {...register("productService", { required: true })} placeholder="e.g. Infrastructure Hosting" className="h-10 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</label>
              <select {...register("category", { required: true })} className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-800 bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow">
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="services">Services</option>
                <option value="security">Security</option>
                <option value="cloud">Cloud Infrastructure</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Cost (USD)</label>
              <Input type="number" {...register("annualCost")} placeholder="0.00" className="h-10 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Effective Date</label>
              <Input type="date" {...register("contractStartDate")} className="h-10 border-slate-200 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Renewal Date</label>
              <Input type="date" {...register("renewalDate")} className="h-10 border-slate-200 dark:border-slate-800" />
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contract Document</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all cursor-pointer relative group">
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {file ? file.name : "Upload MSA or Contract PDF"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    AI will automatically extract key clauses and risk flags
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-900 -mx-6 -mb-6 p-6 bg-slate-50/30 dark:bg-slate-900/10">
            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)} className="h-10 font-medium">Cancel</Button>
            <Button type="submit" disabled={isUploading || isCreating} className="h-10 px-6 font-semibold bg-primary text-white hover:bg-primary/90 shadow-sm">
              {(isUploading || isCreating) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
