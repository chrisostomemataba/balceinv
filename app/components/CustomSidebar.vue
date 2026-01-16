<!-- CustomSidebar.vue -->
<template>
  <aside 
    :class="[
      'fixed left-0 top-16 bottom-0 border-r bg-background transition-all duration-200 z-40',
      sidebarCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <div class="flex flex-col h-full p-3">
      <!-- Menu items section -->
      <div class="flex-1 space-y-1">
        <p v-if="!sidebarCollapsed" class="text-xs text-muted-foreground px-3 mb-2">
          Operations
        </p>
        
        <!-- Example menu items -->
        <button 
          :class="[
            'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'
          ]"
        >
          <CreditCard class="h-4 w-4 flex-shrink-0" :class="{ 'mr-2': !sidebarCollapsed }" />
          <span v-if="!sidebarCollapsed" class="text-sm">Point of Sale</span>
        </button>

        <button 
          :class="[
            'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'
          ]"
        >
          <ShoppingCart class="h-4 w-4 flex-shrink-0" :class="{ 'mr-2': !sidebarCollapsed }" />
          <span v-if="!sidebarCollapsed" class="text-sm">Sales History</span>
        </button>

        <button 
          :class="[
            'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3'
          ]"
        >
          <Package class="h-4 w-4 flex-shrink-0" :class="{ 'mr-2': !sidebarCollapsed }" />
          <span v-if="!sidebarCollapsed" class="text-sm">Products</span>
        </button>
      </div>

      <!-- User section at bottom -->
      <div class="mt-auto pt-3 border-t">
        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
          <Avatar class="h-8 w-8 rounded-lg flex-shrink-0">
            <AvatarFallback class="rounded-lg">{{ getInitials(user.full_name) }}</AvatarFallback>
          </Avatar>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user.full_name }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ user.email }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CreditCard, ShoppingCart, Package } from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Get shared sidebar state
const sidebarCollapsed = useState('sidebar-collapsed', () => false)

// User data
const user = ref({
  full_name: 'Guest User',
  email: ''
})

// Get user initials
const getInitials = (name) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Load user data from localStorage
onMounted(() => {
  if (process.client) {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        user.value = {
          full_name: userData.full_name || 'Guest User',
          email: userData.email || ''
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }

    // Load sidebar state
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  }
})
</script>