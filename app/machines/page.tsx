'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus } from 'lucide-react'

export default function MachinesPage() {
  const [machines, setMachines] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [company, setCompany]   = useState('')
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  const fetchMachines = async () => {
    const { data } = await supabase.from('machine_balances').select('*')
    setMachines(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchMachines() }, [])

  const handleAdd = async () => {
    await supabase.from('machines').insert({ company })
    setShowAdd(false)
    setCompany('')
    fetchMachines()
  }

  const toggleStatus = async (id: number, status: string) => {
    if (!isAdmin) return
    await supabase.from('machines').update({ status: status === 'نشط' ? 'موقوف' : 'نشط' }).eq('id', id)
    fetchMachines()
  }

  return (
    <MainLayout>
      <PageHeader
        title="ماكينات الشحن"
        subtitle={`${machines.length} ماكينة`}
        action={isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة ماكينة
          </button>
        )}
      />

      {loading ? <LoadingSpinner /> : machines.length === 0 ? (
        <EmptyState message="لا توجد ماكينات" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{m.company}</h3>
                  <StatusBadge status={m.status} />
                </div>
                <span className="text-3xl">🖨️</span>
              </div>
              <div className="bg-dark-700 rounded-lg p-4 text-center mb-4">
                <p className="text-slate-400 text-xs mb-1">الرصيد الحالي</p>
                <p className={`text-2xl font-bold ${m.current_balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {m.current_balance?.toLocaleString()} ج
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => toggleStatus(m.id, m.status)}
                  className={`w-full text-sm py-2 rounded-lg transition-colors ${m.status === 'نشط' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                >
                  {m.status === 'نشط' ? 'تعطيل الماكينة' : 'تفعيل الماكينة'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة ماكينة جديدة">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">اسم الشركة</label>
            <input className="input" placeholder="فوري / أمان / ..." value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>
    </MainLayout>
  )
}
