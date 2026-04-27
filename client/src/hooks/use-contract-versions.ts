import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useContractVersions(contractId: number) {
  return useQuery({
    queryKey: ["/api/contracts", contractId, "versions"],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${contractId}/versions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch version history");
      return await res.json();
    },
    enabled: !!contractId,
  });
}

export function useCreateContractVersion() {
  return useMutation({
    mutationFn: async ({ contractId, fileUrl, changesSummary }: { contractId: number; fileUrl: string; changesSummary?: string }) => {
      const res = await fetch(`/api/contracts/${contractId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, changesSummary }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create contract version");
      return await res.json();
    },
  });
}
