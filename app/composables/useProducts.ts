import { toast } from 'vue-sonner';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  price: number;
  costPrice: number;
  quantity: number;
  minStock: number;
  wholesalePrice?: number | null;
  wholesaleMin?: number | null;
  category?: string | null;
  unit: string;
  piecesPerUnit: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductFilters {
  search?: string;
  category?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UploadResult {
  created: number;
  errors: Array<{
    sku: string;
    error: string;
  }>;
}

interface FetchError {
  data?: {
    message?: string;
  };
}

export const useProducts = () => {
  const products = ref<Product[]>([]);
  const lowStockProducts = ref<Product[]>([]);
  const loading = ref<boolean>(false);
  const selectedProduct = ref<Product | null>(null);

  const fetchProducts = async (filters?: ProductFilters): Promise<void> => {
    loading.value = true;
    try {
      const query = new URLSearchParams();
      if (filters?.search) {
        query.append('search', filters.search);
      }
      if (filters?.category) {
        query.append('category', filters.category);
      }
      
      const queryString = query.toString();
      const url = queryString ? `/api/products?${queryString}` : '/api/products';
      
      const response = await $fetch<ApiResponse<Product[]>>(url);
      products.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch products');
    } finally {
      loading.value = false;
    }
  };

  const fetchProduct = async (id: number): Promise<Product | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Product>>(`/api/products/${id}`);
      selectedProduct.value = response.data;
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch product');
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (product: Partial<Product>): Promise<Product | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Product>>('/api/products', {
        method: 'POST',
        body: product
      });
      
      products.value.unshift(response.data);
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to create product');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateProduct = async (id: number, product: Partial<Product>): Promise<Product | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Product>>(`/api/products/${id}`, {
        method: 'PUT',
        body: product
      });
      
      const productIndex = products.value.findIndex((prod: Product) => prod.id === id);
      if (productIndex !== -1) {
        products.value[productIndex] = response.data;
      }
      
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to update product');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteProduct = async (id: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(`/api/products/${id}`, {
        method: 'DELETE'
      });
      
      products.value = products.value.filter((product: Product) => product.id !== id);
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to delete product');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const uploadExcel = async (file: File): Promise<UploadResult | undefined> => {
    loading.value = true;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await $fetch<ApiResponse<UploadResult>>('/api/products/upload', {
        method: 'POST',
        body: formData
      });
      
      toast.success(response.message);
      
      if (response.data.errors.length > 0) {
        toast.warning(`${response.data.errors.length} products had errors`);
      }
      
      await fetchProducts();
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to upload products');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const downloadTemplate = (): void => {
    window.open('/api/products/template', '_blank');
    toast.success('Template downloaded');
  };

  const fetchLowStock = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Product[]>>('/api/products/low-stock');
      lowStockProducts.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch low stock products');
    } finally {
      loading.value = false;
    }
  };

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
  };
};