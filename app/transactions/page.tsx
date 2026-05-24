'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, EmptyState, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Filter } from 'lucide-react'

const TYPES = ['الكل', 'ماكينة', 'كاش', 'كروت', 'داخلي', 'مصروف']
const STATUSES = ['الكل', 'قيد_المراجعة', 'قيد_التنفيذ', 'تم', 'ملغي', 'مرفوض']

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [typeFilter, setType]   = useState('الكل')
  const [statusFilter, setStatus] = useState('الكل')
  const [dateFilter, setDate]   = useState(new Date().toISOString().split('T')[0])
  const [showNew, setShowNew]   = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  // فورم معاملة جديدة
  const [form, setForm] = useState({
    type: 'ماكينة', operation: '', direction: '',
    amount: '', commission: '', client_amount: '', paid_amount: '',
    payment_type: 'كاش', note: '', wallet_id: '', machine_id: '',
  })
  const [wallets, setWallets]   = useState<any[]>([])
  const [machines, setMachines] = useState<any[]>([])

  const fetchTransactions = async () => {
    let query = supabase
      .from('transactions')
      .select('*, users!customer_id(name, phone)')
      .order('requested_at', { ascending: false })
      .limit(100)

    if (typeFilter !== 'الكل') query = query.eq('type', typeFilter)
    if (statusFilter !== 'الكل') query = query.eq('status', statusFilter)
    if (dateFilter) query = query.gte('requested_at', `${dateFilter}T00:00:00`).lte('requested_at', `${dateFilter}T23:59:59`)

    const { data } = await query
    setTransactions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
    supabase.from('wallets').select('id, company, phone_number').then(r => setWallets(r.data || []))
    supabase.from('machines').select('id, company').then(r => setMachines(r.data || []))
  }, [typeFilter, statusFilter, dateFilter])

  const handleNewTransaction = async () => {
    await supabase.from('transactions').insert({
      employee_id: user?.id,
      type: form.type,
      operation: form.operation,
      direction: form.direction,
      amount: parseFloat(form.amount) || 0,
      commission: parseFloat(form.commission) || 0,
      client_amount: parseFloat(form.client_amount) || 0,
      paid_amount: parseFloat(form.paid_amount) || 0,
      payment_type: form.payment_type,
      note: form.note || null,
      wallet_id: form.wallet_id ? parseInt(form.wallet_id) : null,
      machine_id: form.machine_id ? parseInt(form.machine_id) : null,
      status: 'تم',
      source: 'فيزيائي',
      executed_at: new Date().toISOString(),
    })
    setShowNew(false)
    fetchTransactions()
  }

  const handleDelete = async (id: number) => {
    if (!isAdmin) return
    if (!confirm('هل تأكيد حذف المعاملة؟')) return
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const canEdit = (t: any) => {
    if (isAdmin) return true
    const isToday = new Date(t.executed_at || t.requested_at).toDateString() === new Date().toDateString()
    return t.employee_id === user?.id && isToday
  }

  return (
    <MainLayout>
      <PageHeader
        title="المعاملات"
        subtitle={`${transactions.length} معاملة`}
        action={
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> معاملة جديدة
          </button>
        }
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <input
            type="date"
            className="input w-auto"
            value={dateFilter}
            onChange={e => setDate(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${typeFilter === t ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['العميل', 'النوع', 'العملية', 'القيمة', 'الربح', 'المصدر', 'الوقت', 'الحالة', '']}>
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-white text-sm">{t.users?.name || 'عابر'}</p>
                  <p className="text-slate-500 text-xs">{t.users?.phone}</p>
                </td>
                <td className="py-3 px-4"><span className="badge badge-blue text-xs">{t.type}</span></td>
                <td className="py-3 px-4 text-slate-300 text-sm">{t.operation || '-'}</td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm font-medium">{t.client_amount} ج</p>
                  <p className="text-slate-500 text-xs">فعلي: {t.amount} ج</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-medium text-sm ${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.profit} ج
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`badge text-xs ${t.source === 'أونلاين' ? 'badge-blue' : 'badge-green'}`}>{t.source}</span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs">
                  {new Date(t.requested_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </td>
                <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    {canEdit(t) && (
                      <button onClick={() => setSelected(t)} className="text-xs text-primary-400 hover:text-primary-300">تعديل</button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300">حذف</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          {transactions.length === 0 && <EmptyState message="لا توجد معاملات" />}
        </div>
      )}

      {/* New Transaction Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="معاملة جديدة">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">النوع</label>
              <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {['ماكينة', 'كاش', 'كروت', 'داخلي', 'مصروف'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">العملية</label>
              <input className="input" placeholder="تحويل / سحب / شحن..." value={form.operation} onChange={e => setForm({...form, operation: e.target.value})} />
            </div>
          </div>

          {form.type === 'كاش' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">المحفظة</label>
              <select className="input" value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})}>
                <option value="">اختر المحفظة</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.company} - {w.phone_number}</option>)}
              </select>
            </div>
          )}

          {form.type === 'ماكينة' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">الماكينة</label>
              <select className="input" value={form.machine_id} onChange={e => setForm({...form, machine_id: e.target.value})}>
                <option value="">اختر الماكينة</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.company}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">الجهة</label>
            <input className="input" placeholder="رقم الهاتف / اسم المورد..." value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">القيمة الفعلية</label>
              <input className="input" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">العمولة</label>
              <input className="input" type="number" placeholder="0" value={form.commission} onChange={e => setForm({...form, commission: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">المطلوب من العميل</label>
              <input className="input" type="number" value={form.client_amount} onChange={e => setForm({...form, client_amount: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">المدفوع كاش</label>
              <input className="input" type="number" placeholder="0" value={form.paid_amount} onChange={e => setForm({...form, paid_amount: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">نوع الدفع</label>
            <select className="input" value={form.payment_type} onChange={e => setForm({...form, payment_type: e.target.value})}>
              {['كاش', 'رصيد_عميل', 'رصيد_ماكينة'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">ملاحظة</label>
            <textarea className="input resize-none h-16" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          </div>

          <button onClick={handleNewTransaction} className="btn-primary w-full">تسجيل المعاملة</button>
        </div>
      </Modal>
    </MainLayout>
  )
}
