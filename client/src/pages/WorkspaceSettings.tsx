import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User, Plus, Shield, UserCog, Mail, Key, RefreshCw, Eye, EyeOff, Copy } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const rotateKeyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/api-key");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "API Key rotated", description: "Your new key is now active." });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // We also need to update the local useAuth state if possible, 
      // but query invalidation should trigger a profile refresh.
    },
    onError: (error: any) => {
      toast({
        title: "Rotation failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });


  const { data: members, isLoading } = useQuery<any[]>({
    queryKey: ["/api/org/members"],
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/org/invite", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invite sent", description: `Successfully invited ${inviteEmail}` });
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteFirstName("");
      setInviteLastName("");
      queryClient.invalidateQueries({ queryKey: ["/api/org/members"] });
    },
    onError: (error: any) => {
      toast({
        title: "Invite failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PUT", "/api/org/member", { userId, role });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/org/members"] });
    },
  });

  if (isLoading) return null;

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  return (
    <Layout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Workspace Settings</h1>
          <p className="text-slate-400">Manage your organization's team members and permissions.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="col-span-2 border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Team Members</CardTitle>
                <CardDescription className="text-slate-400">
                  Total of {members?.length || 0} members in your organization.
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="mr-2 h-4 w-4" /> Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-slate-800 bg-slate-950 text-white">
                    <DialogHeader>
                      <DialogTitle>Invite new member</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Enter their email and assign a role to invite them to your workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label htmlFor="firstName">First name</Label>
                          <Input
                            id="firstName"
                            placeholder="Jane"
                            className="border-slate-800 bg-slate-900"
                            value={inviteFirstName}
                            onChange={(e) => setInviteFirstName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="lastName">Last name</Label>
                          <Input
                            id="lastName"
                            placeholder="Doe"
                            className="border-slate-800 bg-slate-900"
                            value={inviteLastName}
                            onChange={(e) => setInviteLastName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          className="border-slate-800 bg-slate-900"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="border-slate-800 bg-slate-900">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent className="border-slate-800 bg-slate-950">
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsInviteOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => inviteMutation.mutate({ 
                          email: inviteEmail, 
                          role: inviteRole, 
                          firstName: inviteFirstName, 
                          lastName: inviteLastName 
                        })}
                        disabled={inviteMutation.isPending || !inviteEmail || !inviteFirstName || !inviteLastName}
                        className="bg-primary hover:bg-primary/90"
                      >
                        {inviteMutation.isPending ? "Inviting..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="border-slate-800">
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">Member</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => (
                    <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/20">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                            <User className="h-4 w-4 text-slate-300" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{member.firstName} {member.lastName}</div>
                            <div className="text-xs text-slate-500">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={member.role || "analyst"} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && member.id !== user?.id && (
                          <Select
                            defaultValue={member.role}
                            onValueChange={(value) => updateRoleMutation.mutate({ userId: member.id, role: value })}
                          >
                            <SelectTrigger className="h-8 w-[120px] ml-auto border-slate-800 bg-slate-900 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-slate-800 bg-slate-950">
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="analyst">Analyst</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Workspace Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Current Plan</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-white italic tracking-tight uppercase">
                    {((user as any)?.subscriptionTier || 'STARTER')}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Contracts Used</Label>
                <div className="text-white font-mono">{(user as any)?.contractsCount ?? 0} uploaded</div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs h-10 rounded-xl"
                  onClick={() => window.location.href = '/billing'}
                >
                  Upgrade Plan
                </Button>
                <Button variant="outline" className="w-full border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800">
                  <UserCog className="mr-2 h-4 w-4" /> General Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-3 border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle className="text-white">Integrations & API</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Connect your workspace to external tools like the Microsoft Word Add-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Platform API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={user?.apiKey || "No key generated"}
                          readOnly
                          className="bg-slate-950 border-slate-800 font-mono text-xs pr-20"
                        />
                        <div className="absolute right-2 top-1.5 flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-500 hover:text-white"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-500 hover:text-white"
                            onClick={() => {
                              if (user?.apiKey) {
                                navigator.clipboard.writeText(user.apiKey);
                                toast({ title: "Copied to clipboard" });
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="border-slate-800 text-slate-300"
                        onClick={() => rotateKeyMutation.mutate()}
                        disabled={rotateKeyMutation.isPending || user?.role === 'viewer'}
                      >
                        <RefreshCw className={`h-4 w-4 ${rotateKeyMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      Use this key to authorize the Microsoft Word Add-in. Never share this key.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                  <h4 className="text-sm font-semibold text-white">Active Integrations</h4>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-slate-300 font-medium">Microsoft Word Add-in</span>
                    </div>
                    <StatusBadge status="active" />
                  </div>
                  <p className="text-xs text-slate-500">
                    Deep-link integration active. Open the Add-in menu in Word and enter your API key to begin auditing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
