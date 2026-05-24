'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Save, Plus, Trash2 } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [cities, setCities]     = useState<any[]>([])
  const [newCity, setNewCity]   = useState('')
  const [loading, setLoading]   = useState(true)
  const [saved, setSaved]       = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const fetch = async () => {
      const [settRes, citiesRes] = await Promise.all([
        supabase.from('system_settings').select('*').single(),
        supabase.from('cities').select('*').order('name'),
      ])
      setSettings(settRes.data)
      setCities(citiesRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    await supabase.from('system_settings').update({
      referral_max_invites:            settings.referral_max_invites,
      referral_transactions_required:  settings.referral_transactions_required,
      referral_reward_amount:          settings.referral_reward_amount,
      referral_max_reward:             settings.referral_max_reward,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleSystem = async () => {
    const newVal = !settings.is_online
    const autoOff = newVal ? new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() : null
    await supabase.from('system_settings').update({
      is_online: newVal,
      auto_offline_at: autoOff,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSettings({ ...settings, is_online: newVal, auto_offline_at: autoOff })
  }

  const addCity = async () => {
    if (!newCity) return
    await supabase.from('cities').insert({ name: newCity })
    setNewCity('')
    const { data } = await supabase.from('cities').select('*').order('name')
    setCities(data || [])
  }

  const toggleCity = async (id: number, active: boolean) => {
    await supabase.from('cities').update({ is_active: !active }).eq('id', id)
    setCities(cities.map(c => c.id === id ? { ...c, is_active: !active } : c))
  }

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>

  return (
    <MainLayout>
      <PageHeader title="الإعدادات" />

      <div className="space-y-6 max-w-2xl">

        {/* System Status */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">حالة النظام</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">
                {settings.is_online ? '🟢 النظام شغال' : '🔴 النظام متوقف'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {settings.is_online
                  ? `سيتوقف تلقائياً: ${new Date(settings.auto_offline_at).toLocaleString('ar-EG')}`
                  : 'العملاء لا يمكنهم إرسال طلبات'}
              </p>
            </div>
            <button
              onClick={toggleSystem}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${settings.is_online ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
            >
              {settings.is_online ? 'إيقاف' : 'تشغيل'}
            </button>
          </div>
        </div>

        {/* Referral Settings */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">إعدادات نظام الإحالة</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">أقصى عدد مدعوين</label>
              <input
                className="input" type="number"
                value={settings.referral_max_invites}
                onChange={e => setSettings({...settings, referral_max_invites: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">معاملات المدعو المطلوبة</label>
              <input
                className="input" type="number"
                value={settings.referral_transactions_required}
                onChange={e => setSettings({...settings, referral_transactions_required: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">قيمة الكاش باك (ج)</label>
              <input
                className="input" type="number"
                value={settings.referral_reward_amount}
                onChange={e => setSettings({...settings, referral_reward_amount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">أقصى كاش باك إجمالي (ج)</label>
              <input
                className="input" type="number"
                value={settings.referral_max_reward}
                onChange={e => setSettings({...settings, referral_max_reward: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <button onClick={handleSave} className="btn-primary mt-4 flex items-center gap-2">
            <Save size={16} />
            {saved ? '✅ تم الحفظ!' : 'حفظ الإعدادات'}
          </button>
        </div>

        {/* Cities Management */}
        <div className="card">
          <h2 className="text-white font-semibold mb-4">إدارة المدن</h2>
          <div className="flex gap-3 mb-4">
            <input
              className="input flex-1"
              placeholder="اسم المدينة الجديدة..."
              value={newCity}
              onChange={e => setNewCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCity()}
            />
            <button onClick={addCity} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> إضافة
            </button>
          </div>
          <div className="space-y-2">
            {cities.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-2.5">
                <span className={`text-sm ${c.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{c.name}</span>
                <button
                  onClick={() => toggleCity(c.id, c.is_active)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${c.is_active ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}
                >
                  {c.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </MainLayout>
  )
}
