import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0b14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | VisualPC",
    default: "VisualPC — Distributed GPU Cloud Monitoring",
  },
  description:
    "Enterprise-grade real-time monitoring and orchestration dashboard for the VisualPC distributed edge-to-cloud GPU computing platform.",
  keywords: ["GPU Cloud", "Distributed Computing", "Telemetry", "Cluster Monitoring", "CUDA", "VisualPC"],
  authors: [{ name: "VisualPC Engineering" }],
  creator: "VisualPC",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://visualpc.vercel.app",
    title: "VisualPC — Distributed GPU Cloud",
    description: "Enterprise-grade real-time monitoring and orchestration dashboard for the VisualPC distributed edge-to-cloud GPU platform.",
    siteName: "VisualPC Console",
  },
  twitter: {
    card: "summary_large_image",
    title: "VisualPC — Distributed GPU Cloud",
    description: "Enterprise-grade real-time monitoring and orchestration dashboard.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased gradient-bg`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
