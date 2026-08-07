import React, { useState } from 'react'
import type { Product } from '../types'
import {
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  Calendar,
  Download,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  ArrowRight,
  Wallet,
  Briefcase,
  Smartphone,
  CreditCard,
  FileText,
  AlertTriangle
} from 'lucide-react'

interface LaporanProps {
  products: Product[]
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

type TabType = 'Ringkasan' | 'Penjualan' | 'Produk' | 'Metode Pembayaran' | 'Stok'

export default function Laporan({ products, onLogout, onNavigate }: LaporanProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Ringkasan')

  // Filter States
  const [periode, setPeriode] = useState('14 Mei 2024 - 20 Mei 2024')
  const [perbandingan, setPerbandingan] = useState('Periode Sebelumnya')
  const [outlet, setOutlet] = useState('Semua Outlet')
  const [kasir, setKasir] = useState('Semua Kasir')

  // Interactive Hover/Selection states for Charts
  const [hoveredSalesIndex, setHoveredSalesIndex] = useState<number | null>(null)
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null)
  
  // Best selling sorting
  const [bestSellingSort, setBestSellingSort] = useState<'qty' | 'omset'>('qty')

  // Pagination states
  const [currentPageNum, setCurrentPageNum] = useState(1)

  // Export dropdown
  const [showExportOptions, setShowExportOptions] = useState(false)

  // Date picker modal/dropdown simulation
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Daily report data (mocked from screenshot/image context)
  const dailyReportData = [
    { tanggal: '20 Mei 2024', penjualan: 2450000, transaksi: 48, rataRata: 51042, labaKotor: 720000, perubahan: 18.6 },
    { tanggal: '19 Mei 2024', penjualan: 1980000, transaksi: 39, rataRata: 50769, labaKotor: 610000, perubahan: 11.2 },
    { tanggal: '18 Mei 2024', penjualan: 1750000, transaksi: 35, rataRata: 50000, labaKotor: 520000, perubahan: 8.4 },
    { tanggal: '17 Mei 2024', penjualan: 2100000, transaksi: 41, rataRata: 51219, labaKotor: 640000, perubahan: -4.2 },
    { tanggal: '16 Mei 2024', penjualan: 1520000, transaksi: 28, rataRata: 54286, labaKotor: 450000, perubahan: -12.4 },
    { tanggal: '15 Mei 2024', penjualan: 1800000, transaksi: 34, rataRata: 52941, labaKotor: 530000, perubahan: 5.8 },
    { tanggal: '14 Mei 2024', penjualan: 850000, transaksi: 20, rataRata: 425000, labaKotor: 290000, perubahan: -2.3 }
  ]

  // Dynamic values computation based on periode
  const isOneDay = periode.includes('20 Mei 2024 - 20 Mei 2024') || periode === 'Hari Ini' || periode === '20 Mei 2024'
  const filteredReportData = isOneDay ? dailyReportData.slice(0, 1) : dailyReportData

  const totalPenjualan = filteredReportData.reduce((acc, curr) => acc + curr.penjualan, 0)
  const totalTransaksi = filteredReportData.reduce((acc, curr) => acc + curr.transaksi, 0)
  const rataRataTransaksi = totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0
  const totalLabaKotor = filteredReportData.reduce((acc, curr) => acc + curr.labaKotor, 0)

  const trendSales = '18.6%'
  const trendTrans = '12.4%'
  const trendAverage = '5.7%'
  const trendProfit = '16.3%'

  // Sales line chart points coordinates (normalized within a 500x200 canvas)
  const salesChartPoints = isOneDay ? [
    { date: '20 Mei', value: 2450000, x: 250, y: 60 }
  ] : [
    { date: '14 Mei', value: 850000, x: 30, y: 170 },
    { date: '15 Mei', value: 1800000, x: 100, y: 110 },
    { date: '16 Mei', value: 1520000, x: 170, y: 130 },
    { date: '17 Mei', value: 2100000, x: 240, y: 90 },
    { date: '18 Mei', value: 1750000, x: 310, y: 115 },
    { date: '19 Mei', value: 1980000, x: 380, y: 98 },
    { date: '20 Mei', value: 2450000, x: 450, y: 60 }
  ]

