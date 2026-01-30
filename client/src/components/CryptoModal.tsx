import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Unlock, Upload, FileKey, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CryptoModal() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptFile, setEncryptFile] = useState<File | null>(null);
  const [encryptKeyFile, setEncryptKeyFile] = useState<File | null>(null);
  const [decryptFile, setDecryptFile] = useState<File | null>(null);
  const [decryptKeyFile, setDecryptKeyFile] = useState<File | null>(null);
  const { toast } = useToast();

  const encryptFileRef = useRef<HTMLInputElement>(null);
  const encryptKeyRef = useRef<HTMLInputElement>(null);
  const decryptFileRef = useRef<HTMLInputElement>(null);
  const decryptKeyRef = useRef<HTMLInputElement>(null);

  const handleEncrypt = async () => {
    if (!encryptFile || !encryptKeyFile) {
      toast({ title: "Missing files", description: "Please select both a file to encrypt and a key file", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", encryptFile);
      formData.append("keyFile", encryptKeyFile);

      const response = await fetch("/api/crypto/encrypt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Encryption failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${encryptFile.name}.encrypted`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ 
        title: "Encryption successful", 
        description: "Your encrypted file has been downloaded. Keep your key file safe!",
      });
      
      setEncryptFile(null);
      setEncryptKeyFile(null);
      if (encryptFileRef.current) encryptFileRef.current.value = "";
      if (encryptKeyRef.current) encryptKeyRef.current.value = "";
    } catch (error: any) {
      toast({ title: "Encryption failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!decryptFile || !decryptKeyFile) {
      toast({ title: "Missing files", description: "Please select both an encrypted file and the key file", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("encryptedFile", decryptFile);
      formData.append("keyFile", decryptKeyFile);

      const response = await fetch("/api/crypto/decrypt", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Decryption failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decryptFile.name.replace(/\.encrypted$/, "") || "decrypted_file";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ 
        title: "Decryption successful", 
        description: "Your decrypted file has been downloaded.",
      });
      
      setDecryptFile(null);
      setDecryptKeyFile(null);
      if (decryptFileRef.current) decryptFileRef.current.value = "";
      if (decryptKeyRef.current) decryptKeyRef.current.value = "";
    } catch (error: any) {
      toast({ title: "Decryption failed", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-crypto-tools">
          <FileKey className="h-4 w-4" />
          Crypto Tools
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>File Encryption Tools</DialogTitle>
          <DialogDescription>
            Encrypt or decrypt files using a key file
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="encrypt" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encrypt" className="gap-2" data-testid="tab-encrypt">
              <Lock className="h-4 w-4" /> Encrypt
            </TabsTrigger>
            <TabsTrigger value="decrypt" className="gap-2" data-testid="tab-decrypt">
              <Unlock className="h-4 w-4" /> Decrypt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encrypt" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">File to Encrypt</label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => encryptFileRef.current?.click()}
                >
                  <input
                    ref={encryptFileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setEncryptFile(e.target.files?.[0] || null)}
                    data-testid="input-encrypt-file"
                  />
                  {encryptFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="truncate max-w-[200px]">{encryptFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Click to select file</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Key File (used as password)</label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => encryptKeyRef.current?.click()}
                >
                  <input
                    ref={encryptKeyRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setEncryptKeyFile(e.target.files?.[0] || null)}
                    data-testid="input-encrypt-keyfile"
                  />
                  {encryptKeyFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileKey className="h-4 w-4 text-primary" />
                      <span className="truncate max-w-[200px]">{encryptKeyFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileKey className="h-6 w-6" />
                      <span className="text-sm">Click to select key file</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">Keep your key file safe! You will need the exact same file to decrypt later.</p>
              </div>

              <Button 
                onClick={handleEncrypt} 
                disabled={!encryptFile || !encryptKeyFile || isProcessing}
                className="w-full"
                data-testid="button-encrypt"
              >
                {isProcessing ? "Encrypting..." : "Encrypt & Download"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="decrypt" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Encrypted File</label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => decryptFileRef.current?.click()}
                >
                  <input
                    ref={decryptFileRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setDecryptFile(e.target.files?.[0] || null)}
                    data-testid="input-decrypt-file"
                  />
                  {decryptFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span className="truncate max-w-[200px]">{decryptFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <span className="text-sm">Click to select encrypted file</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Key File</label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => decryptKeyRef.current?.click()}
                >
                  <input
                    ref={decryptKeyRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setDecryptKeyFile(e.target.files?.[0] || null)}
                    data-testid="input-decrypt-keyfile"
                  />
                  {decryptKeyFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileKey className="h-4 w-4 text-primary" />
                      <span className="truncate max-w-[200px]">{decryptKeyFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileKey className="h-6 w-6" />
                      <span className="text-sm">Click to select key file</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleDecrypt} 
                disabled={!decryptFile || !decryptKeyFile || isProcessing}
                className="w-full"
                data-testid="button-decrypt"
              >
                {isProcessing ? "Decrypting..." : "Decrypt & Download"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
