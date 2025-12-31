'use client'

import { useState } from 'react'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-industrial-black flex items-center justify-center px-4">
      <div className="max-w-sm w-full border border-industrial-gray p-8 bg-white/5 backdrop-blur-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-heading font-black text-2xl tracking-tighter text-industrial-white">
            TEXERE<span className="text-industrial-warning">.ART</span>
          </h1>
          <p className="text-industrial-gray font-mono text-xs mt-2 uppercase tracking-widest">Admin Access</p>
        </div>

        {/* Formulario */}
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-xs font-mono uppercase">
              {error === 'Invalid login credentials'
                ? 'Credenciales Inválidas'
                : error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-industrial-gray text-[10px] tracking-widest uppercase mb-2 font-bold"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-industrial-black border border-industrial-gray text-industrial-white
                focus:outline-none focus:border-industrial-warning
                transition-colors duration-200 placeholder-gray-700 font-mono text-sm"
              placeholder="admin@texere.art"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-industrial-gray text-[10px] tracking-widest uppercase mb-2 font-bold"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-industrial-black border border-industrial-gray text-industrial-white
                focus:outline-none focus:border-industrial-warning
                transition-colors duration-200 placeholder-gray-700 font-mono text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-industrial-warning text-industrial-black font-bold text-sm tracking-widest uppercase
              hover:bg-white transition-colors duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Accediendo...' : 'Entrar'}
          </button>
        </form>

        {/* Link para volver */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-industrial-gray text-xs hover:text-industrial-white transition-colors uppercase tracking-wider font-mono"
          >
            ← Volver al sitio
          </a>
        </div>
      </div>
    </div>
  )
}

