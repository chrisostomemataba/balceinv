import { toast } from 'vue-sonner';

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  role: Role;
  createdAt: Date;
  updatedAt?: Date;
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

export const useUsers = () => {
  const users = ref<User[]>([]);
  const loading = ref<boolean>(false);
  const selectedUser = ref<User | null>(null);

  const fetchUsers = async (): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<User[]>>('/api/users');
      users.value = response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch users');
    } finally {
      loading.value = false;
    }
  };

  const fetchUser = async (id: number): Promise<User | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`);
      selectedUser.value = response.data;
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to fetch user');
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (data: {
    name: string;
    email: string;
    password: string;
    roleId: number;
  }): Promise<User | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<User>>('/api/users', {
        method: 'POST',
        body: data,
      });
      await fetchUsers();
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to create user');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (
    id: number,
    data: {
      name?: string;
      email?: string;
      roleId?: number;
    }
  ): Promise<User | undefined> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<User>>(`/api/users/${id}`, {
        method: 'PUT',
        body: data,
      });
      await fetchUsers();
      toast.success(response.message);
      return response.data;
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to update user');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updatePassword = async (
    userId: number,
    newPassword: string
  ): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(
        '/api/users/update-password',
        {
          method: 'POST',
          body: { userId, newPassword },
        }
      );
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to update password');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (id: number): Promise<void> => {
    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<null>>(`/api/users/${id}`, {
        method: 'DELETE',
      });
      users.value = users.value.filter((user: User) => user.id !== id);
      toast.success(response.message);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      toast.error(fetchError.data?.message || 'Failed to delete user');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    loading,
    selectedUser,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    updatePassword,
    deleteUser,
  };
};