<script setup lang="ts">
import { Menu, Bell } from 'lucide-vue-next';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const sidebarCollapsed = useState('sidebar-collapsed', () => false);

const user = ref<{
  name: string;
  email: string;
  role: string;
} | null>(null);

const notificationCount = ref(0);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  if (process.client) {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value.toString());
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const handleLogout = async () => {
  try {
    await $fetch('/api/auth/logout', { method: 'POST' });
    if (process.client) {
      localStorage.removeItem('user');
    }
    await navigateTo('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
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
  <header class="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50">
    <div class="flex items-center justify-between h-full px-4 gap-4">
      <div class="flex items-center gap-3">
        <button 
          @click="toggleSidebar"
          class="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors flex-shrink-0"
        >
          <Menu class="h-5 w-5" />
        </button>
        
        <h1 class="text-lg font-semibold hidden sm:block">POS System</h1>
      </div>

      <div class="flex items-center gap-3">
        <button 
          class="relative flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          @click="$router.push('/notifications')"
        >
          <Bell class="h-5 w-5" />
          <Badge 
            v-if="notificationCount > 0" 
            class="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            variant="destructive"
          >
            {{ notificationCount }}
          </Badge>
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <button class="flex items-center gap-2 pl-3 border-l hover:bg-accent rounded-md px-2 py-1 transition-colors">
              <Avatar class="h-9 w-9">
                <AvatarFallback>{{ user ? getInitials(user.name) : 'GU' }}</AvatarFallback>
              </Avatar>
              <div class="hidden md:block text-sm text-left">
                <p class="font-medium leading-none">{{ user?.name || 'Guest User' }}</p>
                <p class="text-xs text-muted-foreground mt-1">{{ user?.role || 'No Role' }}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel>
              <div class="flex flex-col space-y-1">
                <p class="text-sm font-medium">{{ user?.name || 'Guest User' }}</p>
                <p class="text-xs text-muted-foreground">{{ user?.email || '' }}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="$router.push('/settings')">
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem @click="$router.push('/profile')">
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
</template>