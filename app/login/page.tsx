'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/supabase'
import { Eye, EyeOff, Phone, Lock } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (phone.length !== 11) {
      setError('رقم الهاتف لازم يكون 11 رقم')
      return
    }

    setLoading(true)
    const { data, error: authError } = await signIn(phone, password)

    if (authError) {
      setError('رقم الهاتف أو كلمة السر غلط')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💰</div>
          <h1 className="text-3xl font-bold text-white">عبده كاش</h1>
          <p className="text-slate-400 mt-2 text-sm">لوحة إدارة الموظفين والأدمن</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">رقم الهاتف</label>
              <div className="relative">
                <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="01xxxxxxxxx"
                  className="input pr-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">كلمة السر</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10 pl-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          لوحة إدارة حصرية للموظفين والإدارة
        </p>
      </div>
    </div>
  )
}
