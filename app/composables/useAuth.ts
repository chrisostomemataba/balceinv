interface User {
  id: number
  name: string
  email: string
  role: string
}

interface LoginResponse {
  success: boolean
  message: string
  data?: {
    user: User
  }
}

interface SetupResponse {
  success: boolean
  message: string
  data?: {
    user: User
  }
}

export const useAuth = () => {
  const isLoading = ref(false)

  const login = async (credentials: { email: string; password: string }) => {
    console.log('=== useAuth.login called ===')
    console.log('Credentials:', credentials)
    
    isLoading.value = true

    try {
      console.log('Making login request...')
      
      const response = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
        credentials: 'include'
      })

      console.log('Login response:', response)
      return response
      
    } catch (error) {
      console.error('Login error in composable:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const setupAdmin = async (data: { name: string; email: string; password: string }) => {
    console.log('=== useAuth.setupAdmin called ===')
    console.log('Setup data:', data)
    
    isLoading.value = true

    try {
      console.log('Making setup request...')
      
      const response = await $fetch<SetupResponse>('/api/auth/setup', {
        method: 'POST',
        body: data,
        credentials: 'include'
      })

      console.log('Setup response:', response)
      return response
      
    } catch (error) {
      console.error('Setup error in composable:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    console.log('=== useAuth.logout called ===')
    
    isLoading.value = true

    try {
      const response = await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      console.log('Logout response:', response)
      return response
      
    } catch (error) {
      console.error('Logout error in composable:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    login,
    setupAdmin,
    logout
  }
}