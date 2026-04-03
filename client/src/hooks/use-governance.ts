import { useQuery } from "@tanstack/react-query";

export interface GovernancePosture {
  overallStatus: "Optimal" | "Caution" | "Critical";
  resilienceIndex: number;
  complianceHealth: number;
  executiveSummary: string;
  topRecommendations: string[];
  predictiveAnalysis: string;
}

export function useGovernancePosture() {
  return useQuery<GovernancePosture>({
    queryKey: ["/api/governance/posture"],
    queryFn: async () => {
      const res = await fetch("/api/governance/posture");
      if (!res.ok) throw new Error("Failed to fetch governance posture");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute for real-time autonomic updates
  });
}
