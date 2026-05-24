'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { StatCard, LoadingSpinner, PageHeader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Monitor, CreditCard, TrendingUp, Users, ArrowLeftRight } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats]   = useState<any>(null)
  const [chart, setChart]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [todayRes, netRes, chartRes] = await Promise.all([
        supabase.from('today_report').select('*').single(),
        supabase.from('shop_net_balance').select('*').single(),
        supabase.from('last_30_days_profit').select('*'),
      ])
      setStats({ today: todayRes.data, net: netRes.data })
      setChart(chartRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>

  const { today, net } = stats || {}

  return (
    <MainLayout>
      <PageHeader title="الداشبورد" subtitle="نظرة عامة على المحل" />

      {/* Stats Row 1 - صافي المحل */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="رصيد الدرج"        value={`${net?.drawer_balance?.toLocaleString()} ج`}    icon={<span>💵</span>} color="green" />
        <StatCard title="إجمالي المحافظ"    value={`${net?.total_wallet_balance?.toLocaleString()} ج`} icon={<Wallet size={24}/>} color="blue" />
        <StatCard title="إجمالي الماكينات"  value={`${net?.total_machine_balance?.toLocaleString()} ج`} icon={<Monitor size={24}/>} color="yellow" />
        <StatCard title="إجمالي الكروت"     value={`${net?.total_card_balance?.toLocaleString()} ج`} icon={<CreditCard size={24}/>} color="blue" />
      </div>

      {/* Net Balance */}
      <div className="card mb-6 bg-gradient-to-r from-primary-600/20 to-accent/10 border-primary-600/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">صافي المحل الحقيقي</p>
            <p className="text-4xl font-bold text-white mt-1">{net?.net_balance?.toLocaleString()} ج</p>
            <p className="text-slate-500 text-xs mt-1">بعد خصم التزامات العملاء ({net?.total_customer_liabilities?.toLocaleString()} ج)</p>
          </div>
          <TrendingUp size={48} className="text-primary-400 opacity-50" />
        </div>
      </div>

      {/* Stats Row 2 - اليوم */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="ربح اليوم"          value={`${today?.total_profit?.toLocaleString()} ج`}    color="green"  icon={<TrendingUp size={24}/>} />
        <StatCard title="مصاريف اليوم"       value={`${today?.total_expenses?.toLocaleString()} ج`}  color="red"    icon={<span>📉</span>} />
        <StatCard title="معاملات اليوم"      value={today?.total_transactions}                        color="blue"   icon={<ArrowLeftRight size={24}/>} />
        <StatCard title="أونلاين / فيزيائي"  value={`${today?.online_transactions} / ${today?.physical_transactions}`} color="yellow" icon={<Users size={24}/>} />
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-white font-semibold mb-6">الأرباح - آخر 30 يوم</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chart}>
            <defs>
              <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
              formatter={(v: any) => [`${v} ج`, 'الربح']}
            />
            <Area type="monotone" dataKey="total_profit" stroke="#0ea5e9" fill="url(#profitGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MainLayout>
  )
}
