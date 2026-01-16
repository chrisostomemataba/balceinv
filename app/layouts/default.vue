<template>
  <CustomSidebar>
    <slot />
  </CustomSidebar>
  <Toaster />
</template>

<script setup lang="ts">
import CustomSidebar from '@/components/CustomSidebar.vue'
import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
</script>