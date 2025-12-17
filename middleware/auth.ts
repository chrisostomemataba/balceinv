export default defineNuxtRouteMiddleware(async (to) => {
  const token = useCookie('access_token')

  if (!token.value) {
    return navigateTo('/login')
  }

  // Optional: validate token server-side
  try {
    await $fetch('/api/auth/verify', { credentials: 'include' })
  } catch {
    return navigateTo('/login')
  }
})