# عبده كاش - لوحة الإدارة

لوحة إدارة للموظفين والأدمن مبنية على Next.js + Supabase

## الإعداد

### 1. استنسخ المشروع
```bash
git clone https://github.com/your-username/abda-cash-admin
cd abda-cash-admin
```

### 2. ثبت الحزم
```bash
npm install
```

### 3. إعداد متغيرات البيئة
انسخ الملف وعدل القيم:
```bash
cp .env.local.example .env.local
```

عدل `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://qhvbfuucbpaskvpudwnj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

الـ Anon Key موجود في:
**Supabase Dashboard → Settings → API → anon public**

### 4. شغّل المشروع محلياً
```bash
npm run dev
```

افتح http://localhost:3000

## الرفع على Vercel

### 1. ارفع على GitHub
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/your-username/abda-cash-admin
git push -u origin main
```

### 2. اربط بـ Vercel
1. افتح vercel.com
2. اضغط "New Project"
3. اختار الـ repo من GitHub
4. في "Environment Variables" أضف:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. اضغط Deploy

## هيكل المشروع

```
abda-cash-admin/
├── app/
│   ├── login/          # صفحة تسجيل الدخول
│   ├── dashboard/      # الداشبورد (أدمن فقط)
│   ├── requests/       # الطلبات النشطة
│   ├── transactions/   # المعاملات
│   ├── customers/      # العملاء
│   ├── wallets/        # المحافظ
│   ├── machines/       # الماكينات
│   ├── cards/          # الكروت
│   ├── services/       # الخدمات
│   ├── employees/      # الموظفين (أدمن فقط)
│   ├── reports/        # التقارير (أدمن فقط)
│   └── settings/       # الإعدادات (أدمن فقط)
├── components/
│   ├── AuthProvider    # إدارة تسجيل الدخول
│   ├── layout/
│   │   ├── Sidebar     # القائمة الجانبية
│   │   └── MainLayout  # الهيكل العام
│   └── ui/
│       └── index       # مكونات مشتركة
└── lib/
    └── supabase        # الاتصال بـ Supabase
```

## الصلاحيات

| الصفحة | أدمن | موظف |
|---|---|---|
| الداشبورد | ✅ | ❌ |
| الطلبات | ✅ | ✅ |
| المعاملات | ✅ | ✅ |
| العملاء | ✅ | ✅ |
| المحافظ | ✅ | ✅ |
| الماكينات | ✅ | ✅ |
| الكروت | ✅ | ✅ |
| الخدمات | ✅ | ✅ |
| الموظفين | ✅ | ❌ |
| التقارير | ✅ | ❌ |
| الإعدادات | ✅ | ❌ |
