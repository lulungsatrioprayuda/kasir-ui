const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      throw new Error(errBody.error || errBody.message || `HTTP ${res.status}`)
    }

    return await res.json()
  } catch (error) {
    console.warn(`[API Client] Error reaching ${endpoint}:`, error)
    throw error
  }
}

// API Services
export const api = {
  // Check API status
  getHealth: () => fetchApi<{ status: string; database: string }>('/'),

  // Products
  getProducts: () => fetchApi<{ success: boolean; data: any[] }>('/api/products'),
  getProductByBarcode: (barcode: string) => fetchApi<{ success: boolean; data: any }>(`/api/products/barcode/${barcode}`),
  createProduct: (data: any) => fetchApi<{ success: boolean; data: any }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: number | string, data: any) => fetchApi<{ success: boolean; data: any }>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  restockProduct: (id: number | string, data: any) => fetchApi<{ success: boolean; data: any }>(`/api/products/${id}/restock`, { method: 'POST', body: JSON.stringify(data) }),
  deleteProduct: (id: number | string) => fetchApi<{ success: boolean; message: string }>(`/api/products/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: () => fetchApi<{ success: boolean; data: any[] }>('/api/transactions'),
  createTransaction: (data: any) => fetchApi<{ success: boolean; data: any }>('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getDashboardReports: () => fetchApi<{ success: boolean; data: any }>('/api/reports/dashboard'),

  // Auth
  login: (credentials: any) => fetchApi<{ success: boolean; data: any; message: string }>('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // Printing
  printReceipt: (data: any) => fetchApi<{ success: boolean; message: string }>('/api/print/receipt', { method: 'POST', body: JSON.stringify(data) }),
}
