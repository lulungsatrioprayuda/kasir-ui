import { useState, useMemo } from 'react'
import {
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  Coins,
  Receipt,
  ScanLine,
  MoreVertical,
  ChevronLeft
} from 'lucide-react'

import type { Product, ProductUnit } from '../types'
import { api } from '../api/client'

// Cart Item type
interface CartItem {
  product: Product
  quantity: number
  selectedUnit: ProductUnit
}

interface TransaksiProps {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

const CATEGORIES = ['Semua', 'Minuman', 'Makanan', 'Snack', 'Kebutuhan', 'Lainnya']

export default function Transaksi({ products, setProducts, onLogout, onNavigate }: TransaksiProps) {
  // Page states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [cart, setCart] = useState<CartItem[]>(() => {
    const findProduct = (id: number) => products.find(p => p.id === id)
    const items = [
      { product: findProduct(2), quantity: 2 }, // Kopi Hitam
      { product: findProduct(3), quantity: 1 }, // Teh Botol
      { product: findProduct(4), quantity: 1 }, // Roti Cokelat
      { product: findProduct(5), quantity: 2 }, // Indomie Goreng
      { product: findProduct(1), quantity: 1 }  // Air Mineral
    ]
    return items
      .filter(item => item.product)
      .map(item => {
        const prod = item.product!
        const defaultUnit = prod.units?.find(u => u.isDefault) || { name: prod.unit || 'Pcs', price: prod.price, isDefault: true, qty: 1 }
        return {
          product: prod,
          quantity: item.quantity,
          selectedUnit: defaultUnit
        }
      })
  })
  const [discountInput, setDiscountInput] = useState('')
  const [activeDiscount, setActiveDiscount] = useState(0) // flat IDR amount
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  
  // Checkout form states
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Debit' | 'Kredit'>('Tunai')
  const [cashReceived, setCashReceived] = useState('')
  const [checkoutStep, setCheckoutStep] = useState<'input' | 'receipt'>('input')

  const [includePajak, setIncludePajak] = useState(true)
  const [showPPNRow, setShowPPNRow] = useState(true)

  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc'>('default')
  const [stockFilter, setStockFilter] = useState<'all' | 'instock'>('all')
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Toast notifications
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({
    show: false,
    msg: '',
    type: 'success'
  })

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 3000)
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory
      const matchesStock = stockFilter === 'all' || p.stock > 0
      return matchesSearch && matchesCategory && matchesStock
    })

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'name-desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    }

    return result
  }, [products, searchQuery, selectedCategory, sortBy, stockFilter])

  // Cart operations
  const addToCart = (product: Product) => {
    const defaultUnit = product.units?.find(u => u.isDefault) || { name: product.unit || 'Pcs', price: product.price, isDefault: true, qty: 1 }

    // Check total quantity of this product already in cart
    const currentCartQty = cart
      .filter(item => item.product.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0)

    if (currentCartQty >= product.stock) {
      triggerToast('Stok produk tidak mencukupi!', 'info')
      return
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id && item.selectedUnit.name === defaultUnit.name)
    if (existingIndex > -1) {
      const updatedCart = [...cart]
      updatedCart[existingIndex].quantity += 1
      setCart(updatedCart)
    } else {
      if (product.stock <= 0) {
        triggerToast('Produk habis!', 'info')
        return
      }
      setCart([...cart, { product, quantity: 1, selectedUnit: defaultUnit }])
    }
  }

  const updateQuantity = (productId: number, unitName: string, amount: number) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId && item.selectedUnit.name === unitName)
    if (existingIndex === -1) return

    const actualProduct = products.find(p => p.id === productId)
    if (!actualProduct) return

    const updatedCart = [...cart]
    const item = updatedCart[existingIndex]
    const nextQty = item.quantity + amount

    // Check total quantity of this product in cart
    const otherUnitsQty = updatedCart
      .filter((u, idx) => u.product.id === productId && idx !== existingIndex)
      .reduce((sum, u) => sum + u.quantity, 0)

    if (nextQty <= 0) {
      updatedCart.splice(existingIndex, 1)
    } else if (otherUnitsQty + nextQty > actualProduct.stock) {
      triggerToast('Stok produk tidak mencukupi!', 'info')
      return
    } else {
      item.quantity = nextQty
    }
    setCart(updatedCart)
  }

  const updateCartItemUnit = (productId: number, oldUnitName: string, newUnit: ProductUnit) => {
    const existingIndex = cart.findIndex(item => item.product.id === productId && item.selectedUnit.name === oldUnitName)
    if (existingIndex === -1) return

    const targetIndex = cart.findIndex(item => item.product.id === productId && item.selectedUnit.name === newUnit.name)
    const updatedCart = [...cart]

    if (targetIndex > -1 && targetIndex !== existingIndex) {
      // Merge them
      updatedCart[targetIndex].quantity += updatedCart[existingIndex].quantity
      updatedCart.splice(existingIndex, 1)
    } else {
      updatedCart[existingIndex].selectedUnit = newUnit
    }
    setCart(updatedCart)
  }

  const removeFromCart = (productId: number, unitName: string) => {
    setCart(cart.filter(item => !(item.product.id === productId && item.selectedUnit.name === unitName)))
  }

  const clearCart = () => {
    setCart([])
    triggerToast('Keranjang berhasil dikosongkan', 'success')
  }

  // Price calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.selectedUnit.price * item.quantity, 0)
  }, [cart])

  const ppn = useMemo(() => {
    if (!includePajak) return 0
    const base = Math.max(0, subtotal - activeDiscount)
    return Math.round(base * 0.11)
  }, [subtotal, activeDiscount, includePajak])

  const total = useMemo(() => {
    const base = Math.max(0, subtotal - activeDiscount)
    return base + ppn
  }, [subtotal, activeDiscount, ppn])

  const formatPrice = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  // Handle Checkout submission
  const handleCheckoutSubmit = () => {
    if (paymentMethod === 'Tunai') {
      const received = parseFloat(cashReceived) || 0
      if (received < total) {
        triggerToast('Uang yang diterima kurang!', 'info')
        return
      }
    }
    
    const receiptNo = `TRX-${Math.floor(100000 + Math.random() * 900000)}`
    const paymentMap: Record<string, number> = { Tunai: 1, QRIS: 2, Debit: 3, Kredit: 4 }

    // Persist transaction to PostgreSQL via Hono API
    api.createTransaction({
      receipt_no: receiptNo,
      payment_method_id: paymentMap[paymentMethod] || 1,
      subtotal,
      discount: activeDiscount,
      tax_amount: ppn,
      total,
      cash_received: parseFloat(cashReceived) || total,
      change_amount: Math.max(0, (parseFloat(cashReceived) || total) - total),
      items: cart.map(item => ({
        product_id: item.product.id,
        unit_name: item.selectedUnit.name,
        unit_qty: item.selectedUnit.qty || 1,
        unit_price: item.selectedUnit.price,
        quantity: item.quantity,
        line_total: item.selectedUnit.price * item.quantity
      }))
    }).catch(err => console.warn('Could not persist transaction to backend:', err))

    // Deduct stock globally in local React state
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const cartItemsForProduct = cart.filter(item => item.product.id === p.id)
        if (cartItemsForProduct.length > 0) {
          const totalQty = cartItemsForProduct.reduce((sum, item) => sum + item.quantity, 0)
          const newStock = Math.max(0, p.stock - totalQty)
          const newStatus = newStock === 0 ? 'Nonaktif' : newStock <= p.minStock ? 'Stok Rendah' : 'Aktif'
          const dateStr = new Date().toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          return {
            ...p,
            stock: newStock,
            status: newStatus,
            history: [
              {
                type: 'Penjualan',
                amount: -totalQty,
                date: dateStr,
                operator: 'Kasir Utama'
              },
              ...p.history
            ]
          }
        }
        return p
      })
    })

    setCheckoutStep('receipt')
  }

  const finishTransaction = () => {
    setShowCheckoutModal(false)
    setCart([])
    setActiveDiscount(0)
    setPaymentMethod('Tunai')
    setCashReceived('')
    setCheckoutStep('input')
    triggerToast('Transaksi selesai dan receipt dicetak!', 'success')
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
            <SidebarLink icon={<ShoppingCart className="w-5 h-5" />} label="Transaksi" active onClick={() => onNavigate('transaksi')} />
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

      {/* Main Column */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Product Selection */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0">
          {/* Header */}
          <header className="flex justify-between items-start mb-8 shrink-0">
            <div className="text-left space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Transaksi / Kasir</h2>
              <p className="text-slate-500 text-sm">Tambah produk ke keranjang untuk memulai transaksi</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200">
                <ScanLine className="w-4 h-4 text-slate-400" />
                Scan Barcode
              </button>
              <button className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-700 shadow-sm transition-all duration-200">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Search and Filters */}
          <section className="mb-6 space-y-4 shrink-0">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama / barcode..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all outline-none text-sm"
                />
              </div>
              <button
                onClick={() => setShowFilterModal(true)}
                className={`flex items-center gap-2 px-4 py-3.5 border rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${
                  sortBy !== 'default' || stockFilter !== 'all'
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                Filter
                {(sortBy !== 'default' || stockFilter !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                )}
              </button>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          {/* Product Grid */}
          <section className="flex-1 min-h-0 mb-6">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.01)] hover:shadow-[0_10px_35px_rgba(15,23,42,0.03)] hover:border-slate-200/80 transition-all cursor-pointer flex flex-col group relative overflow-hidden"
                  >
                    {/* Centered Image Container - Transparent/No Box Background */}
                    <div className="h-32 w-full flex items-center justify-center mb-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-auto object-contain group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
                      />
                    </div>
                    {/* Details */}
                    <div className="text-left space-y-0.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-400">Stok: {product.stock}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                        <span className="font-extrabold text-[#1B52FF] text-sm">{formatPrice(product.price)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                          className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100/80 p-8">
                <Package className="w-16 h-16 text-slate-300 mb-4" />
                <h3 className="font-bold text-slate-700 text-lg">Produk tidak ditemukan</h3>
                <p className="text-slate-400 text-sm mt-1">Coba gunakan kata kunci pencarian atau kategori lain</p>
              </div>
            )}
          </section>

          {/* Pagination */}
          <footer className="flex justify-between items-center py-4 border-t border-slate-100 shrink-0">
            <div className="flex items-center gap-1.5">
              <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 text-slate-500" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-600/10">1</button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">2</button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">3</button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">4</button>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">5</button>
              <span className="px-2 text-slate-400 text-sm">...</span>
              <button className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">12</button>
              <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Show count selector */}
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600">
                <option>12 / halaman</option>
                <option>24 / halaman</option>
                <option>48 / halaman</option>
              </select>
            </div>
          </footer>
        </div>

        {/* Right Column: Cart / Summary */}
        <aside className="w-[420px] bg-white border-l border-slate-100 flex flex-col justify-between shrink-0 h-full overflow-hidden">
          {/* Cart Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-left">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-900">Keranjang</h3>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
            )}
          </div>

          {/* Cart Item List - Borderless Rows separated by thin lines */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100">
            {cart.length > 0 ? (
              cart.map(item => {
                const availableUnits = item.product.units && item.product.units.length > 0
                  ? item.product.units
                  : [{ name: item.product.unit || 'Pcs', price: item.product.price, isDefault: true, qty: 1 }]

                return (
                  <div key={`${item.product.id}-${item.selectedUnit.name}`} className="flex items-center gap-4 py-4 text-left relative group">
                    {/* Small Square Image */}
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <img src={item.product.image} alt={item.product.name} className="w-4/5 h-4/5 object-contain mix-blend-multiply" />
                    </div>
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-1">{item.product.name}</h4>
                      
                      {/* Unit Selector dropdown */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <select
                          value={item.selectedUnit.name}
                          onChange={e => {
                            const newUnitName = e.target.value
                            const newUnit = availableUnits.find(u => u.name === newUnitName)
                            if (newUnit) {
                              updateCartItemUnit(item.product.id, item.selectedUnit.name, newUnit)
                            }
                          }}
                          className="px-2 py-0.5 bg-slate-100 border-none rounded-lg text-[10px] font-bold text-slate-650 outline-none cursor-pointer focus:ring-1 focus:ring-blue-500 transition-all uppercase"
                        >
                          {availableUnits.map((u, idx) => (
                            <option key={idx} value={u.name}>
                              {u.name} ({formatPrice(u.price).replace('Rp ', '')})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {/* Quantity selectors */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedUnit.name, -1)}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedUnit.name, 1)}
                        className="w-6 h-6 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Subtotal */}
                    <div className="min-w-[80px] text-right font-extrabold text-slate-850 text-sm">
                      {formatPrice(item.selectedUnit.price * item.quantity)}
                    </div>
                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedUnit.name)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <ShoppingCart className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-500">Keranjang masih kosong</p>
                <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">Pilih produk di sebelah kiri untuk ditambahkan</p>
              </div>
            )}
          </div>

          {/* Pricing calculations & actions */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4 shrink-0">
            {/* Calculation rows */}
            <div className="space-y-2.5 text-left text-sm font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Diskon</span>
                <button
                  onClick={() => {
                    setDiscountInput(activeDiscount > 0 ? activeDiscount.toString() : '')
                    setShowDiscountModal(true)
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  {activeDiscount > 0 ? `-${formatPrice(activeDiscount)}` : 'Tambah Diskon'}
                </button>
              </div>
              {showPPNRow && (
                <div className="flex justify-between">
                  <span>Pajak (PPN 11%)</span>
                  <span className="text-slate-800 font-bold">
                    {includePajak ? formatPrice(ppn) : 'Rp 0'}
                  </span>
                </div>
              )}

              {/* Toggles for Pajak & PPN */}
              <div className="grid grid-cols-2 gap-2 pt-1 pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setIncludePajak(!includePajak)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                    includePajak
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={includePajak}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                  />
                  <span>Hitung Pajak</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPPNRow(!showPPNRow)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                    showPPNRow
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={showPPNRow}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 pointer-events-none"
                  />
                  <span>Tampilkan PPN</span>
                </button>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 text-base">
                <span className="text-slate-900 font-extrabold">Total</span>
                <span className="text-[#1B52FF] font-black text-xl">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <button
                disabled={cart.length === 0}
                onClick={() => {
                  setCashReceived('')
                  setShowCheckoutModal(true)
                }}
                className="w-full bg-[#1B52FF] hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Bayar
              </button>
              <button
                disabled={cart.length === 0}
                onClick={() => triggerToast('Draf transaksi berhasil disimpan', 'success')}
                className="w-full bg-white hover:bg-slate-50 disabled:opacity-50 border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Receipt className="w-4 h-4 text-slate-400" />
                Simpan sebagai Draft
              </button>
            </div>
          </div>
        </aside>
      </main>

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Tambah Diskon</h3>
              <button onClick={() => setShowDiscountModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="discount" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Jumlah Diskon (Rp)
              </label>
              <input
                type="number"
                id="discount"
                placeholder="Masukkan nominal diskon..."
                value={discountInput}
                onChange={e => setDiscountInput(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setActiveDiscount(0)
                  setShowDiscountModal(false)
                }}
                className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-sm transition-all"
              >
                Hapus
              </button>
              <button
                onClick={() => {
                  const val = parseFloat(discountInput) || 0
                  if (val > subtotal) {
                    triggerToast('Diskon tidak boleh melebihi subtotal!', 'info')
                    return
                  }
                  setActiveDiscount(val)
                  setShowDiscountModal(false)
                  triggerToast(`Diskon ${formatPrice(val)} berhasil diterapkan`, 'success')
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/10"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT / BAYAR MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left animate-in fade-in zoom-in duration-200">
            
            {checkoutStep === 'input' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-extrabold text-slate-900">Pembayaran</h3>
                  <button onClick={() => setShowCheckoutModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Total Bill box */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-center items-center">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tagihan</span>
                  <span className="text-[#1B52FF] font-black text-3xl mt-1">{formatPrice(total)}</span>
                </div>

                {/* Metode Pembayaran Dropdown */}
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Metode Pembayaran
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={e => {
                      const val = e.target.value as any
                      setPaymentMethod(val)
                      if (val !== 'Tunai') {
                        setCashReceived(total.toString())
                      } else {
                        setCashReceived('')
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold text-sm cursor-pointer"
                  >
                    <option value="Tunai">Tunai / Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Debit">Debit Card</option>
                    <option value="Kredit">Credit Card</option>
                  </select>
                </div>

                {/* Cash Received input */}
                {paymentMethod === 'Tunai' && (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label htmlFor="received" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      id="received"
                      placeholder="Masukkan nominal uang..."
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-bold text-lg"
                    />
                    
                    {/* Quick Cash Buttons */}
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {[total, 10000, 20000, 50000, 100000].map((cash, idx) => {
                        const actualCash = cash === total ? Math.ceil(total / 1000) * 1000 : cash
                        if (actualCash < total && cash !== total) return null
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCashReceived(actualCash.toString())}
                            className="py-2 px-1 text-center bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-xs text-slate-700 transition-all"
                          >
                            {cash === total ? 'Uang Pas' : formatPrice(actualCash).replace('Rp ', '')}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Change Calculator (Tunai Only) */}
                {paymentMethod === 'Tunai' && (() => {
                  const receivedVal = parseFloat(cashReceived) || 0
                  if (receivedVal < total) {
                    return (
                      <div className="flex justify-between items-center pt-2 text-sm font-semibold border-t border-slate-100 animate-in fade-in duration-200">
                        <span className="text-slate-500">Status</span>
                        <span className="text-lg font-black text-red-500 text-right">
                          uang tidak cukup<br />
                          <span className="text-xs font-bold text-red-400 block mt-0.5">Kurang {formatPrice(total - receivedVal)}</span>
                        </span>
                      </div>
                    )
                  }
                  if (receivedVal === total) {
                    return (
                      <div className="flex justify-between items-center pt-2 text-sm font-semibold border-t border-slate-100 animate-in fade-in duration-200">
                        <span className="text-slate-500">Status</span>
                        <span className="text-lg font-black text-emerald-600">uang pas</span>
                      </div>
                    )
                  }
                  return (
                    <div className="flex justify-between items-center pt-2 text-sm font-semibold border-t border-slate-100 animate-in fade-in duration-200">
                      <span className="text-slate-500">Kembalian</span>
                      <span className="text-lg font-black text-emerald-600">
                        {formatPrice(receivedVal - total)}
                      </span>
                    </div>
                  )
                })()}

                {/* Submit Pay button */}
                <button
                  onClick={handleCheckoutSubmit}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
                >
                  <ArrowRightButtonIcon />
                  Proses Transaksi
                </button>
              </div>
            ) : (
              /* Receipt Step */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Transaksi Berhasil!</h3>
                  <p className="text-slate-400 text-xs">Receipt #TRX-{(new Date()).getTime().toString().slice(-6)} telah diterbitkan</p>
                </div>

                {/* Simulated Paper Receipt */}
                <div className="bg-[#FAF9F5] border border-dashed border-slate-200 p-5 rounded-2xl font-mono text-xs text-slate-700 space-y-4 max-h-[450px] overflow-y-auto">
                  <div className="text-center border-b border-dashed border-slate-350 pb-3">
                    <p className="font-bold text-sm tracking-wider uppercase">KASIRKU POS</p>
                    <p className="text-[10px] mt-0.5">Mall Grand Indonesia, Jakarta</p>
                    <p className="text-[10px]">Telp: 021-5551234</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Tanggal:</span>
                      <span>{new Date().toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir:</span>
                      <span>Kasir Utama</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Metode:</span>
                      <span className="font-bold uppercase">{paymentMethod}</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-slate-350 pt-3 space-y-2">
                    {cart.map(item => (
                      <div key={`${item.product.id}-${item.selectedUnit.name}`} className="space-y-0.5 animate-in fade-in duration-100">
                        <div className="flex justify-between font-bold text-left">
                          <span>{item.product.name} ({item.selectedUnit.name})</span>
                          <span>{formatPrice(item.selectedUnit.price * item.quantity).replace('Rp ', '')}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 text-left">
                          <span>{item.quantity} {item.selectedUnit.name} x {formatPrice(item.selectedUnit.price).replace('Rp ', '')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed border-slate-350 pt-3 space-y-1 font-bold">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal).replace('Rp ', '')}</span>
                    </div>
                    {activeDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Diskon:</span>
                        <span>-{formatPrice(activeDiscount).replace('Rp ', '')}</span>
                      </div>
                    )}
                    {showPPNRow && (
                      <div className="flex justify-between">
                        <span>PPN (11%):</span>
                        <span>{formatPrice(ppn).replace('Rp ', '')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base border-t border-dashed border-slate-350 pt-2 text-slate-900">
                      <span>TOTAL:</span>
                      <span>{formatPrice(total).replace('Rp ', '')}</span>
                    </div>
                    {paymentMethod === 'Tunai' && (
                      <>
                        <div className="flex justify-between text-slate-500">
                          <span>Bayar:</span>
                          <span>{formatPrice(parseFloat(cashReceived) || 0).replace('Rp ', '')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-600">
                          <span>Kembali:</span>
                          <span>{formatPrice(Math.max(0, (parseFloat(cashReceived) || 0) - total)).replace('Rp ', '')}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-center pt-3 border-t border-dashed border-slate-350 text-[10px] text-slate-400">
                    <p className="font-bold">Terima Kasih</p>
                    <p>Selamat Belanja Kembali!</p>
                  </div>
                </div>

                {/* Print button & Finish button */}
                <div className="flex gap-3">
                  <button
                    onClick={finishTransaction}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-all text-center"
                  >
                    Selesai & Print
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FILTER & SORT MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Filter & Urutkan</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Urutkan Berdasarkan</span>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'default', label: 'Bawaan (Urutan Default)' },
                  { value: 'price-asc', label: 'Harga: Terendah ke Tertinggi' },
                  { value: 'price-desc', label: 'Harga: Tertinggi ke Terendah' },
                  { value: 'name-asc', label: 'Nama: A - Z' },
                  { value: 'name-desc', label: 'Nama: Z - A' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value as any)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                      sortBy === opt.value
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Availability Option */}
            <div className="space-y-3">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Ketersediaan Stok</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Semua Produk' },
                  { value: 'instock', label: 'Hanya Stok Tersedia' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStockFilter(opt.value as any)}
                    className={`flex-1 text-center py-3 rounded-xl border text-xs font-bold transition-all ${
                      stockFilter === opt.value
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => {
                  setSortBy('default')
                  setStockFilter('all')
                  setShowFilterModal(false)
                  triggerToast('Filter telah direset', 'info')
                }}
                className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-xs transition-all text-center"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFilterModal(false)
                  triggerToast('Filter berhasil diterapkan', 'success')
                }}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all text-center shadow-md shadow-blue-600/10"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 border border-slate-800 text-white px-5 py-4 rounded-2xl shadow-xl animate-in slide-in-from-bottom-5 duration-200">
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
          <span className="text-sm font-semibold">{toast.msg}</span>
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
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ArrowRightButtonIcon() {
  return <Coins className="w-5 h-5" />
}
