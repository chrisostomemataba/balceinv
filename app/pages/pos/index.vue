<script setup lang="ts">
import { Plus, Minus, Trash2, Search, Barcode, ShoppingCart, CreditCard, Smartphone, Banknote, X } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  wholesalePrice?: number | null;
  wholesaleMin?: number;
  quantity: number;
  isWholesale: boolean;
  availableStock: number;
}

const { products, fetchProducts } = useProducts();
const { createSale, loading } = useSales();

const barcodeInput = ref('');
const searchQuery = ref('');
const cart = ref<CartItem[]>([]);
const showCheckoutDialog = ref(false);
const showSuccessDialog = ref(false);
const paymentType = ref<'cash' | 'card' | 'mobile'>('cash');
const lastReceipt = ref('');

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value);
};

onMounted(async () => {
  await fetchProducts();
});

const filteredProducts = computed(() => {
  if (!searchQuery.value) return [];
  const query = searchQuery.value.toLowerCase();
  return products.value
    .filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.sku.toLowerCase().includes(query)
    )
    .slice(0, 5);
});

const subtotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    const itemPrice = item.isWholesale && item.wholesalePrice 
      ? item.wholesalePrice 
      : item.price;
    return sum + (itemPrice * item.quantity);
  }, 0);
});

const tax = computed(() => subtotal.value * 0.18);
const total = computed(() => subtotal.value + tax.value);

const totalItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0);
});

const handleBarcodeInput = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const barcode = input.value.trim();
  
  if (!barcode) return;

  const product = products.value.find(p => 
    p.barcode === barcode || p.sku === barcode
  );

  if (product) {
    addToCart(product);
    barcodeInput.value = '';
  } else {
    toast.error('Product not found');
  }
};

const addToCart = (product: any) => {
  if (product.quantity <= 0) {
    toast.error('Product out of stock');
    return;
  }

  const existingItem = cart.value.find(item => item.productId === product.id);

  if (existingItem) {
    if (existingItem.quantity >= product.quantity) {
      toast.error('Insufficient stock');
      return;
    }
    existingItem.quantity++;
    
    const shouldBeWholesale = !!(product.wholesalePrice && 
                             existingItem.quantity >= (product.wholesaleMin || 10));
    existingItem.isWholesale = shouldBeWholesale;
  } else {
    cart.value.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      wholesalePrice: product.wholesalePrice,
      wholesaleMin: product.wholesaleMin,
      quantity: 1,
      isWholesale: false,
      availableStock: product.quantity
    });
  }

  searchQuery.value = '';
};

const updateQuantity = (item: CartItem, change: number) => {
  const newQuantity = item.quantity + change;

  if (newQuantity <= 0) {
    removeFromCart(item);
    return;
  }

  if (newQuantity > item.availableStock) {
    toast.error('Insufficient stock');
    return;
  }

  item.quantity = newQuantity;
  
  const shouldBeWholesale = !!(item.wholesalePrice && 
                           item.quantity >= (item.wholesaleMin || 10));
  item.isWholesale = shouldBeWholesale;
};

const setQuantity = (item: CartItem, value: string) => {
  const quantity = parseInt(value);
  
  if (isNaN(quantity) || quantity <= 0) {
    removeFromCart(item);
    return;
  }

  if (quantity > item.availableStock) {
    toast.error('Insufficient stock');
    return;
  }

  item.quantity = quantity;
  
  const shouldBeWholesale = !!(item.wholesalePrice && 
                           item.quantity >= (item.wholesaleMin || 10));
  item.isWholesale = shouldBeWholesale;
};

const removeFromCart = (item: CartItem) => {
  cart.value = cart.value.filter(cartItem => cartItem.productId !== item.productId);
};

const clearCart = () => {
  cart.value = [];
};

const openCheckout = () => {
  if (cart.value.length === 0) {
    toast.error('Cart is empty');
    return;
  }
  showCheckoutDialog.value = true;
};

const processCheckout = async () => {
  try {
    const saleItems = cart.value.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      isWholesale: item.isWholesale
    }));

    const result = await createSale({
      items: saleItems,
      paymentType: paymentType.value,
      saleType: cart.value.some(item => item.isWholesale) ? 'wholesale' : 'retail',
      useEFD: true
    });

    if (result) {
      lastReceipt.value = result.receiptNumber;
      showCheckoutDialog.value = false;
      showSuccessDialog.value = true;
      clearCart();
    }
  } catch (error) {
    console.error('Checkout failed:', error);
  }
};

