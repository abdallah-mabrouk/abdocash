'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, Table, LoadingSpinner, EmptyState, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Search, MessageCircle } from 'lucide-react'

export default function ActivationPage() {
  const [pending, setPending]   = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(true)
  const { user } = useAuth()

  const fetchPending = async () => {
    const { data } = await supabase
      .from('users')
      .select('*, cities(name)')
      .eq('status', 'معلق')
      .eq('role', 'عميل')
      .order('created_at', { ascending: false })
    setPending(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPending() }, [])

  const generateCode = () => Math.random().toString(36).slice(-6).toUpperCase()

  const handleSendCode = async (customer: any) => {
    const newCode = generateCode()
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // ساعة

    await supabase.from('users').update({
      activation_code: newCode,
      activation_expires_at: expires,
    }).eq('id', customer.id)

    setSelected(customer)
    setCode(newCode)
  }

  const openWhatsApp = () => {
    const msg = `مرحباً ${selected?.name}، كود تفعيل حسابك في عبده كاش هو:\n\n*${code}*\n\nصالح لمدة ساعة واحدة.`
    const phone = selected?.phone?.replace(/^0/, '20')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleActivate = async (customerId: string) => {
    await supabase.from('users').update({
      status: 'نشط',
      activation_code: null,
      activation_expires_at: null,
    }).eq('id', customerId)
    setSelected(null)
    fetchPending()
  }

  const handleReject = async (customerId: string) => {
    if (!confirm('هل تأكيد رفض هذا الحساب؟')) return
    await supabase.from('users').update({ status: 'موقوف' }).eq('id', customerId)
    fetchPending()
  }

  const filtered = pending.filter(p =>
    p.name?.includes(search) || p.phone?.includes(search)
  )

  return (
    <MainLayout>
      <PageHeader title="تفعيل الحسابات" subtitle={`${pending.length} حساب معلق`} />

      <div className="relative mb-6">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pr-10" placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['العميل', 'الهاتف', 'المدينة', 'الإحالة', 'التسجيل', '']}>
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4 text-white font-medium text-sm">{p.name}</td>
                <td className="py-3 px-4 text-slate-300 text-sm">{p.phone}</td>
                <td className="py-3 px-4 text-slate-400 text-sm">{p.cities?.name || '-'}</td>
                <td className="py-3 px-4">
                  {p.referred_by ? <span className="badge badge-blue text-xs">مدعو</span> : <span className="text-slate-500 text-xs">-</span>}
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString('ar-EG')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={() => handleSendCode(p)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                      <MessageCircle size={12} /> كود
                    </button>
                    <button onClick={() => handleReject(p.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                      رفض
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          {filtered.length === 0 && <EmptyState message="لا توجد حسابات معلقة" />}
        </div>
      )}

      {/* Send Code Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="إرسال كود التفعيل">
        {selected && (
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-2">كود التفعيل لـ {selected.name}</p>
              <p className="text-4xl font-mono font-bold text-primary-400 tracking-widest">{code}</p>
              <p className="text-slate-500 text-xs mt-2">صالح لمدة ساعة</p>
            </div>

            <button onClick={openWhatsApp} className="btn-primary w-full flex items-center justify-center gap-2">
              <MessageCircle size={16} /> إرسال عبر الواتساب
            </button>

            <div className="border-t border-white/5 pt-4">
              <p className="text-slate-400 text-sm mb-3">بعد التحقق من هوية العميل:</p>
              <div className="flex gap-3">
                <button onClick={() => handleActivate(selected.id)} className="flex-1 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium">
                  ✅ تفعيل الحساب
                </button>
                <button onClick={() => setSelected(null)} className="btn-secondary text-sm">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
