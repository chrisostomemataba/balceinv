<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

definePageMeta({
  layout: 'auth'
})

const formSchema = toTypedSchema(z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters')
}))

const { login, isLoading } = useAuth()
const form = useForm({ validationSchema: formSchema })

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const response = await login(values)
    if (response.success && response.data?.user) {
      const { role, name } = response.data.user
      toast.success('Welcome back!', { 
        description: `Logged in as ${name}`,
        duration: 4000
      })
      
      if (role === 'SuperAdmin' || role === 'Admin') {
        await navigateTo('/dashboard')
      } else {
        await navigateTo('/')
      }
    }
  } catch (error: any) {
    let message = 'Something went wrong'
    if (error?.statusCode === 401) {
      message = 'Invalid email or password'
    } else if (error?.data?.message) {
      message = error.data.message
    }
    toast.error('Login failed', { description: message })
  }
})
</script>

<template>
  <div class="min-h-screen w-full grid lg:grid-cols-2">
    <!-- Left side - Welcome / Branding -->
    <div class="relative hidden lg:flex flex-col justify-between bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 p-10 text-white">
      <!-- Background pattern (subtle) -->
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.08)_0%,transparent_50%)]"></div>
      </div>

      <div>
        <h1 class="text-4xl font-bold tracking-tight">POS<span class="text-indigo-400">.</span></h1>
        <p class="mt-4 text-lg text-slate-300 max-w-md">
          Modern point-of-sale system built for speed, simplicity, and scale.
        </p>
      </div>

      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center backdrop-blur-sm">
            <span class="text-2xl">⚡</span>
          </div>
          <div>
            <p class="font-medium">Lightning Fast</p>
            <p class="text-sm text-slate-400">Process sales in seconds</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center backdrop-blur-sm">
            <span class="text-2xl">🔒</span>
          </div>
          <div>
            <p class="font-medium">Secure & Reliable</p>
            <p class="text-sm text-slate-400">Protected sessions & audit logs</p>
          </div>
        </div>

        <Separator class="bg-white/10 my-8" />

        <p class="text-sm text-slate-400">
          © {{ new Date().getFullYear() }} POS System • Made with ❤️ in Tanzania
        </p>
      </div>
    </div>

    <!-- Right side - Login Form -->
    <div class="flex items-center justify-center p-6 lg:p-10 bg-background">
      <Card class="w-full max-w-md border-none shadow-2xl">
        <CardHeader class="space-y-1 pb-6">
          <CardTitle class="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription class="text-base">
            Enter your credentials to continue
          </CardDescription>
        </CardHeader>

        <form @submit="onSubmit">
          <CardContent class="space-y-5">
            <FormField v-slot="{ componentField }" name="email">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    autocomplete="email"
                    :disabled="isLoading"
                    class="h-11"
                    v-bind="componentField" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="password">
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    autocomplete="current-password"
                    :disabled="isLoading"
                    class="h-11"
                    v-bind="componentField" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="flex items-center justify-between text-sm">
              <NuxtLink 
                to="/forgot-password" 
                class="text-primary hover:underline"
              >
                Forgot password?
              </NuxtLink>
            </div>
          </CardContent>

          <CardFooter class="flex flex-col space-y-4 pt-2">
            <Button as-child>
              <button 
                type="submit" 
                class="w-full h-11 text-base font-medium"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Signing in...' : 'Sign in' }}
              </button>
            </Button>

            <div class="text-center text-sm text-muted-foreground">
              First time here? 
              <NuxtLink 
                to="/admin-page" 
                class="text-primary hover:underline font-medium"
              >
                Create Super User
              </NuxtLink>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>

  <!-- Make sure vue-sonner <Toaster /> is in your root layout or app.vue -->
</template>

<style scoped>
/* Optional: subtle hover effect on links */
a:hover {
  text-decoration: underline;
}
</style>