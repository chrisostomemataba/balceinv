import { UsersService } from '../../services/users.service';

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0');
  return await UsersService.getById(id);
});