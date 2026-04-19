import { toast } from 'vue-sonner'

interface SaleItem {
  productId: number
  quantity: number
  isWholesale?: boolean
}

interface Sale {
  id: number
  receiptNumber: string
  userId: number
  totalAmount: number
  paymentType: string
  saleType: string
  taxAmount: number
  createdAt: Date
  change?: number
  items?: Array<{
    id: number
    saleId: number
    productId: number
    quantity: number
    unitPrice: number
    totalPrice: number
    isWholesale: boolean
    product: {
      id: number
      name: string
      price: number
      wholesalePrice?: number
    }
  }>
  user?: {
    name: string
    email: string
  }
}

interface SalesFilters {
  startDate?: string
  endDate?: string
  paymentType?: string
  saleType?: string
}

interface DailySalesSummary {
  sales: Sale[]
  totalRevenue: number
  totalTransactions: number
  totalTax: number
}

interface MonthlySalesSummary extends DailySalesSummary {
  averageTransaction: number
}

interface UploadResult {
  created: number
  errors: Array<{ row: number; error: string }>
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const useSales = () => {
  // Read the Go server base URL from runtime config.
  // This is set in nuxt.config.ts as runtimeConfig.public.apiBase
  // and comes from the API_BASE_URL environment variable.
  const { public: { apiBase } } = useRuntimeConfig()

  const sales = ref<Sale[]>([])
  const loading = ref(false)
  const selectedSale = ref<Sale | null>(null)
  const dailySummary = ref<DailySalesSummary | null>(null)
  const monthlySummary = ref<MonthlySalesSummary | null>(null)

  const fetchSales = async (filters?: SalesFilters): Promise<void> => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (filters?.startDate) query.append('startDate', filters.startDate)
      if (filters?.endDate) query.append('endDate', filters.endDate)
      if (filters?.paymentType) query.append('paymentType', filters.paymentType)
      if (filters?.saleType) query.append('saleType', filters.saleType)

      const qs = query.toString()
      const url = qs ? `${apiBase}/api/sales?${qs}` : `${apiBase}/api/sales`

      const res = await $fetch<ApiResponse<Sale[]>>(url, {
        credentials: 'include' as const,
      })
      sales.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch sales')
    } finally {
      loading.value = false
    }
  }

  const fetchSale = async (id: number): Promise<Sale | undefined> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Sale>>(`${apiBase}/api/sales/${id}`, {
        credentials: 'include' as const,
      })
      selectedSale.value = res.data
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch sale details')
    } finally {
      loading.value = false
    }
  }

  const createSale = async (data: {
    items: Array<{ productId: number; quantity: number; isWholesale?: boolean }>
    paymentType: 'cash' | 'card' | 'mobile'
    saleType?: 'retail' | 'wholesale'
    amountPaid?: number
    useEFD?: boolean
  }) => {
    loading.value = true
    try {
      const res = await $fetch(`${apiBase}/api/sales`, {
        method: 'POST' as const,
        body: data,
        credentials: 'include' as const,
      })
      return res
    } catch (err: any) {
      toast.error('Sale failed', {
        description: err?.data?.message || 'Please try again',
      })
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDailySales = async (date?: Date): Promise<void> => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (date) query.append('date', date.toISOString().split('T')[0]!)

      const qs = query.toString()
      const url = qs
        ? `${apiBase}/api/sales/daily?${qs}`
        : `${apiBase}/api/sales/daily`

      const res = await $fetch<ApiResponse<DailySalesSummary>>(url, {
        credentials: 'include' as const,
      })
      dailySummary.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch daily sales')
    } finally {
      loading.value = false
    }
  }

  const fetchMonthlySales = async (year?: number, month?: number): Promise<void> => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (year) query.append('year', year.toString())
      if (month) query.append('month', month.toString())

      const qs = query.toString()
      const url = qs
        ? `${apiBase}/api/sales/monthly?${qs}`
        : `${apiBase}/api/sales/monthly`

      const res = await $fetch<ApiResponse<MonthlySalesSummary>>(url, {
        credentials: 'include' as const,
      })
      monthlySummary.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch monthly sales')
    } finally {
      loading.value = false
    }
  }

  const fetchSalesByDateRange = async (startDate: Date, endDate: Date): Promise<void> => {
    loading.value = true
    try {
      const query = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0]!,
        endDate: endDate.toISOString().split('T')[0]!,
      })

      const res = await $fetch<ApiResponse<Sale[]>>(
        `${apiBase}/api/sales/date-range?${query.toString()}`,
        { credentials: 'include' as const }
      )
      sales.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch sales for date range')
    } finally {
      loading.value = false
    }
  }

  const uploadSalesExcel = async (file: File): Promise<UploadResult | undefined> => {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await $fetch<ApiResponse<UploadResult>>(
        `${apiBase}/api/sales/upload`,
        {
          method: 'POST' as const,
          body: formData,
          credentials: 'include' as const,
        }
      )

      toast.success(res.message)

      if (res.data.errors.length > 0) {
        toast.warning(
          `${res.data.errors.length} sale${res.data.errors.length > 1 ? 's' : ''} could not be imported`
        )
      }

      await fetchSales()
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload sales')
      throw error
    } finally {
      loading.value = false
    }
  }

  const downloadTemplate = (): void => {
    // window.open works fine here because the user expects a file download,
    // not a JSON response. The Go server will set the correct Content-Disposition
    // header and the browser will handle the download natively.
    window.open(`${apiBase}/api/sales/template`, '_blank')
    toast.success('Template downloaded')
  }

  const exportSales = (startDate?: Date, endDate?: Date): void => {
    const query = new URLSearchParams()
    if (startDate) query.append('startDate', startDate.toISOString().split('T')[0]!)
    if (endDate) query.append('endDate', endDate.toISOString().split('T')[0]!)

    const qs = query.toString()
    const url = qs
      ? `${apiBase}/api/sales/export?${qs}`
      : `${apiBase}/api/sales/export`

    window.open(url, '_blank')
    toast.success('Sales report downloaded')
  }

  return {
    sales,
    loading,
    selectedSale,
    dailySummary,
    monthlySummary,
    fetchSales,
    fetchSale,
    createSale,
    fetchDailySales,
    fetchMonthlySales,
    fetchSalesByDateRange,
    uploadSalesExcel,
    downloadTemplate,
    exportSales,
  }
}