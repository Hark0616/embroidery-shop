'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/actions/auth'

const navItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    name: 'Prendas (Hoodies/Tees)',
    href: '/admin/prendas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
    ),
  },
  {
    name: 'Diseños Bordado',
    href: '/admin/disenos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-industrial-black border-r border-industrial-gray/20 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-industrial-gray/20">
        <Link href="/admin" className="block">
          <h1 className="font-heading font-black text-xl tracking-tighter text-industrial-white">
            TEXERE<span className="text-industrial-warning">.ART</span>
          </h1>
          <p className="text-gray-500 font-mono text-[10px] tracking-widest mt-1 uppercase">
            Admin Console
          </p>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-widest font-mono
                    transition-all duration-200 border-l-2
                    ${isActive
                      ? 'border-industrial-warning bg-white/5 text-industrial-white font-bold'
                      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-industrial-white'
                    }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer con logout */}
      <div className="p-4 border-t border-industrial-gray/20">
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 w-full text-xs uppercase tracking-widest font-mono
              text-gray-400 hover:bg-red-500/10 hover:text-red-500 
              transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar sesión
          </button>
        </form>

        {/* Link al sitio público */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 mt-1 text-xs uppercase tracking-widest font-mono
            text-gray-400 hover:bg-white/5 hover:text-industrial-white 
            transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          Ver sitio
        </a>
      </div>
    </aside>
  )
}

