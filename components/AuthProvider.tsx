'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: any
  setUser: (user: any) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
        setLoading(false)

        if (!userData && pathname !== '/login') {
          router.push('/login')
          return
        }

        if (userData && pathname === '/login') {
          router.push('/dashboard')
          return
        }

        if (userData?.role === 'موظف' &&
          ['/dashboard', '/reports', '/employees', '/settings'].includes(pathname)) {
          router.push('/requests')
          return
        }

        // تحديث last_seen
        if (userData) {
          await supabase.from('users')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', userData.id)
        }
      } catch (e) {
        setLoading(false)
      }
    }
    init()
  }, [pathname])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context
}
