export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/admin-page', '/setup']
  if (publicRoutes.includes(to.path)) return

  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase as string

  const user = useState<{ id: number; name: string; email: string; role: string; company_id: number } | null>('auth:user')
  const userPermissions = useState<Array<{ id: number; resource: string; action: string }>>('perms:user', () => [])

  const restorePermissions = async (userId: number) => {
    if (userPermissions.value.length > 0) return
    try {
      const res = await $fetch<{ success: boolean; data: Array<{ id: number; resource: string; action: string }> }>(
        `${baseUrl}/api/permissions/user/${userId}`,
        { credentials: 'include' as const }
      )
      if (res.success) userPermissions.value = res.data ?? []
    } catch {}
  }

  if (user.value) {
    await restorePermissions(user.value.id)
    return
  }

  try {
    const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string; company_id: number } }>(
      `${baseUrl}/api/auth/me`,
      { credentials: 'include' as const }
    )
    if (res.success && res.data) {
      user.value = res.data
      if (import.meta.client) localStorage.setItem('user', JSON.stringify(res.data))
      await restorePermissions(res.data.id)
      return
    }
  } catch {
    try {
      await $fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST' as const,
        credentials: 'include' as const,
      })
      const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string; company_id: number } }>(
        `${baseUrl}/api/auth/me`,
        { credentials: 'include' as const }
      )
      if (res.success && res.data) {
        user.value = res.data
        if (import.meta.client) localStorage.setItem('user', JSON.stringify(res.data))
        await restorePermissions(res.data.id)
        return
      }
    } catch {
      user.value = null
      userPermissions.value = []
      if (import.meta.client) localStorage.removeItem('user')
      return navigateTo('/login')
    }
  }
})