import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, File, Loader2 } from "lucide-react";
import { useUploadFile } from "@/hooks/use-files";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const { mutate: uploadFile, isPending } = useUploadFile();
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    maxFiles: 1,
  });

  const handleUpload = () => {
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    
    uploadFile(formData, {
      onSuccess: () => {
        setOpen(false);
        setFiles([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Secure File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Upload File</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors duration-200",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              files.length > 0 && "border-primary bg-primary/5"
            )}
          >
            <input {...getInputProps()} />
            <AnimatePresence mode="wait">
              {files.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {files[0].name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(files[0].size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                  >
                    Remove
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                    <UploadCloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    AES-256 encryption applied automatically
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || isPending}
              className="rounded-xl min-w-[100px]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Encrypt & Upload"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
