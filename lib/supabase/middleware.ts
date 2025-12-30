import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    // Si no hay variables de Supabase, permitir acceso sin protección
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Bloquear acceso a /admin si no hay Supabase configurado
      if (request.nextUrl.pathname.startsWith('/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: any) {
            cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }: any) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Proteger rutas /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!user) {
        // No hay sesión, redirigir al login
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      // A01: Broken Access Control Fix
      // Check if user has admin role in app_metadata
      const role = user.app_metadata.role
      if (role !== 'admin') {
        console.warn(`Unauthorized access attempt to /admin by ${user.email}`)
        // Redirigir a home si no es admin
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    // Si está en login y ya tiene sesión, redirigir al admin
    if (request.nextUrl.pathname === '/login' && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (e) {
    // Si algo falla crítico en middleware, permitimos pasar (fail open)
    // para no tumbar el sitio, pero logueamos el error.
    console.error('Middleware Error:', e)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

