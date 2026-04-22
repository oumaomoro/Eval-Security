import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, Slack, MessageSquare, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function NotificationSettings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [provider, setProvider] = useState<"slack" | "teams">("slack");
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data: channels, isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications/channels"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/notifications/channels", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Channel added", description: "Notifications will now be sent to this webhook." });
      setWebhookUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/channels"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to add channel", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/channels/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Channel removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/channels"] });
    }
  });

  const providers = [
    { id: "slack", name: "Slack", icon: Slack, color: "text-[#4A154B]" },
    { id: "teams", name: "MS Teams", icon: MessageSquare, color: "text-[#6264A7]" },
  ];

  return (
    <Layout>
      <div className="space-y-8 p-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/workspace")} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" /> Notification Settings
            </h1>
            <p className="text-slate-400">Configure real-time alerts for contract events and high-risk detections.</p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* New Channel Section */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white text-lg font-semibold">Add Webhook Channel</CardTitle>
              <CardDescription className="text-slate-400">Connect a new external notification provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-slate-300">Choose Provider</Label>
                <div className="grid grid-cols-2 gap-3">
                  {providers.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        provider === p.id 
                          ? "border-primary bg-primary/10 ring-1 ring-primary" 
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <p.icon className={`h-8 w-8 ${p.color}`} />
                      <span className="text-xs font-bold text-white uppercase tracking-tighter">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Webhook URL</Label>
                <Input 
                  placeholder={`https://hooks.${provider}.com/services/...`}
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-sm"
                />
                <p className="text-[10px] text-slate-500 italic">
                  Paste your incoming webhook URL here to enable automated alerts.
                </p>
              </div>

              <Button 
                onClick={() => createMutation.mutate({ provider, webhookUrl, events: ["contract.uploaded", "risk.critical"] })}
                disabled={!webhookUrl || createMutation.isPending}
                className="w-full bg-primary hover:bg-primary/90 font-bold font-semibold text-xs h-12"
              >
                {createMutation.isPending ? "Connecting..." : "Connect Channel"}
              </Button>
            </CardContent>
          </Card>

          {/* Active Channels List */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 font-semibold px-1 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Active Integrations
            </h3>
            
            {isLoading ? (
              <div className="h-32 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : channels?.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                <p className="text-xs text-slate-500 italic">No channels configured</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {channels?.map((channel) => (
                  <Card key={channel.id} className="border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                          {channel.provider === "slack" ? <Slack className="h-5 w-5 text-[#4A154B]" /> : <MessageSquare className="h-5 w-5 text-[#6264A7]" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white capitalize">{channel.provider} Gateway</div>
                          <div className="text-[10px] text-slate-500 font-mono max-w-[200px] truncate">{channel.webhook_url}</div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(channel.id)}
                        className="text-slate-600 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
              <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                <Plus className="h-3 w-3" /> Security Governance
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Platform alerts are delivered over sovereign TLS 1.3 encrypted channels. Every notification includes a cryptographically signed HMAC signature for destination verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
