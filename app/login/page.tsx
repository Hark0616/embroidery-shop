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
    <div className="min-h-screen bg-mint flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-2xl tracking-[0.15em] text-jungle-deep">
            MENTA<span className="text-gold">.</span>
          </h1>
          <p className="text-jungle-muted text-sm mt-2">Panel de Administración</p>
        </div>

        {/* Formulario */}
        <form action={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
              {error === 'Invalid login credentials' 
                ? 'Email o contraseña incorrectos' 
                : error}
            </div>
          )}

          <div>
            <label 
              htmlFor="email" 
              className="block text-jungle-muted text-xs tracking-wide uppercase mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
                text-jungle-deep placeholder:text-jungle-muted/50
                focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
                transition-colors duration-200"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-jungle-muted text-xs tracking-wide uppercase mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
                text-jungle-deep placeholder:text-jungle-muted/50
                focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
                transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-jungle-deep text-mint text-xs tracking-[0.2em] uppercase
              hover:bg-jungle transition-colors duration-300
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Link para volver */}
        <div className="text-center mt-8">
          <a 
            href="/" 
            className="text-jungle-muted text-xs hover:text-jungle-deep transition-colors"
          >
            ← Volver al sitio
          </a>
        </div>
      </div>
    </div>
  )
}

