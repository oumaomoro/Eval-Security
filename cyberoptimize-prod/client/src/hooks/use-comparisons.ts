import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";

export interface ContractComparison {
    id: number;
    contractId: number;
    comparisonType: string;
    overallScore: number;
    clauseAnalysis: any;
    missingClauses: any;
    keyRecommendations: any;
    createdAt: string;
}

export function useContractComparisons(contractId: number) {
    return useQuery<ContractComparison[]>({
        queryKey: [api.contracts.comparisons.list.path, contractId],
        queryFn: async () => {
            const res = await fetch(buildUrl(api.contracts.comparisons.list.path, { id: contractId }));
            if (!res.ok) throw new Error("Failed to fetch comparisons");
            return res.json();
        },
    });
}

export function useRunComparison() {
    return useMutation<ContractComparison, Error, { contractId: number; comparisonType: string }>({
        mutationFn: async ({ contractId, comparisonType }) => {
            const res = await fetch(buildUrl(api.contracts.comparisons.compare.path, { id: contractId }), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comparisonType }),
            });
            if (!res.ok) throw new Error("Failed to run comparison");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [api.contracts.comparisons.list.path, variables.contractId] });
        }
    });
}

export function useMultiComparison() {
    return useMutation<ContractComparison[], Error, { contractId: number; standards: string[] }>({
        mutationFn: async ({ contractId, standards }) => {
            const res = await fetch(buildUrl(api.contracts.comparisons.multi.path, { id: contractId }), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ standards }),
            });
            if (!res.ok) throw new Error("Multi-standard comparison failed");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: [api.contracts.comparisons.list.path, variables.contractId] });
        }
    });
}
