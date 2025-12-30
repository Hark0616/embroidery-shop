'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/["']/g, "").trim();
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/["']/g, "").trim();

  if (supabaseUrl && !supabaseUrl.startsWith("http")) {
    supabaseUrl = `https://${supabaseUrl}`;
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase Environment Variables missing or invalid");
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}

