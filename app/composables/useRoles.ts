import { toast } from 'vue-sonner';

interface Role {
  id: number;
  name: string;
  users?: Array<{ 
    id: number; 
    name: string; 
    email: string;
  }>;
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

export const useRoles = () => {
  const roles = ref<Role[]>([]);
  const loading = ref<boolean>(false);
  const selectedRole = ref<Role | null>(null);

  const fetchRoles = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Role[]>>('/api/roles');
      roles.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch roles');
    } finally {
      loading.value = false;
    }
  };

  const fetchRole = async (id: number): Promise<Role | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Role>>(`/api/roles/${id}`);
      selectedRole.value = response.data;
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch role');
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const createRole = async (name: string): Promise<Role | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Role>>('/api/roles', {
        method: 'POST',
        body: { name }
      });
      roles.value.push(response.data);
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to create role');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateRole = async (id: number, name: string): Promise<Role | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<Role>>(`/api/roles/${id}`, {
        method: 'PUT',
        body: { name }
      });
      
      const roleIndex = roles.value.findIndex((role: Role) => role.id === id);
      if (roleIndex !== -1) {
        roles.value[roleIndex] = response.data;
      }
      
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to update role');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteRole = async (id: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(`/api/roles/${id}`, {
        method: 'DELETE'
      });
      
      roles.value = roles.value.filter((role: Role) => role.id !== id);
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to delete role');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const assignRole = async (userId: number, roleId: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>('/api/roles/assign', {
        method: 'POST',
        body: { userId, roleId }
      });
      
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to assign role');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    roles,
    loading,
    selectedRole,
    fetchRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
    assignRole
  };
};