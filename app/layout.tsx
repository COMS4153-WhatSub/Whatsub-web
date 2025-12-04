import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { ToastProviderWrapper } from "@/components/toast-provider-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WhatSub - Subscription Manager",
  description: "Manage your subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <NotificationProvider>
            <ToastProviderWrapper>
              <Navbar />
              {children}
            </ToastProviderWrapper>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
