'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, ChevronLeft } from 'lucide-react'

export default function ServicesPage() {
  const [services, setServices]   = useState<any[]>([])
  const [wallets, setWallets]     = useState<any[]>([])
  const [machines, setMachines]   = useState<any[]>([])
  const [cardTypes, setCardTypes] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [parentId, setParentId]   = useState<number | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<any[]>([])
  const [showAdd, setShowAdd]     = useState(false)
  const [suspendModal, setSuspendModal] = useState<any>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  const [form, setForm] = useState({
    name: '', description: '', type: 'ماكينة',
    machine_id: '', wallet_id: '', card_type_id: '',
    counts_for_reward: false, is_online: true,
  })

  const fetchServices = async (pid: number | null = null) => {
    let data: any[] = []
    if (pid) {
      const res = await supabase.from('services').select('*').eq('parent_id', pid).order('name')
      data = res.data || []
    } else {
      const res = await supabase.from('services').select('*').is('parent_id', null).order('name')
      data = res.data || []
    }
    setServices(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchServices(parentId)
    supabase.from('wallets').select('id, company').then(r => setWallets(r.data || []))
    supabase.from('machines').select('id, company').then(r => setMachines(r.data || []))
    supabase.from('card_types').select('*').then(r => setCardTypes(r.data || []))
  }, [parentId])

  const handleDrillDown = (service: any) => {
    setParentId(service.id)
    setBreadcrumb(prev => [...prev, service])
  }

  const handleBreadcrumb = (index: number) => {
    if (index === -1) {
      setParentId(null)
      setBreadcrumb([])
    } else {
      const item = breadcrumb[index]
      setParentId(item.id)
      setBreadcrumb(prev => prev.slice(0, index + 1))
    }
  }

  const handleAdd = async () => {
    await supabase.from('services').insert({
      name: form.name,
      description: form.description || null,
      type: form.type,
      parent_id: parentId,
      is_primary: parentId === null,
      machine_id: form.machine_id ? parseInt(form.machine_id) : null,
      wallet_id: form.wallet_id ? parseInt(form.wallet_id) : null,
      card_type_id: form.card_type_id ? parseInt(form.card_type_id) : null,
      counts_for_reward: form.counts_for_reward,
      is_online: form.is_online,
    })
    setShowAdd(false)
    fetchServices(parentId)
  }

  const handleToggleStatus = async (service: any) => {
    if (service.status === 'نشط') {
      setSuspendModal(service)
    } else {
      await supabase.from('services').update({ status: 'نشط', suspension_reason: null }).eq('id', service.id)
      fetchServices(parentId)
    }
  }

  const confirmSuspend = async () => {
    await supabase.from('services').update({ status: 'موقوف', suspension_reason: suspendReason }).eq('id', suspendModal.id)
    setSuspendModal(null)
    setSuspendReason('')
    fetchServices(parentId)
  }

  return (
    <MainLayout>
      <PageHeader
        title="الخدمات"
        action={isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة خدمة
          </button>
        )}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={() => handleBreadcrumb(-1)} className="text-primary-400 hover:text-primary-300">الرئيسية</button>
        {breadcrumb.map((b, i) => (
          <span key={b.id} className="flex items-center gap-2">
            <ChevronLeft size={14} className="text-slate-500" />
            <button onClick={() => handleBreadcrumb(i)} className="text-primary-400 hover:text-primary-300">{b.name}</button>
          </span>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : services.length === 0 ? (
        <EmptyState message="لا توجد خدمات في هذا المستوى" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="card hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{s.name}</h3>
                  {s.description && <p className="text-slate-400 text-xs mt-1">{s.description}</p>}
                  {s.suspension_reason && s.status === 'موقوف' && (
                    <p className="text-yellow-400 text-xs mt-1">⚠️ {s.suspension_reason}</p>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-blue text-xs">{s.type}</span>
                {s.counts_for_reward && <span className="badge badge-yellow text-xs">⭐ يحسب</span>}
                {s.is_online && <span className="badge badge-green text-xs">🌐 أونلاين</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDrillDown(s)} className="btn-secondary text-xs flex-1">
                  الخدمات الفرعية
                </button>
                <button
                  onClick={() => handleToggleStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${s.status === 'نشط' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                >
                  {s.status === 'نشط' ? 'تعليق' : 'تفعيل'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة خدمة جديدة">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">اسم الخدمة</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">الوصف (اختياري)</label>
            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">النوع</label>
            <select className="input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['ماكينة', 'كاش', 'كروت', 'داخلي', 'مصروف'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {form.type === 'ماكينة' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">الماكينة</label>
              <select className="input" value={form.machine_id} onChange={e => setForm({...form, machine_id: e.target.value})}>
                <option value="">اختر</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.company}</option>)}
              </select>
            </div>
          )}
          {form.type === 'كاش' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">المحفظة</label>
              <select className="input" value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})}>
                <option value="">اختر</option>
                {wallets.map(w => <option key={w.id} value={w.id}>{w.company}</option>)}
              </select>
            </div>
          )}
          {form.type === 'كروت' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">نوع الكارت</label>
              <select className="input" value={form.card_type_id} onChange={e => setForm({...form, card_type_id: e.target.value})}>
                <option value="">اختر</option>
                {cardTypes.map(c => <option key={c.id} value={c.id}>{c.display_name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.counts_for_reward} onChange={e => setForm({...form, counts_for_reward: e.target.checked})} className="w-4 h-4" />
              يحسب في العداد
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.is_online} onChange={e => setForm({...form, is_online: e.target.checked})} className="w-4 h-4" />
              متاح أونلاين
            </label>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal open={!!suspendModal} onClose={() => setSuspendModal(null)} title="تعليق الخدمة">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">سبب تعليق خدمة <span className="text-white font-medium">{suspendModal?.name}</span></p>
          <textarea className="input resize-none h-24" placeholder="مثال: الخدمة متوقفة من المصدر..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={confirmSuspend} className="btn-primary flex-1">تأكيد التعليق</button>
            <button onClick={() => setSuspendModal(null)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
