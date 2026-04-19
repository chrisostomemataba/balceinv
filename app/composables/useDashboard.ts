// composables/useDashboard.ts
export const useDashboard = () => {
  const { public: { apiBase } } = useRuntimeConfig()

  return useLazyAsyncData('dashboard', () =>
    $fetch(`${apiBase}/api/dashboard`, { credentials: 'include' })
  )
}