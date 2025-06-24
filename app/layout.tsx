import type { Metadata } from 'next'
import Script from 'next/script'
import './tailwind.css'
import { CommandPalette } from '@/components/ui/cyberpunk/CommandPalette'

export const metadata: Metadata = {
  title: 'Forge MOI',
  description: 'Forge MOI - AI-powered development environment',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" 
          rel="stylesheet" 
        />
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            // Check for saved theme preference or use system preference
            const savedTheme = localStorage.getItem('forge-moi-layout');
            if (savedTheme) {
              try {
                const parsed = JSON.parse(savedTheme);
                const theme = parsed.state?.theme || 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {
                // If parsing fails, check system preference
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', systemTheme === 'dark');
              }
            } else {
              // No saved preference, use system preference
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              document.documentElement.classList.toggle('dark', systemTheme === 'dark');
            }
          `}
        </Script>
      </head>
      <body>
        {children}
        <CommandPalette />
      </body>
    </html>
  )
}