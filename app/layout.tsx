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
import "./framed-request.css";
import "./framed-request-fix.css";
import "./sos-scroll-surface.css";
import "./table-dashboard.css";
import "./framed-map.css";
import { Suspense } from "react";
import { DispatchProvider } from "../components/dispatch-provider";
import { ScreenTransitionLoader } from "../components/screen-transition-loader";

export const metadata: Metadata = { title: "Den Den Mushi SOS", description: "Grand Line emergency coordination" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <DispatchProvider>
          <Suspense fallback={null}>
            <ScreenTransitionLoader />
          </Suspense>
          {children}
        </DispatchProvider>
      </body>
    </html>
  );
}
