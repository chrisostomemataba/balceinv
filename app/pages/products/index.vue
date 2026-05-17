<script setup lang="ts">
import { Plus, Upload, Download, Package, DollarSign, AlertTriangle, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { createColumns } from '@/components/products/columns'
import DataTable from '@/components/products/DataTable.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '~/composables/useAuth'
import { usePermissions } from '~/composables/usePermissions'

const { user } = useAuth()
const { canCreate, canEdit, canDelete, fetchUserPermissions } = usePermissions()

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
} = useProducts()

const { catalog, loading: catalogLoading, fetchCatalog, searchCatalog } = useCatalog()

const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailsDialog = ref(false)
const showUploadDialog = ref(false)
const isEditing = ref(false)
const uploadFile = ref<File | null>(null)

const showCatalogPanel = ref(false)
const catalogSearch = ref('')
const filteredCatalog = ref<typeof catalog.value>([])

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
})

const metadataFields = ref<Array<{ key: string; value: string }>>([])

const formatCurrency = (value: string): string => {
  const number = parseFloat(value.replace(/[^0-9.]/g, ''))
  if (isNaN(number)) return ''
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(number)
}

const handlePriceInput = (field: 'price' | 'costPrice' | 'wholesalePrice', event: Event) => {
  const input = event.target as HTMLInputElement
  const newValue = input.value
  formData.value[field] = newValue
  nextTick(() => {
    if (newValue) formData.value[field] = formatCurrency(newValue)
  })
}

const parseCurrency = (value: string): number =>
  parseFloat(value.replace(/[^0-9.]/g, '')) || 0

const addMetadataField = () => metadataFields.value.push({ key: '', value: '' })

const removeMetadataField = (index: number) => metadataFields.value.splice(index, 1)

const buildMetadata = (): Record<string, string> | null => {
  const entries = metadataFields.value.filter(f => f.key.trim() !== '')
  return entries.length === 0
    ? null
    : Object.fromEntries(entries.map(f => [f.key.trim(), f.value]))
}

onMounted(async () => {
  if (user.value) {
    await fetchUserPermissions(user.value.id)
  }
  await fetchProducts()
})

// columns is a computed so canEdit/canDelete react to permission changes
// onView does NOT call fetchProduct — the product from row.original has all
// fields the dialog needs. Calling fetchProduct sets the shared loading ref
// to true which tears down DataTable mid-render and causes the backdrop-only bug.
const columns = computed(() =>
  createColumns({
    canEdit: canEdit('products'),
    canDelete: canDelete('products'),
    onView: (product) => {
      selectedProduct.value = product
      showDetailsDialog.value = true
    },
    onEdit: (product) => {
      isEditing.value = true
      formData.value = {
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        price: formatCurrency(product.price.toString()),
        costPrice: formatCurrency(product.cost_price.toString()),
        quantity: product.quantity.toString(),
        minStock: product.min_stock.toString(),
        wholesalePrice: product.wholesale_price
          ? formatCurrency(product.wholesale_price.toString())
          : '',
        wholesaleMin: product.wholesale_min?.toString() || '10',
        category: product.category || '',
        unit: product.unit,
        piecesPerUnit: product.pieces_per_unit.toString(),
      }
      metadataFields.value = product.metadata
        ? Object.entries(product.metadata).map(([key, value]) => ({ key, value: String(value) }))
        : []
      selectedProduct.value = product
      showCatalogPanel.value = false
      showDialog.value = true
    },
    onDelete: (product) => {
      selectedProduct.value = product
      showDeleteDialog.value = true
    },
  })
)

const openCreateDialog = () => {
  isEditing.value = false
  selectedProduct.value = null
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
  }
  metadataFields.value = []
  showCatalogPanel.value = false
  catalogSearch.value = ''
  showDialog.value = true
}

const openUploadDialog = () => {
  showUploadDialog.value = true
}

const toggleCatalogPanel = async () => {
  showCatalogPanel.value = !showCatalogPanel.value
  if (showCatalogPanel.value && catalog.value.length === 0) {
    await fetchCatalog()
    filteredCatalog.value = catalog.value
  }
}

watch(catalogSearch, async (val) => {
  filteredCatalog.value = await searchCatalog(val)
})

const prefillFromCatalog = (item: typeof catalog.value[number]) => {
  formData.value.name = item.name
  formData.value.category = item.category ?? ''
  formData.value.unit = item.unit
  formData.value.sku = item.sku_prefix ? `${item.sku_prefix}-` : ''
  formData.value.price = item.default_price
    ? formatCurrency(String(item.default_price))
    : ''
  metadataFields.value = item.metadata
    ? Object.entries(item.metadata).map(([key, value]) => ({ key, value: String(value) }))
    : []
  showCatalogPanel.value = false
  catalogSearch.value = ''
}

const handleSubmit = async () => {
  if (!formData.value.name || !formData.value.sku || !formData.value.price || !formData.value.costPrice) {
    toast.error('Please fill in all required fields')
    return
  }

  const productData = {
    name: formData.value.name,
    sku: formData.value.sku,
    barcode: formData.value.barcode || null,
    price: parseCurrency(formData.value.price),
    cost_price: parseCurrency(formData.value.costPrice),
    quantity: parseInt(formData.value.quantity) || 0,
    min_stock: parseInt(formData.value.minStock) || 5,
    wholesale_price: formData.value.wholesalePrice
      ? parseCurrency(formData.value.wholesalePrice)
      : null,
    wholesale_min: parseInt(formData.value.wholesaleMin) || 10,
    category: formData.value.category || null,
    unit: formData.value.unit,
    pieces_per_unit: parseInt(formData.value.piecesPerUnit) || 1,
    metadata: buildMetadata(),
  }

  try {
    if (isEditing.value && selectedProduct.value) {
      await updateProduct(selectedProduct.value.id, productData)
    } else {
      await createProduct(productData)
    }
    showDialog.value = false
  } catch (error) {
    console.error('Failed to save product:', error)
  }
}

