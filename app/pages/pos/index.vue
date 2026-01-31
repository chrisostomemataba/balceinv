<script setup lang="ts">
import { Plus, Minus, Trash2, Search, Barcode, ShoppingCart, CreditCard, Smartphone, Banknote, X, Pause, Play, Printer, Check } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

interface PausedCart {
  id: string;
  items: CartItem[];
  timestamp: Date;
}

const { products, fetchProducts } = useProducts();
const { createSale, loading } = useSales();

// POS state
const barcodeInput = ref('');
const searchQuery = ref('');
const cart = ref<CartItem[]>([]);
const paymentType = ref<'cash' | 'card' | 'mobile'>('cash');
const amountPaid = ref<number>(0);

// Paused carts state
const pausedCarts = ref<PausedCart[]>([]);
const showPausedCartsPopover = ref(false);

// Confirmation state
const showConfirmDialog = ref(false);

// Success state
const lastReceipt = ref('');
const lastChange = ref(0);
const showingSuccess = ref(false);

// Computed
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

const total = computed(() => subtotal.value);

const totalItems = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0);
});

const change = computed(() => {
  if (paymentType.value === 'cash' && amountPaid.value > 0) {
    return Math.max(0, amountPaid.value - total.value);
  }
  return 0;
});

const canCheckout = computed(() => {
  if (cart.value.length === 0) return false;
  if (paymentType.value === 'cash') {
    return amountPaid.value >= total.value;
  }
  return true;
});

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
  }).format(value);
};

// Lifecycle
onMounted(async () => {
  await fetchProducts();
  loadPausedCarts();
  // Auto-focus amount paid for cash
  if (paymentType.value === 'cash') {
    amountPaid.value = 0;
  }
});

// Handle barcode input
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

// Add product to cart
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
    
    const shouldBeWholesale = product.wholesalePrice && 
                             existingItem.quantity >= (product.wholesaleMin || 10);
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
  
  // Auto-update amount paid for cash
  if (paymentType.value === 'cash') {
    amountPaid.value = total.value;
  }
};

// Update quantity
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
  
  const shouldBeWholesale = Boolean(item.wholesalePrice && 
                           item.quantity >= (item.wholesaleMin || 10));
  item.isWholesale = shouldBeWholesale;
  
  // Auto-update amount paid for cash
  if (paymentType.value === 'cash') {
    amountPaid.value = total.value;
  }
};

// Set quantity directly
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
  
  const shouldBeWholesale = Boolean(item.wholesalePrice && 
                           item.quantity >= (item.wholesaleMin || 10));
  item.isWholesale = shouldBeWholesale;
  
  // Auto-update amount paid for cash
  if (paymentType.value === 'cash') {
    amountPaid.value = total.value;
  }
};

// Remove from cart
const removeFromCart = (item: CartItem) => {
  cart.value = cart.value.filter(cartItem => cartItem.productId !== item.productId);
  
  // Auto-update amount paid for cash
  if (paymentType.value === 'cash' && cart.value.length > 0) {
    amountPaid.value = total.value;
  }
};

// Clear cart
const clearCart = () => {
  cart.value = [];
  amountPaid.value = 0;
  showingSuccess.value = false;
};

// Pause cart
const pauseCart = () => {
  if (cart.value.length === 0) {
    toast.error('Cart is empty');
    return;
  }

  const pausedCart: PausedCart = {
    id: `PAUSE-${Date.now()}`,
    items: [...cart.value],
    timestamp: new Date(),
  };

  pausedCarts.value.push(pausedCart);
  savePausedCarts();
  
  clearCart();
  toast.success('Cart paused');
};

// Resume cart
const resumeCart = (pausedCart: PausedCart) => {
  if (cart.value.length > 0) {
    toast.error('Please pause or clear current cart first');
    return;
  }

  cart.value = [...pausedCart.items];
  pausedCarts.value = pausedCarts.value.filter(c => c.id !== pausedCart.id);
  savePausedCarts();
  showPausedCartsPopover.value = false;
  
  // Auto-update amount paid for cash
  if (paymentType.value === 'cash') {
    amountPaid.value = total.value;
  }
  
  toast.success('Cart resumed');
};

