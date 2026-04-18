import { toast } from 'vue-sonner'

interface Permission {
  id: number
  name: string
  resource: string
  action: 'view' | 'create' | 'edit' | 'delete'
  description?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const usePermissions = () => {
  const { public: { apiBase } } = useRuntimeConfig()

  const permissions = ref<Permission[]>([])
  const userPermissions = ref<Permission[]>([])
  const loading = ref(false)

  const fetchPermissions = async (): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Permission[]>>(`${apiBase}/api/permissions`, {
        credentials: 'include'
      })
      permissions.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch permissions')
    } finally {
      loading.value = false
    }
  }

  const fetchUserPermissions = async (userId: number): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Permission[]>>(`${apiBase}/api/permissions/user/${userId}`, {
        credentials: 'include'
      })
      userPermissions.value = res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch user permissions')
    } finally {
      loading.value = false
    }
  }

  const fetchRolePermissions = async (roleId: number): Promise<Permission[]> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<Permission[]>>(`${apiBase}/api/permissions/role/${roleId}`, {
        credentials: 'include'
      })
      return res.data
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to fetch role permissions')
      return []
    } finally {
      loading.value = false
    }
  }

  const assignPermissionsToRole = async (roleId: number, permissionIds: number[]): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<null>>(`${apiBase}/api/permissions/assign-role`, {
        method: 'POST',
        body: { roleId, permissionIds },
        credentials: 'include'
      })
      toast.success(res.message)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign permissions')
      throw error
    } finally {
      loading.value = false
    }
  }

  const assignPermissionsToUser = async (userId: number, permissionIds: number[]): Promise<void> => {
    loading.value = true
    try {
      const res = await $fetch<ApiResponse<null>>(`${apiBase}/api/permissions/assign-user`, {
        method: 'POST',
        body: { userId, permissionIds },
        credentials: 'include'
      })
      toast.success(res.message)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign permissions')
      throw error
    } finally {
      loading.value = false
    }
  }

  const hasPermission = (resource: string, action: string): boolean =>
    userPermissions.value.some(p => p.resource === resource && p.action === action)

  const canView = (resource: string): boolean => hasPermission(resource, 'view')
  const canCreate = (resource: string): boolean => hasPermission(resource, 'create')
  const canEdit = (resource: string): boolean => hasPermission(resource, 'edit')
  const canDelete = (resource: string): boolean => hasPermission(resource, 'delete')


  const groupByResource = computed(() => {
    const grouped: Record<string, Permission[]> = {}
    permissions.value.forEach(p => {
      if (!grouped[p.resource]) grouped[p.resource] = []
      grouped[p.resource]!.push(p)
    })
    return grouped
  })

  return {
    permissions,
    userPermissions,
    loading,
    groupByResource,
    fetchPermissions,
    fetchUserPermissions,
    fetchRolePermissions,
    assignPermissionsToRole,
    assignPermissionsToUser,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete
  }
}