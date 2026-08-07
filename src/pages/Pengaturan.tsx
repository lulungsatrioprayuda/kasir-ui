import React, { useState, useRef } from 'react'
import type { Product } from '../types'
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
  Store,
  Sliders,
  Printer,
  Database,
  Info,
  Sun,
  Moon,
  Upload,
  Bell,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface PengaturanProps {
  products: Product[]
  onLogout: () => void
  onNavigate: (page: 'dashboard' | 'transaksi' | 'produk' | 'restok' | 'laporan' | 'pengaturan') => void
}

type SettingsMenuType = 'Informasi Toko' | 'Preferensi' | 'Printer Struk' | 'Pengguna' | 'Backup Data' | 'Tentang Aplikasi'

export default function Pengaturan({ products, onLogout, onNavigate }: PengaturanProps) {
  const [activeMenu, setActiveMenu] = useState<SettingsMenuType>('Informasi Toko')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Shop Information States
  const [shopName, setShopName] = useState('Toko Kita')
  const [phoneNumber, setPhoneNumber] = useState('0812-3456-7890')
  const [shopAddress, setShopAddress] = useState('Desa \nKabupaten Jember, Jawa Timur 68184')
  const [shopEmail, setShopEmail] = useState('info@tokokita.com')
  const [shopLogo, setShopLogo] = useState<string | null>(null)

  // System Preferences States
  const [currency, setCurrency] = useState('IDR')
  const [themeMode, setThemeMode] = useState<'Terang' | 'Gelap'>('Terang')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [taxPercent, setTaxPercent] = useState(11)
  const [receiptLanguage, setReceiptLanguage] = useState('id')

  // Printer Settings States
  const [printerName, setPrinterName] = useState('Epson TM-T88VI')
  const [printerPaperSize, setPrinterPaperSize] = useState('80mm')
  const [printerConnection, setPrinterConnection] = useState('USB')

  // Users List States (Mock data matching typical user database)
  const [users, setUsers] = useState([
    { id: 1, name: 'Kasir Utama', email: 'kasir@tokokita.com', role: 'Administrator', status: 'Online' },
    { id: 2, name: 'Budi Santoso', email: 'budi@tokokita.com', role: 'Kasir', status: 'Offline' },
    { id: 3, name: 'Siti Aminah', email: 'siti@tokokita.com', role: 'Kasir', status: 'Offline' }
  ])
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('Kasir')
  const [showAddUserModal, setShowAddUserModal] = useState(false)

  // Handle Logo Upload Preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setShopLogo(uploadEvent.target.result as string)
          showToast('Logo berhasil diunggah.')
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // Handle Save Info
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault()
    showToast('Pengaturan informasi toko berhasil disimpan.')
  }

  // Handle System Preferences Save
  const handleSavePreferences = () => {
    showToast('Preferensi sistem berhasil diperbarui.')
  }

  // Add New User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Nama dan Email pengguna harus diisi!')
      return
    }
    const newUser = {
      id: Date.now(),
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      status: 'Offline'
    }
    setUsers([...users, newUser])
    setNewUserName('')
    setNewUserEmail('')
    setNewUserRole('Kasir')
    setShowAddUserModal(false)
    showToast('Pengguna baru berhasil ditambahkan.')
  }

  // Delete User
  const handleDeleteUser = (id: number) => {
    if (id === 1) {
      showToast('Tidak dapat menghapus Administrator Utama!')
      return
    }
    setUsers(users.filter(u => u.id !== id))
    showToast('Pengguna berhasil dihapus.')
  }

  // Backup Trigger
  const handleBackupNow = () => {
    showToast('Memulai pencadangan data toko...')
    setTimeout(() => {
      // Simulate CSV or JSON download
      const backupDataObj = {
        shopName,
        phoneNumber,
        shopAddress,
        shopEmail,
        currency,
        soundEnabled,
        taxPercent,
        usersCount: users.length,
        timestamp: new Date().toISOString()
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupDataObj, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `kasirku_backup_${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.removeChild(downloadAnchor)
      showToast('Pencadangan berhasil diunduh.')
    }, 1500)
  }

  // Test printer receipt trigger
  const handleTestPrint = () => {
    showToast('Mengirim test print ke ' + printerName + '...')
    setTimeout(() => {
      showToast('Test print tercetak sukses.')
    }, 1000)
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
            <SidebarLink icon={<BarChart3 className="w-5 h-5" />} label="Laporan" onClick={() => onNavigate('laporan')} />
            <SidebarLink icon={<Settings className="w-5 h-5" />} label="Pengaturan" active onClick={() => onNavigate('pengaturan')} />
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
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan</h2>
            <p className="text-slate-500 mt-1">Atur informasi toko dan preferensi sistem.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-3 border border-slate-100 rounded-2xl shadow-sm self-end">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80"
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div className="text-left">
              <p className="font-bold text-slate-900 text-sm">Kasir Utama</p>
              <p className="text-xs text-slate-400 leading-none">Kasir</p>
            </div>
          </div>
        </div>

        {/* Outer Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Inner Left Submenu (1 Column) */}
          <div className="md:col-span-1 bg-white p-5 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-4 px-2">Menu Pengaturan</h3>
            <div className="space-y-1.5">
              <SettingsTabLink
                icon={<Store className="w-4 h-4" />}
                label="Informasi Toko"
                active={activeMenu === 'Informasi Toko'}
                onClick={() => setActiveMenu('Informasi Toko')}
              />
              <SettingsTabLink
                icon={<Sliders className="w-4 h-4" />}
                label="Preferensi"
                active={activeMenu === 'Preferensi'}
                onClick={() => setActiveMenu('Preferensi')}
              />
              <SettingsTabLink
                icon={<Printer className="w-4 h-4" />}
                label="Printer Struk"
                active={activeMenu === 'Printer Struk'}
                onClick={() => setActiveMenu('Printer Struk')}
              />
              <SettingsTabLink
                icon={<Users className="w-4 h-4" />}
                label="Pengguna"
                active={activeMenu === 'Pengguna'}
                onClick={() => setActiveMenu('Pengguna')}
              />
              <SettingsTabLink
                icon={<Database className="w-4 h-4" />}
                label="Backup Data"
                active={activeMenu === 'Backup Data'}
                onClick={() => setActiveMenu('Backup Data')}
              />
              <SettingsTabLink
                icon={<Info className="w-4 h-4" />}
                label="Tentang Aplikasi"
                active={activeMenu === 'Tentang Aplikasi'}
                onClick={() => setActiveMenu('Tentang Aplikasi')}
              />
            </div>
          </div>

          {/* Inner Right Content Panel (3 Columns) */}
          <div className="md:col-span-3 space-y-6">
            {activeMenu === 'Informasi Toko' && (
              <>
                {/* Informasi Toko Card */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="font-extrabold text-slate-800 text-lg">Informasi Toko</h3>
                  </div>

                  <form onSubmit={handleSaveInfo} className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      {/* Logo Uploader */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-32 h-32 bg-slate-50 border border-slate-200/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                          {shopLogo ? (
                            <img src={shopLogo} alt="Shop Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-12 h-12 text-slate-400" />
                          )}
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-400" />
                          Ubah Logo
                        </button>
                      </div>

                      {/* Text inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full text-xs font-bold text-slate-700">
                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Nama Toko</label>
                          <input
                            type="text"
                            required
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">No. Telepon</label>
                          <input
                            type="text"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1 text-left sm:col-span-2">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Alamat Toko</label>
                          <textarea
                            rows={3}
                            required
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold resize-none"
                          />
                        </div>
                        <div className="space-y-1 text-left sm:col-span-2">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Email (Opsional)</label>
                          <input
                            type="email"
                            value={shopEmail}
                            onChange={(e) => setShopEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-50">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </div>

                {/* Preferensi Sistem Panel */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="font-extrabold text-slate-800 text-lg">Preferensi Sistem</h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* Currency option */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 first:pt-0">
                      <div className="flex items-center gap-3.5 text-left">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                          <span className="font-extrabold text-xs">Rp</span>
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm leading-tight">Mata Uang</p>
                          <p className="text-xs text-slate-400 font-medium">Pilih mata uang yang digunakan</p>
                        </div>
                      </div>
                      <select
                        value={currency}
                        onChange={(e) => { setCurrency(e.target.value); showToast('Mata uang diubah ke ' + e.target.value); }}
                        className="px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-bold text-xs cursor-pointer focus:border-blue-500 w-full sm:w-48 text-slate-700"
                      >
                        <option value="IDR">Rupiah (IDR)</option>
                        <option value="USD">Dolar AS (USD)</option>
                        <option value="SGD">Singapore Dollar (SGD)</option>
                      </select>
                    </div>

                    {/* Theme Mode option */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3.5 text-left">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm leading-tight">Mode Tampilan</p>
                          <p className="text-xs text-slate-400 font-medium">Pilih tema tampilan aplikasi</p>
                        </div>
                      </div>
                      <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-xl gap-1 w-full sm:w-fit self-end">
                        <button
                          type="button"
                          onClick={() => { setThemeMode('Terang'); showToast('Tema terang diaktifkan.'); }}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${themeMode === 'Terang'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          <Sun className="w-3.5 h-3.5" />
                          Terang
                        </button>
                        <button
                          type="button"
                          onClick={() => { setThemeMode('Gelap'); showToast('Tema gelap segera hadir!'); }}
                          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${themeMode === 'Gelap'
                            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                          <Moon className="w-3.5 h-3.5" />
                          Gelap
                        </button>
                      </div>
                    </div>

                    {/* Sounds notification option */}
                    <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 last:pb-0">
                      <div className="flex items-center gap-3.5 text-left">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm leading-tight">Suara Notifikasi</p>
                          <p className="text-xs text-slate-400 font-medium">Aktifkan suara pada setiap transaksi</p>
                        </div>
                      </div>
                      <div className="flex items-center w-full sm:w-fit justify-end">
                        <button
                          type="button"
                          onClick={() => { setSoundEnabled(!soundEnabled); showToast(soundEnabled ? 'Suara notifikasi dinonaktifkan.' : 'Suara notifikasi diaktifkan.'); }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${soundEnabled ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Backup Data Panel */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                  <div className="border-b border-slate-50 pb-4">
                    <h3 className="font-extrabold text-slate-800 text-lg">Backup Data</h3>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3.5 text-left">
                      <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm leading-tight">Backup Data</p>
                        <p className="text-xs text-slate-400 font-medium">Simpan data toko secara manual</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackupNow}
                      className="px-4 py-2.5 border border-blue-600 hover:bg-blue-50 text-blue-600 rounded-xl font-bold text-xs transition-colors shadow-sm self-end sm:self-center"
                    >
                      Backup Sekarang
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeMenu === 'Preferensi' && (
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                <div className="border-b border-slate-50 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg">Preferensi & Biaya Sistem</h3>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-slate-400 uppercase tracking-wider text-[10px]">Persentase Pajak (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-slate-400 uppercase tracking-wider text-[10px]">Bahasa Struk</label>
                      <select
                        value={receiptLanguage}
                        onChange={(e) => setReceiptLanguage(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English (US)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-50">
                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Simpan Preferensi
                  </button>
                </div>
              </div>
            )}

            {activeMenu === 'Printer Struk' && (
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                <div className="border-b border-slate-50 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg">Konfigurasi Printer Struk</h3>
                </div>

                <div className="space-y-4 text-xs font-bold text-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-slate-400 uppercase tracking-wider text-[10px]">Nama Printer</label>
                      <input
                        type="text"
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-slate-400 uppercase tracking-wider text-[10px]">Lebar Kertas</label>
                      <select
                        value={printerPaperSize}
                        onChange={(e) => setPrinterPaperSize(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                      >
                        <option value="80mm">80mm (Thermal Standard)</option>
                        <option value="58mm">58mm (Mobile Printer)</option>
                      </select>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-slate-400 uppercase tracking-wider text-[10px]">Koneksi</label>
                      <select
                        value={printerConnection}
                        onChange={(e) => setPrinterConnection(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                      >
                        <option value="USB">USB Connection</option>
                        <option value="Bluetooth">Bluetooth</option>
                        <option value="Wi-Fi / LAN">Network (Wi-Fi / LAN)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button
                    onClick={handleTestPrint}
                    className="px-4 py-3 border border-slate-250 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Test Print Struk
                  </button>
                  <button
                    onClick={() => showToast('Konfigurasi printer berhasil disimpan.')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Simpan Printer
                  </button>
                </div>
              </div>
            )}

            {activeMenu === 'Pengguna' && (
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg">Kelola Pengguna</h3>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Pengguna
                  </button>
                </div>

                {/* Users List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-semibold text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-left">
                        <th className="py-3 px-2">Nama</th>
                        <th className="py-3 px-2">Email</th>
                        <th className="py-3 px-2">Peran (Role)</th>
                        <th className="py-3 px-2 text-center">Status</th>
                        <th className="py-3 px-2 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {users.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-2 font-extrabold text-slate-900">{item.name}</td>
                          <td className="py-4 px-2 text-slate-700 font-semibold">{item.email}</td>
                          <td className="py-4 px-2 font-bold text-slate-600">{item.role}</td>
                          <td className="py-4 px-2 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider ${item.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                              <span className={`w-1 h-1 rounded-full ${item.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">
                            <button
                              disabled={item.id === 1}
                              onClick={() => handleDeleteUser(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add User Modal */}
                {showAddUserModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 text-left">
                      <h4 className="font-extrabold text-slate-800 text-base mb-4">Tambah Pengguna Baru</h4>
                      <form onSubmit={handleAddUser} className="space-y-4 text-xs font-bold text-slate-700">
                        <div className="space-y-1">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Nama Lengkap</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Ahmad Subagyo"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Email</label>
                          <input
                            type="email"
                            required
                            placeholder="Contoh: ahmad@tokokita.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-400 uppercase tracking-wider text-[10px]">Peran (Role)</label>
                          <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl outline-none bg-white font-semibold cursor-pointer focus:border-blue-500"
                          >
                            <option value="Kasir">Kasir</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setShowAddUserModal(false)}
                            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
                          >
                            Tambah
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeMenu === 'Backup Data' && (
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                <div className="border-b border-slate-50 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg">Pencadangan & Pemulihan</h3>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">Cadangkan Database KasirKu</h4>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Unduh salinan penuh konfigurasi toko, produk, supplier, dan data riwayat transaksi Anda. Simpan di tempat yang aman.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleBackupNow}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                    >
                      Cadangkan Data Sekarang
                    </button>
                  </div>
                </div>

                <div className="p-5 bg-amber-50/40 border border-amber-100 rounded-2xl space-y-4 text-slate-700">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm leading-tight">Pulihkan Database KasirKu</h4>
                      <p className="text-xs text-amber-700 font-medium mt-1">
                        PENTING: Memulihkan database dari file cadangan (.json) akan menimpa data transaksi dan pengaturan toko saat ini. Harap berhati-hati.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        const fileInput = document.createElement('input')
                        fileInput.type = 'file'
                        fileInput.accept = '.json'
                        fileInput.onchange = (e: any) => {
                          if (e.target.files && e.target.files[0]) {
                            showToast('Memulihkan database dari file ' + e.target.files[0].name + '...')
                            setTimeout(() => {
                              showToast('Database berhasil dipulihkan.');
                            }, 1500)
                          }
                        }
                        fileInput.click()
                      }}
                      className="px-4 py-2.5 border border-amber-300 hover:bg-amber-100/50 text-amber-800 rounded-xl font-bold text-xs transition-colors"
                    >
                      Unggah File Cadangan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeMenu === 'Tentang Aplikasi' && (
              <div className="bg-white p-6 rounded-[24px] border border-slate-100/80 shadow-[0_10px_30px_rgba(15,23,42,0.015)] text-left space-y-6">
                <div className="border-b border-slate-50 pb-4">
                  <h3 className="font-extrabold text-slate-800 text-lg">Tentang KasirKu</h3>
                </div>

                <div className="flex flex-col items-center py-6 text-center space-y-4">
                  <div className="bg-blue-600 p-4 rounded-[28px] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <ShoppingBag className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xl">KasirKu POS Platform</h4>
                    <p className="text-xs text-slate-400 font-bold mt-1">Versi 1.2.4 (Build 49120)</p>
                  </div>
                  <p className="text-xs text-slate-500 max-w-md font-medium">
                    Aplikasi kasir point of sale modern, ergonomis, dan berkinerja tinggi untuk mengelola outlet ritel, inventaris barang, restocking, dan analytics penjualan Anda.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs text-slate-600 space-y-2.5 font-semibold text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lisensi</span>
                    <span className="text-slate-800">Commercial Licensed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pengembang</span>
                    <span className="text-slate-800">Google DeepMind Team</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Update Terakhir</span>
                    <span className="text-slate-800">24 Juli 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Produk Terdaftar</span>
                    <span className="text-slate-800">{products.length} Item</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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

// Nested settings tab helper component
function SettingsTabLink({
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
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 text-left ${active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// Main Sidebar item component
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
