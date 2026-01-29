
// server/api/stock-movements/index.post.ts
import { StockMovementsService } from '../../services/stock-movements.service';
import { AuthService } from '../../services/auth.service.ts';

export default defineEventHandler(async (event) => {
  const user = AuthService.getUserFromToken(event);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  
  return await StockMovementsService.create(event, user.userId);
});