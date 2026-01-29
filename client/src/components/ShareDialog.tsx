import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check, Link as LinkIcon, Loader2 } from "lucide-react";
import { useCreateLink } from "@/hooks/use-links";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";

interface ShareDialogProps {
  fileId: number;
  fileName: string;
}

export function ShareDialog({ fileId, fileName }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState("7");
  const [maxDownloads, setMaxDownloads] = useState("10");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const { mutate: createLink, isPending } = useCreateLink();

  const handleCreate = () => {
    const expiresAt = addDays(new Date(), parseInt(expiryDays)).toISOString();
    
    createLink(
      { 
        fileId, 
        expiresAt, 
        maxAccess: maxDownloads ? parseInt(maxDownloads) : undefined 
      },
      {
        onSuccess: (data) => {
          // Construct full URL
          const link = `${window.location.origin}/s/${data.id}`;
          setGeneratedLink(link);
        }
      }
    );
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setGeneratedLink(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10 transition-colors">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Share "{fileName}"</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!generatedLink ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 py-4"
            >
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="expiry">Expires in (days)</Label>
                  <Input 
                    id="expiry" 
                    type="number" 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="rounded-xl bg-background border-border" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="downloads">Max Downloads</Label>
                  <Input 
                    id="downloads" 
                    type="number" 
                    value={maxDownloads} 
                    onChange={(e) => setMaxDownloads(e.target.value)}
                    className="rounded-xl bg-background border-border" 
                  />
                </div>
              </div>
              <Button 
                className="w-full rounded-xl mt-2" 
                onClick={handleCreate}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LinkIcon className="h-4 w-4 mr-2" />}
                Generate Secure Link
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 py-4"
            >
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 text-center">
                <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/30">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg">Link Generated!</h3>
                <p className="text-sm text-muted-foreground mt-1">This link is valid until {format(addDays(new Date(), parseInt(expiryDays)), 'PPP')}</p>
              </div>

              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={generatedLink} 
                  className="rounded-xl bg-background font-mono text-xs" 
                />
                <Button 
                  size="icon" 
                  onClick={copyToClipboard}
                  className={copied ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <Button variant="ghost" className="w-full" onClick={reset}>
                Create Another Link
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
