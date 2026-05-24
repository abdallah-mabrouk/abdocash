'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, Modal } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus } from 'lucide-react'

export default function WalletsPage() {
  const [wallets, setWallets]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ company: '', phone_number: '', daily_transfer_limit: '', monthly_transfer_limit: '', daily_withdrawal_limit: '', monthly_withdrawal_limit: '' })
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  const fetchWallets = async () => {
    const { data } = await supabase.from('wallet_balances').select('*')
    setWallets(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWallets() }, [])

  const handleAdd = async () => {
    await supabase.from('wallets').insert({
      company: form.company,
      phone_number: form.phone_number,
      daily_transfer_limit: parseFloat(form.daily_transfer_limit) || 0,
      monthly_transfer_limit: parseFloat(form.monthly_transfer_limit) || 0,
      daily_withdrawal_limit: parseFloat(form.daily_withdrawal_limit) || 0,
      monthly_withdrawal_limit: parseFloat(form.monthly_withdrawal_limit) || 0,
    })
    setShowAdd(false)
    fetchWallets()
  }

  const toggleStatus = async (id: number, status: string) => {
    if (!isAdmin) return
    await supabase.from('wallets').update({ status: status === 'نشط' ? 'موقوف' : 'نشط' }).eq('id', id)
    fetchWallets()
  }

  return (
    <MainLayout>
      <PageHeader
        title="المحافظ الإلكترونية"
        subtitle={`${wallets.length} محفظة`}
        action={isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة محفظة
          </button>
        )}
      />

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['المحفظة', 'الرصيد', 'تحويل يومي', 'تحويل شهري', 'سحب يومي', 'سحب شهري', 'الحالة', '']}>
            {wallets.map(w => (
              <tr key={w.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-white font-medium text-sm">{w.company}</p>
                  <p className="text-slate-500 text-xs">{w.phone_number}</p>
                </td>
                <td className="py-3 px-4">
                  <span className={`font-bold ${w.current_balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {w.current_balance?.toLocaleString()} ج
                  </span>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm">{w.daily_transfer_remaining?.toLocaleString()} ج</p>
                  <p className="text-slate-500 text-xs">من {w.daily_transfer_limit?.toLocaleString()}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm">{w.monthly_transfer_remaining?.toLocaleString()} ج</p>
                  <p className="text-slate-500 text-xs">من {w.monthly_transfer_limit?.toLocaleString()}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm">{w.daily_withdrawal_remaining?.toLocaleString()} ج</p>
                  <p className="text-slate-500 text-xs">من {w.daily_withdrawal_limit?.toLocaleString()}</p>
                </td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm">{w.monthly_withdrawal_remaining?.toLocaleString()} ج</p>
                  <p className="text-slate-500 text-xs">من {w.monthly_withdrawal_limit?.toLocaleString()}</p>
                </td>
                <td className="py-3 px-4"><StatusBadge status={w.status} /></td>
                <td className="py-3 px-4">
                  {isAdmin && (
                    <button onClick={() => toggleStatus(w.id, w.status)} className={`text-xs px-3 py-1 rounded-lg transition-colors ${w.status === 'نشط' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      {w.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة محفظة جديدة">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">الشركة</label>
              <input className="input" placeholder="فودافون" value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">رقم المحفظة</label>
              <input className="input" placeholder="010xxxxxxxx" value={form.phone_number} onChange={e => setForm({...form, phone_number: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">حد التحويل اليومي</label>
              <input className="input" type="number" value={form.daily_transfer_limit} onChange={e => setForm({...form, daily_transfer_limit: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">حد التحويل الشهري</label>
              <input className="input" type="number" value={form.monthly_transfer_limit} onChange={e => setForm({...form, monthly_transfer_limit: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">حد السحب اليومي</label>
              <input className="input" type="number" value={form.daily_withdrawal_limit} onChange={e => setForm({...form, daily_withdrawal_limit: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">حد السحب الشهري</label>
              <input className="input" type="number" value={form.monthly_withdrawal_limit} onChange={e => setForm({...form, monthly_withdrawal_limit: e.target.value})} />
            </div>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>
    </MainLayout>
  )
}
