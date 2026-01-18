<script setup lang="ts">
import { Plus, Upload, Download, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { columns } from '@/components/products/columns';
import DataTable from '@/components/products/DataTable.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const { 
  products, 
  loading, 
  selectedProduct,
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  uploadExcel,
  downloadTemplate,
  fetchProduct
} = useProducts();

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const showDetailsDialog = ref(false);
const showUploadDialog = ref(false);
const isEditing = ref(false);
const uploadFile = ref<File | null>(null);

const formData = ref({
  name: '',
  sku: '',
  barcode: '',
  price: '',
  costPrice: '',
  quantity: '',
  minStock: '5',
  wholesalePrice: '',
  wholesaleMin: '10',
  category: '',
  unit: 'pcs',
  piecesPerUnit: '1',
});

const formatCurrency = (value: string): string => {
  const number = parseFloat(value.replace(/[^0-9.]/g, ''));
  if (isNaN(number)) return '';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(number);
};

const handlePriceInput = (field: 'price' | 'costPrice' | 'wholesalePrice', event: Event) => {
  const input = event.target as HTMLInputElement;
  const cursorPos = input.selectionStart || 0;
  const oldValue = formData.value[field];
  const newValue = input.value;
  
  formData.value[field] = newValue;
  
  nextTick(() => {
    if (newValue) {
      const formatted = formatCurrency(newValue);
      formData.value[field] = formatted;
    }
  });
};

onMounted(async () => {
  await fetchProducts();
  
  window.addEventListener('edit-product', handleEdit);
  window.addEventListener('delete-product', handleDelete);
  window.addEventListener('view-product', handleViewDetails);
});

onUnmounted(() => {
  window.removeEventListener('edit-product', handleEdit);
  window.removeEventListener('delete-product', handleDelete);
  window.removeEventListener('view-product', handleViewDetails);
});

const handleEdit = (event: any) => {
  const product = event.detail;
  isEditing.value = true;
  formData.value = {
    name: product.name,
    sku: product.sku,
    barcode: product.barcode || '',
    price: formatCurrency(product.price.toString()),
    costPrice: formatCurrency(product.costPrice.toString()),
    quantity: product.quantity.toString(),
    minStock: product.minStock.toString(),
    wholesalePrice: product.wholesalePrice ? formatCurrency(product.wholesalePrice.toString()) : '',
    wholesaleMin: product.wholesaleMin?.toString() || '10',
    category: product.category || '',
    unit: product.unit,
    piecesPerUnit: product.piecesPerUnit.toString(),
  };
  selectedProduct.value = product;
  showDialog.value = true;
};

const handleDelete = (event: any) => {
  selectedProduct.value = event.detail;
  showDeleteDialog.value = true;
};

const handleViewDetails = async (event: any) => {
  const product = event.detail;
  await fetchProduct(product.id);
  showDetailsDialog.value = true;
};

const openCreateDialog = () => {
  isEditing.value = false;
  selectedProduct.value = null;
  formData.value = {
    name: '',
    sku: '',
    barcode: '',
    price: '',
    costPrice: '',
    quantity: '0',
    minStock: '5',
    wholesalePrice: '',
    wholesaleMin: '10',
    category: '',
    unit: 'pcs',
    piecesPerUnit: '1',
  };
  showDialog.value = true;
};

const parseCurrency = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
};

const handleSubmit = async () => {
  if (!formData.value.name || !formData.value.sku || !formData.value.price || !formData.value.costPrice) {
    toast.error('Please fill in all required fields');
    return;
  }

  const productData = {
    name: formData.value.name,
    sku: formData.value.sku,
    barcode: formData.value.barcode || null,
    price: parseCurrency(formData.value.price),
    costPrice: parseCurrency(formData.value.costPrice),
    quantity: parseInt(formData.value.quantity) || 0,
    minStock: parseInt(formData.value.minStock) || 5,
    wholesalePrice: formData.value.wholesalePrice ? parseCurrency(formData.value.wholesalePrice) : null,
    wholesaleMin: parseInt(formData.value.wholesaleMin) || 10,
    category: formData.value.category || null,
    unit: formData.value.unit,
    piecesPerUnit: parseInt(formData.value.piecesPerUnit) || 1,
  };

  try {
    if (isEditing.value && selectedProduct.value) {
      await updateProduct(selectedProduct.value.id, productData);
    } else {
      await createProduct(productData);
    }
    showDialog.value = false;
  } catch (error) {
    console.error('Failed to save product:', error);
  }
};

const confirmDelete = async () => {
  if (selectedProduct.value) {
    try {
      await deleteProduct(selectedProduct.value.id);
      showDeleteDialog.value = false;
      selectedProduct.value = null;
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  }
};

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    uploadFile.value = input.files[0];
  }
};

