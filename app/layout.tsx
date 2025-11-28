import type React from "react"
import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/lib/language-context"
import { ToastProvider } from "@/components/toast-provider"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata: Metadata = {
  title: "Wexly",
  description: "A modern weekly schedule planner app with drag-and-drop, random schedule generation, and PWA support.",
  generator: "v0.app",
  manifest: "/manifest.json",
  keywords: ["Wexly", "schedule", "productivity", "khmer", "cambodia"],
  authors: [{ name: "Wexly" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wexly.vercel.app/",
    title: "Wexly",
    description:
      "A modern weekly schedule planner app with drag-and-drop, random schedule generation, and PWA support.",
    siteName: "Wexly",
    images: [
      {
        url: "/og-image.jpg?v=1",
        width: 630,
        height: 630,
        alt: " Wexly Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wexly",
    description:
      "A modern weekly schedule planner app with drag-and-drop, random schedule generation, and PWA support.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/icon-192x192.jpg", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.jpg", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.jpg",
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>){
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* <meta name="apple-mobile-web-app-capable" content="yes" /> */}
        <meta name="mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <LanguageProvider>
          {children}
          <ToastProvider />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
