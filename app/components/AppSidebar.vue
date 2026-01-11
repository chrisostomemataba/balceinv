<template>
  <Sidebar>
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Store class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">Business Name</span>
              <span class="truncate text-xs">POS & Inventory</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    
    <SidebarContent>
      <!-- Main Operations -->
      <SidebarGroup>
        <SidebarGroupLabel>Operations</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/pos">
                  <CreditCard class="mr-2 h-4 w-4" />
                  <span>Point of Sale</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/sales">
                  <ShoppingCart class="mr-2 h-4 w-4" />
                  <span>Sales History</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/products">
                  <Package class="mr-2 h-4 w-4" />
                  <span>Products</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Inventory Management -->
      <SidebarGroup>
        <SidebarGroupLabel>Inventory</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/inventory">
                  <Boxes class="mr-2 h-4 w-4" />
                  <span>Stock Management</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/inventory/categories">
                  <Tag class="mr-2 h-4 w-4" />
                  <span>Categories</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/inventory/suppliers">
                  <Truck class="mr-2 h-4 w-4" />
                  <span>Suppliers</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/inventory/low-stock">
                  <AlertTriangle class="mr-2 h-4 w-4" />
                  <span>Low Stock Alerts</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Analytics & Reports -->
      <SidebarGroup>
        <SidebarGroupLabel>Analytics</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/reports">
                  <BarChart3 class="mr-2 h-4 w-4" />
                  <span>Reports</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/reports/sales">
                  <TrendingUp class="mr-2 h-4 w-4" />
                  <span>Sales Reports</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/reports/inventory">
                  <PieChart class="mr-2 h-4 w-4" />
                  <span>Inventory Reports</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <!-- Admin Settings -->
      <SidebarGroup>
        <SidebarGroupLabel>Administration</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/admin/users">
                  <Users class="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/admin/roles">
                  <Shield class="mr-2 h-4 w-4" />
                  <span>Roles & Permissions</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <NuxtLink to="/admin/settings">
                  <Settings class="mr-2 h-4 w-4" />
                  <span>System Settings</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton>
                <UserCircle class="mr-2 h-4 w-4" />
                <span>Current User</span>
                <ChevronUp class="ml-auto h-4 w-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" class="w-[--radix-popper-anchor-width]">
              <DropdownMenuItem>
                <User class="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings class="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut class="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    
    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Icons
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
  UserCircle,
  User,
  LogOut,
  ChevronUp,
} from 'lucide-vue-next'
</script>