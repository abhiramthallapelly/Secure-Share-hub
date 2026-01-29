import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === SHARE LINKS MANAGEMENT ===

export function useCreateLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ fileId, ...data }: { fileId: number, expiresAt?: string, maxAccess?: number }) => {
      const url = buildUrl(api.links.create.path, { id: fileId });
      const res = await fetch(url, {
        method: api.links.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create share link");
      return api.links.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate file details (if we showed links there) or link lists
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Link generated",
        description: "Share link copied to clipboard (implemented in UI)",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not create share link",
        variant: "destructive",
      });
    },
  });
}

export function useRevokeLink() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.links.revoke.path, { id });
      const res = await fetch(url, {
        method: api.links.revoke.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to revoke link");
      return api.links.revoke.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Link revoked",
        description: "Access via this link is now blocked.",
      });
    },
  });
}

// === PUBLIC ACCESS ===

export function usePublicLink(token: string) {
  return useQuery({
    queryKey: [api.links.access.path, token],
    queryFn: async () => {
      // This is a special public route
      const url = buildUrl(api.links.access.path, { token });
      const res = await fetch(url);
      
      if (res.status === 410) throw new Error("Link expired or limit reached");
      if (res.status === 404) throw new Error("Link not found");
      if (!res.ok) throw new Error("Failed to load file");
      
      return await res.json(); // Returns generic file info + download URL
    },
    retry: false,
    enabled: !!token,
  });
}
