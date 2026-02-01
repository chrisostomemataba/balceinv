import { PermissionsService } from '../server/services/permission.service';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user } = useAuth();
  
  if (!user.value) {
    return navigateTo('/login');
  }
  
  const routePermissions: Record<string, { resource: string; action: string }> = {
    '/pos': { resource: 'pos', action: 'view' },
    '/sales': { resource: 'sales', action: 'view' },
    '/products': { resource: 'products', action: 'view' },
    '/stock-movements': { resource: 'stock-movements', action: 'view' },
    '/reports': { resource: 'reports', action: 'view' },
    '/notifications': { resource: 'notifications', action: 'view' },
    '/users': { resource: 'users', action: 'view' },
    '/roles': { resource: 'roles', action: 'view' },
    '/settings': { resource: 'settings', action: 'view' },
  };
  
  const pathKey = Object.keys(routePermissions).find(key => 
    to.path === key || to.path.startsWith(key + '/')
  );
  
  if (pathKey) {
    const permission = routePermissions[pathKey];
    
    try {
      const hasPermission = await $fetch('/api/permissions/check', {
        method: 'POST',
        body: {
          userId: user.value.id,
          resource: permission.resource,
          action: permission.action,
        },
      });
      
      if (!hasPermission) {
        return navigateTo('/unauthorized');
      }
    } catch (error) {
      return navigateTo('/unauthorized');
    }
  }
});