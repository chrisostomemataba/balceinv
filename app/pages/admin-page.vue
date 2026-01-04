<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Loader2, ShieldCheck } from 'lucide-vue-next'

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
const { setupAdmin } = useAuth()
const isLoading = ref(false)

const form = useForm({
  defaultValues: {
    name: '',
    email: '',
    password: '',
  },
  validators: {
    // Changing to onChange or onBlur can help see errors before clicking submit
    onChange: formSchema,
  },
  onSubmit: async ({ value }) => {
    isLoading.value = true
    try {
      // Use the composable instead of raw $fetch
      const response = await setupAdmin(value)

      if (response.success) {
        toast.success('Super User Created')
        await navigateTo('/')
      }
    } catch (error: any) {
      toast.error('Setup failed', {
        description: error.data?.message || 'Error connecting to server',
      })
    } finally {
      isLoading.value = false
    }
  },
})

function isInvalid(field: any): boolean {
  return field.state.meta.isTouched && field.state.meta.errors?.length > 0
}
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
      
      <CardContent>
        <form 
          @submit.prevent="(e) => {
            e.stopPropagation();
            form.handleSubmit();
          }" 
          class="space-y-4"
        >
          <FieldGroup>
            <form.Field name="name">
              <template #default="{ field }: { field: any }">
                <Field :data-invalid="isInvalid(field)">
                  <FieldLabel :for="field.name">Full Name</FieldLabel>
                  <Input 
                    :id="field.name"
                    :model-value="field.state.value" 
                    placeholder="Admin Name" 
                    :disabled="isLoading" 
                    @blur="field.handleBlur"
                    @input="(e: any) => field.handleChange(e.target?.value)"
                  />
                  <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
                </Field>
              </template>
            </form.Field>

            <form.Field name="email">
              <template #default="{ field }: { field: any }">
                <Field :data-invalid="isInvalid(field)">
                  <FieldLabel :for="field.name">Email Address</FieldLabel>
                  <Input 
                    :id="field.name"
                    :model-value="field.state.value" 
                    type="email" 
                    placeholder="admin@system.com" 
                    :disabled="isLoading" 
                    @blur="field.handleBlur"
                    @input="(e: any) => field.handleChange(e.target?.value)"
                  />
                  <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
                </Field>
              </template>
            </form.Field>

            <form.Field name="password">
              <template #default="{ field }: { field: any }">
                <Field :data-invalid="isInvalid(field)">
                  <FieldLabel :for="field.name">Root Password</FieldLabel>
                  <Input 
                    :id="field.name"
                    :model-value="field.state.value" 
                    type="password" 
                    placeholder="••••••••" 
                    :disabled="isLoading" 
                    @blur="field.handleBlur"
                    @input="(e: any) => field.handleChange(e.target?.value)"
                  />
                  <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
                </Field>
              </template>
            </form.Field>
          </FieldGroup>

          <Button type="submit" class="w-full mt-4" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? 'Creating Account...' : 'Create Super User' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex flex-col gap-3">
        <NuxtLink to="/login" class="text-xs text-center text-muted-foreground hover:underline">
          Back to Login
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>