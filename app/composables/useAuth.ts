export const useAuth = () => {
  /* ------- login ------- */
  const login = async (credentials: { email: string; password: string }) => {
    return await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
      credentials: 'include',      // HTTP-only cookies
    })
  }

  /* ------- logout ------- */
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    await navigateTo('/login')
  }

  /* ------- refresh ------- */
  const refresh = async () => {
    return await $fetch('/api/auth/refresh', { credentials: 'include' })
  }

  /* ------- whoami ------- */
  const me = async () => {
    return await $fetch('/api/auth/verify', { credentials: 'include' })
  }

  return { login, logout, refresh, me }
}