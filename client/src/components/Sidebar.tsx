import { Link, useLocation } from "wouter";
import { LayoutDashboard, FileText, Share2, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  const links = [
    { href: "/", icon: LayoutDashboard, label: "Overview" },
    { href: "/files", icon: FileText, label: "My Files" },
    { href: "/links", icon: Share2, label: "Active Links" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">VaultShare</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