// Delete paused cart
const deletePausedCart = (pausedCart: PausedCart) => {
  pausedCarts.value = pausedCarts.value.filter(c => c.id !== pausedCart.id);
  savePausedCarts();
  toast.success('Paused cart deleted');
};

// Save/load paused carts
const savePausedCarts = () => {
  if (process.client) {
    localStorage.setItem('pausedCarts', JSON.stringify(pausedCarts.value));
  }
};

const loadPausedCarts = () => {
  if (process.client) {
    const saved = localStorage.getItem('pausedCarts');
    if (saved) {
      try {
        pausedCarts.value = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading paused carts:', error);
      }
    }
  }
};

// Format paused time
const formatPausedTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
};

// Open confirmation
const openConfirmation = () => {
  if (!canCheckout.value) {
    if (cart.value.length === 0) {
      toast.error('Cart is empty');
    } else if (paymentType.value === 'cash' && amountPaid.value < total.value) {
      toast.error('Insufficient payment amount');
    }
    return;
  }
  
  showConfirmDialog.value = true;
};

// Process checkout
const processCheckout = async () => {
  showConfirmDialog.value = false;
  
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
      amountPaid: paymentType.value === 'cash' ? amountPaid.value : undefined,
      useEFD: true
    });

    if (result) {
      // Store receipt info
      lastReceipt.value = result.receiptNumber;
      lastChange.value = result.change || 0;
      
      // Show success state briefly
      showingSuccess.value = true;
      
      // Show success toast with change
      if (paymentType.value === 'cash' && lastChange.value > 0) {
        toast.success('Sale completed!', {
          description: `Change: ${formatCurrency(lastChange.value)}`,
          duration: 5000,
        });
      } else {
        toast.success('Sale completed!', {
          description: `Receipt: ${lastReceipt.value}`,
          duration: 3000,
        });
      }
      
      // Auto-clear after 3 seconds for next customer
      setTimeout(() => {
        clearCart();
      }, 3000);
    }
  } catch (error) {
    console.error('Checkout failed:', error);
  }
};

// Print receipt
const printReceipt = () => {
  // This will trigger browser print dialog
  // In production, you'd send to thermal printer
  toast.success('Receipt sent to printer');
  window.print();
};

// Watch payment type
watch(paymentType, (newType) => {
  if (newType === 'cash' && cart.value.length > 0) {
    amountPaid.value = total.value;
  } else {
    amountPaid.value = 0;
  }
});
</script>

