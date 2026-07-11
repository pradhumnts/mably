import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "@/components/posthog-provider";
import { MobileAccessGate } from "@/components/mobile-access-gate";
import {
  getCanonicalMarketingUrl,
  getMetadataBaseUrl,
  getSocialShareMetadata,
} from "@/lib/marketing/social-share-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultTitle = "Mably — Simple client portal for freelancers";
const defaultDescription =
  "A simple client portal for freelancers — manage client communication, files, feedback, approvals, and project handoff in one branded link.";

export const metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: {
    template: "%s | Mably",
    default: defaultTitle,
  },
  description: defaultDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  ...getSocialShareMetadata({
    title: defaultTitle,
    description: defaultDescription,
    url: getCanonicalMarketingUrl(),
  }),
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
            <MobileAccessGate>{children}</MobileAccessGate>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
