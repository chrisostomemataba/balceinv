export const useDashboard = () =>
  useLazyAsyncData('dashboard', () =>
    $fetch('/api/dashboard', { credentials: 'include' })
  )