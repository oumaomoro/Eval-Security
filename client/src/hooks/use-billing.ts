import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export interface BillingTelemetry {
    id: number;
    clientId: number;
    metricType: string;
    value: number;
    cost?: number;
    timestamp: string;
}

export function useBillingTelemetry(clientId?: number) {
    return useQuery<BillingTelemetry[]>({
        queryKey: [api.billing.telemetry.path, clientId],
        queryFn: async () => {
            const url = buildUrl(api.billing.telemetry.path, clientId ? { clientId } : undefined);
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch billing telemetry");
            return res.json();
        },
    });
}
