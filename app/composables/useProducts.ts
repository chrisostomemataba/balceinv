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
  createdAt: Date
  updatedAt: Date
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
  // useRuntimeConfig() reads the apiBase we set in nuxt.config.ts runtimeConfig.
  // On desktop (Tauri), this will be http://localhost:8080.
  // On web, it will be your deployed Go server URL.
  const { public: { apiBase } } = useRuntimeConfig()

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

      const res = await $fetch<ApiResponse<Product[]>>(url, {
        credentials: 'include'
      })
      products.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch products')
    } finally {
      loading.value = false
    }
  }

  const fetchProduct = async (id: number): Promise<Product | undefined> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Product>>(`${apiBase}/api/products/${id}`, {
        credentials: 'include'
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
      const res = await $fetch<ApiResponse<Product>>(`${apiBase}/api/products`, {
        method: 'POST',
        body: product,
        credentials: 'include'
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
      const res = await $fetch<ApiResponse<Product>>(`${apiBase}/api/products/${id}`, {
        method: 'PUT',
        body: product,
        credentials: 'include'
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
      const res = await $fetch<ApiResponse<null>>(`${apiBase}/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
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

      const res = await $fetch<ApiResponse<UploadResult>>(`${apiBase}/api/products/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
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
    // Opens the template download in the current tab.
    // On desktop (Tauri) this triggers a native file save dialog.
    window.open(`${apiBase}/api/products/template`, '_blank')
    toast.success('Template downloaded')
  }

  const fetchLowStock = async (): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Product[]>>(`${apiBase}/api/products/low-stock`, {
        credentials: 'include'
      })
      lowStockProducts.value = res.data
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