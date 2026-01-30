import { toast } from 'vue-sonner';

interface Settings {
  id: number;
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessTIN?: string | null;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  businessLogo?: string | null;
  primaryColor: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  receiptNumberFormat: string;
  efdEnabled: boolean;
  efdEndpoint?: string | null;
  efdApiKey?: string | null;
  efdLastTestDate?: Date | null;
  efdTestStatus?: string | null;
  lowStockThreshold: number;
  emailNotificationsEnabled: boolean;
  notificationEmail?: string | null;
  alertSoundEnabled: boolean;
  alertOnLowStock: boolean;
  alertOnOutOfStock: boolean;
  alertOnDeadStock: boolean;
  deadStockDays: number;
  printReceiptAutomatically: boolean;
  showTaxOnReceipt: boolean;
  showBarcodesOnReceipt: boolean;
  updatedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateSettingsInput {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessTIN?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  businessLogo?: string;
  primaryColor?: string;
  taxRate?: number;
  currency?: string;
  currencySymbol?: string;
  dateFormat?: string;
  receiptNumberFormat?: string;
  efdEnabled?: boolean;
  efdEndpoint?: string;
  efdApiKey?: string;
  lowStockThreshold?: number;
  emailNotificationsEnabled?: boolean;
  notificationEmail?: string;
  alertSoundEnabled?: boolean;
  alertOnLowStock?: boolean;
  alertOnOutOfStock?: boolean;
  alertOnDeadStock?: boolean;
  deadStockDays?: number;
  printReceiptAutomatically?: boolean;
  showTaxOnReceipt?: boolean;
  showBarcodesOnReceipt?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface FetchError {
  data?: {
    message?: string;
  };
}

export const useSettings = () => {
  const settings = ref<Settings | null>(null);
  const loading = ref<boolean>(false);
  const testing = ref<boolean>(false);

  const fetchSettings = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Settings>>('/api/settings');
      settings.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch settings');
    } finally {
      loading.value = false;
    }
  };

  const updateSettings = async (data: UpdateSettingsInput): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Settings>>('/api/settings', {
        method: 'PUT',
        body: data
      });
      
      settings.value = response.data;
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to update settings');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const testEFDConnection = async (endpoint: string, apiKey: string): Promise<boolean> => {
    testing.value = true;
    try {
      const response = await $fetch<ApiResponse<{ status: string; message: string }>>('/api/settings/test-efd', {
        method: 'POST',
        body: { endpoint, apiKey }
      });
      
      if (response.data.status === 'success') {
        toast.success(response.message);
        await fetchSettings();
        return true;
      } else {
        toast.error(response.data.message);
        return false;
      }
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to test EFD connection');
      return false;
    } finally {
      testing.value = false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    loading.value = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await $fetch<ApiResponse<{ logoUrl: string }>>('/api/settings/upload-logo', {
        method: 'POST',
        body: formData
      });
      
      toast.success(response.message);
      await fetchSettings();
      return response.data.logoUrl;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to upload logo');
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    settings,
    loading,
    testing,
    fetchSettings,
    updateSettings,
    testEFDConnection,
    uploadLogo
  };
};