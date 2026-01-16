<template>
  <div class="layout-container" :class="{ 'sidebar-collapsed': collapsed }">
    <!-- Sidebar -->
    <aside 
      class="sidebar" 
      :class="{ 'sidebar-collapsed': collapsed }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="sidebar-content">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store class="size-4" />
          </div>
          <div v-if="!collapsed" class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">Business Name</span>
            <span class="truncate text-xs">POS & Inventory</span>
          </div>
          <button 
            @click="toggleSidebar"
            class="ml-auto size-8 flex items-center justify-center rounded-md hover:bg-accent"
          >
            <ChevronLeft class="size-4" :class="{ 'rotate-180': collapsed }" />
          </button>
        </div>

        <!-- Sidebar Menu Items -->
        <div class="sidebar-menu">
          <SidebarSection 
            title="Operations"
            :items="operationItems"
            :collapsed="collapsed"
          />
          <SidebarSection 
            title="Inventory"
            :items="inventoryItems"
            :collapsed="collapsed"
          />
          <SidebarSection 
            title="Analytics"
            :items="analyticsItems"
            :collapsed="collapsed"
          />
          <SidebarSection 
            title="Administration"
            :items="adminItems"
            :collapsed="collapsed"
          />
        </div>

        <!-- User Profile -->
        <div class="sidebar-footer">
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarFallback class="rounded-lg">CU</AvatarFallback>
            </Avatar>
            <div v-if="!collapsed" class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Current User</span>
              <span class="truncate text-xs">user@example.com</span>
            </div>
            <ChevronUp v-if="!collapsed" class="ml-auto size-4" />
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" :class="{ 'expanded': collapsed }">
      <header class="main-header">
        <button 
          @click="toggleSidebar"
          class="flex items-center justify-center size-8 rounded-md hover:bg-accent"
        >
          <Menu class="size-4" />
        </button>
        <!-- Add your header content here -->
      </header>
      <div class="content-area">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Store,
  CreditCard,
  ShoppingCart,
  Package,
  Boxes,
  Tag,
  Truck,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Shield,
  Settings,
  ChevronLeft,
  ChevronUp,
  Menu,
} from 'lucide-vue-next'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import SidebarSection from './SidebarSection.vue'

// Sidebar state
const collapsed = ref(false)
const isHovered = ref(false)

// Toggle sidebar
const toggleSidebar = () => {
  collapsed.value = !collapsed.value
  // Save to localStorage for persistence
  localStorage.setItem('sidebar-collapsed', collapsed.value.toString())
}

// Handle hover for temporary expansion
const handleMouseEnter = () => {
  if (collapsed.value) {
    isHovered.value = true
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
}

// Load sidebar state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('sidebar-collapsed')
  if (savedState !== null) {
    collapsed.value = savedState === 'true'
  }
})

// Menu items (same as before)
const operationItems = [
  { title: 'Point of Sale', url: '/pos', icon: CreditCard },
  { title: 'Sales History', url: '/sales', icon: ShoppingCart },
  { title: 'Products', url: '/products', icon: Package },
]

const inventoryItems = [
  { title: 'Stock Management', url: '/inventory', icon: Boxes },
  { title: 'Categories', url: '/inventory/categories', icon: Tag },
  { title: 'Suppliers', url: '/inventory/suppliers', icon: Truck },
  { title: 'Low Stock Alerts', url: '/inventory/low-stock', icon: AlertTriangle },
]

const analyticsItems = [
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Sales Reports', url: '/reports/sales', icon: TrendingUp },
  { title: 'Inventory Reports', url: '/reports/inventory', icon: PieChart },
]

const adminItems = [
  { title: 'User Management', url: '/admin/users', icon: Users },
  { title: 'Roles & Permissions', url: '/admin/roles', icon: Shield },
  { title: 'System Settings', url: '/admin/settings', icon: Settings },
]
</script>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
  position: relative;
}

/* Sidebar Styles */
.sidebar {
  width: 256px;
  min-height: 100vh;
  border-right: 1px solid hsl(var(--border));
  background-color: hsl(var(--sidebar-background));
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  transition: width 0.2s ease-in-out, transform 0.2s ease-in-out;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 64px;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
}

/* Main Content Styles */
.main-content {
  flex: 1;
  margin-left: 256px;
  transition: margin-left 0.2s ease-in-out;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content.expanded {
  margin-left: 64px;
}

.main-header {
  height: 4rem;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
  background-color: hsl(var(--background));
  position: sticky;
  top: 0;
  z-index: 30;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: 256px;
  }
  
  .sidebar-collapsed {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .main-content.expanded {
    margin-left: 0;
  }
}

/* Smooth transitions */
* {
  transition-property: width, margin-left, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
</style>