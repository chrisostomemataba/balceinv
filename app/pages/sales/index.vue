<script setup lang="ts">
import { TrendingUp, DollarSign, ShoppingCart, Receipt } from 'lucide-vue-next';
import { columns } from '@/components/sales/columns';
import DataTable from '@/components/sales/DataTable.vue';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSales } from '@/composables/useSales';

const { sales, loading, selectedSale, monthlySummary, fetchSales, fetchSale, fetchMonthlySales } = useSales();

const showDetailsDialog = ref(false);

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value);
};

onMounted(async () => {
  await fetchSales();
  await fetchMonthlySales();
  
  window.addEventListener('view-sale', handleViewSale);
});

onUnmounted(() => {
  window.removeEventListener('view-sale', handleViewSale);
});

const handleViewSale = async (event: any) => {
  await fetchSale(event.detail.id);
  showDetailsDialog.value = true;
};

const handleDateFilter = async (startDate: Date | null, endDate: Date | null) => {
  if (startDate && endDate) {
    await fetchSales({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  } else {
    await fetchSales();
  }
};

const handlePaymentFilter = async (paymentType: string) => {
  await fetchSales({ paymentType });
};

const handleTypeFilter = async (saleType: string) => {
  await fetchSales({ saleType });
};

const totalRevenue = computed(() => monthlySummary.value?.totalRevenue || 0);
const totalTransactions = computed(() => monthlySummary.value?.totalTransactions || 0);
const averageTransaction = computed(() => monthlySummary.value?.averageTransaction || 0);
const totalTax = computed(() => monthlySummary.value?.totalTax || 0);
</script>

<template>
  <div class="container mx-auto py-6 px-4 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Sales</h1>
        <p class="text-muted-foreground mt-1">
          View and manage sales transactions
        </p>
      </div>
      <Button @click="$router.push('/pos')">
        <ShoppingCart class="mr-2 h-4 w-4" />
        Go to POS
      </Button>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-32" />
          </div>
          <div v-else class="text-2xl font-bold">
            {{ formatCurrency(totalRevenue) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Transactions</CardTitle>
          <Receipt class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-20" />
          </div>
          <div v-else class="text-2xl font-bold">
            {{ totalTransactions }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Average Sale</CardTitle>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-28" />
          </div>
          <div v-else class="text-2xl font-bold">
            {{ formatCurrency(averageTransaction) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">Per transaction</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Tax</CardTitle>
          <Receipt class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="space-y-2">
            <Skeleton class="h-8 w-28" />
          </div>
          <div v-else class="text-2xl font-bold">
            {{ formatCurrency(totalTax) }}
          </div>
          <p class="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>All Sales</CardTitle>
        <CardDescription>Complete history of sales transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="space-y-4">
          <div class="flex gap-2">
            <Skeleton class="h-10 flex-1" />
            <Skeleton class="h-10 w-[180px]" />
            <Skeleton class="h-10 w-[180px]" />
          </div>
          <div class="rounded-md border">
            <div class="p-4 space-y-3">
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
              <Skeleton class="h-12 w-full" />
            </div>
          </div>
        </div>
        <DataTable 
          v-else 
          :columns="columns" 
          :data="sales"
          @date-filter="handleDateFilter"
          @payment-filter="handlePaymentFilter"
          @type-filter="handleTypeFilter"
        />
      </CardContent>
    </Card>

    <Dialog v-model:open="showDetailsDialog">
      <DialogContent class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>
        <div v-if="selectedSale" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted-foreground">Receipt Number</p>
              <p class="font-mono font-semibold">{{ selectedSale.receiptNumber }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Date</p>
              <p class="font-medium">{{ new Date(selectedSale.createdAt).toLocaleString() }}</p>
            </div>
          </div>

          <Separator />

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted-foreground">Payment Method</p>
              <Badge class="mt-1">{{ selectedSale.paymentType }}</Badge>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Sale Type</p>
              <Badge class="mt-1" :variant="selectedSale.saleType === 'wholesale' ? 'default' : 'secondary'">
                {{ selectedSale.saleType }}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p class="text-sm font-medium mb-3">Items Sold</p>
            <div class="space-y-2">
              <div 
                v-for="item in selectedSale.items" 
                :key="item.id"
                class="flex justify-between items-center p-3 border rounded-lg"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ item.product?.name }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ item.quantity }} × {{ formatCurrency(item.unitPrice) }}
                    <Badge v-if="item.isWholesale" variant="outline" class="ml-2">Wholesale</Badge>
                  </p>
                </div>
                <p class="font-semibold">{{ formatCurrency(item.totalPrice) }}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Subtotal</span>
              <span class="font-medium">{{ formatCurrency(selectedSale.totalAmount - selectedSale.taxAmount) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Tax (18%)</span>
              <span class="font-medium">{{ formatCurrency(selectedSale.taxAmount) }}</span>
            </div>
            <Separator />
            <div class="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{{ formatCurrency(selectedSale.totalAmount) }}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>