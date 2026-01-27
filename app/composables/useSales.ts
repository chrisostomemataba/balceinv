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
  items?: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isWholesale: boolean;
    product?: {
      name: string;
      sku: string;
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

  const createSale = async (saleData: CreateSaleInput): Promise<Sale | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Sale>>('/api/sales', {
        method: 'POST',
        body: saleData
      });
      
      sales.value.unshift(response.data);
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to create sale');
      throw error;
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
    fetchSalesByDateRange
  };
};