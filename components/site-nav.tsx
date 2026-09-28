"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, Radio, ShipWheel, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Logbook" },
  { href: "/request", label: "Transmit" },
  { href: "/team", label: "Armada" },
  { href: "/map", label: "Chart" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return <header className="sticky top-0 z-40 w-full border-b border-[#e8bd6155] bg-[#071926eF] backdrop-blur-md">
    <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Return to voyage landing">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-[#e8bd61] text-[#e8bd61]"><Radio className="h-5 w-5" /></span>
        <span className="leading-none"><b className="block font-serif text-base tracking-wide text-[#f4ead5]">DEN DEN MUSHI</b><small className="font-mono text-[9px] tracking-[.18em] text-[#e8bd61]">SOS · GRAND LINE</small></span>
      </Link>
      <nav className="hidden items-center gap-1 md:flex">{navLinks.map(link => <Link key={link.href} href={link.href} className={`px-3 py-2 font-mono text-[10px] tracking-[.12em] transition-colors ${pathname === link.href ? "text-[#e8bd61]" : "text-[#a8bbc0] hover:text-[#f4ead5]"}`}>{pathname === link.href && <span className="mr-1.5 text-[#e8bd61]">✦</span>}{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-4 md:flex"><Link href="/map" className="flex items-center gap-1.5 font-mono text-[10px] tracking-[.12em] text-[#a8bbc0] hover:text-[#e8bd61]"><Compass className="h-3.5 w-3.5"/>OPEN CHART</Link><Link href="/request" className="inline-flex items-center gap-2 bg-[#e8bd61] px-3.5 py-2.5 font-mono text-[10px] font-bold tracking-[.12em] text-[#102b3a]"><ShipWheel className="h-4 w-4"/>SEND SOS</Link></div>
      <button type="button" className="p-2 text-[#e8bd61] md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">{mobileOpen ? <X/> : <Menu/>}</button>
    </div>
    {mobileOpen && <div className="border-t border-[#e8bd6133] bg-[#0b293a] px-5 py-4 md:hidden"><nav className="flex flex-col gap-3">{navLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className={`font-mono text-xs tracking-[.14em] ${pathname === link.href ? "text-[#e8bd61]" : "text-[#d6dfd6]"}`}>{link.label}</Link>)}<Link href="/request" onClick={() => setMobileOpen(false)} className="mt-2 bg-[#e8bd61] px-3 py-3 text-center font-mono text-xs font-bold tracking-wider text-[#102b3a]">SEND SOS</Link></nav></div>}
  </header>;
}
