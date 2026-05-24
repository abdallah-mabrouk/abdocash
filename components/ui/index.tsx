import clsx from 'clsx'

// =====================
// StatCard - بطاقة إحصائية
// =====================
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red'
}

export function StatCard({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) {
  const colors = {
    blue:   'from-blue-600/20 to-blue-600/5 border-blue-600/20',
    green:  'from-green-600/20 to-green-600/5 border-green-600/20',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-600/20',
    red:    'from-red-600/20 to-red-600/5 border-red-600/20',
  }
  const iconColors = {
    blue: 'text-blue-400', green: 'text-green-400',
    yellow: 'text-yellow-400', red: 'text-red-400',
  }

  return (
    <div className={clsx('card bg-gradient-to-br border', colors[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {icon && <div className={clsx('text-2xl', iconColors[color])}>{icon}</div>}
      </div>
    </div>
  )
}

// =====================
// Badge - حالة المعاملة
// =====================
const statusMap: Record<string, string> = {
  'قيد_المراجعة': 'badge-yellow',
  'قيد_التنفيذ':  'badge-blue',
  'تم':           'badge-green',
  'ملغي':         'badge-gray',
  'مرفوض':        'badge-red',
  'نشط':          'badge-green',
  'موقوف':        'badge-red',
  'معلق':         'badge-yellow',
  'متاح':         'badge-green',
  'مستخدم':       'badge-gray',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={clsx('badge', statusMap[status] || 'badge-gray')}>
      {status}
    </span>
  )
}

// =====================
// PageHeader - رأس الصفحة
// =====================
export function PageHeader({ title, subtitle, action }: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// =====================
// EmptyState
// =====================
export function EmptyState({ message = 'لا توجد بيانات' }: { message?: string }) {
  return (
    <div className="text-center py-16 text-slate-500">
      <p className="text-4xl mb-3">📭</p>
      <p>{message}</p>
    </div>
  )
}

// =====================
// LoadingSpinner
// =====================
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// =====================
// Table - جدول بيانات
// =====================
export function Table({ headers, children }: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {headers.map((h, i) => (
              <th key={i} className="text-right text-slate-400 font-medium py-3 px-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  )
}

// =====================
// Modal
// =====================
export function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
