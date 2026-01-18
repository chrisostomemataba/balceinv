<script setup lang="ts">
import { Plus, Users as UsersIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { columns } from '@/components/roles/columns';
import DataTable from '@/components/roles/DataTable.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useRoles } from '@/composables/useRoles';
const { roles, loading, fetchRoles, createRole, updateRole, deleteRole } = useRoles();

const showDialog = ref(false);
const showDeleteDialog = ref(false);
const showUsersDialog = ref(false);
const isEditing = ref(false);
const selectedRole = ref<any>(null);
const roleName = ref('');

onMounted(async () => {
  await fetchRoles();
  
  window.addEventListener('edit-role', handleEdit);
  window.addEventListener('delete-role', handleDelete);
  window.addEventListener('view-users', handleViewUsers);
});

onUnmounted(() => {
  window.removeEventListener('edit-role', handleEdit);
  window.removeEventListener('delete-role', handleDelete);
  window.removeEventListener('view-users', handleViewUsers);
});

const handleEdit = (event: any) => {
  selectedRole.value = event.detail;
  roleName.value = event.detail.name;
  isEditing.value = true;
  showDialog.value = true;
};

const handleDelete = (event: any) => {
  selectedRole.value = event.detail;
  showDeleteDialog.value = true;
};

const handleViewUsers = (event: any) => {
  selectedRole.value = event.detail;
  showUsersDialog.value = true;
};

const openCreateDialog = () => {
  selectedRole.value = null;
  roleName.value = '';
  isEditing.value = false;
  showDialog.value = true;
};

const handleSubmit = async () => {
  if (!roleName.value.trim()) {
    toast.error('Role name is required');
    return;
  }

  try {
    if (isEditing.value && selectedRole.value) {
      await updateRole(selectedRole.value.id, roleName.value);
    } else {
      await createRole(roleName.value);
    }
    showDialog.value = false;
    roleName.value = '';
  } catch (error) {
    console.error('Failed to save role:', error);
  }
};

const confirmDelete = async () => {
  if (selectedRole.value) {
    try {
      await deleteRole(selectedRole.value.id);
      showDeleteDialog.value = false;
      selectedRole.value = null;
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  }
};
</script>

<template>
  <div class="container mx-auto py-6 px-4 space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Roles Management</h1>
        <p class="text-muted-foreground mt-1">
          Manage user roles and permissions
        </p>
      </div>
      <Button @click="openCreateDialog" :disabled="loading">
        <Plus class="mr-2 h-4 w-4" />
        Add Role
      </Button>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>All Roles</CardTitle>
        <CardDescription>A list of all roles in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable :columns="columns" :data="roles" />
      </CardContent>
    </Card>

    <Dialog v-model:open="showDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit Role' : 'Create New Role' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Update the role name' : 'Add a new role to the system' }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="role-name">Role Name</Label>
            <Input
              id="role-name"
              v-model="roleName"
              placeholder="Enter role name"
              @keyup.enter="handleSubmit"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDialog = false">Cancel</Button>
          <Button @click="handleSubmit" :disabled="!roleName.trim()">
            {{ isEditing ? 'Update' : 'Create' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the role "{{ selectedRole?.name }}".
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="showUsersDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <UsersIcon class="h-5 w-5" />
            Users with {{ selectedRole?.name }} Role
          </DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <div v-if="selectedRole?.users?.length" class="space-y-2">
            <div
              v-for="user in selectedRole.users"
              :key="user.id"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p class="font-medium">{{ user.name }}</p>
                <p class="text-sm text-muted-foreground">{{ user.email }}</p>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-muted-foreground">
            No users assigned to this role
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>