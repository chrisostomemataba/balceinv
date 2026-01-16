<!-- layouts/default.vue -->
<template>
  <div class="app-layout">
    <AppHeader />
    
    <div class="content-wrapper">
      <CustomSidebar :collapsed="sidebarCollapsed" />
      
      <main class="page-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <slot />
      </main>
    </div>
    
    <AppFooter />
  </div>
</template>

<script setup>
const sidebarCollapsed = useState('sidebar-collapsed', () => false)
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex: 1;
  position: relative;
}

.page-content {    
  flex: 1 1 0%;
  min-width: 0;       
  margin-left: 0 !important; 
}

/* Optional: Add margin when sidebar is expanded */
.page-content:not(.sidebar-collapsed) {
  margin-left: 256px;
}

.page-content.sidebar-collapsed {
  margin-left: 64px;
}

@media (max-width: 768px) {
  .page-content {
    margin-left: 0 !important;
  }
}
</style>