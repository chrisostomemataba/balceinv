import { PermissionsService } from '../../../services/permission.service';

export default defineEventHandler(async (event) => {
  const userId = parseInt(event.context.params?.id || '0');
  return await PermissionsService.getUserPermissions(userId);
});