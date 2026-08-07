export interface ProductHistory {
  type: 'Stok Masuk' | 'Penjualan' | 'Penyesuaian'
  amount: number
  date: string
  operator: string
}

export interface ProductUnit {
  name: string
  price: number
  isDefault: boolean
  qty: number
}

export interface Product {
  id: number
  name: string
  sku: string
  category: string
  price: number
  costPrice: number
  stock: number
  unit: string
  minStock: number
  barcode: string
  supplier: string
  description: string
  status: 'Aktif' | 'Stok Rendah' | 'Nonaktif'
  image: string
  history: ProductHistory[]
  units: ProductUnit[]
}
