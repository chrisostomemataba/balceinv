<script setup>
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <slot />
  </div>
  <Toaster />
</template>