import React from "react"
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css'
import ClientProviders from '@/components/client-providers'

const gagalin = localFont({
  src: '../public/fonts/Gagalin-Regular.otf',
  variable: '--font-gagalin',
  display: 'swap',
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'MAIMA - Machine-AI for Managed Actions',
  description: 'Intent-based smart wallet with AI-powered automation, multisig security, and real-time Chainlink CRE execution',
  keywords: ['smart wallet', 'intent', 'AI', 'automation', 'Chainlink', 'crypto'],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${gagalin.variable} ${geist.variable} ${geistMono.variable}`}>
      <body className={`${geist.className} antialiased bg-background text-foreground min-h-screen`}>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Analytics />
      </body>
    </html>
  )
}
