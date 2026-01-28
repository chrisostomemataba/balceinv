import { SalesService } from '../../services/sales.service';
import { AuthService } from '../../services/auth';

export default defineEventHandler(async (event) => {
  const user = AuthService.getUserFromToken(event);
  
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' });
  }
  
  return await SalesService.uploadSalesExcel(event, user.userId);
});