import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useFiles() {
  return useQuery({
    queryKey: [api.files.list.path],
    queryFn: async () => {
      const res = await fetch(api.files.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch files");
      return api.files.list.responses[200].parse(await res.json());
    },
  });
}

export function useFile(id: number) {
  return useQuery({
    queryKey: [api.files.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.files.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch file details");
      return api.files.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Note: We don't parse input with Zod here because it's FormData, not JSON
      const res = await fetch(api.files.upload.path, {
        method: api.files.upload.method,
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        if (res.status === 400) throw new Error("Invalid file upload");
        throw new Error("Upload failed");
      }
      
      return api.files.upload.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.files.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "File encrypted & uploaded",
        description: "Your file is now securely stored.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.files.delete.path, { id });
      const res = await fetch(url, { 
        method: api.files.delete.method,
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to delete file");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.files.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "File deleted",
        description: "The file and all shared links have been removed.",
      });
    },
  });
}
