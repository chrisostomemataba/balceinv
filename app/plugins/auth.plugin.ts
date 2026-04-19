export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase as string;

  let refreshPromise: Promise<void> | null = null;

  const doRefresh = (): Promise<void> => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = $fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST' as const,
      credentials: 'include' as const,
    })
      .then(() => { refreshPromise = null; })
      .catch(async () => {
        refreshPromise = null;
        const user = useState('auth:user')
        user.value = null
        if (import.meta.client) localStorage.removeItem('user')
        await nuxtApp.runWithContext(() => navigateTo('/login'))
      });

    return refreshPromise;
  };

  const apiFetch = $fetch.create({
    credentials: 'include',
    async onResponseError({ response, request, options }) {
      const requestUrl =
        typeof request === 'string' ? request
        : request instanceof URL ? request.toString()
        : (request as Request).url;

      const isAuthEndpoint =
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/me');

      if (response.status === 401 && !isAuthEndpoint) {
        await doRefresh();
      }
    },
  });

  return { provide: { apiFetch } };
});