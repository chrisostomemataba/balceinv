<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

definePageMeta({
  layout: 'auth'
})
const formSchema = toTypedSchema(z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters')
}))

const { login, isLoading } = useAuth()
const form = useForm({ validationSchema: formSchema })

const onSubmit = form.handleSubmit(async (values) => {
  console.log('Login form submitted')
  try {
    const response = await login(values)
    if (response.success && response.data) {
      const { role, name } = response.data.user
      toast.success('Login successful', { description: `Welcome back, ${name}!` })
      if (role === 'SuperAdmin' || role === 'Admin') {
        await navigateTo('/dashboard')
      } else {
        await navigateTo('/')
      }
    }
  } catch (error: any) {
    console.error('Login error:', error)
    let errorMessage = 'Login failed'
    if (error?.statusCode === 401) {
      errorMessage = 'Invalid email or password'
    } else if (error?.data?.message) {
      errorMessage = error.data.message
    }
    toast.error('Login failed', { description: errorMessage })
  }
})
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4">
    <Card class="w-full sm:max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Login to Your Account</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form @submit="onSubmit">
        <CardContent>
          <div class="space-y-4">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" autocomplete="email" :disabled="isLoading" v-bind="componentField" />
                </FormControl>
                <FormDescription>Enter the email associated with your account</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autocomplete="current-password" :disabled="isLoading" v-bind="componentField" />
                </FormControl>
                <FormDescription>Must be at least 6 characters long</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>
          </div>
        </CardContent>
        <CardFooter class="flex-col space-y-4">
          <div class="flex w-full justify-end space-x-2">
            <button 
              type="button" 
              @click="form.resetForm()" 
              :disabled="isLoading"
              class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Clear
            </button>
            <button 
              type="submit" 
              :disabled="isLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isLoading ? 'Logging in...' : 'Login' }}
            </button>
          </div>
          <div class="text-center text-sm text-muted-foreground">
            <p class="mb-2">
              First time? 
              <NuxtLink to="/admin-page" class="text-primary font-medium hover:underline">Create Super User</NuxtLink>
            </p>
            <p class="text-xs">By logging in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>