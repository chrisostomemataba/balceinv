<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ShieldCheck } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth'
})

const formSchema = toTypedSchema(z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
}))

const { setupAdmin, isLoading } = useAuth()
const form = useForm({ validationSchema: formSchema })

const onSubmit = form.handleSubmit(async (values) => {
  console.log('Setup form submitted')
  try {
    const response = await setupAdmin(values)
    if (response.success) {
      toast.success('Super User Created', { description: 'Admin account has been set up successfully' })
      await navigateTo('/login')
    }
  } catch (error: any) {
    console.error('Setup error:', error)
    toast.error('Setup failed', { description: error.data?.message || 'Error connecting to server' })
  }
})
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-4">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-1">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-6 h-6 text-primary" />
          <CardTitle class="text-2xl">System Setup</CardTitle>
        </div>
        <p class="text-sm text-muted-foreground">Initialize the Super Admin account</p>
      </CardHeader>
      <form @submit="onSubmit">
        <CardContent>
          <div class="space-y-4">
            <FormField v-slot="{ componentField }" name="name">
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Admin Name" :disabled="isLoading" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="admin@system.com" :disabled="isLoading" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Root Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" :disabled="isLoading" v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </CardContent>
        <CardFooter class="flex-col gap-3">
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isLoading ? 'Creating Account...' : 'Create Super User' }}
          </button>
          <NuxtLink to="/login" class="text-xs text-center text-muted-foreground hover:underline">Back to Login</NuxtLink>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>