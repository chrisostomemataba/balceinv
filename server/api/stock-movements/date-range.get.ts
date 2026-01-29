
// server/api/stock-movements/date-range.get.ts
import { StockMovementsService } from '../../services/stock-movements.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  if (!query.startDate || !query.endDate) {
    throw createError({ statusCode: 400, message: 'Start date and end date required' });
  }
  
  const startDate = new Date(query.startDate as string);
  const endDate = new Date(query.endDate as string);
  
  return await StockMovementsService.getByDateRange(startDate, endDate);
});
