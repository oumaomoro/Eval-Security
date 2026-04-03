import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

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
        queryFn: async () => {
            const res = await fetch(api.infrastructure.logs.path);
            if (!res.ok) throw new Error("Failed to fetch infrastructure logs");
            return res.json();
        },
        refetchInterval: 10000, // Refresh every 10s for live health
    });
}

export function useHealInfrastructure() {
    return useMutation<InfrastructureLog, Error, number>({
        mutationFn: async (logId) => {
            const res = await fetch(api.infrastructure.heal.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logId }),
            });
            if (!res.ok) throw new Error("Healing operation failed");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.infrastructure.logs.path] });
        },
    });
}
