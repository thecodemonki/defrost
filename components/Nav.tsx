"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <Link href="/" className="nav-mark">Defrost</Link>
      <div className="nav-links">
        <Link href="/" data-active={path === "/"}>Generate</Link>
        <Link href="/dashboard" data-active={path === "/dashboard"}>Dashboard</Link>
      </div>
    </nav>
  );
}
