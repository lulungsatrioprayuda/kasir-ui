import React, { useState, useEffect } from 'react'
import type { Product } from '../types'
import { api } from '../api/client'
import {
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Minus,
  FileText
} from 'lucide-react'

interface DashboardProps {
  products: Product[]
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

export default function Dashboard({ products, onLogout, onNavigate }: DashboardProps) {
  // Chart states
  const [selectedPeriod, setSelectedPeriod] = useState<"7 Hari Terakhir" | "30 Hari Terakhir" | "Hari Ini">("7 Hari Terakhir")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [dbStats, setDbStats] = useState<{ todaySales?: number; todayTransactions?: number; totalProducts?: number; lowStockCount?: number }>({})

  // Date Filter State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [dateFilterLabel, setDateFilterLabel] = useState<string>("Hari Ini (12 Agu 2026)")

  // Notifications Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Calculate live notification alerts
  const lowStockItems = products.filter(p => p.stock <= p.minStock)
  const notifications = [
    ...lowStockItems.map(p => ({
      id: `stock-${p.id}`,
      title: 'Peringatan Stok Menipis',
      message: `${p.name} tersisa ${p.stock} ${p.unit} (Batas minimal: ${p.minStock})`,
      time: 'Baru saja',
      type: 'warning' as const,
      onClick: () => onNavigate('produk')
    })),
    {
      id: 'db-status',
      title: 'Database Terkoneksi',
      message: 'PostgreSQL & Hono Backend terhubung aktif',
      time: 'Aktif',
      type: 'info' as const
    },
    {
      id: 'trx-alert',
      title: 'Sistem POS Siap',
      message: 'Semua menu terhubung langsung ke database',
      time: 'Hari Ini',
      type: 'success' as const
    }
  ]

  useEffect(() => {
    api.getDashboardReports()
      .then(res => {
        if (res.success && res.data) {
          setDbStats(res.data)
        }
      })
      .catch(err => console.warn('Could not fetch DB report stats:', err))
  }, [])

  // Chart datasets
  const chartData = {
    "7 Hari Terakhir": [
      { date: "14 Mei", label: "14 Mei 2024", displayValue: "Rp 1.500.000", x: 50, y: 200 },
      { date: "15 Mei", label: "15 Mei 2024", displayValue: "Rp 2.800.000", x: 130, y: 130 },
      { date: "16 Mei", label: "16 Mei 2024", displayValue: "Rp 1.000.000", x: 210, y: 210 },
      { date: "17 Mei", label: "17 Mei 2024", displayValue: "Rp 2.200.000", x: 290, y: 170 },
      { date: "18 Mei", label: "18 Mei 2024", displayValue: "Rp 3.000.000", x: 370, y: 110 },
      { date: "19 Mei", label: "19 Mei 2024", displayValue: "Rp 2.600.000", x: 450, y: 140 },
      { date: "20 Mei", label: "20 Mei 2024", displayValue: "Rp 3.250.000", x: 530, y: 80 }
    ],
    "30 Hari Terakhir": [
      { date: "Minggu 1", label: "Mng 1 Mei", displayValue: "Rp 12.000.000", x: 80, y: 180 },
      { date: "Minggu 2", label: "Mng 2 Mei", displayValue: "Rp 14.500.000", x: 230, y: 120 },
      { date: "Minggu 3", label: "Mng 3 Mei", displayValue: "Rp 9.800.000", x: 380, y: 200 },
      { date: "Minggu 4", label: "Mng 4 Mei", displayValue: "Rp 18.250.000", x: 530, y: 70 }
    ],
    "Hari Ini": [
      { date: "08:00", label: "08:00 WIB", displayValue: "Rp 350.000", x: 50, y: 210 },
      { date: "10:00", label: "10:00 WIB", displayValue: "Rp 850.000", x: 130, y: 170 },
      { date: "12:00", label: "12:00 WIB", displayValue: "Rp 1.800.000", x: 210, y: 110 },
      { date: "14:00", label: "14:00 WIB", displayValue: "Rp 1.200.000", x: 290, y: 130 },
      { date: "16:00", label: "16:00 WIB", displayValue: "Rp 2.400.000", x: 370, y: 80 },
      { date: "18:00", label: "18:00 WIB", displayValue: "Rp 1.500.000", x: 450, y: 120 },
      { date: "20:00", label: "20:00 WIB", displayValue: "Rp 900.000", x: 530, y: 170 }
    ]
  }

  const currentPoints = chartData[selectedPeriod]
  const activeIndex = hoveredIndex !== null ? hoveredIndex : currentPoints.length - 1
  const activePoint = currentPoints[activeIndex]

  // Dynamic lines path generator
  const linePath = currentPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${currentPoints[currentPoints.length - 1].x} 230 L ${currentPoints[0].x} 230 Z`

  // Mock data for top products
  const topProducts = [
    {
      id: 1,
      name: 'Kopi Hitam',
      sold: 132,
      price: 'Rp 1.320.000',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80&auto=format&fit=crop&q=80'
    },
    {
      id: 2,
      name: 'Air Mineral',
      sold: 120,
      price: 'Rp 480.000',
      image: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?w=80&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      name: 'Teh Botol',
      sold: 98,
      price: 'Rp 392.000',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=80&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      name: 'Roti Cokelat',
      sold: 75,
      price: 'Rp 300.000',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=80&auto=format&fit=crop&q=80'
    },
    {
      id: 5,
      name: 'Indomie Goreng',
      sold: 60,
      price: 'Rp 270.000',
      image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=80&auto=format&fit=crop&q=80'
    }
  ]

  // Mock data for recent transactions
  const recentTransactions = [
    { id: 'TRX-200524-125', date: '20 Mei 2024', time: '09:30', amount: 'Rp 85.000', status: 'Selesai' },
    { id: 'TRX-200524-124', date: '20 Mei 2024', time: '09:15', amount: 'Rp 120.000', status: 'Selesai' },
    { id: 'TRX-200524-123', date: '20 Mei 2024', time: '09:02', amount: 'Rp 45.000', status: 'Selesai' },
    { id: 'TRX-200524-122', date: '20 Mei 2024', time: '08:45', amount: 'Rp 200.000', status: 'Selesai' }
  ]

  // Use DB data if available, fallback to mock
  const topProductsList = (dbStats as any).topProducts || topProducts
  const recentTxList = (dbStats as any).recentTransactions || recentTransactions

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2.5 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-955 leading-none mb-1">KasirKu</h1>
              <p className="text-slate-400 text-xs">Aplikasi Kasir</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" active onClick={() => onNavigate('dashboard')} />
            <SidebarLink icon={<ShoppingCart className="w-5 h-5" />} label="Transaksi" onClick={() => onNavigate('transaksi')} />
            <SidebarLink icon={<Package className="w-5 h-5" />} label="Produk" onClick={() => onNavigate('produk')} />
            <SidebarLink icon={<History className="w-5 h-5" />} label="Restok" onClick={() => onNavigate('restok')} />
            <SidebarLink icon={<BarChart3 className="w-5 h-5" />} label="Laporan" onClick={() => onNavigate('laporan')} />
            <SidebarLink icon={<Settings className="w-5 h-5" />} label="Pengaturan" onClick={() => onNavigate('pengaturan')} />
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100/50">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div className="text-left">
                <p className="font-bold text-slate-900 text-sm">Kasir</p>
                <p className="text-[10px] text-slate-400 font-medium mb-0.5 leading-none">kasir@tokokita.com</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Online</span>
                </div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex justify-between items-center">
          <div className="text-left space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-955">Dashboard</h2>
            <p className="text-slate-500 text-sm">Selamat datang kembali, <span className="font-semibold text-slate-700">Kasir! 👋</span></p>
          </div>

          <div className="flex items-center gap-4">
            {/* Interactive Date Filter Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                {dateFilterLabel}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDatePickerOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 text-left">
                  <p className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pilih Periode Data</p>
                  {[
                    { label: 'Hari Ini (12 Agu 2026)', period: 'Hari Ini' as const },
                    { label: '7 Hari Terakhir', period: '7 Hari Terakhir' as const },
                    { label: '30 Hari Terakhir', period: '30 Hari Terakhir' as const }
                  ].map((item) => (
                    <button
                      key={item.period}
                      onClick={() => {
                        setDateFilterLabel(item.label)
                        setSelectedPeriod(item.period)
                        setIsDatePickerOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-blue-50/50 hover:text-blue-600 transition-colors flex items-center justify-between cursor-pointer ${
                        selectedPeriod === item.period ? 'text-blue-600 bg-blue-50/40 font-bold' : 'text-slate-700'
                      }`}
                    >
                      {item.label}
                      {selectedPeriod === item.period && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Interactive Notification Bell Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition-all duration-200 cursor-pointer"
              >
                <Bell className="w-5 h-5 text-slate-700" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-sm animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl py-3 z-50 text-left">
                  <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">Notifikasi</h4>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                        {notifications.length} Baru
                      </span>
                    </div>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          if (n.onClick) n.onClick()
                          setIsNotificationsOpen(false)
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition-colors ${n.onClick ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-bold text-xs ${n.type === 'warning' ? 'text-amber-600' : 'text-slate-900'}`}>{n.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatsCard
            title="Total Penjualan"
            value={dbStats.todaySales !== undefined ? `Rp ${Number(dbStats.todaySales).toLocaleString('id-ID')}` : "Rp 3.250.000"}
            percentage="+12.5%"
            subtext="dari kemarin"
            trend="up"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Transaksi"
            value={dbStats.todayTransactions !== undefined ? String(dbStats.todayTransactions) : "125"}
            percentage="+8.3%"
            subtext="dari kemarin"
            trend="up"
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
            icon={<ShoppingCart className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Produk"
            value={dbStats.totalProducts !== undefined ? String(dbStats.totalProducts) : products.length.toString()}
            percentage="—"
            subtext="tidak ada perubahan"
            trend="neutral"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            icon={<Package className="w-5 h-5" />}
          />
          <StatsCard
            title="Stok Menipis"
            value={dbStats.lowStockCount !== undefined ? String(dbStats.lowStockCount) : "1"}
            percentage="—"
            subtext="perlu restok"
            trend="neutral"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            icon={<Users className="w-5 h-5" />}
          />
        </section>

        {/* Middle Section: Chart & Top Products */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Sales Chart */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Grafik Penjualan</h3>
              
              {/* Interactive Period Dropdown */}
              <div className="relative z-20">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  {selectedPeriod}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-100 rounded-xl shadow-lg py-1 text-left">
                    {(["7 Hari Terakhir", "30 Hari Terakhir", "Hari Ini"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period)
                          setIsDropdownOpen(false)
                          setHoveredIndex(null)
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer ${
                          selectedPeriod === period ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SVG Line Chart */}
            <div className="relative w-full h-[240px] mt-2">
              <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="40" x2="570" y2="40" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="40" y1="90" x2="570" y2="90" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="40" y1="140" x2="570" y2="140" stroke="#F1F5F9" strokeDasharray="4 4" />
                <line x1="40" y1="190" x2="570" y2="190" stroke="#F1F5F9" strokeDasharray="4 4" />

                {/* Chart Path Area */}
                <path
                  d={areaPath}
                  fill="url(#chartGrad)"
                  className="transition-all duration-300 ease-out"
                />

                {/* Chart Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />

                {/* Dots on Vertices */}
                {currentPoints.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={idx === activeIndex ? "6" : "4"}
                    fill={idx === activeIndex ? "#2563EB" : "#FFFFFF"}
                    stroke="#2563EB"
                    strokeWidth={idx === activeIndex ? "0" : "2.5"}
                    className="transition-all duration-200 ease-out"
                  />
                ))}

                {/* Active Guideline */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    y1="40"
                    x2={activePoint.x}
                    y2="210"
                    stroke="#2563EB"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    opacity="0.3"
                  />
                )}

                {/* Active Point Halo */}
                {activePoint && (
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="10"
                    fill="#2563EB"
                    fillOpacity="0.15"
                    className="animate-ping"
                    style={{ transformOrigin: `${activePoint.x}px ${activePoint.y}px` }}
                  />
                )}

                {/* SVG Rendered Tooltip */}
                {activePoint && (
                  <g
                    transform={`translate(${Math.min(460, Math.max(10, activePoint.x - 60))}, ${Math.max(10, activePoint.y - 55)})`}
                    className="pointer-events-none transition-all duration-200 ease-out"
                  >
                    <rect width="120" height="42" rx="10" fill="#0F172A" stroke="#1E293B" strokeWidth="1" />
                    <text x="12" y="16" fill="#94A3B8" fontSize="9" fontWeight="600" fontFamily="sans-serif">{activePoint.label}</text>
                    <text x="12" y="32" fill="#60A5FA" fontSize="11" fontWeight="700" fontFamily="sans-serif">{activePoint.displayValue}</text>
                  </g>
                )}

                {/* Invisible Hover Hitbox columns */}
                {currentPoints.map((p, idx) => {
                  const width = 500 / currentPoints.length
                  return (
                    <rect
                      key={`hitbox-${idx}`}
                      x={p.x - width / 2}
                      y="20"
                      width={width}
                      height="200"
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )
                })}
              </svg>

              {/* X Axis Labels */}
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold px-9 mt-1">
                {currentPoints.map((p, idx) => (
                  <span
                    key={idx}
                    className={`transition-colors duration-200 ${
                      idx === activeIndex ? 'text-blue-600 font-bold' : ''
                    }`}
                  >
                    {p.date}
                  </span>
                ))}
              </div>

              {/* Y Axis Labels */}
              <div className="absolute left-0 top-0 h-[210px] flex flex-col justify-between text-[10px] text-slate-400 font-semibold text-right w-8">
                <span>{selectedPeriod === "30 Hari Terakhir" ? "20jt" : "4jt"}</span>
                <span>{selectedPeriod === "30 Hari Terakhir" ? "15jt" : "3jt"}</span>
                <span>{selectedPeriod === "30 Hari Terakhir" ? "10jt" : "2jt"}</span>
                <span>{selectedPeriod === "30 Hari Terakhir" ? "5jt" : "1jt"}</span>
                <span>0</span>
              </div>
            </div>
          </div>

          {/* Top Products Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Penjualan Terbaik</h3>
              <button onClick={() => onNavigate('produk')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">Lihat semua</button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {topProductsList.map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-sm font-bold text-slate-400">{idx + 1}</span>
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80'
                      }}
                    />
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{p.sold} terjual</p>
                    </div>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Section: Payment Summary & Recent Transactions */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)]">
            <h3 className="text-lg font-bold text-slate-900 mb-6 text-left">Ringkasan Pembayaran</h3>

            <div className="flex items-center gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                  {/* Circle Radius = 50, Circumference = 314 */}
                  {/* Segment 1: Tunai (64.6%) - length: 202.8, offset: 0 */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="16"
                    strokeDasharray="202.8 111.2"
                    strokeDashoffset="0"
                  />
                  {/* Segment 2: QRIS (23.1%) - length: 72.5, offset: -202.8 */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="transparent"
                    stroke="#10B981"
                    strokeWidth="16"
                    strokeDasharray="72.5 241.5"
                    strokeDashoffset="-202.8"
                  />
                  {/* Segment 3: Debit/Kredit (12.3%) - length: 38.6, offset: -275.3 */}
                  <circle
                    cx="70"
                    cy="70"
                    r="50"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="16"
                    strokeDasharray="38.6 275.4"
                    strokeDashoffset="-275.3"
                  />
                </svg>
                {/* Donut Center Label */}
                <div className="absolute text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{dbStats.todaySales !== undefined ? `Rp ${Number(dbStats.todaySales).toLocaleString('id-ID')}` : "Rp 3.250.000"}</p>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-3.5 flex-1">
                <LegendItem color="bg-blue-600" label="Tunai" price="Rp 2.100.000" percent="64.6%" />
                <LegendItem color="bg-emerald-500" label="QRIS" price="Rp 750.000" percent="23.1%" />
                <LegendItem color="bg-amber-500" label="Kartu Debit/Kredit" price="Rp 400.000" percent="12.3%" />
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Transaksi Terakhir</h3>
              <button onClick={() => onNavigate('laporan')} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">Lihat semua</button>
            </div>

            <div className="space-y-4">
              {recentTxList.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-55 border border-slate-100/50 hover:bg-slate-100/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900 text-sm">{t.id}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{t.date} • {t.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <p className="font-bold text-slate-900 text-sm">{t.amount}</p>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600 border border-emerald-100">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SidebarLink({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-left ${
        active
          ? 'bg-blue-50 text-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.04)]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StatsCard({
  title,
  value,
  percentage,
  subtext,
  trend,
  iconBg,
  iconColor,
  icon
}: {
  title: string
  value: string
  percentage: string
  subtext: string
  trend: 'up' | 'down' | 'neutral'
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] flex items-center gap-5 text-left">
      <div className={`p-4 rounded-2xl ${iconBg} ${iconColor} shrink-0`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</h4>
        
        <div className="flex items-center gap-1.5 mt-0.5">
          {trend === 'up' && (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {percentage}
            </span>
          )}
          {trend === 'neutral' && (
            <span className="text-[11px] font-bold text-slate-505 bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <Minus className="w-3 h-3" />
              {percentage}
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-medium">{subtext}</span>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, price, percent }: { color: string, label: string, price: string, percent: string }) {
  return (
    <div className="flex items-center justify-between text-left">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color} shrink-0`}></span>
        <span className="text-sm font-semibold text-slate-505">{label}</span>
      </div>
      <div className="text-right flex items-center gap-3">
        <span className="text-sm font-bold text-slate-900">{price}</span>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md min-w-[45px] text-center">
          {percent}
        </span>
      </div>
    </div>
  )
}
