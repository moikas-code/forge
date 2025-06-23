import type { Metadata } from 'next'
import Script from 'next/script'
import './tailwind.css'

export const metadata: Metadata = {
  title: 'Forge MOI',
  description: 'Forge MOI - AI-powered development environment',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
      <body>{children}</body>
    </html>
  )
}