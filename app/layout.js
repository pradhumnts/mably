import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "%s | Mably",
    default: "Mably - Client Experience Made Easy",
  },
  description: "Manage your clients and their information with ease",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PostHogProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          {/* Mobile block — shown only on screens smaller than lg */}
          <div className="lg:hidden fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-8 bg-white px-8 text-center">
            <img
              src="/images/Logo-SVG.svg"
              alt="Mably"
              className="h-8 w-auto"
              draggable="false"
            />
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">
                Mobile coming soon
              </h1>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                We&apos;re working on a mobile experience — it won&apos;t be long! For now, open Mably on your laptop or desktop.
              </p>
            </div>
            <a
              href="https://mably.io"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:opacity-90 transition-opacity"
            >
              Go back to mably.io
            </a>
          </div>

          {/* Desktop content */}
          <div className="hidden lg:block">
            {children}
          </div>
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
