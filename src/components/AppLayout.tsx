import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-24">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
