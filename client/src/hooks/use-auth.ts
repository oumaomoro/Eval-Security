import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const token = localStorage.getItem("costloci_token");
  if (!token) return null;

  try {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    const response = await fetch(`${apiUrl}/api/auth/user`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("costloci_token");
      return null;
    }

    if (!response.ok) {
        // Log Error but don't crash, return null to show Auth Page
        console.error(`[Auth] Backend responded with ${response.status}: ${response.statusText}`);
        return null; 
    }

    const data = await response.json();
    return data.user || data;
  } catch (error: any) {
    // Phase 25 Autofix: Prevent spinner-lock on network/DNS/Infrastructure errors
    console.error('[Auth] Persistent Spinner Resolution: Caught infrastructure error during fetchUser:', error.message);
    return null;
  }
}

async function logout(): Promise<void> {
  localStorage.removeItem("costloci_token");
  window.location.href = "/auth";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user: user as User | null,
    isLoading,
    isError,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