const handleSuccessClose = () => {
  showSuccessDialog.value = false;
  lastReceipt.value = '';
};
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <div class="border-b p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold">Point of Sale</h1>
        <Button variant="outline" @click="$router.push('/sales')">
          View Sales
        </Button>
      </div>
    </div>

    <div class="flex-1 overflow-hidden">
      <div class="container mx-auto h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-lg">Scan or Search Product</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="relative">
                <Barcode class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="barcodeInput"
                  placeholder="Scan barcode or enter SKU..."
                  class="pl-10"
                  @keyup.enter="handleBarcodeInput"
                />
              </div>

              <div class="relative">
                <Search class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  v-model="searchQuery"
                  placeholder="Search products by name..."
                  class="pl-10"
                />
                <div v-if="filteredProducts.length > 0" class="absolute w-full mt-1 bg-popover border rounded-md shadow-lg z-10">
                  <div
                    v-for="product in filteredProducts"
                    :key="product.id"
                    class="p-3 hover:bg-accent cursor-pointer"
                    @click="addToCart(product)"
                  >
                    <div class="flex justify-between items-center">
                      <div>
                        <p class="font-medium">{{ product.name }}</p>
                        <p class="text-sm text-muted-foreground">{{ product.sku }}</p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold">{{ formatCurrency(product.price) }}</p>
                        <p class="text-xs text-muted-foreground">Stock: {{ product.quantity }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="flex-1">
            <CardHeader>
              <div class="flex justify-between items-center">
                <CardTitle>Cart ({{ totalItems }} items)</CardTitle>
                <Button v-if="cart.length > 0" variant="ghost" size="sm" @click="clearCart">
                  <X class="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea class="h-[400px]">
                <div v-if="cart.length === 0" class="text-center py-12 text-muted-foreground">
                  <ShoppingCart class="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Cart is empty</p>
                  <p class="text-sm mt-1">Scan or search for products to add</p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="item in cart"
                    :key="item.productId"
                    class="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div class="flex-1">
                      <p class="font-medium">{{ item.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ item.sku }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <p class="text-sm font-semibold">
                          {{ formatCurrency(item.isWholesale && item.wholesalePrice ? item.wholesalePrice : item.price) }}
                        </p>
                        <Badge v-if="item.isWholesale" variant="default" class="text-xs">Wholesale</Badge>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <Button variant="outline" size="icon" @click="updateQuantity(item, -1)">
                        <Minus class="h-4 w-4" />
                      </Button>
                      <Input
                        :value="item.quantity"
                        @input="setQuantity(item, ($event.target as HTMLInputElement).value)"
                        class="w-16 text-center"
                        type="number"
                        min="1"
                      />
                      <Button variant="outline" size="icon" @click="updateQuantity(item, 1)">
                        <Plus class="h-4 w-4" />
                      </Button>
                    </div>

                    <div class="text-right">
                      <p class="font-bold">
                        {{ formatCurrency((item.isWholesale && item.wholesalePrice ? item.wholesalePrice : item.price) * item.quantity) }}
                      </p>
                    </div>

                    <Button variant="ghost" size="icon" @click="removeFromCart(item)">
                      <Trash2 class="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Subtotal</span>
                  <span class="font-medium">{{ formatCurrency(subtotal) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Tax (18%)</span>
                  <span class="font-medium">{{ formatCurrency(tax) }}</span>
                </div>
                <Separator />
                <div class="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{{ formatCurrency(total) }}</span>
                </div>
              </div>

              <Button 
                class="w-full" 
                size="lg" 
                :disabled="cart.length === 0 || loading"
                @click="openCheckout"
              >
                <ShoppingCart class="mr-2 h-5 w-5" />
                Checkout
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">1</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">2</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">3</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">4</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">5</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">6</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">7</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">8</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">9</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">.</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">0</span>
                </Button>
                <Button variant="outline" size="sm" class="h-16 flex-col gap-1">
                  <span class="text-2xl font-bold">←</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <Dialog v-model:open="showCheckoutDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Select payment method and confirm the sale
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <p class="text-sm font-medium">Payment Method</p>
            <Select v-model="paymentType">
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  <div class="flex items-center gap-2">
                    <Banknote class="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="card">
                  <div class="flex items-center gap-2">
                    <CreditCard class="h-4 w-4" />
                    Card
                  </div>
                </SelectItem>
                <SelectItem value="mobile">
                  <div class="flex items-center gap-2">
                    <Smartphone class="h-4 w-4" />
                    Mobile Money
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div class="space-y-2">
            <div class="flex justify-between">
              <span>Total Amount</span>
              <span class="font-bold text-lg">{{ formatCurrency(total) }}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showCheckoutDialog = false">Cancel</Button>
          <Button @click="processCheckout" :disabled="loading">
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="showSuccessDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-center text-2xl text-green-600">Sale Completed!</DialogTitle>
        </DialogHeader>
        <div class="py-6 text-center space-y-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Receipt Number</p>
            <p class="font-mono font-bold text-lg">{{ lastReceipt }}</p>
          </div>
          <p class="text-sm text-muted-foreground">
            Transaction has been recorded and sent to TRA
          </p>
        </div>
        <DialogFooter>
          <Button @click="handleSuccessClose" class="w-full">
            New Sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>