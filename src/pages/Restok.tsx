import { useState, useMemo } from 'react'
import { api } from '../api/client'
import {
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Plus,
  X,
  Bell,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import type { Product, ProductHistory } from '../types'

interface RestokProps {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

interface FlattenedRestokHistory {
  date: string
  productId: number
  productName: string
  productImage: string
  sku: string
  amount: number
  costPrice: number
  supplier: string
  operator: string
  note?: string
}

const CATEGORIES = ['Semua', 'Minuman', 'Makanan', 'Snack', 'Bahan Dapur', 'Lainnya']

export default function Restok({ products, setProducts, onLogout, onNavigate }: RestokProps) {
  const [activeTab, setActiveTab] = useState<'daftar' | 'riwayat'>('daftar')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedStockStatus, setSelectedStockStatus] = useState<'Semua' | 'Kritis' | 'Cukup'>('Semua')

  // Notifications Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Calculate live notification alerts
  const lowStockItems = products.filter(p => p.stock <= p.minStock)
  const notifications: Array<{
    id: string
    title: string
    message: string
    time: string
    type: 'warning' | 'info' | 'success'
  }> = [
    ...lowStockItems.map(p => ({
      id: `stock-${p.id}`,
      title: 'Peringatan Stok Menipis',
      message: `${p.name} tersisa ${p.stock} ${p.unit} (Batas minimal: ${p.minStock})`,
      time: 'Baru saja',
      type: 'warning' as const
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
  
  // Restock modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [restockQty, setRestockQty] = useState('10')
  const [restockCost, setRestockCost] = useState('')
  const [restockSupplier, setRestockSupplier] = useState('')
  const [restockUnit, setRestockUnit] = useState('Pcs')
  const [restockMinStock, setRestockMinStock] = useState('5')
  const [restockLocation, setRestockLocation] = useState('')
  const [restockExpired, setRestockExpired] = useState('')
  const [restockUnits, setRestockUnits] = useState<Array<{
    name: string
    qty: number
    price: number
    discount: number
  }>>([])

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  })

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Filter products for restock view
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory
      
      let matchesStock = true
      if (selectedStockStatus === 'Kritis') {
        matchesStock = p.stock <= p.minStock
      } else if (selectedStockStatus === 'Cukup') {
        matchesStock = p.stock > p.minStock
      }

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchQuery, selectedCategory, selectedStockStatus])

  // Get flattened history of restocking ('Stok Masuk')
  const restokHistoryList = useMemo(() => {
    const list: FlattenedRestokHistory[] = []
    products.forEach(p => {
      p.history.forEach(h => {
        if (h.type === 'Stok Masuk') {
          list.push({
            date: h.date,
            productId: p.id,
            productName: p.name,
            productImage: p.image,
            sku: p.sku,
            amount: h.amount,
            costPrice: p.costPrice, // fallback to current costPrice
            supplier: p.supplier,
            operator: h.operator,
            note: 'Pembelian stok masuk'
          })
        }
      })
    })

    // Sort by date (newest first)
    // Note: Since mock date is string like '20 Mei 2024, 10:30', we do simple sort. In real app, we use timestamp.
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [products])

  const formatPrice = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  const handleOpenRestock = (product: Product) => {
    setSelectedProduct(product)
    setRestockQty('10')
    setRestockCost(product.costPrice.toString())
    setRestockSupplier(product.supplier || '')
    setRestockUnit(product.unit || 'Pcs')
    setRestockMinStock((product.minStock || 5).toString())
    setRestockLocation((product as any).location || '')
    setRestockExpired((product as any).expired || '')
    
    if (product.units && product.units.length > 0) {
      setRestockUnits(product.units.map(u => ({
        name: u.name,
        qty: u.qty,
        price: u.price,
        discount: (u as any).discount || 0
      })))
    } else {
      setRestockUnits([{
        name: product.unit || 'Pcs',
        qty: 1,
        price: product.price || 0,
        discount: 0
      }])
    }
    
    setShowRestockModal(true)
  }
  const handleSaveRestock = () => {
    if (!selectedProduct) return
    const qty = parseInt(restockQty)
    const cost = parseFloat(restockCost)
    
    if (isNaN(qty) || qty < 0) {
      triggerToast('Jumlah restok tidak valid', 'error')
      return
    }
    if (isNaN(cost) || cost < 0) {
      triggerToast('Harga beli tidak valid', 'error')
      return
    }

    const restockData = {
      amount: qty,
      cost_price: cost,
      base_unit: restockUnit,
      min_stock: parseInt(restockMinStock) || 5,
      supplier: restockSupplier,
      location: restockLocation,
      expired_date: restockExpired || null,
      units: restockUnits.map((u, idx) => ({
        name: u.name,
        qty: u.qty,
        price: u.price,
        isDefault: idx === 0,
        discount: u.discount
      }))
    }

    api.restockProduct(selectedProduct.id, restockData)
      .then(res => {
        if (res.success && res.data) {
          const p = res.data
          const mappedProduct: Product = {
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
          }

          setProducts(prevProducts => prevProducts.map(prod => prod.id === p.id ? mappedProduct : prod))
          triggerToast(`Berhasil memperbarui stok ${mappedProduct.name}`, 'success')
          setShowRestockModal(false)
        } else {
          triggerToast('Gagal memproses restok', 'error')
        }
      })
      .catch(err => {
        console.error('Restock API error:', err)
        triggerToast('Gagal memproses restok ke server', 'error')
      })
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
            <SidebarLink icon={<History className="w-5 h-5" />} label="Restok" active onClick={() => onNavigate('restok')} />
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
                <p className="font-bold text-slate-900 text-sm">Admin</p>
                <p className="text-[10px] text-slate-400 font-medium mb-0.5 leading-none">admin@tokokita.com</p>
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

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div className="text-left space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Restok & Pembelian</h2>
            <p className="text-slate-500 text-sm">Tambahkan stok produk dan kelola pembelian barang masuk.</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              Hari Ini
            </button>
            {/* Interactive Notification Bell Popover */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-650 hover:text-slate-900 shadow-sm transition-all duration-200 cursor-pointer"
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
                        className="p-3.5 hover:bg-slate-50 transition-colors"
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

        {/* Tab & Filters Container */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.02)] space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('daftar')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'daftar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-500 hover:bg-slate-55'
                }`}
              >
                Daftar Produk
              </button>
              <button
                onClick={() => setActiveTab('riwayat')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === 'riwayat' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15' : 'text-slate-500 hover:bg-slate-55'
                }`}
              >
                Riwayat Restok ({restokHistoryList.length})
              </button>
            </div>

            {activeTab === 'daftar' && (
              <div className="flex items-center gap-3">
                {/* Category Selector */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-650 cursor-pointer outline-none focus:border-blue-500 transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Stock Level Selector */}
                <select
                  value={selectedStockStatus}
                  onChange={(e) => setSelectedStockStatus(e.target.value as any)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-650 cursor-pointer outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Semua">Semua Stok</option>
                  <option value="Kritis">Stok Kritis / Rendah</option>
                  <option value="Cukup">Stok Cukup</option>
                </select>
              </div>
            )}
          </div>

          {activeTab === 'daftar' ? (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-100 hover:border-slate-200/80 focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition-all"
                />
              </div>

              {/* Product Table Grid */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Produk</th>
                      <th className="py-4 px-4">SKU / Barcode</th>
                      <th className="py-4 px-4 text-center">Stok Saat Ini</th>
                      <th className="py-4 px-4">Harga Beli</th>
                      <th className="py-4 px-4">Supplier Utama</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                          Tidak ada produk ditemukan
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map(p => {
                        const isLowStock = p.stock <= p.minStock
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-4 px-6 flex items-center gap-3.5">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-11 h-11 rounded-xl object-cover shadow-sm border border-slate-100"
                              />
                              <div className="text-left">
                                <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                  {p.category}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-left">
                                <p className="text-slate-800 text-xs font-bold">{p.sku}</p>
                                <p className="text-slate-400 text-[11px] font-medium mt-0.5">{p.barcode}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col items-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  p.stock === 0
                                    ? 'bg-red-50 text-red-600 border-red-100'
                                    : isLowStock
                                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                }`}>
                                  {p.stock} {p.unit}
                                </span>
                                {isLowStock && (
                                  <span className="text-[10px] text-amber-500 font-bold mt-1 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" /> Minimum: {p.minStock}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-slate-900 font-bold">
                              {formatPrice(p.costPrice)}
                            </td>
                            <td className="py-4 px-4 text-slate-500">
                              {p.supplier || '—'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleOpenRestock(p)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all"
                              >
                                <Plus className="w-4 h-4" />
                                Restok
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* History Restok Tab */
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Tanggal</th>
                    <th className="py-4 px-4">Produk</th>
                    <th className="py-4 px-4 text-center">Jumlah Masuk</th>
                    <th className="py-4 px-4">Harga Beli</th>
                    <th className="py-4 px-4">Supplier</th>
                    <th className="py-4 px-6">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-600">
                  {restokHistoryList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        Belum ada riwayat restocking.
                      </td>
                    </tr>
                  ) : (
                    restokHistoryList.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-6 text-slate-500 text-xs">
                          {h.date}
                        </td>
                        <td className="py-4 px-4 flex items-center gap-3">
                          <img
                            src={h.productImage}
                            alt={h.productName}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-100 shadow-sm"
                          />
                          <div className="text-left">
                            <p className="font-bold text-slate-900 leading-tight">{h.productName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{h.sku}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md font-bold text-xs">
                            +{h.amount} Unit
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-900 font-bold">
                          {formatPrice(h.costPrice)}
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {h.supplier || '—'}
                        </td>
                        <td className="py-4 px-6 text-slate-800">
                          {h.operator}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Restock Modal */}
      {showRestockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 border border-slate-100 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Restok & Pengaturan Harga</h3>
                <p className="text-slate-400 text-xs mt-0.5">Kelola detail stok, supplier, dan multi-unit harga jual</p>
              </div>
              <button
                onClick={() => setShowRestockModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Two-Column Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              
              {/* Left Column: General Restock Data */}
              <div className="lg:col-span-5 space-y-4">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Informasi Umum Restok</span>

                {/* Product Summary Header */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm"
                  />
                  <div className="text-left space-y-0.5">
                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{selectedProduct.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold">{selectedProduct.sku}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">Stok saat ini: <span className="font-bold text-slate-700">{selectedProduct.stock} {selectedProduct.unit}</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Satuan Dasar</label>
                    <input
                      type="text"
                      value={restockUnit}
                      onChange={(e) => setRestockUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="e.g. Pcs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stok Minimum</label>
                    <input
                      type="number"
                      value={restockMinStock}
                      onChange={(e) => setRestockMinStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Harga Beli Satuan (Rp)</label>
                    <input
                      type="number"
                      value={restockCost}
                      onChange={(e) => setRestockCost(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Masuk ({restockUnit})</label>
                    <input
                      type="number"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="0"
                    />
                    <div className="flex gap-1.5 mt-1.5">
                      {['10', '50', '100'].map(val => (
                        <button
                          key={val}
                          onClick={() => setRestockQty(val)}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200/70 text-slate-600 rounded-md text-[10px] font-bold transition-colors"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier</label>
                  <input
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                    placeholder="Nama supplier..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lokasi / Rak</label>
                    <input
                      type="text"
                      value={restockLocation}
                      onChange={(e) => setRestockLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                      placeholder="e.g. Rak A-3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expired Date</label>
                    <input
                      type="date"
                      value={restockExpired}
                      onChange={(e) => setRestockExpired(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Multi-Unit Pricing Section */}
              <div className="lg:col-span-7 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Harga Jual & Multi-Unit</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRestockUnits([...restockUnits, { name: '', qty: 1, price: 0, discount: 0 }])
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Unit Harga
                  </button>
                </div>

                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 scrollbar-thin">
                  {restockUnits.map((item, idx) => {
                    const costVal = parseFloat(restockCost) || 0
                    const costPerUnit = costVal * item.qty
                    const marginPercent = costPerUnit > 0 ? Math.round(((item.price - costPerUnit) / costPerUnit) * 100) : 0
                    const labaAmount = item.price - costPerUnit

                    return (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setRestockUnits(restockUnits.filter((_, i) => i !== idx))
                            }}
                            className="absolute top-3 right-3 p-1 rounded-md hover:bg-slate-200/50 text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Satuan</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newUnits = [...restockUnits]
                                newUnits[idx].name = e.target.value
                                setRestockUnits(newUnits)
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 transition-all text-slate-900"
                              placeholder="Pcs/Pack"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Isi</label>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) => {
                                const newUnits = [...restockUnits]
                                newUnits[idx].qty = parseInt(e.target.value) || 1
                                setRestockUnits(newUnits)
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 transition-all text-slate-900"
                              placeholder="1"
                              min="1"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Harga Jual</label>
                            <input
                              type="number"
                              value={item.price || ''}
                              onChange={(e) => {
                                const newUnits = [...restockUnits]
                                newUnits[idx].price = parseFloat(e.target.value) || 0
                                setRestockUnits(newUnits)
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 transition-all text-slate-900"
                              placeholder="0"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Diskon (Rp)</label>
                            <input
                              type="number"
                              value={item.discount || ''}
                              onChange={(e) => {
                                const newUnits = [...restockUnits]
                                newUnits[idx].discount = parseFloat(e.target.value) || 0
                                setRestockUnits(newUnits)
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 transition-all text-slate-900"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        {/* Real-time Profit Margin Badges */}
                        <div className="flex gap-2 pt-1 border-t border-slate-100/50">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            marginPercent > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            Margin: {marginPercent}%
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            labaAmount > 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            Laba: {labaAmount > 0 ? formatPrice(labaAmount) : 'Rp 0'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowRestockModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveRestock}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/10 transition-colors"
              >
                Simpan Restok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-red-650 text-white shadow-red-650/20'
        }`}>
          <span className="text-sm font-bold">{toast.msg}</span>
        </div>
      )}
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
          : 'text-slate-500 hover:bg-slate-55 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
