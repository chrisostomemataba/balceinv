import { toast } from 'vue-sonner';

interface SaleItem {
  productId: number;
  quantity: number;
  isWholesale?: boolean;
}

interface Sale {
  id: number;
  receiptNumber: string;
  userId: number;
  totalAmount: number;
  paymentType: string;
  saleType: string;
  taxAmount: number;
  createdAt: Date;
  change?: number;
  items?: Array<{
    id: number;
    saleId: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isWholesale: boolean;
    product: {
      id: number;
      name: string;
      price: number;
      wholesalePrice?: number;
    };
  }>;
  user?: {
    name: string;
    email: string;
  };
}

interface CreateSaleInput {
  items: SaleItem[];
  paymentType: 'cash' | 'card' | 'mobile';
  saleType?: 'retail' | 'wholesale';
  taxAmount?: number;
  useEFD?: boolean;
  amountPaid?: number; // Amount customer paid (for cash payments)
}

interface SalesFilters {
  startDate?: string;
  endDate?: string;
  paymentType?: string;
  saleType?: string;
}

interface DailySalesSummary {
  sales: Sale[];
  totalRevenue: number;
  totalTransactions: number;
  totalTax: number;
}

interface MonthlySalesSummary extends DailySalesSummary {
  averageTransaction: number;
}

interface UploadResult {
  created: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
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

export const useSales = () => {
  const sales = ref<Sale[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const selectedSale = ref<Sale | null>(null);
  const dailySummary = ref<DailySalesSummary | null>(null);
  const monthlySummary = ref<MonthlySalesSummary | null>(null);

  const fetchSales = async (filters?: SalesFilters): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (filters?.startDate) {
        query.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        query.append('endDate', filters.endDate);
      }
      if (filters?.paymentType) {
        query.append('paymentType', filters.paymentType);
      }
      if (filters?.saleType) {
        query.append('saleType', filters.saleType);
      }
      
      const queryString = query.toString();
      const url = queryString ? `/api/sales?${queryString}` : '/api/sales';
      
      const response = await $fetch<ApiResponse<Sale[]>>(url);
      sales.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch sales');
    } finally {
      loading.value = false;
    }
  };

  const fetchSale = async (id: number): Promise<Sale | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Sale>>(`/api/sales/${id}`);
      selectedSale.value = response.data;
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch sale details');
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const createSale = async (data: CreateSaleInput): Promise<Sale | undefined> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<ApiResponse<Sale>>('/api/sales', {
        method: 'POST',
        body: data,
      });

      if (response.success) {
        sales.value.unshift(response.data);
        
        // Show success message with change info if applicable
        if (data.paymentType === 'cash' && response.data.change && response.data.change > 0) {
          toast.success('Sale completed', {
            description: `Change: TZS ${response.data.change.toLocaleString()}`,
          });
        } else {
          toast.success(response.message);
        }

        return response.data;
      }
    } catch (err: unknown) {
      const fetchError = err as FetchError;
      error.value = fetchError.data?.message || 'Failed to create sale';
      toast.error('Sale failed', {
        description: fetchError.data?.message || 'Please try again',
      });
      console.error('Error creating sale:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchDailySales = async (date?: Date): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (date) {
        query.append('date', date.toISOString().split('T')[0] || '');
      }
      
      const queryString = query.toString();
      const url = queryString ? `/api/sales/daily?${queryString}` : '/api/sales/daily';
      
      const response = await $fetch<ApiResponse<DailySalesSummary>>(url);
      dailySummary.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch daily sales');
    } finally {
      loading.value = false;
    }
  };

  const fetchMonthlySales = async (year?: number, month?: number): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (year) {
        query.append('year', year.toString());
      }
      if (month) {
        query.append('month', month.toString());
      }
      
      const queryString = query.toString();
      const url = queryString ? `/api/sales/monthly?${queryString}` : '/api/sales/monthly';
      
      const response = await $fetch<ApiResponse<MonthlySalesSummary>>(url);
      monthlySummary.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch monthly sales');
    } finally {
      loading.value = false;
    }
  };

  const fetchSalesByDateRange = async (startDate: Date, endDate: Date): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0] || '',
        endDate: endDate.toISOString().split('T')[0] || ''
      });
      
      const response = await $fetch<ApiResponse<Sale[]>>(`/api/sales/date-range?${query.toString()}`);
      sales.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch sales for date range');
    } finally {
      loading.value = false;
    }
  };

  const uploadSalesExcel = async (file: File): Promise<UploadResult | undefined> => {
    loading.value = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await $fetch<ApiResponse<UploadResult>>('/api/sales/upload', {
        method: 'POST',
        body: formData
      });
      
      toast.success(response.message);
      
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} sales had errors`);
      }
      
      await fetchSales();
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to upload sales');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const downloadTemplate = (): void => {
    window.open('/api/sales/template', '_blank');
    toast.success('Template downloaded');
  };

  const exportSales = (startDate?: Date, endDate?: Date): void => {
    const query = new URLSearchParams();
    if (startDate) {
      query.append('startDate', startDate.toISOString().split('T')[0] || '');
    }
    if (endDate) {
      query.append('endDate', endDate.toISOString().split('T')[0] || '');
    }
    
    const queryString = query.toString();
    const url = queryString ? `/api/sales/export?${queryString}` : '/api/sales/export';
    
    window.open(url, '_blank');
    toast.success('Sales report downloaded');
  };

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
    exportSales
  };
};