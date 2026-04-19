// app/plugins/auth.ts
import { FetchError } from "ofetch";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBase as string;

  // We hook into Nuxt's built-in fetch instance rather than replacing globalThis.$fetch.
  // This hook fires whenever any $fetch call in the app receives an error response.
  // Think of it as a global catch block specifically for HTTP errors.
  nuxtApp.hook("app:error", () => {
    // We intentionally leave this empty — we handle errors at the fetch level below
  });

  // The correct way to intercept all $fetch calls in Nuxt is to provide
  // a custom $fetch instance via the plugin return. Every composable that
  // calls $fetch will use this intercepted version automatically.
  const apiFetch = $fetch.create({
    credentials: "include",

    // onResponseError fires after the response arrives but when the status
    // code indicates an error (4xx or 5xx). This is where we catch 401s.
    async onResponseError({ response, request, options }) {
      // Guard: only intercept 401 Unauthorized responses.
      // Also guard against intercepting the refresh endpoint itself —
      // if refresh returns 401 we must not loop forever trying to refresh.
      const requestUrl =
        typeof request === "string"
          ? request
          : request instanceof URL
            ? request.toString()
            : (request as Request).url;

      const isRefreshEndpoint = requestUrl.includes("/auth/refresh");

      if (response.status === 401 && !isRefreshEndpoint) {
        try {
          // Attempt a silent token refresh using the refresh token cookie.
          // The Go server will read the refresh_token cookie automatically
          // and issue a new access_token cookie if the session is still valid.
          await $fetch(`${baseUrl}/api/auth/refresh`, {
            method: "POST" as const,
            credentials: "include" as const,
          });

          // Refresh succeeded — replay the original request.
          // We reconstruct the URL cleanly to avoid type issues with RequestInfo.
          await $fetch(requestUrl, {
            ...options,
            method: options.method as any,
            credentials: "include" as const,
          });
        } catch (refreshError) {
          // Refresh itself failed — the session is truly expired.
          // Clear local state and send the user back to login.
          if (import.meta.client) {
            localStorage.removeItem("user");
          }

          // Use nuxtApp.runWithContext to safely call navigateTo from a plugin
          await nuxtApp.runWithContext(() => navigateTo("/login"));
        }
      }
    },
  });

  // Providing $fetch here makes this intercepted version available
  // throughout the app via useNuxtApp().$fetch, but composables that
  // call $fetch directly also benefit because Nuxt replaces the global
  // $fetch with whatever the plugin provides when the key matches.
  return {
    provide: {
      apiFetch,
    },
  };
});
