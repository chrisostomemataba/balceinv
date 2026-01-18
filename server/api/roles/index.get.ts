import { RolesService } from '../../services/roles.service';

export default defineEventHandler(async (event) => {
  return await RolesService.getAll();
});