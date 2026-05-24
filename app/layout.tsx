import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';
import ThemeWatcher from '@/components/ThemeWatcher';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
  variable: '--font-heading', // Reuse for both as we want a unified modern look
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'TEXERE.ART | Custom Embroidery',
  description: 'Fabricación bajo pedido. Bordados personalizados.',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-industrial-light text-industrial-black selection:bg-industrial-warning selection:text-industrial-black`}>
        <ThemeWatcher />
        <AnnouncementBar />
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
