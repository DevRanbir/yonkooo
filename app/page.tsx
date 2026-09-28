"use client";

import Link from "next/link";
import { Map, Radio, ShipWheel } from "lucide-react";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.documentElement.classList.add("landing-active");
    document.body.classList.add("landing-active");
    return () => {
      document.documentElement.classList.remove("landing-active");
      document.body.classList.remove("landing-active");
    };
  }, []);

  return (
    <main className="hero-landing">
      <video className="landing-bg-video" autoPlay loop muted playsInline>
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <section className="hero-center">
        <div className="hero-kicker">
          <Radio size={14} /> GRAND LINE EMERGENCY NETWORK
        </div>
        <img
          src="/chopper-logo.png"
          alt="Chopper Medical Armada"
          className="hero-logo"
        />
        <h1>
          Every SOS <em>must be heard.</em>
        </h1>
        <p>
          A real-time dispatch channel for emergencies across the Grand Line. Listen, prioritize, deploy.
        </p>

        <div className="hero-actions">
          <Link href="/map" className="hero-primary">
            <Map size={17} /> OPEN DISPATCH MAP
          </Link>
          <Link href="/request" className="hero-secondary">
            TRANSMIT SOS <Radio size={15} />
          </Link>
          <Link href="/team" className="hero-secondary">
            RESCUE ARMADA <ShipWheel size={15} />
          </Link>
        </div>
      </section>

      <div className="landing-frame" aria-hidden="true">
        <img src="/landing-command-frame-transparent.png" alt="" />
      </div>

      <nav className="frame-controls" aria-label="Landing page controls">
        <Link href="/dashboard" className="frame-button frame-dashboard">
          DASHBOARD
        </Link>
        <Link href="/request" className="frame-button frame-contact">
          CONTACT
        </Link>
        <Link href="/map" className="frame-button frame-map">
          MAP
        </Link>
        <Link href="/request" className="frame-button frame-sos">
          SOS
        </Link>
      </nav>
    </main>
  );
}
