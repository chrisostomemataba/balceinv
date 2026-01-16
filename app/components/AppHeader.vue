<!-- AppHeader.vue -->
<template>
  <header class="fixed top-0 left-0 right-0 h-16 border-b bg-background z-50">
    <div class="flex items-center justify-between h-full px-4 gap-4">
      <!-- Left section -->
      <div class="flex items-center gap-3">
        <button 
          @click="toggleSidebar"
          class="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
        >
          <Menu class="h-5 w-5" />
        </button>
        
        <div class="hidden md:flex items-center gap-2">
          <Search class="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            class="w-64 h-9"
          />
        </div>
      </div>

      <!-- Right section -->
      <div class="flex items-center gap-3">
        <button class="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors">
          <Bell class="h-5 w-5" />
        </button>
        
        <div class="flex items-center gap-2 pl-3 border-l">
          <Avatar class="h-8 w-8">
            <AvatarFallback>{{ getInitials(user.full_name) }}</AvatarFallback>
          </Avatar>
          <div class="hidden md:block text-sm">
            <p class="font-medium leading-none">{{ user.full_name }}</p>
            <p class="text-xs text-muted-foreground mt-1">{{ user.email }}</p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Menu, Bell, Search } from 'lucide-vue-next'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'

// Get shared sidebar state
const sidebarCollapsed = useState('sidebar-collapsed', () => false)

// User data
const user = ref({
  full_name: 'Guest User',
  email: ''
})

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (process.client) {
    localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value.toString())
  }
}

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