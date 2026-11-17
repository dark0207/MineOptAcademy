import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { SITE_NAME } from "@/lib/constants";
import { logoutAction } from "@/app/actions/auth";
import { Icon } from "./Icon";
import { NavLinks, type NavItem } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function BrandMark() {
  return (
    <img className="brand-mark" src="/mineopt-icon.png" alt="" width={34} height={34} aria-hidden="true" />
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const items: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/library", label: "Tutorials" },
  ];
  if (isAdmin) items.push({ href: "/admin", label: "Admin" });

  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="brand" aria-label={`${SITE_NAME} home`}>
          <BrandMark />
          <span>
            MineOpt <small>Academy</small>
          </span>
        </Link>

        <NavLinks items={items} />

        <div className="header-actions">
          <form action="/library" className="header-search" role="search">
            <Icon name="search" size={16} />
            <input type="search" name="q" placeholder="Search features…" aria-label="Search tutorials" />
          </form>
          <ThemeToggle />

          {isAdmin && (
            <details className="user-menu">
              <summary aria-label="Account menu">
                <span className="avatar">{initials(user.name)}</span>
              </summary>
              <div className="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {user.email}
                  </span>
                  <div style={{ marginTop: 8 }}>
                    <span className="badge badge-accent">Administrator</span>
                  </div>
                </div>
                <Link href="/admin">
                  <Icon name="dashboard" size={16} /> Admin console
                </Link>
                <form action={logoutAction}>
                  <button type="submit">
                    <Icon name="logout" size={16} /> Sign out
                  </button>
                </form>
              </div>
            </details>
          )}
        </div>
      </div>
    </header>
  );
}
