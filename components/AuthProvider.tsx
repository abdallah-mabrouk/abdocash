'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      const userData = await getCurrentUser()
      setUser(userData)
      setLoading(false)

      // لو مش مسجل دخول وراح لصفحة غير login
      if (!userData && pathname !== '/login') {
        router.push('/login')
      }

      // لو مسجل دخول وراح للـ login
      if (userData && pathname === '/login') {
        router.push('/dashboard')
      }

      // لو موظف حاول يدخل صفحة الأدمن
      if (userData?.role === 'موظف' && ['/dashboard', '/reports', '/employees', '/settings'].includes(pathname)) {
        router.push('/requests')
      }
    }
    init()

    // تحديث last_seen
    const updateLastSeen = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        await supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', authUser.id)
      }
    }
    updateLastSeen()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
