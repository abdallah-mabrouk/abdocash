'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Search } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customer_profit_summary')
        .select('*')
        .order('total_transactions', { ascending: false })
      setCustomers(data || [])
      setLoading(false)
    }
    fetchCustomers()
  }, [])

  const fetchTransactions = async (customerId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('requested_at', { ascending: false })
      .limit(20)
    setTransactions(data || [])
  }

  const filtered = customers.filter(c =>
    c.name?.includes(search) || c.phone?.includes(search)
  )

  const handleResetPassword = async (customerId: string, phone: string) => {
    // إعادة تعيين كلمة السر عبر Supabase Admin
    const tempPass = Math.random().toString(36).slice(-8)
    const { error } = await supabase.auth.admin.updateUserById(customerId, { password: tempPass })
    if (!error) {
      await supabase.from('users').update({ force_password_change: true }).eq('id', customerId)
      alert(`كلمة السر الجديدة: ${tempPass}\nأرسلها للعميل عبر الواتساب`)
    }
  }

  return (
    <MainLayout>
      <PageHeader title="العملاء" subtitle={`${customers.length} عميل`} />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pr-10"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['العميل', 'الرصيد', 'المعاملات', 'ربح اليوم', 'ربح الشهر', 'المستوى', 'الحالة', '']}>
            {filtered.map(c => (
              <tr key={c.customer_id} className="hover:bg-white/2 transition-colors cursor-pointer" onClick={() => { setSelected(c); fetchTransactions(c.customer_id) }}>
                <td className="py-3 px-4">
                  <p className="text-white font-medium text-sm">{c.name}</p>
                  <p className="text-slate-500 text-xs">{c.phone}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={c.current_balance < 0 ? 'text-red-400 font-medium' : 'text-green-400 font-medium'}>
                    {c.current_balance?.toLocaleString()} ج
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">{c.total_transactions}</td>
                <td className="py-3 px-4 text-slate-300">{c.today_revenue?.toLocaleString()} ج</td>
                <td className="py-3 px-4 text-slate-300">{c.month_revenue?.toLocaleString()} ج</td>
                <td className="py-3 px-4">
                  <span className="badge badge-blue">⭐ {c.level}</span>
                </td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 px-4 text-primary-400 text-sm">تفاصيل ←</td>
              </tr>
            ))}
          </Table>
          {filtered.length === 0 && <EmptyState message="لا يوجد عملاء مطابقون" />}
        </div>
      )}

      {/* Customer Details Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || ''}>
        {selected && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs">الرصيد</p>
                <p className={`font-bold ${selected.current_balance < 0 ? 'text-red-400' : 'text-green-400'}`}>{selected.current_balance} ج</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs">المستوى</p>
                <p className="text-white font-bold">⭐ {selected.level}</p>
              </div>
              <div className="bg-dark-700 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs">المعاملات</p>
                <p className="text-white font-bold">{selected.total_transactions}</p>
              </div>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetPassword(selected.customer_id, selected.phone)}
                  className="btn-secondary text-sm flex-1"
                >
                  🔑 إعادة تعيين كلمة السر
                </button>
                <button
                  onClick={async () => {
                    const newStatus = selected.status === 'نشط' ? 'موقوف' : 'نشط'
                    await supabase.from('users').update({ status: newStatus }).eq('id', selected.customer_id)
                    setSelected({ ...selected, status: newStatus })
                  }}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${selected.status === 'نشط' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                >
                  {selected.status === 'نشط' ? '🔴 تعطيل' : '🟢 تفعيل'}
                </button>
              </div>
            )}

            {/* Recent Transactions */}
            <div>
              <h3 className="text-white font-medium mb-3 text-sm">آخر المعاملات</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {transactions.map(t => (
                  <div key={t.id} className="bg-dark-700 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-medium">{t.operation || t.type}</p>
                      <p className="text-slate-500 text-xs">{new Date(t.requested_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xs">{t.client_amount} ج</p>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
