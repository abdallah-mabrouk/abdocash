'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Search } from 'lucide-react'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [cities, setCities]       = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [resetModal, setResetModal] = useState<any>(null)
  const [newPass, setNewPass]     = useState('')
  const [loading, setLoading]     = useState(true)
  const { user } = useAuth()

  const [form, setForm] = useState({
    name: '', phone: '', password: '', city_id: '', role: 'موظف',
  })

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .in('role', ['موظف', 'أدمن'])
      .order('created_at', { ascending: false })
    setEmployees(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchEmployees()
    supabase.from('cities').select('*').eq('is_active', true).then(r => setCities(r.data || []))
  }, [])

  const handleAdd = async () => {
    const email = `${form.phone}@abdo.cash.com`
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password: form.password,
      email_confirm: true,
    })
    if (error || !authData.user) return

    await supabase.from('users').insert({
      id: authData.user.id,
      name: form.name,
      phone: form.phone,
      city_id: form.city_id ? parseInt(form.city_id) : null,
      role: form.role,
      status: 'نشط',
      registration_source: 'أدمن',
    })
    setShowAdd(false)
    fetchEmployees()
  }

  const handleResetPassword = async () => {
    if (!resetModal || !newPass) return
    await supabase.auth.admin.updateUserById(resetModal.id, { password: newPass })
    await supabase.from('users').update({ force_password_change: true }).eq('id', resetModal.id)
    setResetModal(null)
    setNewPass('')
    alert('تم تغيير كلمة السر بنجاح')
  }

  const toggleStatus = async (id: string, status: string) => {
    await supabase.from('users').update({ status: status === 'نشط' ? 'موقوف' : 'نشط' }).eq('id', id)
    fetchEmployees()
  }

  const filtered = employees.filter(e =>
    e.name?.includes(search) || e.phone?.includes(search)
  )

  return (
    <MainLayout>
      <PageHeader
        title="الموظفين"
        subtitle={`${employees.length} موظف`}
        action={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة موظف
          </button>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pr-10" placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['الموظف', 'الهاتف', 'الصلاحية', 'آخر ظهور', 'الحالة', '']}>
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {e.name?.charAt(0)}
                    </div>
                    <p className="text-white font-medium text-sm">{e.name}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300 text-sm">{e.phone}</td>
                <td className="py-3 px-4">
                  <span className={`badge text-xs ${e.role === 'أدمن' ? 'badge-blue' : 'badge-green'}`}>{e.role}</span>
                </td>
                <td className="py-3 px-4 text-slate-400 text-xs">
                  {e.last_seen ? new Date(e.last_seen).toLocaleString('ar-EG') : 'لم يدخل بعد'}
                </td>
                <td className="py-3 px-4"><StatusBadge status={e.status} /></td>
                <td className="py-3 px-4">
                  {e.id !== user?.id && (
                    <div className="flex gap-2">
                      <button onClick={() => setResetModal(e)} className="text-xs text-primary-400 hover:text-primary-300">
                        🔑 باسورد
                      </button>
                      <button
                        onClick={() => toggleStatus(e.id, e.status)}
                        className={`text-xs ${e.status === 'نشط' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        {e.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          {filtered.length === 0 && <EmptyState message="لا يوجد موظفون" />}
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة موظف جديد">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">الاسم</label>
              <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">رقم الهاتف</label>
              <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">كلمة السر</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">المدينة</label>
              <select className="input" value={form.city_id} onChange={e => setForm({...form, city_id: e.target.value})}>
                <option value="">اختر</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">الصلاحية</label>
              <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="موظف">موظف</option>
                <option value="أدمن">أدمن</option>
              </select>
            </div>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title={`إعادة تعيين كلمة سر ${resetModal?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">كلمة السر الجديدة</label>
            <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="أدخل كلمة السر الجديدة" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleResetPassword} className="btn-primary flex-1">حفظ</button>
            <button onClick={() => setResetModal(null)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
