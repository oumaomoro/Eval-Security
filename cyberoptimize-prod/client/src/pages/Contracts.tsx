import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useContracts, useCreateContract, useUploadContractFile } from "@/hooks/use-contracts";
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
  
  const filteredContracts = contracts?.filter(c => 
    c.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout 
      header={
        <div className="flex items-center justify-between w-full">
          <SEO title="Enterprise Contract Inventory" description="Analyze and audit your master service agreements and vendor contracts with Costloci Intelligence." />
          <h1 className="text-2xl font-black uppercase tracking-tighter italic drop-shadow-sm">Contract Inventory</h1>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
              />
            </div>
            <CreateContractDialog />
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-background/50 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Term</th>
                  <th className="px-6 py-4">Annual Cost</th>
                  <th className="px-6 py-4">Renewal Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredContracts?.map((contract) => (
                  <tr key={contract.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-medium">
                      <div className="font-bold text-foreground">{contract.vendorName}</div>
                      <div className="text-xs text-muted-foreground">{contract.productService}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-xs border border-border font-mono">
                        {contract.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{contract.contractTermMonths} mo</td>
                    <td className="px-6 py-4 font-mono">${contract.annualCost?.toLocaleString()}</td>
                    <td className="px-6 py-4 font-mono">{contract.renewalDate}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contract.status || "active"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/contracts/${contract.id}`} className="text-primary hover:text-primary/80 font-medium hover:underline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContracts?.length === 0 && (
              <EmptyState 
                icon={FileText} 
                title="No Contracts Detected" 
                description="Your enterprise workspace is currently pristine. Upload master service agreements, NDAs, or vendor contracts to initialize autonomic AI ingestion and auditing."
              />
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
  const { register, handleSubmit, setValue } = useForm<InsertContract>();
  const { toast } = useToast();

  const onSubmit = async (data: InsertContract) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        toast({ title: "Uploading...", description: "AI is analyzing your contract." });
        await uploadFile(formData);
        setIsOpen(false);
        return;
      }
      
      createContract({
        ...data,
        fileUrl: "",
        clientId: 1, // Hardcoded for demo simplicity
        annualCost: Number(data.annualCost),
        contractTermMonths: Number(data.contractTermMonths),
      }, {
        onSuccess: () => setIsOpen(false),
        onError: (err: any) => {
          if (err.message?.includes("Payment Required") || err.message?.includes("Limit Reached")) {
            toast({ 
              title: "Upgrade Required", 
              description: err.message, 
              variant: "destructive",
              action: (
                <Button variant="outline" size="sm" onClick={() => window.location.href = "/billing"}>
                  Upgrade
                </Button>
              )
            });
          } else {
            toast({ title: "Error", description: err.message || "Failed to process contract", variant: "destructive" });
          }
        }
      });
    } catch (e: any) {
      toast({ title: "Process Error", description: e.message || "Upload failed. Try manual entry.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Contract
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload New Contract</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vendor Name</label>
              <Input {...register("vendorName", { required: true })} placeholder="e.g. AWS" className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product/Service</label>
              <Input {...register("productService", { required: true })} placeholder="e.g. Cloud Hosting" className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select {...register("category", { required: true })} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="services">Services</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Annual Cost</label>
              <Input type="number" {...register("annualCost")} placeholder="0.00" className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" {...register("contractStartDate")} className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Renewal Date</label>
              <Input type="date" {...register("renewalDate")} className="bg-background" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Contract Document (PDF)</label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-8 h-8 text-primary/50" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "Drag & drop or click to upload"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUploading || isCreating}>
              {(isUploading || isCreating) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
