<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-vue-next'
// Vue ChartJS Imports
import { Line, Bar } from 'vue-chartjs'
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  CategoryScale, 
  BarElement 
} from 'chart.js'

// Register Chart.js components
ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, BarElement)

const { data, pending, error, refresh } = useDashboard()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Chart.js Data Objects
const lineChartData = computed(() => ({
  labels: data.value?.dailySales?.map(d => formatDate(d.date)) || [],
  datasets: [{
    label: 'Sales',
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    data: data.value?.dailySales?.map(d => d.total) || [],
    tension: 0.4
  }]
}))

const barChartData = computed(() => ({
  labels: data.value?.topProducts?.map(p => p.name) || [],
  datasets: [{
    label: 'Units Sold',
    backgroundColor: '#2563eb',
    data: data.value?.topProducts?.map(p => p.totalSold) || []
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Dashboard</h1>
          <p class="text-gray-500">Overview of your inventory and sales</p>
        </div>
        <button 
          @click="refresh()" 
          :disabled="pending"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ pending ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <Card v-if="error" class="border-red-200 bg-red-50">
        <CardContent class="pt-6">
          <p class="text-red-600">Failed to load dashboard data. Please try again.</p>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Users</CardTitle>
            <Users class="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Skeleton v-if="pending" class="h-8 w-24" />
            <div v-else class="text-2xl font-bold">{{ data?.summary?.userCount || 0 }}</div>
            <p class="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Products</CardTitle>
            <Package class="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Skeleton v-if="pending" class="h-8 w-24" />
            <div v-else class="text-2xl font-bold">{{ data?.summary?.productCount || 0 }}</div>
            <p class="text-xs text-gray-500 mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart class="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Skeleton v-if="pending" class="h-8 w-24" />
            <div v-else class="text-2xl font-bold">{{ data?.summary?.saleCount || 0 }}</div>
            <p class="text-xs text-gray-500 mt-1">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign class="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <Skeleton v-if="pending" class="h-8 w-32" />
            <div v-else class="text-2xl font-bold">{{ formatCurrency(data?.summary?.totalRevenue || 0) }}</div>
            <p class="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales</CardTitle>
            <CardDescription>Sales performance over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="pending" class="h-[250px] flex items-center justify-center">
              <Skeleton class="h-full w-full" />
            </div>
            <div v-else-if="!data?.dailySales || data.dailySales.length === 0" class="h-[250px] flex items-center justify-center text-gray-500">
              No sales data available
            </div>
            <div v-else class="h-[250px]">
              <Line :data="lineChartData" :options="chartOptions" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="pending" class="h-[250px] flex items-center justify-center">
              <Skeleton class="h-full w-full" />
            </div>
            <div v-else-if="!data?.topProducts || data.topProducts.length === 0" class="h-[250px] flex items-center justify-center text-gray-500">
              No products data available
            </div>
            <div v-else class="h-[250px]">
              <Bar :data="barChartData" :options="chartOptions" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products Details</CardTitle>
          <CardDescription>Detailed view of best performing products</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="pending" class="space-y-2">
            <Skeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
          <div v-else-if="!data?.topProducts || data.topProducts.length === 0" class="py-8 text-center text-gray-500">
            No products available
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b">
                  <th class="text-left py-3 px-4">Product Name</th>
                  <th class="text-left py-3 px-4">SKU</th>
                  <th class="text-right py-3 px-4">Units Sold</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in data.topProducts" :key="product.id" class="border-b">
                  <td class="py-3 px-4">{{ product.name }}</td>
                  <td class="py-3 px-4 text-gray-500">{{ product.sku }}</td>
                  <td class="py-3 px-4 text-right font-semibold">{{ product.totalSold }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>