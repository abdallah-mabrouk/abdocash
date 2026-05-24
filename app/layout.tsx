import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'عبده كاش - لوحة الإدارة',
  description: 'نظام إدارة السنترال',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
