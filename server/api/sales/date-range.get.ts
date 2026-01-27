// server/api/sales/date-range.get.ts
import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  if (!query.startDate || !query.endDate) {
    throw createError({ statusCode: 400, message: 'Start date and end date required' });
  }
  
  const startDate = new Date(query.startDate as string);
  const endDate = new Date(query.endDate as string);
  
  return await SalesService.getSalesByDateRange(startDate, endDate);
});