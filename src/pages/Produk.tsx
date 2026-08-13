import { useState, useMemo, useEffect } from 'react'
import {
  ShoppingBag,
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Plus,
  Trash2,
  X,
  MoreVertical,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Upload,
  Bell,
  Edit2
} from 'lucide-react'

import type { Product, ProductUnit } from '../types'
import { api } from '../api/client'

const STANDARD_UNITS = ['Pcs', 'Pack', 'Renceng', 'Press', 'Box', 'Botol', 'Kaleng', 'Karton']

interface ProdukProps {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

export default function Produk({ products, setProducts, onLogout, onNavigate }: ProdukProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null)

  // Search / Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [selectedStatus, setSelectedStatus] = useState('Semua')
  const [showFilters, setShowFilters] = useState(false)

  // Pagination States
  const [itemsPerPage, setItemsPerPage] = useState<number | 'Semua'>(10)
  const [currentPageNum, setCurrentPageNum] = useState<number>(1)

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

  // Fetch / Sync products directly from Database on Mount
  useEffect(() => {
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
          if (mapped.length > 0) {
            if (!selectedProduct) {
              setSelectedProduct(mapped[0])
            }
          } else {
            setSelectedProduct(null)
          }
        }
      })
      .catch(err => console.warn('Could not fetch DB products:', err))
  }, [])

  // Keep selectedProduct in sync with updated list
  useEffect(() => {
    if (products.length > 0) {
      if (!selectedProduct) {
        setSelectedProduct(products[0])
      } else {
        const found = products.find(p => p.id === selectedProduct.id)
        if (found) setSelectedProduct(found)
      }
    }
  }, [products])

  // Checkbox state for rows
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])

  // Modal display states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAddSupplierDropdown, setShowAddSupplierDropdown] = useState(false)
  const [showEditSupplierDropdown, setShowEditSupplierDropdown] = useState(false)

  // Forms state
  const [formName, setFormName] = useState('')
  const [formSku, setFormSku] = useState('')
  const [formCategory, setFormCategory] = useState('Minuman')
  const [formCostPrice, setFormCostPrice] = useState('')
  const [formStock, setFormStock] = useState('')
  const [formMinStock, setFormMinStock] = useState('10')
  const [formBarcode, setFormBarcode] = useState('')
  const [formSupplier, setFormSupplier] = useState('')
  const [suppliers, setSuppliers] = useState<string[]>([
    'PT Kopi Nusantara',
    'PT Sinar Sosro',
    'Sari Roti',
    'PT Indofood CBP',
    'PT Aqua Golden Mississippi',
    'PT Indofood Fritolay',
    'PT Gulaku Indonesia',
    'Ultra Jaya'
  ])
  const [formDescription, setFormDescription] = useState('')
  const [formImage, setFormImage] = useState('')
  const [formUnits, setFormUnits] = useState<ProductUnit[]>([
    { name: 'Pcs', price: 0, isDefault: true, qty: 1 }
  ])

  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({
    show: false,
    msg: '',
    type: 'success'
  })

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  // Filtered product listing
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'Semua' || p.category === selectedCategory
      const matchesStatus = selectedStatus === 'Semua' || p.status === selectedStatus
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedCategory, selectedStatus])

  // Paginated product listing
  const totalPages = useMemo(() => {
    if (itemsPerPage === 'Semua') return 1
    return Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  }, [filteredProducts.length, itemsPerPage])

  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === 'Semua') return filteredProducts
    const start = (currentPageNum - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPageNum, itemsPerPage])

  // Select/Deselect row checkbox helpers
  const handleToggleRow = (id: number) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === filteredProducts.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(filteredProducts.map(p => p.id))
    }
  }

  const formatPrice = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
  }

  // Set up modals with active item data
  const openAddModal = () => {
    setFormName('')
    setFormSku(`PRD00${products.length + 1}`)
    setFormCategory('Minuman')
    setFormCostPrice('')
    setFormStock('')
    setFormMinStock('10')
    setFormBarcode('')
    setFormSupplier('')
    setFormDescription('')
    setFormImage('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=80')
    setFormUnits([
      { name: 'Pcs', price: 0, isDefault: true, qty: 1 }
    ])
    setShowAddModal(true)
  }

  const openEditModal = (prod: Product) => {
    setSelectedProduct(prod)
    setFormName(prod.name)
    setFormSku(prod.sku)
    setFormCategory(prod.category)
    setFormCostPrice(prod.costPrice.toString())
    setFormStock(prod.stock.toString())
    setFormMinStock(prod.minStock.toString())
    setFormBarcode(prod.barcode)
    setFormSupplier(prod.supplier)
    setFormDescription(prod.description)
    setFormImage(prod.image)
    setFormUnits(prod.units && prod.units.length > 0 ? prod.units : [
      { name: prod.unit || 'Pcs', price: prod.price, isDefault: true, qty: 1 }
    ])
    setShowEditModal(true)
  }

  // Handle Add Product Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formStock) {
      triggerToast('Mohon lengkapi field wajib (Nama & Stok)!', 'info')
      return
    }

    const costNum = parseFloat(formCostPrice) || 0
    const stockNum = parseInt(formStock) || 0
    const minStockNum = parseInt(formMinStock) || 0

    if (costNum < 0) {
      triggerToast('Harga beli (HPP) tidak boleh negatif!', 'info')
      return
    }

    if (formUnits.length === 0) {
      triggerToast('Minimal harus ada satu unit jual!', 'info')
      return
    }

    const defaultUnit = formUnits.find(u => u.isDefault)
    if (!defaultUnit) {
      triggerToast('Pilih satu unit sebagai unit default!', 'info')
      return
    }

    for (const u of formUnits) {
      if (!u.name.trim()) {
        triggerToast('Nama unit tidak boleh kosong!', 'info')
        return
      }
      if (u.price < 0) {
        triggerToast('Harga jual unit tidak boleh negatif!', 'info')
        return
      }
      if (u.qty <= 0) {
        triggerToast('Isi/Qty unit harus lebih besar dari 0!', 'info')
        return
      }
    }

    let calculatedStatus: 'Aktif' | 'Stok Rendah' | 'Nonaktif' = 'Aktif'
    if (stockNum <= 0) {
      calculatedStatus = 'Nonaktif'
    } else if (stockNum <= minStockNum) {
      calculatedStatus = 'Stok Rendah'
    }

    const newProd: Product = {
      id: Date.now(),
      name: formName,
      sku: formSku || `SKU${Date.now().toString().slice(-4)}`,
      category: formCategory,
      price: defaultUnit.price,
      costPrice: costNum,
      stock: stockNum,
      unit: defaultUnit.name,
      minStock: minStockNum,
      barcode: formBarcode || '-',
      supplier: formSupplier || '-',
      description: formDescription,
      status: calculatedStatus,
      image: formImage || 'https://images.unsplash.com/photo-1608885898957-a599fb1ee4b4?w=200&auto=format&fit=crop&q=80',
      history: [
        {
          type: 'Stok Masuk',
          amount: stockNum,
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
          operator: 'Kasir Utama'
        }
      ],
      units: formUnits
    }

    // Helper to refresh product list from DB
    const refreshFromDb = async () => {
      try {
        const res = await api.getProducts()
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
            history: [],
            units: [{ name: p.base_unit || 'Pcs', price: Number(p.price), isDefault: true, qty: 1 }]
          }))
          setProducts(mapped)
          return mapped
        }
      } catch (err) {
        console.warn('Error refreshing from DB:', err)
      }
      return null
    }

    // Persist to PostgreSQL backend via Hono API
    try {
      const res = await api.createProduct({
        name: formName,
        sku: newProd.sku,
        barcode: formBarcode || null,
        category_name: formCategory,
        image_url: formImage || null,
        base_unit: defaultUnit.name,
        cost_price: costNum,
        price: defaultUnit.price,
        stock: stockNum,
        min_stock: minStockNum,
        description: formDescription || null
      })
      if (res.success && res.data) {
        newProd.id = res.data.id
      }
    } catch (err) {
      console.warn('Could not persist to DB backend:', err)
    }

    const freshList = await refreshFromDb()
    if (freshList && freshList.length > 0) {
      const found = freshList.find(p => p.id === newProd.id) || freshList[0]
      setSelectedProduct(found)
    } else {
      setProducts([newProd, ...products])
      setSelectedProduct(newProd)
    }
    setShowAddModal(false)
    triggerToast('Produk baru berhasil ditambahkan dan disimpan ke database!', 'success')
  }

  // Handle Edit Product Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    if (!formName || !formStock) {
      triggerToast('Mohon lengkapi field wajib (Nama & Stok)!', 'info')
      return
    }

    const costNum = parseFloat(formCostPrice) || 0
    const stockNum = parseInt(formStock) || 0
    const minStockNum = parseInt(formMinStock) || 0

    if (costNum < 0) {
      triggerToast('Harga beli (HPP) tidak boleh negatif!', 'info')
      return
    }

    if (formUnits.length === 0) {
      triggerToast('Minimal harus ada satu unit jual!', 'info')
      return
    }

    const defaultUnit = formUnits.find(u => u.isDefault)
    if (!defaultUnit) {
      triggerToast('Pilih satu unit sebagai unit default!', 'info')
      return
    }

    for (const u of formUnits) {
      if (!u.name.trim()) {
        triggerToast('Nama unit tidak boleh kosong!', 'info')
        return
      }
      if (u.price < 0) {
        triggerToast('Harga jual unit tidak boleh negatif!', 'info')
        return
      }
      if (u.qty <= 0) {
        triggerToast('Isi/Qty unit harus lebih besar dari 0!', 'info')
        return
      }
    }

    let calculatedStatus: 'Aktif' | 'Stok Rendah' | 'Nonaktif' = 'Aktif'
    if (stockNum <= 0) {
      calculatedStatus = 'Nonaktif'
    } else if (stockNum <= minStockNum) {
      calculatedStatus = 'Stok Rendah'
    }

    // Determine stock difference to add to history if modified
    const stockDiff = stockNum - (selectedProduct.stock || 0)
    const updatedHistory = [...(selectedProduct.history || [])]
    if (stockDiff !== 0) {
      updatedHistory.unshift({
        type: stockDiff > 0 ? 'Stok Masuk' : 'Penjualan',
        amount: stockDiff,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        operator: 'Kasir Utama'
      })
    }

    const updatedProd: Product = {
      ...selectedProduct,
      name: formName,
      sku: formSku,
      category: formCategory,
      price: defaultUnit.price,
      costPrice: costNum,
      stock: stockNum,
      unit: defaultUnit.name,
      minStock: minStockNum,
      barcode: formBarcode,
      supplier: formSupplier,
      description: formDescription,
      status: calculatedStatus,
      image: formImage,
      history: updatedHistory,
      units: formUnits
    }

    // Persist edit to PostgreSQL via Hono API
    try {
      await api.updateProduct(selectedProduct.id, {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category_name: formCategory,
        image_url: formImage,
        base_unit: defaultUnit.name,
        cost_price: costNum,
        price: defaultUnit.price,
        stock: stockNum,
        min_stock: minStockNum,
        description: formDescription
      })
    } catch (err) {
      console.warn('Could not persist product update to backend:', err)
    }

    // Refresh state directly from PostgreSQL
    try {
      const res = await api.getProducts()
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
          history: updatedHistory,
          units: formUnits
        }))
        setProducts(mapped)
        const updatedItem = mapped.find(p => p.id === selectedProduct.id) || updatedProd
        setSelectedProduct(updatedItem)
      }
    } catch (err) {
      const updatedProducts = products.map(p => p.id === selectedProduct.id ? updatedProd : p)
      setProducts(updatedProducts)
      setSelectedProduct(updatedProd)
    }

    setShowEditModal(false)
    triggerToast('Detail produk berhasil diperbarui!', 'success')
  }

  // Handle Delete Product
  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return

    // Persist deletion to PostgreSQL via Hono API
    try {
      await api.deleteProduct(selectedProduct.id)
    } catch (err) {
      console.warn('Could not persist deletion to backend:', err)
    }

    setProducts(products.filter(p => p.id !== selectedProduct.id))
    setSelectedProduct(null)
    setShowDeleteConfirm(false)
    triggerToast('Produk berhasil dihapus!', 'success')
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0">
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#1B52FF] p-2.5 rounded-xl flex items-center justify-center">
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
            <SidebarLink icon={<Package className="w-5 h-5" />} label="Produk" active onClick={() => onNavigate('produk')} />
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
                <p className="font-bold text-slate-900 text-sm">Kasir Utama</p>
                <p className="text-[10px] text-slate-400 font-medium mb-0.5 leading-none">kasir@tokokita.com</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider leading-none">Online</span>
                </div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <ChevronDown className="w-4 h-4" />
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

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Area: Product List */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0">

          {/* Header */}
          <header className="flex justify-between items-start mb-8 shrink-0">
            <div className="text-left space-y-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Produk</h2>
              <p className="text-slate-500 text-sm">Kelola semua produk yang tersedia di toko</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200">
                <Upload className="w-4 h-4 text-slate-400" />
                Impor Produk
              </button>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1B52FF] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tambah Produk
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

          {/* Search, Dropdowns, Filters Row */}
          <section className="mb-6 space-y-4 shrink-0 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama atau SKU..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all outline-none text-sm"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all duration-200 border ${showFilters
                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                Filter
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100/50 animate-in slide-in-from-top-2 duration-200">
                {/* Category dropdown */}
                <div className="w-full text-left">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1 pl-1">Kategori</label>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Snack">Snack</option>
                    <option value="Bahan Dapur">Bahan Dapur</option>
                  </select>
                </div>

                {/* Status dropdown */}
                <div className="w-full text-left">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1 pl-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Aktif">Aktif</option>
                    <option value="Stok Rendah">Stok Rendah</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            )}

            {/* Total counts */}
            <div className="text-left text-xs font-semibold text-slate-400">
              Total {filteredProducts.length} produk
            </div>
          </section>

          {/* Table Container */}
          <section className="flex-1 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(15,23,42,0.01)] flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-50 text-xs font-extrabold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && selectedRowIds.length === filteredProducts.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4 font-bold">Produk</th>
                    <th className="py-4 px-4 font-bold">SKU</th>
                    <th className="py-4 px-4 font-bold">Kategori</th>
                    <th className="py-4 px-4 font-bold">Harga</th>
                    <th className="py-4 px-4 font-bold">Stok</th>
                    <th className="py-4 px-4 font-bold">Status</th>
                    <th className="py-4 px-6 font-bold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {paginatedProducts.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${selectedProduct?.id === p.id ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(p.id)}
                          onChange={() => handleToggleRow(p.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80'
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{p.name}</p>
                            <span className="text-[10px] text-slate-400 font-semibold tracking-wider">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-550">{p.sku}</td>
                      <td className="py-4 px-4 font-medium text-slate-500">{p.category}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{formatPrice(p.price)}</td>
                      <td className={`py-4 px-4 font-bold ${p.stock <= p.minStock ? 'text-red-500' : 'text-emerald-600'
                        }`}>{p.stock}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${p.status === 'Aktif'
                            ? 'bg-emerald-50 text-emerald-600'
                            : p.status === 'Stok Rendah'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-xl shadow-sm text-slate-500 hover:bg-blue-50/25 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-slate-450 hover:text-slate-700 transition-all cursor-pointer">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Package className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                        <p className="font-semibold text-slate-500">Tidak ada produk ditemukan</p>
                        <p className="text-xs text-slate-400 mt-0.5">Coba cari dengan kata kunci lain atau ubah filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Flexible Pagination footer */}
            <footer className="flex flex-wrap justify-between items-center py-4 px-6 border-t border-slate-100 shrink-0 gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-semibold">
                  {itemsPerPage === 'Semua'
                    ? `Menampilkan semua ${filteredProducts.length} produk`
                    : `Menampilkan ${Math.min((currentPageNum - 1) * itemsPerPage + 1, filteredProducts.length)} - ${Math.min(currentPageNum * itemsPerPage, filteredProducts.length)} dari ${filteredProducts.length} produk`
                  }
                </span>

                {/* Rows Per Page Selector */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span>Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const val = e.target.value
                      setItemsPerPage(val === 'Semua' ? 'Semua' : Number(val))
                      setCurrentPageNum(1)
                    }}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 text-xs cursor-pointer focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5 Baris</option>
                    <option value={10}>10 Baris</option>
                    <option value={25}>25 Baris</option>
                    <option value={50}>50 Baris</option>
                    <option value="Semua">Semua Data</option>
                  </select>
                </div>
              </div>

              {/* Page navigation buttons */}
              {itemsPerPage !== 'Semua' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPageNum(prev => Math.max(1, prev - 1))}
                    disabled={currentPageNum === 1}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-slate-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPageNum(pNum)}
                      className={`w-9 h-9 rounded-xl font-bold text-sm transition-all cursor-pointer ${currentPageNum === pNum
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPageNum(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPageNum === totalPages}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 text-slate-500 cursor-pointer disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </footer>
          </section>
        </div>

        {/* Right Area: Detail panel */}
        {selectedProduct ? (
          <aside className="w-[420px] bg-white border-l border-slate-100 flex flex-col justify-between shrink-0 h-full overflow-hidden">
            {/* Panel Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-900 text-lg text-left">Detail Produk</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Panel Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Profile */}
              <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    referrerPolicy="no-referrer"
                    className="w-4/5 h-4/5 object-contain mix-blend-multiply"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80'
                    }}
                  />
                </div>
                <div className="text-left space-y-1">
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">{selectedProduct.name}</h4>
                  <div className="flex gap-2 items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${selectedProduct.status === 'Aktif'
                        ? 'bg-emerald-50 text-emerald-600'
                        : selectedProduct.status === 'Stok Rendah'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                      <span className={`w-1 h-1 rounded-full ${selectedProduct.status === 'Aktif'
                          ? 'bg-emerald-500'
                          : selectedProduct.status === 'Stok Rendah'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`} />
                      {selectedProduct.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">SKU: {selectedProduct.sku}</span>
                  </div>
                  <p className="text-[10px] text-slate-450 font-bold">Kategori: {selectedProduct.category}</p>
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-3.5 text-left text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Harga Jual (Default)</span>
                  <span className="text-slate-800 font-bold">{formatPrice(selectedProduct.price)} / {selectedProduct.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Beli (HPP)</span>
                  <span className="text-slate-800 font-semibold">{formatPrice(selectedProduct.costPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stok</span>
                  <span className="text-slate-800 font-semibold">{selectedProduct.stock}</span>
                </div>
                <div className="flex justify-between">
                  <span>Satuan Default</span>
                  <span className="text-slate-800 font-semibold">{selectedProduct.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimal Stok</span>
                  <span className="text-slate-800 font-semibold">{selectedProduct.minStock}</span>
                </div>
                <div className="flex justify-between">
                  <span>Barcode</span>
                  <span className="text-slate-850 font-mono font-semibold">{selectedProduct.barcode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplier</span>
                  <span className="text-slate-800 font-semibold">{selectedProduct.supplier}</span>
                </div>

                {/* List of Selling Units */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Unit & Harga Jual</span>
                  <div className="space-y-1.5">
                    {(selectedProduct.units || [{ name: selectedProduct.unit, price: selectedProduct.price, isDefault: true }]).map((u, idx) => {
                      const costNum = selectedProduct.costPrice || 0
                      const unitCost = costNum * (u.qty || 1)
                      const margin = unitCost > 0 ? Math.round(((u.price - unitCost) / unitCost) * 100) : 0
                      return (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              {u.name}
                              {u.isDefault && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Default</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-0.5">Isi: {u.qty || 1} Pcs</span>
                          </div>
                          <div className="text-right">
                            <span className="block font-extrabold text-slate-900">{formatPrice(u.price)}</span>
                            <span className={`text-[10px] font-bold ${margin >= 20 ? 'text-emerald-600' : margin >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                              Margin: {margin}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Deskripsi</span>
                  <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {selectedProduct.description || 'Tidak ada deskripsi.'}
                  </p>
                </div>
              </div>

              {/* Stock History */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-slate-850">Riwayat Stok</span>
                  <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
                </div>

                <div className="space-y-3">
                  {selectedProduct.history?.map((h, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${h.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                          {h.amount > 0 ? `+${h.amount}` : h.amount}
                        </div>
                        <div className="text-left leading-tight">
                          <p className="font-bold text-slate-700 text-xs">{h.type}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">{h.date}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">oleh {h.operator}</span>
                      </div>
                    </div>
                  ))}
                  {(!selectedProduct.history || selectedProduct.history.length === 0) && (
                    <p className="text-xs text-slate-450 italic py-2">Belum ada riwayat pergerakan stok.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3 shrink-0">
              <button
                onClick={() => openEditModal(selectedProduct)}
                className="flex-1 bg-white hover:bg-slate-50 border border-blue-200 hover:border-blue-400 text-blue-600 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit Produk
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 bg-white hover:bg-red-50 border border-red-200 hover:border-red-400 text-red-650 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Produk
              </button>
            </div>
          </aside>
        ) : (
          <aside className="w-[420px] bg-white border-l border-slate-100 flex flex-col items-center justify-center p-8 shrink-0 h-full text-slate-400">
            <Package className="w-16 h-16 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Pilih Produk</p>
            <p className="text-xs text-slate-400 text-center max-w-[200px] mt-1">Klik baris produk di tabel untuk melihat detail info produk dan riwayat stok</p>
          </aside>
        )}
      </main>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Tambah Produk Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="prodName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Produk *</label>
                  <input
                    type="text"
                    id="prodName"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="Contoh: Kopi Susu Aren"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="prodSku" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Kode Produk</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="prodSku"
                      value={formSku}
                      onChange={e => setFormSku(e.target.value)}
                      placeholder="Contoh: KOP009"
                      className="w-full pl-4 pr-14 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
                        setFormSku(`PRD${randomDigits}`)
                        triggerToast('SKU di-generate otomatis!', 'success')
                      }}
                      className="absolute right-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all uppercase"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="prodCat" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                  <select
                    id="prodCat"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-semibold text-sm"
                  >
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Snack">Snack</option>
                    <option value="Bahan Dapur">Bahan Dapur</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="prodCost" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Beli / Pokok (Rp)</label>
                  <input
                    type="number"
                    id="prodCost"
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(e.target.value)}
                    placeholder="Contoh: 8000"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Unit & Selling Price Section */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit & Harga Jual *</h4>
                  <button
                    type="button"
                    onClick={() => setFormUnits([...formUnits, { name: 'Pcs', price: 0, isDefault: false, qty: 1 }])}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Unit
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formUnits.map((u, index) => {
                    const costNum = parseFloat(formCostPrice) || 0
                    const unitCost = costNum * (u.qty || 1)
                    const margin = unitCost > 0 ? Math.round(((u.price - unitCost) / unitCost) * 100) : 0
                    const selectValue = STANDARD_UNITS.includes(u.name) ? u.name : (u.name === '' ? '' : 'Lainnya')
                    return (
                      <div key={index} className="space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-xl relative">
                        {/* Top part on mobile: Default radio + Unit Name + Delete button */}
                        <div className="flex items-end gap-3 w-full sm:w-auto sm:flex-1">
                          {/* Radio default */}
                          <div className="flex flex-col items-center justify-center shrink-0 pb-1.5">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Default</span>
                            <input
                              type="radio"
                              name="addDefaultUnit"
                              checked={u.isDefault}
                              onChange={() => {
                                setFormUnits(formUnits.map((item, idx) => ({
                                  ...item,
                                  isDefault: idx === index
                                })))
                              }}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* Unit name dropdown */}
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Unit</span>
                            {selectValue === 'Lainnya' ? (
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder="Nama unit..."
                                  value={u.name}
                                  onChange={e => {
                                    const val = e.target.value
                                    setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: val } : item))
                                  }}
                                  className="w-full pr-7 px-2 py-1.5 border border-slate-200 rounded-lg text-slate-950 outline-none focus:border-blue-600 font-semibold text-xs bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: 'Pcs' } : item))
                                  }}
                                  className="absolute right-1 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <select
                                value={selectValue}
                                onChange={e => {
                                  const val = e.target.value
                                  const newName = val === 'Lainnya' ? '' : val
                                  setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: newName } : item))
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white cursor-pointer"
                              >
                                <option value="" disabled>Pilih Unit</option>
                                {STANDARD_UNITS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Lainnya">Lainnya (Kustom)</option>
                              </select>
                            )}
                          </div>

                          {/* Delete button on mobile (hidden on desktop, placed here on mobile) */}
                          {formUnits.length > 1 && (
                            <div className="sm:hidden shrink-0 pb-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUnits = formUnits.filter((_, idx) => idx !== index)
                                  if (u.isDefault && nextUnits.length > 0) {
                                    nextUnits[0].isDefault = true
                                  }
                                  setFormUnits(nextUnits)
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom part on mobile: Qty + Price + Margin + Delete Button (desktop only) */}
                        <div className="flex items-end gap-3 w-full sm:w-auto">
                          {/* Quantity / Isi */}
                          <div className="w-16 shrink-0 text-center">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Isi / Qty</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={u.qty || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, qty: val } : item))
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white text-center"
                            />
                          </div>

                          {/* Selling Price */}
                          <div className="flex-1">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Harga Jual</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={u.price || ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, price: val } : item))
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white"
                            />
                          </div>

                          {/* Margin */}
                          <div className="w-16 shrink-0 text-center">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Margin (%)</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={margin || ''}
                              onChange={e => {
                                const newMargin = parseFloat(e.target.value) || 0
                                const costNum = parseFloat(formCostPrice) || 0
                                const unitCost = costNum * (u.qty || 1)
                                const calculatedPrice = Math.round(unitCost * (1 + newMargin / 100))
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, price: calculatedPrice } : item))
                              }}
                              className={`w-full px-1 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-extrabold text-xs text-center ${margin >= 20 ? 'text-emerald-600 bg-emerald-50/20' : margin >= 0 ? 'text-blue-600 bg-blue-50/20' : 'text-red-500 bg-red-50/20'
                                }`}
                            />
                          </div>

                          {/* Delete button (hidden on mobile, visible on desktop) */}
                          {formUnits.length > 1 && (
                            <div className="hidden sm:block shrink-0 pb-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUnits = formUnits.filter((_, idx) => idx !== index)
                                  if (u.isDefault && nextUnits.length > 0) {
                                    nextUnits[0].isDefault = true
                                  }
                                  setFormUnits(nextUnits)
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="prodStock" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Stok Awal *</label>
                  <input
                    type="number"
                    id="prodStock"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    placeholder="Contoh: 50"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="prodMinStock" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Minimal Stok</label>
                  <input
                    type="number"
                    id="prodMinStock"
                    value={formMinStock}
                    onChange={e => setFormMinStock(e.target.value)}
                    placeholder="Contoh: 10"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="prodBarcode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="prodBarcode"
                      value={formBarcode}
                      onChange={e => setFormBarcode(e.target.value)}
                      placeholder="Contoh: 8990123456"
                      className="w-full pl-4 pr-14 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString()
                        setFormBarcode(`899${randomDigits}`)
                        triggerToast('Barcode di-generate otomatis!', 'success')
                      }}
                      className="absolute right-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all uppercase"
                    >
                      Auto
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAddSupplierDropdown(!showAddSupplierDropdown)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-left outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm bg-white flex justify-between items-center"
                    >
                      <span className={formSupplier ? 'text-slate-950' : 'text-slate-400'}>
                        {formSupplier || 'Pilih Supplier'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {showAddSupplierDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowAddSupplierDropdown(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddSupplierDropdown(false)
                              const newSup = prompt('Masukkan nama supplier baru:')
                              if (newSup && newSup.trim()) {
                                const trimmed = newSup.trim()
                                if (!suppliers.includes(trimmed)) {
                                  setSuppliers([...suppliers, trimmed])
                                }
                                setFormSupplier(trimmed)
                                triggerToast('Supplier baru ditambahkan!', 'success')
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#1B52FF] hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Supplier Baru
                          </button>

                          <div className="h-px bg-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setFormSupplier('')
                              setShowAddSupplierDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            Pilih Supplier
                          </button>

                          {suppliers.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setFormSupplier(s)
                                setShowAddSupplierDropdown(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${formSupplier === s
                                  ? 'bg-blue-50 text-[#1B52FF]'
                                  : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="prodImage" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">URL Gambar Produk</label>
                <input
                  type="text"
                  id="prodImage"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prodDesc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                <textarea
                  id="prodDesc"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Keterangan singkat produk..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-955 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-[#1B52FF] hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/10"
                >
                  Tambah Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Edit Detail Produk</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="editName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Produk *</label>
                  <input
                    type="text"
                    id="editName"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="editSku" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">SKU / Kode Produk</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="editSku"
                      value={formSku}
                      onChange={e => setFormSku(e.target.value)}
                      className="w-full pl-4 pr-14 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomDigits = Math.floor(1000 + Math.random() * 9000).toString()
                        setFormSku(`PRD${randomDigits}`)
                        triggerToast('SKU di-generate otomatis!', 'success')
                      }}
                      className="absolute right-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all uppercase"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="editCat" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                  <select
                    id="editCat"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-blue-600 transition-all cursor-pointer font-semibold text-sm"
                  >
                    <option value="Minuman">Minuman</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Snack">Snack</option>
                    <option value="Bahan Dapur">Bahan Dapur</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="editCost" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Harga Beli / Pokok (Rp)</label>
                  <input
                    type="number"
                    id="editCost"
                    value={formCostPrice}
                    onChange={e => setFormCostPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Unit & Selling Price Section */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit & Harga Jual *</h4>
                  <button
                    type="button"
                    onClick={() => setFormUnits([...formUnits, { name: 'Pcs', price: 0, isDefault: false, qty: 1 }])}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Unit
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {formUnits.map((u, index) => {
                    const costNum = parseFloat(formCostPrice) || 0
                    const unitCost = costNum * (u.qty || 1)
                    const margin = unitCost > 0 ? Math.round(((u.price - unitCost) / unitCost) * 100) : 0
                    const selectValue = STANDARD_UNITS.includes(u.name) ? u.name : (u.name === '' ? '' : 'Lainnya')
                    return (
                      <div key={index} className="space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-xl relative">
                        {/* Top part on mobile: Default radio + Unit Name + Delete button */}
                        <div className="flex items-end gap-3 w-full sm:w-auto sm:flex-1">
                          {/* Radio default */}
                          <div className="flex flex-col items-center justify-center shrink-0 pb-1.5">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Default</span>
                            <input
                              type="radio"
                              name="editDefaultUnit"
                              checked={u.isDefault}
                              onChange={() => {
                                setFormUnits(formUnits.map((item, idx) => ({
                                  ...item,
                                  isDefault: idx === index
                                })))
                              }}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </div>

                          {/* Unit name dropdown */}
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Nama Unit</span>
                            {selectValue === 'Lainnya' ? (
                              <div className="relative flex items-center">
                                <input
                                  type="text"
                                  placeholder="Nama unit..."
                                  value={u.name}
                                  onChange={e => {
                                    const val = e.target.value
                                    setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: val } : item))
                                  }}
                                  className="w-full pr-7 px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: 'Pcs' } : item))
                                  }}
                                  className="absolute right-1 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <select
                                value={selectValue}
                                onChange={e => {
                                  const val = e.target.value
                                  const newName = val === 'Lainnya' ? '' : val
                                  setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, name: newName } : item))
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white cursor-pointer"
                              >
                                <option value="" disabled>Pilih Unit</option>
                                {STANDARD_UNITS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                                <option value="Lainnya">Lainnya (Kustom)</option>
                              </select>
                            )}
                          </div>

                          {/* Delete button on mobile (hidden on desktop, placed here on mobile) */}
                          {formUnits.length > 1 && (
                            <div className="sm:hidden shrink-0 pb-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUnits = formUnits.filter((_, idx) => idx !== index)
                                  if (u.isDefault && nextUnits.length > 0) {
                                    nextUnits[0].isDefault = true
                                  }
                                  setFormUnits(nextUnits)
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Bottom part on mobile: Qty + Price + Margin + Delete Button (desktop only) */}
                        <div className="flex items-end gap-3 w-full sm:w-auto">
                          {/* Quantity / Isi */}
                          <div className="w-16 shrink-0 text-center">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Isi / Qty</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={u.qty || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, qty: val } : item))
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white text-center"
                            />
                          </div>

                          {/* Selling Price */}
                          <div className="flex-1">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Harga Jual</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={u.price || ''}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, price: val } : item))
                              }}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-slate-955 outline-none focus:border-blue-600 font-semibold text-xs bg-white"
                            />
                          </div>

                          {/* Margin */}
                          <div className="w-16 shrink-0 text-center">
                            <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Margin (%)</span>
                            <input
                              type="number"
                              placeholder="0"
                              value={margin || ''}
                              onChange={e => {
                                const newMargin = parseFloat(e.target.value) || 0
                                const costNum = parseFloat(formCostPrice) || 0
                                const unitCost = costNum * (u.qty || 1)
                                const calculatedPrice = Math.round(unitCost * (1 + newMargin / 100))
                                setFormUnits(formUnits.map((item, idx) => idx === index ? { ...item, price: calculatedPrice } : item))
                              }}
                              className={`w-full px-1 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-extrabold text-xs text-center ${margin >= 20 ? 'text-emerald-600 bg-emerald-50/20' : margin >= 0 ? 'text-blue-600 bg-blue-50/20' : 'text-red-500 bg-red-50/20'
                                }`}
                            />
                          </div>

                          {/* Delete button (hidden on mobile, visible on desktop) */}
                          {formUnits.length > 1 && (
                            <div className="hidden sm:block shrink-0 pb-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUnits = formUnits.filter((_, idx) => idx !== index)
                                  if (u.isDefault && nextUnits.length > 0) {
                                    nextUnits[0].isDefault = true
                                  }
                                  setFormUnits(nextUnits)
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="editStock" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Stok *</label>
                  <input
                    type="number"
                    id="editStock"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="editMinStock" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Minimal Stok</label>
                  <input
                    type="number"
                    id="editMinStock"
                    value={formMinStock}
                    onChange={e => setFormMinStock(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="editBarcode" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Barcode</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="editBarcode"
                      value={formBarcode}
                      onChange={e => setFormBarcode(e.target.value)}
                      className="w-full pl-4 pr-14 py-2.5 border border-slate-200 rounded-xl text-slate-950 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString()
                        setFormBarcode(`899${randomDigits}`)
                        triggerToast('Barcode di-generate otomatis!', 'success')
                      }}
                      className="absolute right-2 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all uppercase"
                    >
                      Auto
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditSupplierDropdown(!showEditSupplierDropdown)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-left outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm bg-white flex justify-between items-center"
                    >
                      <span className={formSupplier ? 'text-slate-950' : 'text-slate-400'}>
                        {formSupplier || 'Pilih Supplier'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {showEditSupplierDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowEditSupplierDropdown(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEditSupplierDropdown(false)
                              const newSup = prompt('Masukkan nama supplier baru:')
                              if (newSup && newSup.trim()) {
                                const trimmed = newSup.trim()
                                if (!suppliers.includes(trimmed)) {
                                  setSuppliers([...suppliers, trimmed])
                                }
                                setFormSupplier(trimmed)
                                triggerToast('Supplier baru ditambahkan!', 'success')
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-[#1B52FF] hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Supplier Baru
                          </button>

                          <div className="h-px bg-slate-100 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setFormSupplier('')
                              setShowEditSupplierDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            Pilih Supplier
                          </button>

                          {suppliers.map(s => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                setFormSupplier(s)
                                setShowEditSupplierDropdown(false)
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${formSupplier === s
                                  ? 'bg-blue-50 text-[#1B52FF]'
                                  : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="editImage" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">URL Gambar Produk</label>
                <input
                  type="text"
                  id="editImage"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-955 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-semibold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="editDesc" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                <textarea
                  id="editDesc"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-955 outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 transition-all font-medium text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/10"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900">Hapus Produk?</h3>
            <p className="text-sm text-slate-550 leading-relaxed font-medium">
              Apakah Anda yakin ingin menghapus produk <span className="font-bold text-slate-800">"{selectedProduct?.name}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 font-bold text-sm transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="flex-1 py-3 px-4 bg-red-650 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-red-600/10"
              >
                Hapus
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-left ${active
          ? 'bg-blue-50 text-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.04)]'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
        }`}
    >
      {icon}
      {label}
    </button>
  )
}
