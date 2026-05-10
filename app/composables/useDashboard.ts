export const useDashboard = () => {
  const { public: { apiBase } } = useRuntimeConfig()
  const { $apiFetch } = useNuxtApp()

  return useAsyncData('dashboard', () =>
    $apiFetch(`${apiBase}/api/dashboard`, { credentials: 'include' })
  )
}
