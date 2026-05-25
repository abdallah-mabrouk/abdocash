import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// دالة تسجيل الدخول
export async function signIn(phone: string, password: string) {
  const email = `${phone}@abdo.cash.com`
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

// دالة تسجيل الخروج
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// جلب المستخدم الحالي مع بياناته من جدول users
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return null

    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (dbError) {
      console.error('DB Error:', dbError)
      return null
    }

    return data
  } catch (e) {
    console.error('getCurrentUser error:', e)
    return null
  }
}
