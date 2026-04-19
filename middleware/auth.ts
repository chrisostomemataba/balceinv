// app/middleware/auth.global.ts
// This middleware runs on every route navigation before the page renders.
// It is the right place to handle session validation because it runs in
// a context where composables and navigation both work without restrictions.
export default defineNuxtRouteMiddleware(async (to) => {
  // Pages that do not require authentication — skip the check for these
  const publicRoutes = ['/login', '/admin-page']
  if (publicRoutes.includes(to.path)) return

  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase as string
  const user = useState<{ id: number; name: string; email: string; role: string } | null>('auth:user')

  // If we already have the user in state, the session is considered valid.
  // The access token may expire mid-session, but that is handled by the
  // plugin interceptor above which will refresh it silently on the next request.
  if (user.value) return

  // No user in state — try to restore from the server using the existing cookie.
  // This handles the page refresh case where localStorage has the user but
  // the reactive state was lost because the server rendered fresh.
  try {
    const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string } }>(
      `${baseUrl}/api/auth/me`,
      {
        credentials: 'include' as const,
      }
    )

    if (res.success && res.data) {
      user.value = res.data
    }
  } catch {
    // /me returned an error — try refreshing the token once before giving up
    try {
      await $fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST' as const,
        credentials: 'include' as const,
      })

      // Refresh worked — now fetch the user again
      const res = await $fetch<{ success: boolean; data: { id: number; name: string; email: string; role: string } }>(
        `${baseUrl}/api/auth/me`,
        {
          credentials: 'include' as const,
        }
      )

      if (res.success && res.data) {
        user.value = res.data
      }
    } catch {
      // Both attempts failed — the session is gone, redirect to login
      return navigateTo('/login')
    }
  }
})