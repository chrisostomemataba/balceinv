import { UsersService } from '../../services/users.service';

export default defineEventHandler(async (event) => {
  return await UsersService.create(event);
});