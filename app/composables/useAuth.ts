// composables/useAuth.ts
interface User {
  id: number
  name: string
  email: string
  role: string
}

export const useAuth = () => {
  const user = useState<User | null>('auth:user', () => null)
  const isLoading = ref(false)

  // Load from localStorage once on client mount (optimistic)
  if (process.client) {
    onMounted(() => {
      const stored = localStorage.getItem('user')
      if (stored) {
        try {
          user.value = JSON.parse(stored)
        } catch {
          localStorage.removeItem('user')
        }
      }
    })
  }

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      const res = await $fetch<{ success: boolean; data?: { user: User }; message: string }>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      if (res.success && res.data?.user) {
        const u = res.data.user
        user.value = u

        if (process.client) {
          localStorage.setItem('user', JSON.stringify(u))
        }

        // Navigate based on role
        const target = ['SuperAdmin', 'Admin'].includes(u.role) ? '/dashboard' : '/'
        await navigateTo(target)

        return res
      }

      throw new Error(res.message || 'Login failed')
    } catch (err: any) {
      console.error('Login error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      user.value = null

      if (process.client) {
        localStorage.removeItem('user')
      }

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