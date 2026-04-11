import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration is missing. Check your environment variables.')
  }

  return createBrowserClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
    {
      cookieOptions: {
        name: 'alfred-br-session',
      },
    }
  )
}
