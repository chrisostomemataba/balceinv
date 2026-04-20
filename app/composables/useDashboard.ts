// composables/useDashboard.ts
export const useDashboard = () => {
  const { public: { apiBase } } = useRuntimeConfig()

  return useAsyncData('dashboard', () =>
    $fetch(`${apiBase}/api/dashboard`, { credentials: 'include' })
  )
}