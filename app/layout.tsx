import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const calSans = localFont({
  src: "../fonts/CalSansVF.woff2",
  variable: "--font-cal",
  display: "swap",
  weight: "400 700",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoePush",
  description: "简单可靠的消息推送服务，支持钉钉、企业微信、Telegram、Discord 等多种渠道。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={cn(
          inter.variable,
          calSans.variable,
          geistMono.variable,
          "min-h-screen bg-background font-sans antialiased",
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