const confirmDelete = async () => {
  if (selectedProduct.value) {
    try {
      await deleteProduct(selectedProduct.value.id)
      showDeleteDialog.value = false
      selectedProduct.value = null
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }
}

const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) uploadFile.value = input.files[0]
}

const handleUpload = async () => {
  if (!uploadFile.value) {
    toast.error('Please select a file')
    return
  }
  try {
    await uploadExcel(uploadFile.value)
    showUploadDialog.value = false
    uploadFile.value = null
  } catch (error) {
    console.error('Upload failed:', error)
  }
}
</script>

<template>
  <div class="container mx-auto py-6 px-4 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Products Inventory</h1>
        <p class="text-muted-foreground mt-1">Manage your products and stock levels</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-if="canCreate('products')"
          variant="outline"
          @click="openUploadDialog"
          :disabled="loading"
        >
          <Upload class="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
        <Button variant="outline" @click="downloadTemplate">
          <Download class="mr-2 h-4 w-4" />
          Template
        </Button>
        <Button
          v-if="canCreate('products')"
          @click="openCreateDialog"
          :disabled="loading"
        >
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
            {{ products.filter(p => p.quantity <= p.min_stock).length }}
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
              <Skeleton v-for="i in 7" :key="i" class="h-12 w-full" />
            </div>
          </div>
        </div>
        <DataTable v-else :columns="columns" :data="products" />
      </CardContent>
    </Card>

    <!-- View details dialog -->
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
              <p class="font-semibold">{{ formatCurrency(selectedProduct.cost_price.toString()) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="text-muted-foreground">Current Stock</Label>
              <div class="flex items-center gap-2 mt-1">
                <Badge
                  :variant="selectedProduct.quantity <= selectedProduct.min_stock ? 'destructive' : 'secondary'"
                >
                  {{ selectedProduct.quantity }} {{ selectedProduct.unit }}
                </Badge>
              </div>
            </div>
            <div>
              <Label class="text-muted-foreground">Category</Label>
              <p>{{ selectedProduct.category || 'N/A' }}</p>
            </div>
          </div>

          <template v-if="selectedProduct.metadata && Object.keys(selectedProduct.metadata).length > 0">
            <Separator />
            <div class="space-y-2">
              <Label class="text-muted-foreground">Additional Details</Label>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="(value, key) in selectedProduct.metadata"
                  :key="key"
                  class="rounded-md border px-3 py-2 bg-muted/30"
                >
                  <p class="text-xs text-muted-foreground capitalize">{{ key }}</p>
                  <p class="text-sm font-medium">{{ value }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Create / Edit dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit Product' : 'Create New Product' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Update product information' : 'Add a new product to inventory' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="!isEditing" class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">Have it in your catalog?</span>
          <Button variant="outline" size="sm" type="button" @click="toggleCatalogPanel">
            {{ showCatalogPanel ? 'Hide Catalog' : 'Use Catalog' }}
          </Button>
        </div>

        <div v-if="showCatalogPanel && !isEditing" class="rounded-lg border bg-muted/30 p-3 space-y-2">
          <Input v-model="catalogSearch" placeholder="Search catalog by name or category..." />
          <div class="max-h-48 overflow-y-auto space-y-1">
            <div v-if="catalogLoading" class="space-y-1">
              <Skeleton v-for="i in 4" :key="i" class="h-12 w-full" />
            </div>
            <p
              v-else-if="filteredCatalog.length === 0"
              class="text-center text-sm text-muted-foreground py-4"
            >
              No catalog items found.
            </p>
            <button
              v-else
              v-for="item in filteredCatalog"
              :key="item.id"
              type="button"
              class="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
              @click="prefillFromCatalog(item)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ item.name }}</span>
                <Badge variant="outline">{{ item.unit }}</Badge>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ [item.category, item.sub_category].filter(Boolean).join(' · ') }}
                {{ item.default_price ? `· TZS ${item.default_price.toLocaleString()}` : '' }}
              </p>
            </button>
          </div>
        </div>

        <Separator v-if="showCatalogPanel && !isEditing" />

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

          <Separator />

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <Label>Additional Details</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  Extra attributes prefilled from catalog or added manually.
                </p>
              </div>
              <Button variant="outline" size="sm" type="button" @click="addMetadataField">
                + Add field
              </Button>
            </div>
            <div
              v-for="(field, index) in metadataFields"
              :key="index"
              class="flex gap-2 items-center"
            >
              <Input v-model="field.key" placeholder="Field name" class="w-2/5" />
              <Input v-model="field.value" placeholder="Value" class="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                @click="removeMetadataField(index)"
                class="text-destructive hover:text-destructive shrink-0 px-2"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">Cancel</Button>
          <Button @click="handleSubmit">{{ isEditing ? 'Update' : 'Create' }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete confirmation -->
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

    <!-- Upload Excel dialog -->
    <Dialog v-model:open="showUploadDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Products from Excel</DialogTitle>
          <DialogDescription>Upload an Excel file with your products data</DialogDescription>
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