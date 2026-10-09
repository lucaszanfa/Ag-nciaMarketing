import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marketing AI Studio",
  description: "Sua equipe de marketing com inteligência artificial.",
};

// Every page depends on live DB state (current user, projects, workflow
// progress) — nothing in this app should be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Kept minimal on purpose: the app chrome (AppShell, current-user fetch)
 * lives in `(app)/layout.tsx` so the `(auth)` route group (login/registrar)
 * doesn't render a sidebar for a user who isn't signed in yet.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
