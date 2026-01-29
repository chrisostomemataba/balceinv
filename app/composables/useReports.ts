import { toast } from 'vue-sonner';

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  averageTransaction: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
}

interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

interface SalesByUser {
  userId: number;
  userName: string;
  totalSales: number;
  totalRevenue: number;
}

interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  deadStockCount: number;
  lowStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    minStock: number;
  }>;
  outOfStockItems: Array<{
    id: number;
    name: string;
    sku: string;
  }>;
  deadStockItems: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    daysSinceLastSale: number;
  }>;
}

interface FinancialReport {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
  totalTax: number;
  netProfit: number;
}

interface DailyTrend {
  date: string;
  sales: number;
  revenue: number;
}

interface DateRange {
  startDate?: string;
  endDate?: string;
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

export const useReports = () => {
  const loading = ref<boolean>(false);
  const salesSummary = ref<SalesSummary | null>(null);
  const topProducts = ref<TopProduct[]>([]);
  const salesByUser = ref<SalesByUser[]>([]);
  const inventoryReport = ref<InventoryReport | null>(null);
  const financialReport = ref<FinancialReport | null>(null);
  const dailyTrend = ref<DailyTrend[]>([]);

  const fetchSalesSummary = async (dateRange?: DateRange): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      
      const url = query.toString() 
        ? `/api/reports/sales-summary?${query.toString()}`
        : '/api/reports/sales-summary';
      
      const response = await $fetch<ApiResponse<SalesSummary>>(url);
      salesSummary.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch sales summary');
    } finally {
      loading.value = false;
    }
  };

  const fetchTopProducts = async (dateRange?: DateRange, limit: number = 10): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      query.append('limit', limit.toString());
      
      const response = await $fetch<ApiResponse<TopProduct[]>>(
        `/api/reports/top-products?${query.toString()}`
      );
      topProducts.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch top products');
    } finally {
      loading.value = false;
    }
  };

  const fetchSalesByUser = async (dateRange?: DateRange): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      
      const url = query.toString()
        ? `/api/reports/sales-by-user?${query.toString()}`
        : '/api/reports/sales-by-user';
      
      const response = await $fetch<ApiResponse<SalesByUser[]>>(url);
      salesByUser.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch sales by user');
    } finally {
      loading.value = false;
    }
  };

  const fetchInventoryReport = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<InventoryReport>>('/api/reports/inventory');
      inventoryReport.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch inventory report');
    } finally {
      loading.value = false;
    }
  };

  const fetchFinancialReport = async (dateRange?: DateRange): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      
      const url = query.toString()
        ? `/api/reports/financial?${query.toString()}`
        : '/api/reports/financial';
      
      const response = await $fetch<ApiResponse<FinancialReport>>(url);
      financialReport.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch financial report');
    } finally {
      loading.value = false;
    }
  };

  const fetchDailyTrend = async (dateRange?: DateRange): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
      
      const url = query.toString()
        ? `/api/reports/daily-trend?${query.toString()}`
        : '/api/reports/daily-trend';
      
      const response = await $fetch<ApiResponse<DailyTrend[]>>(url);
      dailyTrend.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch daily trend');
    } finally {
      loading.value = false;
    }
  };

  const exportExcel = (dateRange?: DateRange): void => {
    const query = new URLSearchParams();
    if (dateRange?.startDate) query.append('startDate', dateRange.startDate);
    if (dateRange?.endDate) query.append('endDate', dateRange.endDate);
    
    const url = query.toString()
      ? `/api/reports/export-excel?${query.toString()}`
      : '/api/reports/export-excel';
    
    window.open(url, '_blank');
    toast.success('Report downloaded');
  };

  const exportPDF = async (html: string, filename: string): Promise<void> => {
    try {
      const response = await $fetch('/api/reports/export-pdf', {
        method: 'POST',
        body: { html, filename },
        responseType: 'blob'
      }) as Uint8Array;

      const arrayBuffer = new ArrayBuffer(response.byteLength);
      new Uint8Array(arrayBuffer).set(response);
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded');
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to generate PDF');
    }
  };

  return {
    loading,
    salesSummary,
    topProducts,
    salesByUser,
    inventoryReport,
    financialReport,
    dailyTrend,
    fetchSalesSummary,
    fetchTopProducts,
    fetchSalesByUser,
    fetchInventoryReport,
    fetchFinancialReport,
    fetchDailyTrend,
    exportExcel,
    exportPDF
  };
};