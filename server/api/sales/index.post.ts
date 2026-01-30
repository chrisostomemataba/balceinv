import { SalesService } from '../../services/sales.service';
import { AuthService } from '../../services/auth.service';

export default defineEventHandler(async (event) => {
  const user = AuthService.getUserFromToken(event);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  
  const body = await readBody(event);
  return await SalesService.createSale({ ...body, userId: user.userId });
});