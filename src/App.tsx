import { useState, useEffect } from 'react'
import {
  ShoppingBag,
  BarChart3,
  Package,
  Zap,
  ShieldCheck,
  User,
  Lock,
  EyeOff,
  Eye,
  ArrowRight
} from 'lucide-react'
import { Agentation } from 'agentation'
import { api } from './api/client'
import posSystem from './assets/pos_system_transparent.png'
import Dashboard from './pages/Dashboard'
import Transaksi from './pages/Transaksi'
import Produk from './pages/Produk'
import Restok from './pages/Restok'
import Laporan from './pages/Laporan'
import Pengaturan from './pages/Pengaturan'
import type { Product } from './types'

type PageType = 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan'

export default function App() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('kasirku_is_logged_in') === 'true')
  
  const getInitialPage = (): PageType => {
    const path = window.location.pathname.replace('/', '').toLowerCase()
    const validPages: PageType[] = ['dashboard', 'transaksi', 'produk', 'restok', 'laporan', 'pengaturan']
    return validPages.includes(path as PageType) ? (path as PageType) : 'dashboard'
  }

  const [currentPage, setCurrentPage] = useState<PageType>(getInitialPage)
  const [products, setProducts] = useState<Product[]>([])
  const [emailInput, setEmailInput] = useState('admin@kasir.com')
  const [passwordInput, setPasswordInput] = useState('admin123')
  const [loginError, setLoginError] = useState('')

  const handleNavigate = (page: PageType) => {
    setCurrentPage(page)
    if (window.location.pathname !== `/${page}`) {
      window.history.pushState({}, '', `/${page}`)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '').toLowerCase()
      const validPages: PageType[] = ['dashboard', 'transaksi', 'produk', 'restok', 'laporan', 'pengaturan']
      if (validPages.includes(path as PageType)) {
        setCurrentPage(path as PageType)
      } else {
        setCurrentPage('dashboard')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('kasirku_is_logged_in')
    setIsLoggedIn(false)
    handleNavigate('dashboard')
  }

  useEffect(() => {
    // Fetch products from Hono backend (PostgreSQL)
    api.getProducts()
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const mapped: Product[] = res.data.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category_name || 'Umum',
            price: Number(p.price),
            costPrice: Number(p.cost_price),
            stock: p.stock,
            unit: p.base_unit || 'Pcs',
            minStock: p.min_stock || 5,
            barcode: p.barcode || '-',
            supplier: p.supplier_name || '-',
            description: p.description || '',
            status: p.status || 'Aktif',
            image: p.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80',
            history: Array.isArray(p.history) ? p.history.map((h: any) => ({
              type: h.type,
              amount: Number(h.amount),
              date: new Date(h.created_at || new Date()).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              operator: h.operator_name || 'Admin'
            })) : [],
            units: Array.isArray(p.units) && p.units.length > 0 ? p.units.map((u: any) => ({
              name: u.name,
              price: Number(u.price),
              isDefault: u.is_default || false,
              qty: Number(u.qty) || 1
            })) : [{ name: p.base_unit || 'Pcs', price: Number(p.price), isDefault: true, qty: 1 }]
          }))
          setProducts(mapped)
        }
      })
      .catch(err => {
        console.warn('Backend not reached, using fallback state:', err)
      })
  }, [])

  return (
    <>
      {isLoggedIn ? (
        currentPage === 'dashboard' ? (
          <Dashboard products={products} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : currentPage === 'transaksi' ? (
          <Transaksi products={products} setProducts={setProducts} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : currentPage === 'produk' ? (
          <Produk products={products} setProducts={setProducts} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : currentPage === 'restok' ? (
          <Restok products={products} setProducts={setProducts} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : currentPage === 'laporan' ? (
          <Laporan products={products} onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : (
          <Pengaturan products={products} onNavigate={handleNavigate} onLogout={handleLogout} />
        )
      ) : (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800 relative">
          {/* Left Side (Desktop Only) */}
          <div className="hidden lg:flex flex-col w-1/2 p-16 xl:p-24 relative overflow-hidden justify-between bg-[#F8FAFC] border-r border-slate-100">
            {/* Curved Background Shape */}
            <div className="absolute right-0 top-0 bottom-0 w-[120%] bg-[#EDF4FC] rounded-l-[100%] pointer-events-none transform translate-x-[45%] z-0"></div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="relative bg-[#1B52FF] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                  <ShoppingBag className="w-8 h-8 text-white" />
                  <span className="absolute text-white font-extrabold text-[11px] mt-1.5">K</span>
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">KasirKu</h1>
                  <p className="text-slate-500 text-sm">Aplikasi Kasir Modern</p>
                </div>
              </div>

              {/* Hero & Features Content Container */}
              <div className="my-auto py-8 max-w-[420px] xl:max-w-[460px] text-left">
                {/* Hero Text */}
                <div className="mb-10">
                  <h2 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-[1.2] tracking-tight mb-6">
                    Kelola Penjualan <br />
                    dengan <span className="text-[#1B52FF]">Mudah,</span> <br />
                    Semua dalam <span className="text-[#1B52FF]">Satu</span>
                  </h2>
                  <p className="text-slate-500 text-base leading-relaxed">
                    KasirKu membantu bisnis Anda mencatat penjualan, mengelola stok, dan laporan dengan lebih efisien.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-6">
                  <FeatureItem
                    icon={<BarChart3 className="w-6 h-6" />}
                    title="Laporan Real-time"
                    desc="Pantau penjualan dan bisnis Anda kapan saja secara real-time."
                    bgColor="bg-blue-50 text-blue-600"
                  />
                  <FeatureItem
                    icon={<Package className="w-6 h-6" />}
                    title="Kelola Produk"
                    desc="Atur stok produk, kategori, dan harga dengan mudah."
                    bgColor="bg-emerald-50 text-emerald-600"
                  />
                  <FeatureItem
                    icon={<Zap className="w-6 h-6" />}
                    title="Transaksi Cepat"
                    desc="Proses transaksi lebih cepat dan praktis."
                    bgColor="bg-violet-50 text-violet-600"
                  />
                  <FeatureItem
                    icon={<ShieldCheck className="w-6 h-6" />}
                    title="Aman & Terpercaya"
                    desc="Data bisnis Anda aman dengan sistem keamanan yang andal."
                    bgColor="bg-amber-50 text-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Dot Grid Decoration */}
            <div className="absolute bottom-16 left-16 xl:left-24 opacity-30 pointer-events-none select-none z-10">
              <svg width="80" height="50" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                {[...Array(6)].map((_, col) => 
                  [...Array(4)].map((_, row) => (
                    <circle key={`${col}-${row}`} cx={8 + col * 12} cy={8 + row * 12} r="2" fill="#3B82F6" />
                  ))
                )}
              </svg>
            </div>

            {/* POS Mockup Image */}
            <div className="absolute bottom-20 right-[-100px] xl:right-[-60px] w-[52%] xl:w-[57%] aspect-square z-10 pointer-events-none select-none flex items-center justify-end">
              <img src={posSystem} alt="POS System" className="w-full h-auto object-contain" />
            </div>
          </div>

          {/* Right Side (Form) */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-[#F8FAFC]">
            {/* Mobile Logo Header */}
            <div className="lg:hidden flex flex-col items-center mb-8 z-10 text-center">
              <div className="relative bg-[#1B52FF] w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-4">
                <ShoppingBag className="w-8 h-8 text-white" />
                <span className="absolute text-white font-extrabold text-[11px] mt-1.5">K</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">KasirKu</h1>
              <p className="text-slate-500">Kelola transaksi dengan mudah</p>
            </div>

            {/* Form Card */}
            <div className="bg-white w-full max-w-md rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.04)] border border-slate-100/80 z-10 relative">
              <div className="mb-8 space-y-2 text-left">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl flex items-center gap-2">
                  Selamat Datang Kembali! <span className="inline-block origin-bottom hover:animate-bounce">👋</span>
                </h2>
                <p className="text-slate-500 text-sm">
                  Silakan masuk untuk melanjutkan ke akun Anda
                </p>
              </div>

              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setLoginError('')
                  try {
                    const res = await api.login({ email: emailInput, password: passwordInput })
                    if (res.success) {
                      localStorage.setItem('kasirku_is_logged_in', 'true')
                      setIsLoggedIn(true)
                    } else {
                      setLoginError(res.message || 'Login gagal, periksa email & password Anda.')
                    }
                  } catch (err: any) {
                    setLoginError(err.message || 'Email atau password salah!')
                  }
                }}
              >
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold text-left animate-in fade-in duration-200">
                    ❌ {loginError}
                  </div>
                )}
                {/* Username Input */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 text-left">
                    Email atau Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      placeholder="Masukkan email atau username"
                      className="block w-full pl-11 pr-4 py-4 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all outline-none bg-slate-50/50 text-sm"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 text-left">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      placeholder="Masukkan password"
                      className="block w-full pl-11 pr-12 py-4 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all outline-none bg-slate-50/50 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Lupa password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1B52FF] hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 text-sm"
                >
                  <ArrowRight className="w-5 h-5" />
                  Masuk
                </button>
              </form>

              {/* Footer Text inside Card */}
              <div className="mt-8 text-center text-sm font-medium text-slate-500">
                Belum punya akun? <a href="#" className="text-[#1B52FF] hover:underline">Hubungi administrator</a>
              </div>
            </div>
          </div>

          {/* Centered Desktop Copyright Footer */}
          <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-slate-400 pointer-events-none hidden lg:block z-20">
            © 2024 KasirKu. All rights reserved.
          </div>
        </div>
      )}
      {import.meta.env.DEV && <Agentation />}
    </>
  )
}

function FeatureItem({ icon, title, desc, bgColor }: { icon: React.ReactNode, title: string, desc: string, bgColor: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className={`${bgColor} p-3.5 rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-800 text-base mb-0.5 text-left">{title}</h3>
        <p className="text-slate-500 leading-normal text-xs text-left">{desc}</p>
      </div>
    </div>
  )
}
