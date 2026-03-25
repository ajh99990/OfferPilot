import { AppHeader } from "@/components/app-header";
import { AuthProvider } from "@/components/auth-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Manrope,
  Sora,
} from "next/font/google";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const displayFont = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "OfferPilot AgentOS",
  description: "Mission-driven workspace for job applications and AI-assisted resume strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="zh-CN"
        className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} h-full overflow-hidden antialiased`}
      >
      <body className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <TooltipProvider>
          <AuthProvider>
            <AppHeader />
            <main className="h-0 min-h-0 flex-1 overflow-hidden">{children}</main>
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
