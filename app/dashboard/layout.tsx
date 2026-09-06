import { Sidebar, MobileNav } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="lg:pl-60">
        <MobileNav />
        {children}
      </div>
    </div>
  );
}