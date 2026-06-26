import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import Navbar from '@/components/Navbar';
import AnnouncementBar from '@/components/AnnouncementBar';
import ThemeWatcher from '@/components/ThemeWatcher';
import { getWhatsAppConfig } from '@/lib/actions/config';
import { buildWhatsAppContactUrl } from '@/lib/config/whatsapp';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsapp = await getWhatsAppConfig();
  const contactHref = buildWhatsAppContactUrl(whatsapp.phone, whatsapp.message);

  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased bg-industrial-light text-industrial-black selection:bg-industrial-warning selection:text-industrial-black`}>
        <ThemeWatcher />
        <AnnouncementBar />
        <Navbar contactHref={contactHref} />
        <main className="min-h-screen">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
