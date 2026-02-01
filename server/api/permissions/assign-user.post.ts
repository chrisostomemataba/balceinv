import { PermissionsService } from '../../services/permission.service';

export default defineEventHandler(async (event) => {
  return await PermissionsService.assignPermissionsToUser(event);
});