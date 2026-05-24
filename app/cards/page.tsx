'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatusBadge, Table, LoadingSpinner, Modal, EmptyState } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Plus, Search } from 'lucide-react'

export default function CardsPage() {
  const [summary, setSummary]     = useState<any[]>([])
  const [cards, setCards]         = useState<any[]>([])
  const [cardTypes, setCardTypes] = useState<any[]>([])
  const [search, setSearch]       = useState('')
  const [showAdd, setShowAdd]     = useState(false)
  const [showSell, setShowSell]   = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [newCard, setNewCard]     = useState({ card_type_id: '', code: '', sell_price: '' })
  const { user } = useAuth()
  const isAdmin = user?.role === 'أدمن'

  const fetchData = async () => {
    const [summaryRes, cardsRes, typesRes] = await Promise.all([
      supabase.from('available_cards_summary').select('*'),
      supabase.from('cards').select('*, card_types(company, display_name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('card_types').select('*'),
    ])
    setSummary(summaryRes.data || [])
    setCards(cardsRes.data || [])
    setCardTypes(typesRes.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const handleAddCard = async () => {
    const type = cardTypes.find(t => t.id === parseInt(newCard.card_type_id))
    if (!type) return
    await supabase.from('cards').insert({
      card_type_id: parseInt(newCard.card_type_id),
      code: newCard.code,
      sell_price: parseFloat(newCard.sell_price),
      cost_price: type.cost_price,
      display_name: type.display_name,
      source: 'يدوي',
    })
    setShowAdd(false)
    setNewCard({ card_type_id: '', code: '', sell_price: '' })
    fetchData()
  }

  const handleSellCard = async (card: any, customerId: string) => {
    // تسجيل المعاملة
    const { data: txn } = await supabase.from('transactions').insert({
      customer_id: customerId || null,
      employee_id: user?.id,
      card_id: card.id,
      type: 'كروت',
      operation: 'بيع كارت',
      amount: card.cost_price,
      client_amount: card.sell_price,
      profit: card.sell_price - card.cost_price,
      status: 'تم',
      source: 'فيزيائي',
      executed_at: new Date().toISOString(),
    }).select().single()

    // تحديث الكارت
    await supabase.from('cards').update({
      status: 'مستخدم',
      customer_id: customerId || null,
      transaction_id: txn.data?.id,
      sold_at: new Date().toISOString(),
    }).eq('id', card.id)

    setShowSell(null)
    fetchData()
  }

  const filtered = cards.filter(c =>
    c.card_types?.display_name?.includes(search) ||
    c.card_types?.company?.includes(search) ||
    c.code?.includes(search)
  )

  return (
    <MainLayout>
      <PageHeader
        title="الكروت"
        subtitle={`${cards.filter(c => c.status === 'متاح').length} كارت متاح`}
        action={isAdmin && (
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> إضافة كارت
          </button>
        )}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summary.map(s => (
          <div key={s.id} className="card">
            <p className="text-slate-400 text-xs">{s.company}</p>
            <p className="text-white font-bold text-lg mt-1">{s.display_name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="badge badge-green">{s.available_count} متاح</span>
              <span className="text-slate-400 text-xs">{s.sell_price} ج</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pr-10" placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <Table headers={['النوع', 'الكود', 'سعر التكلفة', 'سعر البيع', 'الحالة', '']}>
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-white/2 transition-colors">
                <td className="py-3 px-4">
                  <p className="text-white text-sm font-medium">{c.card_types?.display_name}</p>
                  <p className="text-slate-500 text-xs">{c.card_types?.company}</p>
                </td>
                <td className="py-3 px-4">
                  {c.status === 'متاح' ? (
                    <span className="font-mono text-primary-400 text-sm">{c.code}</span>
                  ) : (
                    <span className="text-slate-500 text-sm">••••••••</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-300 text-sm">{c.cost_price} ج</td>
                <td className="py-3 px-4 text-white font-medium text-sm">{c.sell_price} ج</td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 px-4">
                  {c.status === 'متاح' && (
                    <button onClick={() => setShowSell(c)} className="btn-primary text-xs py-1.5 px-3">
                      بيع
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          {filtered.length === 0 && <EmptyState message="لا توجد كروت" />}
        </div>
      )}

      {/* Add Card Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="إضافة كارت جديد">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">نوع الكارت</label>
            <select className="input" value={newCard.card_type_id} onChange={e => {
              const type = cardTypes.find(t => t.id === parseInt(e.target.value))
              setNewCard({...newCard, card_type_id: e.target.value, sell_price: type?.sell_price || ''})
            }}>
              <option value="">اختر النوع</option>
              {cardTypes.map(t => <option key={t.id} value={t.id}>{t.display_name} - {t.company}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">كود الشحن</label>
            <input className="input font-mono" placeholder="أدخل الكود" value={newCard.code} onChange={e => setNewCard({...newCard, code: e.target.value})} />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">سعر البيع</label>
            <input className="input" type="number" value={newCard.sell_price} onChange={e => setNewCard({...newCard, sell_price: e.target.value})} />
          </div>
          <button onClick={handleAddCard} className="btn-primary w-full">إضافة</button>
        </div>
      </Modal>

      {/* Sell Modal */}
      <Modal open={!!showSell} onClose={() => setShowSell(null)} title="بيع كارت">
        {showSell && (
          <div className="space-y-4">
            <div className="bg-dark-700 rounded-lg p-4">
              <p className="text-white font-bold">{showSell.card_types?.display_name}</p>
              <p className="text-primary-400 font-mono text-lg mt-1">{showSell.code}</p>
              <p className="text-green-400 mt-2">{showSell.sell_price} ج</p>
            </div>
            <p className="text-slate-400 text-sm">هل تأكيد بيع الكارت ده؟</p>
            <div className="flex gap-3">
              <button onClick={() => handleSellCard(showSell, '')} className="btn-primary flex-1">تأكيد البيع</button>
              <button onClick={() => setShowSell(null)} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  )
}
