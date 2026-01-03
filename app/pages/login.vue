<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-vue-next'


interface LoginCredentials {
  email: string
  password: string
}

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    user: {
      id: number
      name: string
      role: string
    }
  }
}


const formSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

// Reactive state for loading
const isLoading = ref(false)

const form = useForm({
  defaultValues: {
    email: '',
    password: '',
  },
  validators: {
    onSubmit: formSchema,
  },
  onSubmit: async ({ value }: { value: LoginCredentials }) => {
    isLoading.value = true
    
    try {
      const response = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: value,
        credentials: 'include'
      })

      if (response.success && response.data) {
        const { role } = response.data.user

        toast.success('Login successful', {
          description: `Welcome back, ${response.data.user.name}!`,
          position: 'bottom-right',
        })

        if (role === 'SuperAdmin' || role === 'Admin') {
          await navigateTo('/dashboard')
        } else {
          await navigateTo('/')
        }
      }
    } catch (error: any) {
      let errorMessage = 'Login failed'
      
      if (error?.statusCode === 401) {
        errorMessage = 'Invalid email or password'
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      }
      
      toast.error('Login failed', {
        description: errorMessage,
        position: 'bottom-right',
        class: 'flex flex-col gap-2',
        style: {
          '--border-radius': 'calc(var(--radius) + 4px)',
        },
      })
    } finally {
      isLoading.value = false
    }
  },
})

// Helper function for field validation state
function isInvalid(field: any): boolean {
  return field.state.meta.isTouched && field.state.meta.errors?.length > 0
}
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4">
    <Card class="w-full sm:max-w-md mx-auto mt-8">
    <CardHeader>
      <CardTitle>Login to Your Account</CardTitle>
      <CardDescription>
        Enter your credentials to access your account
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form id="login-form" @submit.prevent="form.handleSubmit">
        <FieldGroup>
          <form.Field name="email">
            <template #default="{ field }: { field: any }">
              <Field :data-invalid="isInvalid(field)">
                <FieldLabel :for="field.name">
                  Email Address
                </FieldLabel>
                <Input
                  :id="field.name"
                  :name="field.name"
                  :model-value="field.state.value"
                  :aria-invalid="isInvalid(field)"
                  type="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  @blur="field.handleBlur"
                  @input="(e: any) => field.handleChange(e.target?.value)"
                  :disabled="isLoading"
                />
                <FieldDescription>
                  Enter the email associated with your account
                </FieldDescription>
                <FieldError
                  v-if="isInvalid(field)"
                  :errors="field.state.meta.errors"
                />
              </Field>
            </template>
          </form.Field>

          <form.Field name="password">
            <template #default="{ field }: { field: any }">
              <Field :data-invalid="isInvalid(field)">
                <FieldLabel :for="field.name">
                  Password
                </FieldLabel>
                <Input
                  :id="field.name"
                  :name="field.name"
                  :model-value="field.state.value"
                  :aria-invalid="isInvalid(field)"
                  type="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  @blur="field.handleBlur"
                  @input="(e: any) => field.handleChange(e.target?.value)"
                  :disabled="isLoading"
                />
                <FieldDescription>
                  Must be at least 6 characters long
                </FieldDescription>
                <FieldError
                  v-if="isInvalid(field)"
                  :errors="field.state.meta.errors"
                />
              </Field>
            </template>
          </form.Field>
        </FieldGroup>
      </form>
    </CardContent>
    <CardFooter class="flex-col space-y-4">
      <div class="flex w-full justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          @click="form.reset()"
          :disabled="isLoading"
        >
          Clear
        </Button>
        <Button 
          type="submit" 
          form="login-form"
          :disabled="isLoading"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </Button>
      </div>
      
      <div class="text-center text-sm text-muted-foreground">
          <p class="mb-2">
            First time? 
            <NuxtLink to="/admin-page" class="text-primary font-medium hover:underline">
              Create Super User
            </NuxtLink>
          </p>
          <p class="text-xs">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
    </CardFooter>
  </Card>
</div>
</template>