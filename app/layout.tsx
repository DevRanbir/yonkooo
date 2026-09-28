import type { Metadata } from "next";
import "./globals.css";
import "./app.css";
import "./dash.css";
import "./landing.css";
import "./onepiece-ui.css";
import "./ocean-override.css";
import "./ocean-layer-fix.css";
import "./parchment-surfaces.css";
import "./single-landing.css";
import "./hero-only.css";
import { DispatchProvider } from "../components/dispatch-provider";

export const metadata: Metadata = { title: "Den Den Mushi SOS", description: "Grand Line emergency coordination" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><DispatchProvider>{children}</DispatchProvider></body></html>;
}
