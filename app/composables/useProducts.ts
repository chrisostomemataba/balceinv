import { toast } from 'vue-sonner'

interface Product {
  id: number
  name: string
  sku: string
  barcode?: string | null
  price: number
  costPrice: number
  quantity: number
  minStock: number
  wholesalePrice?: number | null
  wholesaleMin?: number | null
  category?: string | null
  unit: string
  piecesPerUnit: number
  metadata?: Record<string, any> | null
  createdAt?: Date
  updatedAt?: Date
}

interface ProductFilters {
  search?: string
  category?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface UploadResult {
  created: number
  errors: Array<{ sku: string; error: string }>
}

export const useProducts = () => {
  const { public: { apiBase } } = useRuntimeConfig()
  const { $apiFetch } = useNuxtApp()

  const products = ref<Product[]>([])
  const lowStockProducts = ref<Product[]>([])
  const loading = ref(false)
  const selectedProduct = ref<Product | null>(null)

  const fetchProducts = async (filters?: ProductFilters): Promise<void> => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (filters?.search) query.append('search', filters.search)
      if (filters?.category) query.append('category', filters.category)
      const qs = query.toString()
      const url = qs ? `${apiBase}/api/products?${qs}` : `${apiBase}/api/products`
      const res = await $apiFetch<ApiResponse<Product[]>>(url, { credentials: 'include' as const })
      products.value = res.data ?? []
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch products')
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: number): Promise<Product | undefined> => {
    loading.value = true
    try {
      const res = await $apiFetch<ApiResponse<Product>>(`${apiBase}/api/products/${id}`, {
        credentials: 'include' as const
      })
      selectedProduct.value = res.data
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Could not load product details')
    } finally {
      loading.value = false
    }
  }

  const createProduct = async (product: Partial<Product>): Promise<Product | undefined> => {
    loading.value = true
    try {
      const res = await $apiFetch<ApiResponse<Product>>(`${apiBase}/api/products`, {
        method: 'POST' as const,
        body: product,
        credentials: 'include' as const
      })
      products.value.unshift(res.data)
      toast.success(res.message)
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to create product')
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateProduct = async (id: number, product: Partial<Product>): Promise<Product | undefined> => {
    loading.value = true
    try {
      const res = await $apiFetch<ApiResponse<Product>>(`${apiBase}/api/products/${id}`, {
        method: 'PUT' as const,
        body: product,
        credentials: 'include' as const
      })
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) products.value[index] = res.data
      toast.success(res.message)
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update product')
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteProduct = async (id: number): Promise<void> => {
    loading.value = true
    try {
      const res = await $apiFetch<ApiResponse<null>>(`${apiBase}/api/products/${id}`, {
        method: 'DELETE' as const,
        credentials: 'include' as const
      })
      products.value = products.value.filter(p => p.id !== id)
      toast.success(res.message)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete product')
      throw error
    } finally {
      loading.value = false
    }
  }

  const uploadExcel = async (file: File): Promise<UploadResult | undefined> => {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await $apiFetch<ApiResponse<UploadResult>>(`${apiBase}/api/products/upload`, {
        method: 'POST' as const,
        body: formData,
        credentials: 'include' as const
      })
      toast.success(res.message)
      if (res.data.errors.length > 0) {
        toast.warning(`${res.data.errors.length} product${res.data.errors.length > 1 ? 's' : ''} could not be imported`)
      }
      await fetchProducts()
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload products')
      throw error
    } finally {
      loading.value = false
    }
  }

  const downloadTemplate = (): void => {
    window.open(`${apiBase}/api/products/template`, '_blank')
    toast.success('Template downloaded')
  }

  const fetchLowStock = async (): Promise<void> => {
    loading.value = true
    try {
      const res = await $apiFetch<ApiResponse<Product[]>>(`${apiBase}/api/products/low-stock`, {
        credentials: 'include' as const
      })
      lowStockProducts.value = res.data ?? []
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch low stock products')
    } finally {
      loading.value = false
    }
  }

  return {
    products,
    lowStockProducts,
    loading,
    selectedProduct,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadExcel,
    downloadTemplate,
    fetchLowStock
  }
}