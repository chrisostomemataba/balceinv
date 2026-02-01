import { toast } from 'vue-sonner';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete';
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface FetchError {
  data?: {
    message?: string;
  };
}

export const usePermissions = () => {
  const permissions = ref<Permission[]>([]);
  const userPermissions = ref<Permission[]>([]);
  const loading = ref<boolean>(false);

  const fetchPermissions = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Permission[]>>('/api/permissions');
      permissions.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch permissions');
    } finally {
      loading.value = false;
    }
  };

  const fetchUserPermissions = async (userId: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Permission[]>>(
        `/api/permissions/user/${userId}`
      );
      userPermissions.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch user permissions');
    } finally {
      loading.value = false;
    }
  };

  const fetchRolePermissions = async (roleId: number): Promise<Permission[]> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Permission[]>>(
        `/api/permissions/role/${roleId}`
      );
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch role permissions');
      return [];
    } finally {
      loading.value = false;
    }
  };

  const assignPermissionsToRole = async (
    roleId: number, 
    permissionIds: number[]
  ): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(
        '/api/permissions/assign-role',
        {
          method: 'POST',
          body: { roleId, permissionIds },
        }
      );
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to assign permissions');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const assignPermissionsToUser = async (
    userId: number, 
    permissionIds: number[]
  ): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(
        '/api/permissions/assign-user',
        {
          method: 'POST',
          body: { userId, permissionIds },
        }
      );
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to assign permissions');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    return userPermissions.value.some(
      p => p.resource === resource && p.action === action
    );
  };

  const canView = (resource: string): boolean => {
    return hasPermission(resource, 'view');
  };

  const canCreate = (resource: string): boolean => {
    return hasPermission(resource, 'create');
  };

  const canEdit = (resource: string): boolean => {
    return hasPermission(resource, 'edit');
  };

  const canDelete = (resource: string): boolean => {
    return hasPermission(resource, 'delete');
  };

  const groupByResource = computed(() => {
    const grouped: Record<string, Permission[]> = {};
    
    permissions.value.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource]!.push(permission);
    });
    
    return grouped;
  });

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
    canDelete,
  };
};