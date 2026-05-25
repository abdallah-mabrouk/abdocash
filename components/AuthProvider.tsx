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
  const [user, setUser]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
        setLoading(false)

        // لو مش مسجل دخول وراح لصفحة غير login
        if (!userData && pathname !== '/login') {
          router.replace('/login')
          return
        }

        // لو مسجل دخول وراح للـ login
        if (userData && pathname === '/login') {
          router.replace('/dashboard')
          return
        }

        // لو موظف حاول يدخل صفحة أدمن
        if (userData?.role === 'موظف' &&
          ['/dashboard', '/reports', '/employees', '/settings'].includes(pathname)) {
          router.replace('/requests')
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

  // لو لسه بيتحمل، مش بنعرض أي حاجة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
        <div className="text-center">
          <div style={{
            width: 40, height: 40,
            border: '2px solid #0ea5e9',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>جاري التحميل...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
