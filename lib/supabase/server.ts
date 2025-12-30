import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // Sanitize URL: remove quotes and whitespace that users might accidentally paste
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/["']/g, "").trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/["']/g, "").trim();

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  try {
    const cookieStore = await cookies()

    return createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
}