  // Donut chart segments for payment methods
  const paymentMethods = [
    { label: 'Tunai', percentage: 45.2, value: 5625000, color: '#1B52FF', icon: <Wallet className="w-3.5 h-3.5" /> },
    { label: 'QRIS', percentage: 28.4, value: 3535000, color: '#10B981', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { label: 'Transfer Bank', percentage: 15.7, value: 1955000, color: '#F59E0B', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { label: 'E-Wallet', percentage: 8.1, value: 1010000, color: '#8B5CF6', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { label: 'Lainnya', percentage: 2.6, value: 325000, color: '#6B7280', icon: <Briefcase className="w-3.5 h-3.5" /> }
  ]

  // Mocked products for "Produk Terlaris" (matching screenshot metadata)
  const bestSellers = [
    { name: 'Kopi Hitam', qty: 128, omset: 1280000, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=80&auto=format&fit=crop&q=80' },
    { name: 'Teh Botol', qty: 96, omset: 576000, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=80&auto=format&fit=crop&q=80' },
    { name: 'Roti Cokelat', qty: 75, omset: 600000, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=80&auto=format&fit=crop&q=80' },
    { name: 'Indomie Goreng', qty: 72, omset: 396000, image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=80&auto=format&fit=crop&q=80' },
    { name: 'Air Mineral', qty: 60, omset: 180000, image: 'https://images.unsplash.com/photo-1608885898957-a599fb1ee4b4?w=80&auto=format&fit=crop&q=80' }
  ]

  // Formatter utilities
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID')
  }

  // Generate SVG path for line chart
  const pathD = salesChartPoints.length > 1
    ? salesChartPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : `M ${salesChartPoints[0].x - 50} ${salesChartPoints[0].y} L ${salesChartPoints[0].x} ${salesChartPoints[0].y} L ${salesChartPoints[0].x + 50} ${salesChartPoints[0].y}`
  const areaD = salesChartPoints.length > 1
    ? `${pathD} L ${salesChartPoints[salesChartPoints.length - 1].x} 190 L ${salesChartPoints[0].x} 190 Z`
    : `${pathD} L ${salesChartPoints[0].x + 50} 190 L ${salesChartPoints[0].x - 50} 190 Z`

  // Handle filter submission simulation
  const handleApplyFilter = () => {
    showToast(`Filter berhasil diterapkan: ${periode}`)
  }

  const handleResetFilter = () => {
    setPeriode('14 Mei 2024 - 20 Mei 2024')
    setPerbandingan('Periode Sebelumnya')
    setOutlet('Semua Outlet')
    setKasir('Semua Kasir')
    showToast('Filter berhasil di-reset ke 7 hari terakhir.')
  }

  const handleExportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,Tanggal,Total Penjualan,Total Transaksi,Rata-rata Transaksi,Laba Kotor\n" +
      filteredReportData.map(r => `${r.tanggal},${r.penjualan},${r.transaksi},${r.rataRata},${r.labaKotor}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_${periode.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
    showToast("Laporan Excel berhasil diunduh.");
  }

  const handleExportPDF = () => {
    setShowExportOptions(false);
    showToast("Menyiapkan dokumen PDF...");
    setTimeout(() => {
      window.print();
    }, 500);
  }

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
              <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">KasirKu</h1>
              <p className="text-slate-400 text-xs">Aplikasi Kasir</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <SidebarLink icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" onClick={() => onNavigate('dashboard')} />
            <SidebarLink icon={<ShoppingCart className="w-5 h-5" />} label="Transaksi" onClick={() => onNavigate('transaksi')} />
            <SidebarLink icon={<Package className="w-5 h-5" />} label="Produk" onClick={() => onNavigate('produk')} />
            <SidebarLink icon={<History className="w-5 h-5" />} label="Restok" onClick={() => onNavigate('restok')} />
            <SidebarLink icon={<BarChart3 className="w-5 h-5" />} label="Laporan" active onClick={() => onNavigate('laporan')} />
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
                <p className="font-bold text-slate-900 text-sm">Kasir Utama</p>
                <p className="text-[10px] text-slate-400 font-medium mb-0.5 leading-none">kasir@tokokita.com</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Online</span>
                </div>
              </div>
            </div>
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
      <main className="flex-1 p-8 space-y-6 overflow-y-auto max-w-[1600px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Laporan</h2>
            <p className="text-slate-500 mt-1">Pantau dan analisa performa bisnis toko Anda.</p>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {/* Quick date range picker info display */}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm relative"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{periode}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 text-left">
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Pilih Rentang Waktu</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    {['Hari Ini', 'Kemarin', '7 Hari Terakhir', '30 Hari Terakhir', 'Bulan Ini', 'Tahun Ini'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item === 'Hari Ini') setPeriode('20 Mei 2024 - 20 Mei 2024')
                          else if (item === '7 Hari Terakhir') setPeriode('14 Mei 2024 - 20 Mei 2024')
                          else setPeriode('01 Mei 2024 - 20 Mei 2024')
                          setShowDatePicker(false)
                        }}
                        className="p-2 border border-slate-100 hover:border-blue-500 rounded-lg bg-slate-50 hover:bg-blue-50/20 font-bold transition-all text-slate-700"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Export Dropdown Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export</span>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500" /> Export PDF Laporan
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" /> Export Excel Laporan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="border-b border-slate-200/80 flex items-center gap-6 overflow-x-auto scrollbar-hide py-1">
          {(['Ringkasan', 'Penjualan', 'Produk', 'Metode Pembayaran', 'Stok'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPageNum(1); }}
              className={`pb-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 relative ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Tab Views Switch */}
        {activeTab === 'Ringkasan' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left/Middle area layout (Grid cols span 3) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                 <MetricCard
                  title="Total Penjualan"
                  value={formatRupiah(totalPenjualan)}
                  trend={trendSales}
                  trendUp={true}
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  icon={<BarChart3 className="w-6 h-6" />}
                />
                <MetricCard
                  title="Total Transaksi"
                  value={totalTransaksi.toString()}
                  trend={trendTrans}
                  trendUp={true}
                  iconBg="bg-emerald-50"
                  iconColor="text-emerald-600"
                  icon={<ShoppingCart className="w-6 h-6" />}
                />
                <MetricCard
                  title="Rata-rata Transaksi"
                  value={formatRupiah(rataRataTransaksi)}
                  trend={trendAverage}
                  trendUp={true}
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                  icon={<Wallet className="w-6 h-6" />}
                />
                <MetricCard
                  title="Total Laba Kotor"
                  value={formatRupiah(totalLabaKotor)}
                  trend={trendProfit}
                  trendUp={true}
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                  icon={<ShoppingBag className="w-6 h-6" />}
                />
              </div>

              {/* Graphic Row */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                
                {/* Sales Chart Container (cols span 3) */}
                <div className="xl:col-span-3 bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Grafik Penjualan</h3>
                    <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                      <option>Per Hari</option>
                      <option>Per Jam</option>
                    </select>
                  </div>

                  {/* Interactive SVG Chart */}
                  <div className="relative w-full h-[220px]">
                    <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                      {/* Grid Lines */}
                      <line x1="30" y1="190" x2="450" y2="190" stroke="#F1F5F9" strokeWidth="1" />
                      <line x1="30" y1="140" x2="450" y2="140" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="30" y1="90" x2="450" y2="90" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                      <line x1="30" y1="40" x2="450" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />

                      {/* Area Fill */}
                      <path d={areaD} fill="url(#salesAreaGradient)" />

                      {/* Line Path */}
                      <path d={pathD} fill="none" stroke="#1B52FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Interactive circles/nodes */}
                      {salesChartPoints.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={hoveredSalesIndex === idx ? '7' : '4.5'}
                          fill={hoveredSalesIndex === idx ? '#1B52FF' : '#FFFFFF'}
                          stroke="#1B52FF"
                          strokeWidth="2.5"
                          className="cursor-pointer transition-all duration-150"
                          onMouseEnter={() => setHoveredSalesIndex(idx)}
                          onMouseLeave={() => setHoveredSalesIndex(null)}
                        />
                      ))}

                      {/* Gradients */}
                      <defs>
                        <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1B52FF" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#1B52FF" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Chart tooltip display */}
                    {hoveredSalesIndex !== null && (
                      <div
                        className="absolute bg-slate-900 text-white rounded-xl py-2 px-3 shadow-xl text-left border border-slate-800 pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                          left: `${(salesChartPoints[hoveredSalesIndex].x / 500) * 100}%`,
                          top: `${(salesChartPoints[hoveredSalesIndex].y / 200) * 100 - 8}%`
                        }}
                      >
                        <p className="text-[10px] text-slate-400 font-semibold leading-none mb-1">
                          {salesChartPoints[hoveredSalesIndex].date} 2024
                        </p>
                        <p className="text-xs font-extrabold">
                          {formatRupiah(salesChartPoints[hoveredSalesIndex].value)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date labels below graph */}
                  <div className="flex justify-between items-center px-4 mt-2">
                    {salesChartPoints.map((p, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-bold ${
                          idx === salesChartPoints.length - 1 ? 'text-blue-600 font-extrabold' : 'text-slate-400'
                        }`}
                      >
                        {p.date}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Donut Payment Method Container (cols span 2) */}
                <div className="xl:col-span-2 bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Penjualan Berdasarkan Metode</h3>
                    <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
                      <option>Semua Metode</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
                    {/* Donut SVG */}
                    <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Segments: Tunai (45.2), QRIS (28.4), Bank (15.7), Wallet (8.1), Lainnya (2.6) */}
                        {/* We can compute strokeDasharrays for values: */}
                        {/* Radius=36, Circumference = 226.19 */}
                        <circle cx="50" cy="50" r="36" fill="transparent" stroke="#E2E8F0" strokeWidth="12" />
                        
                        {/* Tunai - 45.2% (dasharray: 102.2 226.19, offset: 0) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#1B52FF"
                          strokeWidth="12.5"
                          strokeDasharray="102.24 226.19"
                          strokeDashoffset="0"
                          className="cursor-pointer transition-all hover:stroke-[14]"
                          onMouseEnter={() => setHoveredDonutIndex(0)}
                          onMouseLeave={() => setHoveredDonutIndex(null)}
                        />
                        
                        {/* QRIS - 28.4% (dasharray: 64.2 226.19, offset: -102.24) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#10B981"
                          strokeWidth="12.5"
                          strokeDasharray="64.24 226.19"
                          strokeDashoffset="-102.24"
                          className="cursor-pointer transition-all hover:stroke-[14]"
                          onMouseEnter={() => setHoveredDonutIndex(1)}
                          onMouseLeave={() => setHoveredDonutIndex(null)}
                        />

                        {/* Transfer Bank - 15.7% (dasharray: 35.5 226.19, offset: -166.48) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#F59E0B"
                          strokeWidth="12.5"
                          strokeDasharray="35.51 226.19"
                          strokeDashoffset="-166.48"
                          className="cursor-pointer transition-all hover:stroke-[14]"
                          onMouseEnter={() => setHoveredDonutIndex(2)}
                          onMouseLeave={() => setHoveredDonutIndex(null)}
                        />

                        {/* E-Wallet - 8.1% (dasharray: 18.3 226.19, offset: -201.99) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#8B5CF6"
                          strokeWidth="12.5"
                          strokeDasharray="18.32 226.19"
                          strokeDashoffset="-201.99"
                          className="cursor-pointer transition-all hover:stroke-[14]"
                          onMouseEnter={() => setHoveredDonutIndex(3)}
                          onMouseLeave={() => setHoveredDonutIndex(null)}
                        />

                        {/* Lainnya - 2.6% (dasharray: 5.88 226.19, offset: -220.31) */}
                        <circle
                          cx="50"
                          cy="50"
                          r="36"
                          fill="transparent"
                          stroke="#6B7280"
                          strokeWidth="12.5"
                          strokeDasharray="5.88 226.19"
                          strokeDashoffset="-220.31"
                          className="cursor-pointer transition-all hover:stroke-[14]"
                          onMouseEnter={() => setHoveredDonutIndex(4)}
                          onMouseLeave={() => setHoveredDonutIndex(null)}
                        />
                      </svg>

                      {/* Center Content */}
                      <div className="absolute text-center select-none pointer-events-none">
                        <p className="text-[10px] text-slate-400 font-bold leading-none mb-0.5 uppercase tracking-wide">Total</p>
                        <p className="text-xs font-black text-slate-800">Rp 12.45M</p>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 flex-1 min-w-[130px]">
                      {paymentMethods.map((pm, idx) => (
                        <div
                          key={pm.label}
                          className={`flex items-center justify-between p-1 rounded-lg transition-colors ${
                            hoveredDonutIndex === idx ? 'bg-slate-50' : 'bg-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pm.color }}></span>
                            <span className="text-[11px] font-bold text-slate-600">{pm.label}</span>
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-700 text-right">
                            {pm.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Daily Sales Table */}
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left">
                <div className="mb-4">
                  <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan Penjualan Per Hari</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-semibold text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-left">
                        <th className="py-3 px-2 font-bold uppercase tracking-wider">Tanggal</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider">Total Penjualan</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-center">Total Transaksi</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider">Rata-rata Transaksi</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider">Laba Kotor</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-center">Perubahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dailyReportData.slice((currentPageNum - 1) * 5, currentPageNum * 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2 font-extrabold text-slate-900">{row.tanggal}</td>
                          <td className="py-4 px-2 font-black text-slate-950">{formatRupiah(row.penjualan)}</td>
                          <td className="py-4 px-2 text-center font-bold text-slate-700">{row.transaksi}</td>
                          <td className="py-4 px-2 text-slate-700">{formatRupiah(row.rataRata)}</td>
                          <td className="py-4 px-2 text-emerald-600 font-extrabold">{formatRupiah(row.labaKotor)}</td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-full font-bold text-[10px] ${
                              row.perubahan >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {row.perubahan >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {row.perubahan >= 0 ? '↑' : '↓'} {Math.abs(row.perubahan)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-bold">
                    Menampilkan {(currentPageNum - 1) * 5 + 1} - {Math.min(currentPageNum * 5, dailyReportData.length)} dari {dailyReportData.length} hari
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPageNum(1)}
                      disabled={currentPageNum === 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={() => setCurrentPageNum(1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        currentPageNum === 1 ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      1
                    </button>
                    <button
                      onClick={() => setCurrentPageNum(2)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                        currentPageNum === 2 ? 'bg-blue-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      2
                    </button>
                    <button
                      onClick={() => setCurrentPageNum(2)}
                      disabled={currentPageNum === 2}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                    >
                      &gt;
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Right sidebar filters & Best Selling Products list (cols span 1) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Filter Panel */}
              <div className="bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="font-extrabold text-slate-800 text-sm">Filter Laporan</h3>
                </div>

                <div className="space-y-3.5 text-xs font-bold text-slate-700">
                  {/* Periode */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Periode</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={periode}
                        onChange={(e) => setPeriode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Perbandingan */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Perbandingan</label>
                    <select
                      value={perbandingan}
                      onChange={(e) => setPerbandingan(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                    >
                      <option>Periode Sebelumnya</option>
                      <option>Bulan Sebelumnya</option>
                      <option>Tahun Sebelumnya</option>
                    </select>
                  </div>

                  {/* Toko / Outlet */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Toko / Outlet</label>
                    <select
                      value={outlet}
                      onChange={(e) => setOutlet(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                    >
                      <option>Semua Outlet</option>
                      <option>Outlet Pusat</option>
                      <option>Cabang Surabaya</option>
                    </select>
                  </div>

                  {/* Kasir */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">Kasir</label>
                    <select
                      value={kasir}
                      onChange={(e) => setKasir(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                    >
                      <option>Semua Kasir</option>
                      <option>Kasir Utama</option>
                      <option>Budi Santoso</option>
                      <option>Siti Aminah</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleApplyFilter}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Terapkan Filter
                  </button>
                  <button
                    onClick={handleResetFilter}
                    className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3 text-slate-400" />
                    Reset Filter
                  </button>
                </div>
              </div>

              {/* Best Selling Products List */}
              <div className="bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Produk Terlaris</h3>
                  <select
                    value={bestSellingSort}
                    onChange={(e) => setBestSellingSort(e.target.value as 'qty' | 'omset')}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer"
                  >
                    <option value="qty">Berdasarkan Qty</option>
                    <option value="omset">Berdasarkan Omset</option>
                  </select>
                </div>

                {/* Items loop */}
                <div className="space-y-3">
                  {bestSellers
                    .sort((a, b) => (bestSellingSort === 'qty' ? b.qty - a.qty : b.omset - a.omset))
                    .map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-3">
                        {/* Number indicator */}
                        <span className="w-5 text-center text-xs font-black text-slate-400">
                          {idx + 1}
                        </span>

                        {/* Image */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                        />

                        {/* Info details */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate leading-tight mb-0.5">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold leading-none">
                            {item.qty} terjual
                          </p>
                        </div>

                        {/* Omset cost */}
                        <span className="text-[11px] font-black text-slate-800 text-right">
                          {formatRupiah(item.omset)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Foot button redirect */}
                <button
                  onClick={() => onNavigate('produk')}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 mt-2"
                >
                  Lihat Semua Produk
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Penjualan Tab Content */}
        {activeTab === 'Penjualan' && (
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Analisa Penjualan Terperinci</h3>
              <p className="text-slate-400 text-xs mt-1">Lacak dan bandingkan perolehan transaksi per-kategori.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <CategoryMetrics label="Minuman" revenue={5200000} count={130} progress={65} color="bg-blue-600" />
              <CategoryMetrics label="Makanan" revenue={3800000} count={95} progress={48} color="bg-emerald-600" />
              <CategoryMetrics label="Snack" revenue={2450000} count={60} progress={30} color="bg-amber-600" />
              <CategoryMetrics label="Bahan Dapur" revenue={1000000} count={25} progress={12} color="bg-purple-600" />
            </div>

            <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
              <h4 className="font-bold text-slate-800 text-sm mb-3">Tren Volume Transaksi</h4>
              <div className="flex items-end justify-between h-40 pt-4 px-2">
                {[45, 60, 35, 70, 85, 90, 110].map((height, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-6/12 bg-blue-100 group-hover:bg-blue-500 rounded-t-lg transition-all duration-200 relative" style={{ height: `${height}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-850 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {height}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">1{idx + 4} Mei</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Produk Tab Content */}
        {activeTab === 'Produk' && (
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Performa Produk & Kategori</h3>
              <p className="text-slate-400 text-xs mt-1">Analisa performa barang-barang dagangan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-100 rounded-2xl p-5">
                <h4 className="font-bold text-slate-800 text-sm mb-4">Kontribusi Omset Per Kategori</h4>
                <div className="space-y-3.5">
                  <ProgressBarItem label="Minuman" percent={45} value="Rp 5.602.000" color="bg-blue-600" />
                  <ProgressBarItem label="Makanan" percent={30} value="Rp 3.735.000" color="bg-emerald-600" />
                  <ProgressBarItem label="Snack" percent={18} value="Rp 2.241.000" color="bg-amber-600" />
                  <ProgressBarItem label="Bahan Dapur" percent={7} value="Rp 872.000" color="bg-purple-600" />
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-5 text-slate-700 text-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Statistik Margin Rata-rata</h4>
                  <p className="text-slate-400 leading-normal mb-4">Membantu memantau batas keuntungan optimal di seluruh rentang harga produk.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Margin Rata-rata Minuman</span>
                    <span className="font-bold text-slate-900">38%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Margin Rata-rata Makanan</span>
                    <span className="font-bold text-slate-900">28%</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span>Margin Rata-rata Snack</span>
                    <span className="font-bold text-slate-900">33%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin Rata-rata Bahan Dapur</span>
                    <span className="font-bold text-slate-900">18%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Tab 5: Metode Pembayaran Tab Content */}
        {activeTab === 'Metode Pembayaran' && (
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Kanal Pembayaran Terpilih</h3>
              <p className="text-slate-400 text-xs mt-1">Lacak dan bandingkan preferensi jenis transaksi pembeli.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment comparative bars */}
              <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Volume Pembayaran</h4>
                <div className="space-y-3.5">
                  {paymentMethods.map((pm) => (
                    <ProgressBarItem key={pm.label} label={pm.label} percent={pm.percentage} value={formatRupiah(pm.value)} color="bg-blue-600" />
                  ))}
                </div>
              </div>

              {/* Payment Summary list */}
              <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Rincian Transaksi Pembayaran</h4>
                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  {paymentMethods.map((pm) => (
                    <div key={pm.label} className="flex justify-between items-center border-b border-slate-50 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-slate-50 rounded-lg text-slate-500">{pm.icon}</span>
                        <span>{pm.label}</span>
                      </div>
                      <span className="font-bold text-slate-900">{formatRupiah(pm.value)} ({pm.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Stok Tab Content */}
        {activeTab === 'Stok' && (
          <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Valuasi Stok & Peringatan Inventaris</h3>
              <p className="text-slate-400 text-xs mt-1">Pantau perputaran stok barang dagangan.</p>
            </div>

            {/* Valuation stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Nilai Beli Stok</span>
                <p className="text-xl font-black text-slate-900 mt-1">Rp 12.800.000</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Asset HPP</span>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Estimasi Nilai Jual</span>
                <p className="text-xl font-black text-slate-900 mt-1">Rp 18.540.000</p>
                <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Asset Harga Jual</span>
              </div>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Laju Perputaran Stok</span>
                <p className="text-xl font-black text-emerald-600 mt-1">8.5x / Tahun</p>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Sangat Sehat</span>
              </div>
            </div>

            {/* Low stock checklist */}
            <div className="border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="font-extrabold text-slate-800 text-sm">Daftar Produk Perlu Restok</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-semibold text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-left">
                      <th className="py-2 px-2">Nama Barang</th>
                      <th className="py-2 px-2">SKU</th>
                      <th className="py-2 px-2 text-center">Stok Sisa</th>
                      <th className="py-2 px-2 text-center">Batas Minimum</th>
                      <th className="py-2 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.filter(p => p.stock <= p.minStock).map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-2 font-bold text-slate-900">{p.name}</td>
                        <td className="py-3 px-2 font-mono">{p.sku}</td>
                        <td className="py-3 px-2 text-center font-bold text-red-500">{p.stock}</td>
                        <td className="py-3 px-2 text-center">{p.minStock}</td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold text-[9px] uppercase">
                            Stok Rendah
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Toast Notification display */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-blue-500 w-2 h-2 rounded-full animate-ping"></div>
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

// SidebarLink helper component
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// KPI Metric Card helper component
function MetricCard({
  title,
  value,
  trend,
  trendUp,
  iconBg,
  iconColor,
  icon
}: {
  title: string
  value: string
  trend: string
  trendUp: boolean
  iconBg: string
  iconColor: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left flex items-start gap-4">
      <div className={`${iconBg} ${iconColor} p-3 rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide block">{title}</span>
        <p className="text-xl font-black text-slate-900 mt-1 leading-none">{value}</p>
        <div className="flex items-center gap-1 mt-2">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold text-[9px] ${
            trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span className="text-[9px] text-slate-400 font-semibold">dari periode sebelumnya</span>
        </div>
      </div>
    </div>
  )
}

// Category progress card details
function CategoryMetrics({
  label,
  revenue,
  count,
  progress,
  color
}: {
  label: string
  revenue: number
  count: number
  progress: number
  color: string
}) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-extrabold text-slate-800 text-sm">{label}</span>
        <span className="text-xs text-slate-400 font-bold">{count} Transaksi</span>
      </div>
      <p className="text-xl font-black text-slate-900">{'Rp ' + revenue.toLocaleString('id-ID')}</p>
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
        <div className={`${color} h-full`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  )
}

// Progress bar item details
function ProgressBarItem({
  label,
  percent,
  value,
  color
}: {
  label: string
  percent: number
  value: string
  color: string
}) {
  return (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between items-center font-bold text-slate-700">
        <span>{label}</span>
        <span className="text-slate-900">{value} ({percent}%)</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div className={`${color} h-full rounded-full`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  )
}
