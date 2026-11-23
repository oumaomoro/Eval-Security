import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { getApiUrl } from "@/lib/api-config";

export interface InfrastructureLog {
 id: number;
 component: string;
 event: string;
 status: 'detected' | 'resolving' | 'healed' | 'failed';
 actionTaken?: string;
 timestamp: string;
}

export function useInfrastructureLogs() {
 return useQuery<InfrastructureLog[]>({
 queryKey: [api.infrastructure.logs.path],
 queryFn: async () => { const res = await fetch(getApiUrl(api.infrastructure.logs.path), { 
 credentials: "include", });
 if (!res.ok) throw new Error("Failed to fetch infrastructure logs");
 const result = await res.json();
 return Array.isArray(result) ? result : [];
 },
 refetchInterval: 10000, // Refresh every 10s for live health
 });
}

export function useHealInfrastructure() {
 return useMutation<InfrastructureLog, Error, number>({
 mutationFn: async (logId: number) => { const res = await fetch(getApiUrl(api.infrastructure.heal.path), {
 method: "POST",
 headers: { 
 "Content-Type": "application/json",
 },
 body: JSON.stringify({ logId }),
 credentials: "include",
 });
 if (!res.ok) throw new Error("Healing operation failed");
 const result = await res.json();
 return result;
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: [api.infrastructure.logs.path] });
 },
 });
}

export function useAdminStats() {
 return useQuery({
 queryKey: [api.dashboard.stats.path],
 queryFn: async () => {
 const res = await fetch(getApiUrl(api.dashboard.stats.path), {
 credentials: "include",
 });
 if (!res.ok) throw new Error("Failed to fetch dashboard stats");
 return res.json();
 },
 refetchInterval: 30000,
 });
}
