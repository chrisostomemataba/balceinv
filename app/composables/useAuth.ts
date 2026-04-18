// composables/useAuth.ts
interface User {
  id: number
  name: string
  email: string
  role: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase

  const user = useState<User | null>('auth:user', () => null)
  const isLoading = ref(false)

  if (process.client) {
    onMounted(() => {
      const stored = localStorage.getItem('user')
      if (stored) {
        try { user.value = JSON.parse(stored) }
        catch { localStorage.removeItem('user') }
      }
    })
  }

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean; data?: { user: User }; message: string }>(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (res.success && res.data?.user) {
        user.value = res.data.user
        if (process.client) localStorage.setItem('user', JSON.stringify(res.data.user))
        const target = ['SuperAdmin', 'Admin'].includes(res.data.user.role) ? '/dashboard' : '/'
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
        method: 'POST',
        credentials: 'include'
      })
      user.value = null
      if (process.client) localStorage.removeItem('user')
      await navigateTo('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    login,
    logout
  }
}