<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Header -->
    <div class="border-b p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold">Point of Sale</h1>
        <Button variant="outline" @click="$router.push('/sales')">
          View Sales
        </Button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-hidden">
      <div class="container mx-auto h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left: Products & Cart -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Search -->
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

          <!-- Cart -->
          <Card class="flex-1">
            <CardHeader>
              <div class="flex justify-between items-center">
                <CardTitle>Cart ({{ totalItems }} items)</CardTitle>
                <div class="flex gap-2">
                  <Button 
                    v-if="cart.length > 0" 
                    variant="outline" 
                    size="sm" 
                    @click="pauseCart"
                  >
                    <Pause class="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button v-if="cart.length > 0" variant="ghost" size="sm" @click="clearCart">
                    <X class="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea class="h-[400px]">
                <!-- Empty state -->
                <div v-if="cart.length === 0 && !showingSuccess" class="text-center py-12 text-muted-foreground">
                  <ShoppingCart class="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Cart is empty</p>
                  <p class="text-sm mt-1">Scan or search for products to add</p>
                </div>

                <!-- Success state -->
                <div v-else-if="showingSuccess" class="text-center py-12">
                  <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check class="h-8 w-8 text-green-600" />
                  </div>
                  <h3 class="text-lg font-semibold mb-2">Sale Completed!</h3>
                  <p class="text-sm text-muted-foreground mb-1">Receipt: {{ lastReceipt }}</p>
                  <p v-if="lastChange > 0" class="text-lg font-bold text-green-600 mb-4">
                    Change: {{ formatCurrency(lastChange) }}
                  </p>
                  <div class="flex gap-2 justify-center mt-4">
                    <Button variant="outline" size="sm" @click="printReceipt">
                      <Printer class="h-4 w-4 mr-2" />
                      Print Receipt
                    </Button>
                    <Button size="sm" @click="clearCart">
                      Next Customer
                    </Button>
                  </div>
                </div>

                <!-- Cart items -->
                <div v-else class="space-y-3">
                  <div
                    v-for="item in cart"
                    :key="item.productId"
                    class="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">{{ item.name }}</p>
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

                    <div class="text-right min-w-[80px]">
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

        <!-- Right: Payment & Summary -->
        <div class="space-y-4">
          <!-- Order Summary & Payment -->
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- Total -->
              <div class="space-y-2">
                <div class="flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span>{{ formatCurrency(total) }}</span>
                </div>
                <p class="text-xs text-muted-foreground text-center">* Price includes 18% VAT</p>
              </div>

              <Separator />

              <!-- Payment Method -->
              <div class="space-y-2">
                <p class="text-sm font-medium">Payment Method</p>
                <Select v-model="paymentType">
                  <SelectTrigger>
                    <SelectValue />
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

              <!-- Cash Payment -->
              <div v-if="paymentType === 'cash'" class="space-y-2">
                <p class="text-sm font-medium">Amount Paid</p>
                <Input
                  v-model.number="amountPaid"
                  type="number"
                  placeholder="Enter amount"
                  :min="total"
                  step="1000"
                  class="text-lg"
                />
                <div v-if="amountPaid > 0" class="flex justify-between text-sm p-2 bg-muted rounded">
                  <span class="text-muted-foreground">Change:</span>
                  <span :class="change < 0 ? 'text-destructive font-bold' : 'text-green-600 font-bold text-lg'">
                    {{ formatCurrency(change) }}
                  </span>
                </div>
              </div>

              <!-- Checkout Button -->
              <Button 
                class="w-full" 
                size="lg" 
                :disabled="!canCheckout || loading"
                @click="openConfirmation"
              >
                <ShoppingCart class="mr-2 h-5 w-5" />
                {{ loading ? 'Processing...' : 'Complete Sale' }}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Floating Paused Carts Button -->
    <Popover v-model:open="showPausedCartsPopover">
      <PopoverTrigger as-child>
        <Button
          v-if="pausedCarts.length > 0"
          class="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <div class="relative">
            <Play class="h-6 w-6" />
            <Badge class="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0" variant="destructive">
              {{ pausedCarts.length }}
            </Badge>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80" align="end" side="top">
        <div class="space-y-2">
          <h4 class="font-semibold">Paused Carts</h4>
          <ScrollArea class="max-h-[300px]">
            <div class="space-y-2">
              <div
                v-for="pausedCart in pausedCarts"
                :key="pausedCart.id"
                class="border rounded-lg p-3 space-y-2"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium">{{ pausedCart.items.length }} items</p>
                    <p class="text-xs text-muted-foreground">{{ formatPausedTime(pausedCart.timestamp) }}</p>
                  </div>
                  <div class="flex gap-1">
                    <Button size="sm" variant="outline" @click="resumeCart(pausedCart)">
                      <Play class="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" @click="deletePausedCart(pausedCart)">
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div class="text-xs space-y-1">
                  <div
                    v-for="item in pausedCart.items.slice(0, 2)"
                    :key="item.productId"
                    class="flex justify-between"
                  >
                    <span class="truncate">{{ item.name }} x{{ item.quantity }}</span>
                  </div>
                  <p v-if="pausedCart.items.length > 2" class="text-muted-foreground">
                    +{{ pausedCart.items.length - 2 }} more
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>

    <!-- Confirmation Dialog -->
    <AlertDialog v-model:open="showConfirmDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Sale</AlertDialogTitle>
          <AlertDialogDescription>
            <div class="space-y-2 mt-2">
              <div class="flex justify-between">
                <span>Total Amount:</span>
                <span class="font-bold">{{ formatCurrency(total) }}</span>
              </div>
              <div v-if="paymentType === 'cash'" class="flex justify-between">
                <span>Amount Paid:</span>
                <span class="font-bold">{{ formatCurrency(amountPaid) }}</span>
              </div>
              <div v-if="paymentType === 'cash' && change > 0" class="flex justify-between text-green-600">
                <span>Change:</span>
                <span class="font-bold">{{ formatCurrency(change) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Payment:</span>
                <span class="font-medium capitalize">{{ paymentType }}</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="processCheckout" :disabled="loading">
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>