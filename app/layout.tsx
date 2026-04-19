import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SplashScreen } from '@/components/SplashScreen'

export const metadata: Metadata = {
  title: 'Theo AI – CLCC Tech Disciples',
  description: 'Spreading God\'s Love Through Intelligent Worship',
  keywords: 'church media, AI worship, live transcription, lyrics, sermon',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SplashScreen />
          {children}
        </Providers>
      </body>
    </html>
  )
}