const handleUpload = async () => {
  if (!uploadFile.value) {
    toast.error('Please select a file');
    return;
  }

  try {
    await uploadExcel(uploadFile.value);
    showUploadDialog.value = false;
    uploadFile.value = null;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
</script>

<template>
  <div class="container mx-auto py-6 px-4 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Products Inventory</h1>
        <p class="text-muted-foreground mt-1">
          Manage your products and stock levels
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" @click="showUploadDialog = true" :disabled="loading">
          <Upload class="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
        <Button variant="outline" @click="downloadTemplate">
          <Download class="mr-2 h-4 w-4" />
          Template
        </Button>
        <Button @click="openCreateDialog" :disabled="loading">
          <Plus class="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Products</CardTitle>
          <Package class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-20" />
          </div>
          <div v-else class="text-2xl font-bold">{{ products.length }}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Value</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-32" />
          </div>
          <div v-else class="text-2xl font-bold">
            {{ formatCurrency(products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toString()) }}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Low Stock Items</CardTitle>
          <AlertTriangle class="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-16" />
          </div>
          <div v-else class="text-2xl font-bold text-destructive">
            {{ products.filter(p => p.quantity <= p.minStock).length }}
          </div>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>All Products</CardTitle>
        <CardDescription>Manage and track your inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="space-y-4">
          <div class="flex flex-col sm:flex-row gap-2">
            <Skeleton class="h-10 flex-1" />
            <Skeleton class="h-10 w-full sm:w-[200px]" />
          </div>
          <div class="rounded-md border">
            <div class="p-4 space-y-3">
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
            </div>
          </div>
          <div class="flex justify-between items-center px-2">
            <Skeleton class="h-4 w-32" />
            <div class="flex gap-2">
              <Skeleton class="h-9 w-20" />
              <Skeleton class="h-9 w-20" />
            </div>
          </div>
        </div>
        <DataTable v-else :columns="columns" :data="products" />
      </CardContent>
    </Card>

    <Dialog v-model:open="showDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit Product' : 'Create New Product' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Update product information' : 'Add a new product to inventory' }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="name">Product Name *</Label>
              <Input id="name" v-model="formData.name" placeholder="e.g., Coca Cola 500ml" />
            </div>
            <div class="space-y-2">
              <Label for="sku">SKU *</Label>
              <Input id="sku" v-model="formData.sku" placeholder="e.g., COCA-500" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="barcode">Barcode</Label>
              <Input id="barcode" v-model="formData.barcode" placeholder="Optional" />
            </div>
            <div class="space-y-2">
              <Label for="category">Category</Label>
              <Input id="category" v-model="formData.category" placeholder="e.g., Drinks" />
            </div>
          </div>

          <Separator />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="price">Selling Price (TZS) *</Label>
              <Input 
                id="price" 
                v-model="formData.price" 
                placeholder="TZS 1,000"
                @input="handlePriceInput('price', $event)"
              />
            </div>
            <div class="space-y-2">
              <Label for="costPrice">Cost Price (TZS) *</Label>
              <Input 
                id="costPrice" 
                v-model="formData.costPrice" 
                placeholder="TZS 700"
                @input="handlePriceInput('costPrice', $event)"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="wholesalePrice">Wholesale Price (TZS)</Label>
              <Input 
                id="wholesalePrice" 
                v-model="formData.wholesalePrice" 
                placeholder="Optional"
                @input="handlePriceInput('wholesalePrice', $event)"
              />
            </div>
            <div class="space-y-2">
              <Label for="wholesaleMin">Min Wholesale Qty</Label>
              <Input id="wholesaleMin" v-model="formData.wholesaleMin" type="number" />
            </div>
          </div>

          <Separator />

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <Label for="quantity">Stock Quantity</Label>
              <Input id="quantity" v-model="formData.quantity" type="number" />
            </div>
            <div class="space-y-2">
              <Label for="minStock">Min Stock Alert</Label>
              <Input id="minStock" v-model="formData.minStock" type="number" />
            </div>
            <div class="space-y-2">
              <Label for="unit">Unit</Label>
              <Input id="unit" v-model="formData.unit" placeholder="pcs, btl, kg" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">Cancel</Button>
          <Button @click="handleSubmit">
            {{ isEditing ? 'Update' : 'Create' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{{ selectedProduct?.name }}".
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="showDetailsDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Product Details</DialogTitle>
        </DialogHeader>
        <div v-if="selectedProduct" class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Product Name</Label>
              <p class="font-semibold">{{ selectedProduct.name }}</p>
            </div>
            <div>
              <Label class="text-muted-foreground">SKU</Label>
              <p class="font-mono">{{ selectedProduct.sku }}</p>
            </div>
          </div>
          
          <Separator />
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Selling Price</Label>
              <p class="font-semibold">{{ formatCurrency(selectedProduct.price.toString()) }}</p>
            </div>
            <div>
              <Label class="text-muted-foreground">Cost Price</Label>
              <p class="font-semibold">{{ formatCurrency(selectedProduct.costPrice.toString()) }}</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Current Stock</Label>
              <div class="flex items-center gap-2">
                <Badge :variant="selectedProduct.quantity <= selectedProduct.minStock ? 'destructive' : 'secondary'">
                  {{ selectedProduct.quantity }} {{ selectedProduct.unit }}
                </Badge>
              </div>
            </div>
            <div>
              <Label class="text-muted-foreground">Category</Label>
              <p>{{ selectedProduct.category || 'N/A' }}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showUploadDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Products from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with your products data
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="file">Select Excel File</Label>
            <Input 
              id="file" 
              type="file" 
              accept=".xlsx,.xls"
              @change="handleFileUpload"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showUploadDialog = false">Cancel</Button>
          <Button @click="handleUpload" :disabled="!uploadFile">
            <Upload class="mr-2 h-4 w-4" />
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>