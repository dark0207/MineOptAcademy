"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export type NavItem = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Main navigation; highlights the current section and collapses into a menu on small screens. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="icon-btn mobile-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name={open ? "x" : "menu"} size={18} />
      </button>
      <nav className={`main-nav${open ? " open" : ""}`} aria-label="Main">
        {items.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

/** Sidebar links of the admin console. */
export function SideLinks({ items }: { items: (NavItem & { icon: string; exact?: boolean })[] }) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <Icon name={item.icon} size={18} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
