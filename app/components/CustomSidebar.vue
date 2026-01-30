<script setup lang="ts">
import { 
  CreditCard, 
  ShoppingCart, 
  Package, 
  Users, 
  Shield,
  BarChart3,
  Bell,
  Settings,
  TrendingUp,
  FileText
} from 'lucide-vue-next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const route = useRoute();
const sidebarCollapsed = useState('sidebar-collapsed', () => false);

const user = ref<{
  name: string;
  email: string;
  role: string;
} | null>(null);

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const isActive = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + '/');
};

const canAccess = (requiredRole: string): boolean => {
  if (!user.value) return false;
  const userRole = user.value.role.toLowerCase();
  
  if (userRole === 'superadmin') return true;
  if (requiredRole === 'admin') return ['admin', 'superadmin'].includes(userRole);
  return true;
};

onMounted(() => {
  if (process.client) {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true';
    }
  }
});
</script>

<template>
  <aside 
    :class="[
      'fixed left-0 top-16 bottom-0 border-r bg-background transition-all duration-200 z-40',
      sidebarCollapsed ? 'w-16' : 'w-64'
    ]"
  >
    <div class="flex flex-col h-full p-3">
      <div class="flex-1 space-y-4">
        <div>
          <p v-if="!sidebarCollapsed" class="text-xs font-semibold text-muted-foreground px-3 mb-2">
            OPERATIONS
          </p>
          
          <NuxtLink
            to="/pos"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/pos') ? 'bg-accent' : ''
            ]"
          >
            <CreditCard class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Point of Sale</span>
          </NuxtLink>

          <NuxtLink
            to="/sales"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/sales') ? 'bg-accent' : ''
            ]"
          >
            <ShoppingCart class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Sales History</span>
          </NuxtLink>

          <NuxtLink
            to="/products"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/products') ? 'bg-accent' : ''
            ]"
          >
            <Package class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Products</span>
          </NuxtLink>

          <NuxtLink
            to="/stock-movements"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/stock-movements') ? 'bg-accent' : ''
            ]"
          >
            <TrendingUp class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Stock Movements</span>
          </NuxtLink>
        </div>

        <Separator v-if="canAccess('admin')" />

        <div v-if="canAccess('admin')">
          <p v-if="!sidebarCollapsed" class="text-xs font-semibold text-muted-foreground px-3 mb-2">
            MANAGEMENT
          </p>

          <NuxtLink
            to="/reports"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/reports') ? 'bg-accent' : ''
            ]"
          >
            <BarChart3 class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Reports</span>
          </NuxtLink>

          <NuxtLink
            to="/notifications"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/notifications') ? 'bg-accent' : ''
            ]"
          >
            <Bell class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Notifications</span>
            <Badge v-if="!sidebarCollapsed" variant="destructive" class="ml-auto">3</Badge>
          </NuxtLink>
        </div>

        <Separator v-if="canAccess('superadmin')" />

        <div v-if="canAccess('superadmin')">
          <p v-if="!sidebarCollapsed" class="text-xs font-semibold text-muted-foreground px-3 mb-2">
            ADMIN
          </p>

          <NuxtLink
            to="/users"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/users') ? 'bg-accent' : ''
            ]"
          >
            <Users class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Users</span>
          </NuxtLink>

          <NuxtLink
            to="/roles"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/roles') ? 'bg-accent' : ''
            ]"
          >
            <Shield class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Roles</span>
          </NuxtLink>

          <NuxtLink
            to="/reports"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/reports') ? 'bg-accent' : ''
            ]"
          >
            <FileText class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Reports</span>
          </NuxtLink>

          <NuxtLink
            to="/settings"
            :class="[
              'w-full flex items-center rounded-md hover:bg-accent transition-colors h-10',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-3',
              isActive('/settings') ? 'bg-accent' : ''
            ]"
          >
            <Settings class="h-4 w-4 shrink-0" :class="{ 'mr-3': !sidebarCollapsed }" />
            <span v-if="!sidebarCollapsed" class="text-sm font-medium">Settings</span>
          </NuxtLink>
        </div>
      </div>

      <div class="mt-auto pt-3 border-t">
        <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
          <Avatar class="h-8 w-8 rounded-lg shrink-0">
            <AvatarFallback class="rounded-lg">
              {{ user ? getInitials(user.name) : 'GU' }}
            </AvatarFallback>
          </Avatar>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user?.name || 'Guest User' }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ user?.email || '' }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>