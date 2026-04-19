export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/admin-page']
  if (publicRoutes.includes(to.path)) return

  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase as string
  const user = useState<{ id: number; name: string; email: string; role: string } | null>('auth:user')

  if (user.value) return

  try {
    const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string } }>(
      `${baseUrl}/api/auth/me`,
      { credentials: 'include' as const }
    )
    if (res.success && res.data) {
      user.value = res.data
    }
  } catch {
    try {
      await $fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST' as const,
        credentials: 'include' as const,
      })
      const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string } }>(
        `${baseUrl}/api/auth/me`,
        { credentials: 'include' as const }
      )
      if (res.success && res.data) {
        user.value = res.data
      }
    } catch {
      user.value = null
      if (import.meta.client) localStorage.removeItem('user')
      return navigateTo('/login')
    }
  }
})