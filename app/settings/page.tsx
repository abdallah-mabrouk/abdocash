'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Plus, Save } from 'lucide-react'

type Tab = 'system' | 'referral' | 'cities' | 'cards' | 'banners' | 'questions'

export default function SettingsPage() {
  const [tab, setTab]             = useState<Tab>('system')
  const [settings, setSettings]   = useState<any>(null)
  const [cities, setCities]       = useState<any[]>([])
  const [cardTypes, setCardTypes] = useState<any[]>([])
  const [banners, setBanners]     = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [saved, setSaved]         = useState(false)
  const [newCity, setNewCity]     = useState('')
  const [showCardForm, setShowCardForm]     = useState(false)
  const [showBannerForm, setShowBannerForm] = useState(false)
  const [showQForm, setShowQForm]           = useState(false)
  const [cardForm, setCardForm]   = useState({ company: '', display_name: '', cost_price: '' })
  const [bannerForm, setBannerForm] = useState({ name: '', image_url: '', page_route: '', parameter_value: '' })
  const [qForm, setQForm]         = useState('')

  useEffect(() => {
    const fetch = async () => {
      const [sRes, cRes, ctRes, bRes, qRes] = await Promise.all([
        supabase.from('system_settings').select('*').single(),
        supabase.from('cities').select('*').order('name'),
        supabase.from('card_types').select('*').order('company'),
        supabase.from('banners').select('*').order('created_at', { ascending: false }),
        supabase.from('security_questions').select('*'),
      ])
      setSettings(sRes.data)
      setCities(cRes.data || [])
      setCardTypes(ctRes.data || [])
      setBanners(bRes.data || [])
      setQuestions(qRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSaveSettings = async () => {
    await supabase.from('system_settings').update({
      referral_max_invites: settings.referral_max_invites,
      referral_transactions_required: settings.referral_transactions_required,
      referral_reward_amount: settings.referral_reward_amount,
      referral_max_reward: settings.referral_max_reward,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleSystem = async () => {
    const newVal = !settings.is_online
    await supabase.from('system_settings').update({
      is_online: newVal,
      auto_offline_at: newVal ? new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSettings({ ...settings, is_online: newVal })
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

  const addCardType = async () => {
    await supabase.from('card_types').insert({
      company: cardForm.company,
      display_name: cardForm.display_name,
      cost_price: parseFloat(cardForm.cost_price),
    })
    setShowCardForm(false)
    setCardForm({ company: '', display_name: '', cost_price: '' })
    const { data } = await supabase.from('card_types').select('*').order('company')
    setCardTypes(data || [])
  }

  const addBanner = async () => {
    await supabase.from('banners').insert({
      name: bannerForm.name,
      image_url: bannerForm.image_url,
      page_route: bannerForm.page_route || null,
      parameter_value: bannerForm.parameter_value || null,
    })
    setShowBannerForm(false)
    setBannerForm({ name: '', image_url: '', page_route: '', parameter_value: '' })
    const { data } = await supabase.from('banners').select('*').order('created_at', { ascending: false })
    setBanners(data || [])
  }

  const toggleBanner = async (id: number, active: boolean) => {
    await supabase.from('banners').update({ is_active: !active }).eq('id', id)
    setBanners(banners.map(b => b.id === id ? { ...b, is_active: !active } : b))
  }

  const addQuestion = async () => {
    if (!qForm) return
    await supabase.from('security_questions').insert({ question: qForm })
    setQForm('')
    setShowQForm(false)
    const { data } = await supabase.from('security_questions').select('*')
    setQuestions(data || [])
  }

  const toggleQuestion = async (id: number, active: boolean) => {
    await supabase.from('security_questions').update({ is_active: !active }).eq('id', id)
    setQuestions(questions.map(q => q.id === id ? { ...q, is_active: !active } : q))
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'system',    label: '⚙️ النظام' },
    { key: 'referral',  label: '🎁 الإحالة' },
    { key: 'cities',    label: '🏙️ المدن' },
    { key: 'cards',     label: '💳 أنواع الكروت' },
    { key: 'banners',   label: '🖼️ البنرات' },
    { key: 'questions', label: '🔐 أسئلة الأمان' },
  ]

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>

  return (
    <MainLayout>
      <PageHeader title="الإعدادات" />

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl">

        {tab === 'system' && (
          <div className="card">
            <h2 className="text-white font-semibold mb-4">حالة النظام</h2>
            <div className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
              <div>
                <p className="text-white font-medium">{settings.is_online ? '🟢 النظام شغال' : '🔴 النظام متوقف'}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {settings.is_online && settings.auto_offline_at
                    ? `يتوقف تلقائياً: ${new Date(settings.auto_offline_at).toLocaleString('ar-EG')}`
                    : 'العملاء لا يمكنهم إرسال طلبات'}
                </p>
              </div>
              <button onClick={toggleSystem} className={`px-5 py-2 rounded-lg font-medium transition-colors ${settings.is_online ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                {settings.is_online ? 'إيقاف' : 'تشغيل'}
              </button>
            </div>
          </div>
        )}

        {tab === 'referral' && (
          <div className="card">
            <h2 className="text-white font-semibold mb-4">إعدادات الإحالة</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: 'أقصى عدد مدعوين',        key: 'referral_max_invites',           isInt: true },
                { label: 'معاملات المدعو المطلوبة', key: 'referral_transactions_required', isInt: true },
                { label: 'قيمة الكاش باك (ج)',      key: 'referral_reward_amount',         isInt: false },
                { label: 'أقصى كاش باك إجمالي (ج)', key: 'referral_max_reward',            isInt: false },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                  <input className="input" type="number" value={settings[f.key]}
                    onChange={e => setSettings({...settings, [f.key]: f.isInt ? parseInt(e.target.value) : parseFloat(e.target.value)})} />
                </div>
              ))}
            </div>
            <button onClick={handleSaveSettings} className="btn-primary flex items-center gap-2">
              <Save size={16} /> {saved ? '✅ تم الحفظ!' : 'حفظ'}
            </button>
          </div>
        )}

        {tab === 'cities' && (
          <div className="card">
            <h2 className="text-white font-semibold mb-4">المدن المتاحة</h2>
            <div className="flex gap-3 mb-4">
              <input className="input flex-1" placeholder="اسم المدينة..." value={newCity}
                onChange={e => setNewCity(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCity()} />
              <button onClick={addCity} className="btn-primary flex items-center gap-2"><Plus size={16} /> إضافة</button>
            </div>
            <div className="space-y-2">
              {cities.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-2.5">
                  <span className={`text-sm ${c.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{c.name}</span>
                  <button onClick={() => toggleCity(c.id, c.is_active)}
                    className={`text-xs px-3 py-1 rounded-lg ${c.is_active ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {c.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'cards' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">أنواع الكروت</h2>
              <button onClick={() => setShowCardForm(true)} className="btn-primary text-sm flex items-center gap-2"><Plus size={14} /> إضافة</button>
            </div>
            <div className="space-y-2">
              {cardTypes.map(c => (
                <div key={c.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{c.display_name}</p>
                    <p className="text-slate-400 text-xs">{c.company} - تكلفة: {c.cost_price} ج</p>
                  </div>
                </div>
              ))}
              {cardTypes.length === 0 && <EmptyState message="لا توجد أنواع كروت" />}
            </div>
          </div>
        )}

        {tab === 'banners' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">البنرات الإعلانية</h2>
              <button onClick={() => setShowBannerForm(true)} className="btn-primary text-sm flex items-center gap-2"><Plus size={14} /> إضافة</button>
            </div>
            <div className="space-y-3">
              {banners.map(b => (
                <div key={b.id} className="bg-dark-700 rounded-lg p-3 flex items-center gap-3">
                  <img src={b.image_url} alt={b.name} className="w-20 h-12 object-cover rounded-lg"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{b.name}</p>
                    {b.page_route && <p className="text-slate-400 text-xs">{b.page_route}</p>}
                  </div>
                  <button onClick={() => toggleBanner(b.id, b.is_active)}
                    className={`text-xs px-3 py-1 rounded-lg ${b.is_active ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {b.is_active ? 'إخفاء' : 'إظهار'}
                  </button>
                </div>
              ))}
              {banners.length === 0 && <EmptyState message="لا توجد بنرات" />}
            </div>
          </div>
        )}

        {tab === 'questions' && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">أسئلة الأمان</h2>
              <button onClick={() => setShowQForm(true)} className="btn-primary text-sm flex items-center gap-2"><Plus size={14} /> إضافة</button>
            </div>
            <div className="space-y-2">
              {questions.map(q => (
                <div key={q.id} className="flex items-center justify-between bg-dark-700 rounded-lg px-4 py-3">
                  <span className={`text-sm ${q.is_active ? 'text-white' : 'text-slate-500 line-through'}`}>{q.question}</span>
                  <button onClick={() => toggleQuestion(q.id, q.is_active)}
                    className={`text-xs px-3 py-1 rounded-lg mr-3 flex-shrink-0 ${q.is_active ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    {q.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showCardForm} onClose={() => setShowCardForm(false)} title="إضافة نوع كارت">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">الشركة</label>
            <input className="input" placeholder="فودافون" value={cardForm.company} onChange={e => setCardForm({...cardForm, company: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">الاسم المعروض</label>
            <input className="input" placeholder="كارت 10 جنيه" value={cardForm.display_name} onChange={e => setCardForm({...cardForm, display_name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">سعر التكلفة</label>
            <input className="input" type="number" value={cardForm.cost_price} onChange={e => setCardForm({...cardForm, cost_price: e.target.value})} />
          </div>
          <button onClick={addCardType} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>

      <Modal open={showBannerForm} onClose={() => setShowBannerForm(false)} title="إضافة بنر">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">الاسم</label>
            <input className="input" value={bannerForm.name} onChange={e => setBannerForm({...bannerForm, name: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">رابط الصورة</label>
            <input className="input" placeholder="https://..." value={bannerForm.image_url} onChange={e => setBannerForm({...bannerForm, image_url: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">الصفحة المرتبطة (اختياري)</label>
            <input className="input" placeholder="/services" value={bannerForm.page_route} onChange={e => setBannerForm({...bannerForm, page_route: e.target.value})} />
          </div>
          <button onClick={addBanner} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>

      <Modal open={showQForm} onClose={() => setShowQForm(false)} title="إضافة سؤال أمان">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">السؤال</label>
            <input className="input" placeholder="ما هو..." value={qForm} onChange={e => setQForm(e.target.value)} />
          </div>
          <button onClick={addQuestion} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>
    </MainLayout>
  )
}
