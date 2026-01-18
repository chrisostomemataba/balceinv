import { RolesService } from '../../services/roles.service';

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id);
  return await RolesService.update(event, id);
});
