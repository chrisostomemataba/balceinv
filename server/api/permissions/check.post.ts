import { PermissionsService } from '../../services/permission.service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { 
    userId?: number; 
    resource?: string; 
    action?: string;
  };
  
  const { userId, resource, action } = body;
  
  if (!userId || !resource || !action) {
    throw createError({ 
      statusCode: 400, 
      message: 'User ID, resource, and action are required' 
    });
  }
  
  const hasPermission = await PermissionsService.checkPermission(
    userId, 
    resource, 
    action
  );
  
  return hasPermission;
});