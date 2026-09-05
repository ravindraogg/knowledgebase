import type { Metadata } from "next";
import { ThemeRegistry } from "@/components/ThemeRegistry";
import { AuthProvider } from "@/components/AuthProvider";
import { Agentation } from 'agentation';
import { NetworkActivityIndicator } from '@/components/NetworkActivityIndicator';
import "./globals.css";

export const metadata: Metadata = {
  title: "Recalix — Code Knowledge Graph Platform",
  description: "Capture why code exists. Ingest commits, tickets, and slack discussions into an interactive, queryable knowledge graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
        <ThemeRegistry>
          <AuthProvider>
            {children}
            <NetworkActivityIndicator />
             <Agentation />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
