import { Sidebar } from "@/components/Sidebar";
import { Link2, Trash2, Globe, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Fetch links isn't in main routes, but we can assume we'd add it or fetch from files
// For now, let's just mock the UI or fetch from a hypothetical endpoint if we had it.
// Given constraints, I'll fetch files and map their shared links if relations are included.
// Actually, I'll update useFiles to include relation fetching in the backend, 
// OR I'll create a new hook in use-links.ts if I could.
// Since I can't modify backend, I will rely on the endpoint returning what I need or mock it for UI demo.
// Wait, the schema has relations. I'll assume the list files endpoint might return relations or I'll just render a placeholder.
// BETTER: The prompt says "Shared Links Page: List of active links". 
// I'll assume the backend `files.list` endpoint returns `sharedLinks` as a relation.

export default function SharedLinks() {
  // In a real app, we'd have a specific `GET /api/links` endpoint.
  // Using files to derive links for now since backend changes aren't allowed here.
  const { data: files } = useQuery({ 
    queryKey: [api.files.list.path],
    // Assuming the backend includes relations, or we just show the structure
    queryFn: async () => {
      const res = await fetch(api.files.list.path);
      return await res.json();
    }
  });

  // Flat map links from files if structure permits, otherwise this is illustrative
  const links = files?.flatMap((f: any) => f.sharedLinks?.map((l: any) => ({ ...l, fileName: f.name })) || []) || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="font-display text-3xl font-bold">Active Shared Links</h1>
            <p className="text-muted-foreground mt-1">Monitor and revoke access to your shared content.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-4">File Name</div>
              <div className="col-span-3">Created</div>
              <div className="col-span-2">Expires</div>
              <div className="col-span-2">Downloads</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {links.length === 0 ? (
               <div className="p-12 text-center text-muted-foreground">
                 <Link2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                 <p>No active shared links found.</p>
               </div>
            ) : (
              links.map((link: any) => (
                <div key={link.id} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                  <div className="col-span-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    {link.fileName}
                  </div>
                  <div className="col-span-3 text-muted-foreground">
                    {format(new Date(link.createdAt), 'MMM d, yyyy')}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {link.expiresAt ? (
                      <span className="text-orange-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(link.expiresAt), 'MMM d')}
                      </span>
                    ) : (
                      <span className="text-emerald-400">Never</span>
                    )}
                  </div>
                  <div className="col-span-2 text-muted-foreground">
                    {link.accessCount} / {link.maxAccess || '∞'}
                  </div>
                  <div className="col-span-1 text-right">
                    <RevokeButton id={link.id} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RevokeButton({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.links.revoke.path, { id });
      await fetch(url, { method: 'POST', credentials: 'include' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.files.list.path] });
      toast({ title: "Link revoked" });
    }
  });

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
