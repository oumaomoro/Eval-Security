import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertReport, type InsertReportSchedule } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/lib/api-config";
import { useWorkspace } from "@/hooks/use-workspace";

export function useReports() {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.reports.list.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.reports.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return api.reports.list.responses[200].parse(await res.json());
    },
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { title: string; type: string; regulatoryBody?: string }) => {
      const res = await fetch(getApiUrl(api.reports.generate.path), {
        method: api.reports.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate report");
      return api.reports.generate.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      toast({ title: "Report Initialized", description: "Deployment of jurisdictional intelligence has commenced." });
    },
  });
}

export function useReportSchedules() {
  const { activeWorkspaceId } = useWorkspace();
  
  return useQuery({
    queryKey: [api.reports.schedules.list.path, activeWorkspaceId],
    queryFn: async () => {
      const res = await fetch(getApiUrl(api.reports.schedules.list.path), { 
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      return api.reports.schedules.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateReportSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertReportSchedule) => {
      const res = await fetch(getApiUrl(api.reports.schedules.create.path), {
        method: api.reports.schedules.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create schedule");
      return api.reports.schedules.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.schedules.list.path] });
      toast({ title: "Schedule Created", description: "Automated report orchestration has been enabled." });
    },
  });
}

export function useDeleteReportSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.reports.schedules.delete.path, { id });
      const res = await fetch(getApiUrl(url), {
        method: api.reports.schedules.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.schedules.list.path] });
      toast({ title: "Schedule Deleted", description: "The recurring report schedule has been deactivated." });
    },
  });
}
