'use client'
import { useEffect, useState } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { PageHeader, StatCard, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#0ea5e9', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444']

export default function ReportsPage() {
  const [monthly, setMonthly]   = useState<any>(null)
  const [chart30, setChart30]   = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [monthRes, chartRes, custRes] = await Promise.all([
        supabase.from('current_month_report').select('*').single(),
        supabase.from('last_30_days_profit').select('*'),
        supabase.from('customer_profit_summary').select('*').order('month_revenue', { ascending: false }).limit(10),
      ])
      setMonthly(monthRes.data)
      setChart30(chartRes.data || [])
      setCustomers(custRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  if (loading) return <MainLayout><LoadingSpinner /></MainLayout>

  const pieData = [
    { name: 'ماكينات', value: monthly?.machine_transactions || 0 },
    { name: 'محافظ',   value: monthly?.wallet_transactions || 0 },
  ]

  return (
    <MainLayout>
      <PageHeader title="التقارير" subtitle={`شهر ${monthly?.month}/${monthly?.year}`} />

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="ربح الشهر"       value={`${monthly?.total_profit?.toLocaleString()} ج`}        color="green" />
        <StatCard title="مصاريف الشهر"    value={`${monthly?.total_expenses?.toLocaleString()} ج`}       color="red" />
        <StatCard title="متوسط ربح يومي"  value={`${monthly?.avg_daily_profit?.toFixed(0)} ج`}           color="blue" />
        <StatCard title="متوسط معاملات"   value={`${monthly?.avg_daily_transactions?.toFixed(0)} / يوم`} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Area Chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-white font-semibold mb-6">الأرباح - آخر 30 يوم</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chart30}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="total_profit" stroke="#0ea5e9" fill="url(#g1)" strokeWidth={2} name="الربح" />
              <Area type="monotone" dataKey="expenses"     stroke="#ef4444" fill="url(#g2)" strokeWidth={2} name="المصاريف" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="text-white font-semibold mb-6">توزيع المعاملات</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart - Daily */}
      <div className="card mb-6">
        <h2 className="text-white font-semibold mb-6">عدد المعاملات اليومي</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chart30}>
            <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
            <Bar dataKey="total_transactions" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="المعاملات" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Customers */}
      <div className="card">
        <h2 className="text-white font-semibold mb-6">أفضل 10 عملاء هذا الشهر</h2>
        <div className="space-y-3">
          {customers.map((c, i) => (
            <div key={c.customer_id} className="flex items-center gap-4">
              <span className="text-slate-500 text-sm w-6">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm">{c.name}</span>
                  <span className="text-green-400 text-sm font-medium">{c.month_revenue?.toLocaleString()} ج</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(c.month_revenue / customers[0]?.month_revenue) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-slate-400 text-xs">{c.month_transactions} معاملة</span>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
