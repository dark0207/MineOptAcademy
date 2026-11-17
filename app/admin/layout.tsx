import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { SideLinks } from "@/components/NavLinks";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · MineOpt Academy" } };

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/tutorials", label: "Tutorials", icon: "video" },
  { href: "/admin/modules", label: "Modules", icon: "layers" },
  { href: "/admin/users", label: "Users", icon: "users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin-shell">
      <aside className="admin-side" aria-label="Admin navigation">
        <div className="group">Manage</div>
        <SideLinks items={LINKS} />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
