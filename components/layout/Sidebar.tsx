'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { signOut } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, ArrowLeftRight,
  Users, Wallet, Monitor, CreditCard, Settings,
  LogOut, Briefcase, BarChart3, Wrench, Bell
} from 'lucide-react'
import clsx from 'clsx'

const adminLinks = [
  { href: '/dashboard',    label: 'الداشبورد',        icon: LayoutDashboard },
  { href: '/requests',     label: 'الطلبات النشطة',   icon: Bell },
  { href: '/transactions', label: 'المعاملات',         icon: ArrowLeftRight },
  { href: '/customers',    label: 'العملاء',           icon: Users },
  { href: '/wallets',      label: 'المحافظ',           icon: Wallet },
  { href: '/machines',     label: 'الماكينات',         icon: Monitor },
  { href: '/cards',        label: 'الكروت',            icon: CreditCard },
  { href: '/services',     label: 'الخدمات',           icon: Wrench },
  { href: '/employees',    label: 'الموظفين',          icon: Briefcase },
  { href: '/reports',      label: 'التقارير',          icon: BarChart3 },
  { href: '/settings',     label: 'الإعدادات',         icon: Settings },
]

const employeeLinks = [
  { href: '/requests',     label: 'الطلبات النشطة',   icon: Bell },
  { href: '/transactions', label: 'المعاملات',         icon: ArrowLeftRight },
  { href: '/customers',    label: 'العملاء',           icon: Users },
  { href: '/wallets',      label: 'المحافظ',           icon: Wallet },
  { href: '/machines',     label: 'الماكينات',         icon: Monitor },
  { href: '/cards',        label: 'الكروت',            icon: CreditCard },
  { href: '/services',     label: 'الخدمات',           icon: Wrench },
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const links = user?.role === 'أدمن' ? adminLinks : employeeLinks

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 right-0 h-full w-64 bg-dark-800 border-l border-white/5 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-bold text-white">💰 عبده كاش</h1>
        <p className="text-xs text-slate-400 mt-1">لوحة الإدارة</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <span className={clsx('badge text-xs', user?.role === 'أدمن' ? 'badge-blue' : 'badge-green')}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              pathname === href
                ? 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all w-full"
        >
          <LogOut size={18} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  )
}
