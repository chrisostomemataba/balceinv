// composables/useAuth.ts
import { toast } from 'vue-sonner'

interface User {
  id: number
  name: string
  email: string
  role: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase


  const user = useState<User | null>('auth:user', () => {
    if (process.client) {
      const stored = localStorage.getItem('user')
      if (stored) {
        try { return JSON.parse(stored) }
        catch { localStorage.removeItem('user') }
      }
    }
    return null
  })

  const isLoading = ref(false)

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean; data?: { user: User }; message: string }>(
        `${baseUrl}/api/auth/login`,
        {
          method: 'POST' as const,
          body: credentials,
          credentials: 'include'
        }
      )

      if (res.success && res.data?.user) {
        user.value = res.data.user
        if (process.client) localStorage.setItem('user', JSON.stringify(res.data.user))

        toast.success('Welcome back!', {
          description: `Logged in as ${res.data.user.name}`
        })

        const target = ['SuperAdmin', 'Admin'].includes(res.data.user.role)
          ? '/dashboard'
          : '/'
        await navigateTo(target)
        return res
      }

      throw new Error(res.message || 'Login failed')
    } catch (err: any) {
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await $fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST' as const,
        credentials: 'include'
      })
    } catch {
      // Even if the server call fails, clear local state
    } finally {
      user.value = null
      if (process.client) localStorage.removeItem('user')
      isLoading.value = false
      toast.success('Signed out successfully')
      await navigateTo('/login')
    }
  }


  const setupAdmin = async (values: { name: string; email: string; password: string }) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean; message: string }>(
        `${baseUrl}/api/auth/setup`,
        {
          method: 'POST' as const,
          body: values,
          credentials: 'include'
        }
      )
      return res
    } catch (err: any) {
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    login,
    logout,
    setupAdmin,
  }
}