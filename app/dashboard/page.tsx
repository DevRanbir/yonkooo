"use client";

import Link from "next/link";
import Component from "../../components/comp-485";
import { OceanBackground } from "../../components/ocean-background";

export default function DashboardPage() {
  return <main className="table-dashboard">
    <OceanBackground />
    <section className="table-scroll" aria-label="Grand Line dispatch records"><Component /></section>
    <div className="landing-frame" aria-hidden="true"><img src="/landing-command-frame-transparent.png" alt="" /></div>
    <nav className="frame-controls dashboard-frame-controls" aria-label="Dashboard controls"><Link href="/dashboard" className="frame-button frame-dashboard">DASHBOARD</Link><Link href="/map" className="frame-button frame-contact">CONTACT</Link><Link href="/map" className="frame-button frame-map">MAP</Link><Link href="/request" className="frame-button frame-sos">SOS</Link></nav>
  </main>;
}
