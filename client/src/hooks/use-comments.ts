import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export interface CommentWithUser {
    id: number;
    userId: string;
    contractId: number | null;
    auditId: number | null;
    content: string;
    createdAt: string;
    user?: {
        firstName: string | null;
        email: string | null;
    };
}

export function useComments(filters?: { contractId?: number; auditId?: number }) {
    return useQuery<CommentWithUser[]>({
        queryKey: [api.comments.list.path, filters],
        queryFn: async () => {
            const params: Record<string, string> = {};
            if (filters?.contractId) params.contractId = String(filters.contractId);
            if (filters?.auditId) params.auditId = String(filters.auditId);

            const queryStr = new URLSearchParams(params).toString();
            const url = queryStr ? `${api.comments.list.path}?${queryStr}` : api.comments.list.path;

            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch comments");
            return res.json();
        },
    });
}

export function useCreateComment() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { contractId?: number; auditId?: number; content: string }) => {
            const res = await fetch(api.comments.create.path, {
                method: api.comments.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to post comment");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [api.comments.list.path, { contractId: variables.contractId, auditId: variables.auditId }],
            });
            toast({ title: "Comment Posted", description: "Your message has been added to the discussion." });
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        },
    });
}
