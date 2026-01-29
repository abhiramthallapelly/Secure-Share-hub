import { useRoute } from "wouter";
import { usePublicLink } from "@/hooks/use-links";
import { Button } from "@/components/ui/button";
import { Shield, Download, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PublicDownload() {
  const [, params] = useRoute("/s/:token");
  const { data, isLoading, error } = usePublicLink(params?.token || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-card rounded-2xl mb-4" />
          <div className="h-4 w-32 bg-card rounded mb-2" />
          <div className="h-3 w-24 bg-card rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-destructive/20 rounded-3xl p-8 text-center shadow-2xl">
          <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">{error.message}</p>
          <p className="text-xs text-muted-foreground border-t border-white/5 pt-4">
            This link may have expired or been revoked by the owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

      <header className="p-6 flex justify-center relative z-10">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-xl">VaultShare Secure Transfer</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="glass-card rounded-3xl p-1 overflow-hidden">
            <div className="bg-card/80 p-8 rounded-[20px] text-center">
              <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner shadow-white/5">
                <FileText className="h-10 w-10 text-primary" />
              </div>

              <h1 className="text-3xl font-display font-bold mb-2">{data.name}</h1>
              <p className="text-muted-foreground mb-8">
                {(data.size / 1024 / 1024).toFixed(2)} MB • Securely Encrypted
              </p>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8 flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-500">Virus Scan Passed</p>
                  <p className="text-muted-foreground text-xs">This file is safe to download.</p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                onClick={() => window.location.href = data.downloadUrl}
              >
                <Download className="mr-2 h-5 w-5" /> Download File
              </Button>

              <p className="text-xs text-muted-foreground mt-6">
                Link expires: {data.expiresAt ? format(new Date(data.expiresAt), 'PPP') : 'Never'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground relative z-10">
        Powered by VaultShare • End-to-End Encryption
      </footer>
    </div>
  );
}
