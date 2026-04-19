import { toast } from 'vue-sonner'

interface Settings {
  id: number
  businessName?: string | null
  businessAddress?: string | null
  businessPhone?: string | null
  businessTIN?: string | null
  receiptHeader?: string | null
  receiptFooter?: string | null
  businessLogo?: string | null
  primaryColor: string
  taxRate: number
  currency: string
  currencySymbol: string
  dateFormat: string
  receiptNumberFormat: string
  efdEnabled: boolean
  efdEndpoint?: string | null
  efdApiKey?: string | null
  efdLastTestDate?: Date | null
  efdTestStatus?: string | null
  lowStockThreshold: number
  emailNotificationsEnabled: boolean
  notificationEmail?: string | null
  alertSoundEnabled: boolean
  alertOnLowStock: boolean
  alertOnOutOfStock: boolean
  alertOnDeadStock: boolean
  deadStockDays: number
  printReceiptAutomatically: boolean
  showTaxOnReceipt: boolean
  showBarcodesOnReceipt: boolean
  updatedBy?: number | null
  createdAt: Date
  updatedAt: Date
}

interface UpdateSettingsInput {
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  businessTIN?: string
  receiptHeader?: string
  receiptFooter?: string
  primaryColor?: string
  taxRate?: number
  currency?: string
  currencySymbol?: string
  dateFormat?: string
  receiptNumberFormat?: string
  efdEnabled?: boolean
  efdEndpoint?: string
  efdApiKey?: string
  lowStockThreshold?: number
  emailNotificationsEnabled?: boolean
  notificationEmail?: string
  alertSoundEnabled?: boolean
  alertOnLowStock?: boolean
  alertOnOutOfStock?: boolean
  alertOnDeadStock?: boolean
  deadStockDays?: number
  printReceiptAutomatically?: boolean
  showTaxOnReceipt?: boolean
  showBarcodesOnReceipt?: boolean
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const useSettings = () => {
  const { public: { apiBase } } = useRuntimeConfig()

  const settings = ref<Settings | null>(null)
  const loading = ref(false)
  const testing = ref(false)

  const fetchSettings = async (): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Settings>>(`${apiBase}/api/settings`, {
        credentials: 'include'
      })
      settings.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch settings')
    } finally {
      loading.value = false
    }
  }

  const updateSettings = async (data: UpdateSettingsInput): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Settings>>(`${apiBase}/api/settings`, {
        method: 'PUT',
        body: data,
        credentials: 'include'
      })
      settings.value = res.data
      toast.success(res.message)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update settings')
      throw error
    } finally {
      loading.value = false
    }
  }

  const testEFDConnection = async (endpoint: string, apiKey: string): Promise<boolean> => {
    testing.value = true
    try {
      const res = await $fetch<ApiResponse<{ status: string; message: string }>>(
        `${apiBase}/api/settings/test-efd`,
        { method: 'POST', body: { endpoint, apiKey }, credentials: 'include' }
      )

      if (res.data.status === 'success') {
        toast.success(res.message)
        await fetchSettings()
        return true
      }

      toast.error(res.data.message)
      return false
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to test EFD connection')
      return false
    } finally {
      testing.value = false
    }
  }

  const uploadLogo = async (file: File): Promise<string | null> => {
    loading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await $fetch<ApiResponse<{ logoUrl: string }>>(
        `${apiBase}/api/settings/upload-logo`,
        { method: 'POST', body: formData, credentials: 'include' }
      )

      toast.success(res.message)
      await fetchSettings()
      return res.data.logoUrl
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload logo')
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    loading,
    testing,
    fetchSettings,
    updateSettings,
    testEFDConnection,
    uploadLogo
  }
}