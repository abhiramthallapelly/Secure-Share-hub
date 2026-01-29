import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Share2, Zap, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="px-6 h-20 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">VaultShare</span>
        </div>
        <div className="flex gap-4">
          <a href="/api/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Log in</Button>
          </a>
          <a href="/api/login">
            <Button className="rounded-xl shadow-lg shadow-primary/20">Get Started</Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto space-y-8"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            AES-256 Encryption Active
          </motion.div>

          <motion.h1 variants={item} className="font-display text-5xl md:text-7xl font-bold leading-tight">
            Secure File Sharing <br />
            <span className="text-gradient">For Modern Freelancers</span>
          </motion.h1>

          <motion.p variants={item} className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop losing control of your work. Share files with clients securely, 
            track downloads, and revoke access instantly.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a href="/api/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-2xl shadow-xl shadow-primary/25 hover:scale-105 transition-transform duration-200">
                Start Sharing Free
              </Button>
            </a>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl bg-white/5 border-white/10 hover:bg-white/10">
              How it works
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-24 w-full"
        >
          {[
            {
              icon: Lock,
              title: "End-to-End Encryption",
              desc: "Files are encrypted before they hit our storage. Only you hold the keys."
            },
            {
              icon: Share2,
              title: "Expiring Links",
              desc: "Set time limits or max download counts. Links self-destruct automatically."
            },
            {
              icon: Zap,
              title: "Instant Revocation",
              desc: "Client didn't pay? Kill the link instantly. Access denied everywhere."
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-3xl text-left hover:border-primary/30 transition-colors duration-300">
              <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-muted-foreground text-sm">
        <p>© 2025 VaultShare. Built for security.</p>
      </footer>
    </div>
  );
}
