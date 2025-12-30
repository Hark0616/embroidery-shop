'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/logger'

export async function login(formData: FormData) {
  const supabase = await createClient()

  if (!supabase) {
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    return {
      error: `Supabase no está configurado. URL: ${hasUrl ? '✓' : '✗'}, Key: ${hasKey ? '✓' : '✗'}. Verifica las variables de entorno en Vercel.`
    }
  }

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  await logAudit('LOGIN', 'auth', { email: data.email })

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  if (supabase) {
    await supabase.auth.signOut()
    await logAudit('LOGOUT', 'auth')
  }
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

