import type React from "react"
import { Anton, Roboto } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { Toaster } from "sonner"
import "./globals.css"

const anton = Anton({ 
  subsets: ["latin"],
  weight: ['400'],
  variable: '--font-anton',
})

const roboto = Roboto({
  subsets: ["latin"],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
})

export const metadata = {
  title: "ReferralInc - Referral Management System",
  description: "Connect candidates with employees for job referrals",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${anton.variable} ${roboto.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
