'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, EmptyState, LoadingSpinner, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { CheckCircle, XCircle, Clock, Upload } from 'lucide-react'

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [note, setNote]         = useState('')
  const [amount, setAmount]     = useState('')
  const [commission, setCommission] = useState('')
  const { user } = useAuth()

  const fetchRequests = async () => {
    const { data } = await supabase.from('active_requests').select('*')
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
    // Real-time subscription
    const channel = supabase
      .channel('active_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchRequests)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (id: number, status: string, extraData = {}) => {
    await supabase.from('transactions').update({
      status,
      employee_id: user?.id,
      note: note || null,
      ...extraData,
    }).eq('id', id)
    setSelected(null)
    setNote('')
    fetchRequests()
  }

  const handleExecute = async () => {
    if (!selected) return
    await updateStatus(selected.id, 'تم', {
      amount: parseFloat(amount) || selected.client_amount,
      commission: parseFloat(commission) || 0,
      executed_at: new Date().toISOString(),
      notify_customer: true,
      notify_employee: false,
    })
  }

  return (
    <MainLayout>
      <PageHeader
        title="الطلبات النشطة"
        subtitle={`${requests.length} طلب`}
      />

      {loading ? <LoadingSpinner /> : requests.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-slate-400">لا توجد طلبات نشطة</p>
        </div>
      ) : (
        <div className="card">
          <Table headers={['العميل', 'الخدمة', 'النوع', 'المبلغ', 'المصدر', 'الوقت', 'الحالة', '']}>
            {requests.map(r => (
              <tr key={r.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-white font-medium text-sm">{r.customer_name || 'عابر'}</p>
                  <p className="text-slate-500 text-xs">{r.customer_phone}</p>
                  {r.customer_balance < 0 && (
                    <span className="text-red-400 text-xs">رصيد: {r.customer_balance} ج</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-300 text-sm">{r.service_name}</td>
                <td className="py-3 px-4">
                  <span className="badge badge-blue text-xs">{r.type}</span>
                </td>
                <td className="py-3 px-4 text-white font-medium">{r.client_amount} ج</td>
                <td className="py-3 px-4">
                  <span className={`badge text-xs ${r.source === 'أونلاين' ? 'badge-blue' : 'badge-green'}`}>
                    {r.source}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs">
                  {new Date(r.requested_at).toLocaleTimeString('ar-EG')}
                </td>
                <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => { setSelected(r); setAmount(r.client_amount) }}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    تنفيذ
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Execute Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="تنفيذ الطلب">
        {selected && (
          <div className="space-y-4">
            {/* Details */}
            <div className="bg-dark-700 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">العميل</span><span className="text-white">{selected.customer_name || 'عابر'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">الرصيد</span><span className={selected.customer_balance < 0 ? 'text-red-400' : 'text-green-400'}>{selected.customer_balance} ج</span></div>
              <div className="flex justify-between"><span className="text-slate-400">الخدمة</span><span className="text-white">{selected.service_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">البيانات</span><span className="text-white">{JSON.stringify(selected.data)}</span></div>
            </div>

            {/* Amount & Commission */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">القيمة الفعلية</label>
                <input className="input" value={amount} onChange={e => setAmount(e.target.value)} type="number" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">العمولة</label>
                <input className="input" value={commission} onChange={e => setCommission(e.target.value)} type="number" placeholder="0" />
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">ملاحظة (اختياري)</label>
              <textarea className="input resize-none h-20" value={note} onChange={e => setNote(e.target.value)} placeholder="سبب الرفض أو ملاحظة..." />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleExecute} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> تم التنفيذ
              </button>
              <button onClick={() => updateStatus(selected.id, 'قيد_التنفيذ')} className="btn-secondary flex items-center gap-2">
                <Clock size={16} /> قيد التنفيذ
              </button>
              <button onClick={() => updateStatus(selected.id, 'مرفوض')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm">
                <XCircle size={16} /> رفض
              </button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
