import { toast } from 'vue-sonner';

interface StockMovement {
  id: number;
  productId: number;
  change: number;
  newQuantity: number;
  reason: string;
  reference?: string | null;
  userId?: number | null;
  createdAt: Date;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

interface MovementFilters {
  startDate?: string;
  endDate?: string;
  productId?: string;
  reason?: string;
  search?: string;
}

interface CreateMovementInput {
  productId: number;
  change: number;
  reason: 'purchase' | 'adjust' | 'damage';
  reference?: string;
}

interface MovementSummary {
  totalMovements: number;
  bySale: number;
  byPurchase: number;
  byAdjustment: number;
  byDamage: number;
  netChange: number;
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

export const useStockMovements = () => {
  const movements = ref<StockMovement[]>([]);
  const loading = ref<boolean>(false);
  const selectedMovement = ref<StockMovement | null>(null);
  const summary = ref<MovementSummary | null>(null);

  const fetchMovements = async (filters?: MovementFilters): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (filters?.startDate) {
        query.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        query.append('endDate', filters.endDate);
      }
      if (filters?.productId) {
        query.append('productId', filters.productId);
      }
      if (filters?.reason) {
        query.append('reason', filters.reason);
      }
      if (filters?.search) {
        query.append('search', filters.search);
      }
      
      const queryString = query.toString();
      const url = queryString ? `/api/stock-movements?${queryString}` : '/api/stock-movements';
      
      const response = await $fetch<ApiResponse<StockMovement[]>>(url);
      movements.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch stock movements');
    } finally {
      loading.value = false;
    }
  };

  const fetchMovement = async (id: number): Promise<StockMovement | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<StockMovement>>(`/api/stock-movements/${id}`);
      selectedMovement.value = response.data;
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch movement details');
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const fetchMovementsByProduct = async (productId: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<StockMovement[]>>(
        `/api/stock-movements/product/${productId}`
      );
      movements.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch product movements');
    } finally {
      loading.value = false;
    }
  };

  const fetchMovementsByDateRange = async (startDate: Date, endDate: Date): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams({
        startDate: startDate.toISOString().split('T')[0] || '',
        endDate: endDate.toISOString().split('T')[0] || ''
      });
      
      const response = await $fetch<ApiResponse<StockMovement[]>>(
        `/api/stock-movements/date-range?${query.toString()}`
      );
      movements.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch movements for date range');
    } finally {
      loading.value = false;
    }
  };

  const createAdjustment = async (data: CreateMovementInput): Promise<StockMovement | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<StockMovement>>('/api/stock-movements', {
        method: 'POST',
        body: data
      });
      
      movements.value.unshift(response.data);
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to create stock adjustment');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchSummary = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<MovementSummary>>('/api/stock-movements/summary');
      summary.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch movement summary');
    } finally {
      loading.value = false;
    }
  };

  const exportReport = (startDate?: Date, endDate?: Date): void => {
    const query = new URLSearchParams();
    if (startDate) {
      query.append('startDate', startDate.toISOString().split('T')[0] || '');
    }
    if (endDate) {
      query.append('endDate', endDate.toISOString().split('T')[0] || '');
    }
    
    const queryString = query.toString();
    const url = queryString ? `/api/stock-movements/export?${queryString}` : '/api/stock-movements/export';
    
    window.open(url, '_blank');
    toast.success('Stock movements report downloaded');
  };

  return {
    movements,
    loading,
    selectedMovement,
    summary,
    fetchMovements,
    fetchMovement,
    fetchMovementsByProduct,
    fetchMovementsByDateRange,
    createAdjustment,
    fetchSummary,
    exportReport
  };
};