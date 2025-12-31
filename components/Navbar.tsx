'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-industrial-gray/20 bg-industrial-light/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
            <span className="font-heading font-black text-2xl tracking-tighter text-industrial-black group-hover:text-industrial-gray transition-colors">
              TEXERE<span className="text-industrial-warning">.</span>ART
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-8">
            <Link
              href="/catalog"
              className="font-heading text-sm font-bold uppercase tracking-widest text-industrial-black hover:text-industrial-warning transition-colors"
            >
              Catálogo
            </Link>
            <Link
              href="https://wa.me/573013732290"
              target="_blank"
              className="hidden md:block bg-industrial-black text-industrial-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
