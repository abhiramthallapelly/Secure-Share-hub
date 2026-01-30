import { Sidebar } from "@/components/Sidebar";
import { UploadModal } from "@/components/UploadModal";
import { ShareDialog } from "@/components/ShareDialog";
import { CryptoModal } from "@/components/CryptoModal";
import { useFiles, useDeleteFile } from "@/hooks/use-files";
import { FileText, MoreVertical, Trash2, Download, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { buildUrl, api } from "@shared/routes";

export default function MyFiles() {
  const { data: files, isLoading } = useFiles();
  const { mutate: deleteFile } = useDeleteFile();

  const handleDownload = (id: number) => {
    // Direct browser download
    window.location.href = buildUrl(api.files.download.path, { id });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">My Files</h1>
              <p className="text-muted-foreground mt-1">Manage your encrypted files and access.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  className="bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm w-64 focus:outline-none focus:border-primary transition-colors"
                  data-testid="input-search-files"
                />
              </div>
              <CryptoModal />
              <UploadModal />
            </div>
          </div>

          {/* Files List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-card animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
              <div className="h-16 w-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No files uploaded yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first file to get started.</p>
              <UploadModal />
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {files?.map((file: any) => (
                <div key={file.id} className="group relative bg-card/50 border border-white/5 hover:border-primary/50 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/5">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h3 className="font-semibold text-lg truncate mb-1" title={file.name}>{file.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                      <Clock className="h-3 w-3" />
                      Secure
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(file.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <ShareDialog fileId={file.id} fileName={file.name} />
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
