import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymRat AI — Your Personal Fitness Coach",
  description:
    "AI-powered workout planning, progress tracking, and personalized fitness coaching. Log workouts, track PRs, and get expert advice.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GymRat AI",
  },
  keywords: [
    "fitness",
    "workout",
    "AI coach",
    "progress tracker",
    "gym",
    "personal trainer",
  ],
  authors: [{ name: "GymRat AI" }],
  openGraph: {
    title: "GymRat AI — Your Personal Fitness Coach",
    description: "AI-powered workout planning and progress tracking",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--color-card)",
                color: "var(--color-card-foreground)",
                border: "1px solid var(--color-border)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
