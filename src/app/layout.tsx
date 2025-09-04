import SerialProvider from "@/providers/SerialProvider";
import ConnectionGuard from "@/components/ConnectionGuard";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@kuriousdesign/machine-sdk/styles/animations.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Serial Streaming App",
  description: "Next.js app to stream serial data from USB devices",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SerialProvider>
          <ConnectionGuard>{children}</ConnectionGuard>
        </SerialProvider>
      </body>
    </html>
  );
}