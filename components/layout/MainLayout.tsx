'use client'
import Sidebar from './Sidebar'
import { useAuth } from '@/components/AuthProvider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar />
      <main className="flex-1 mr-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
