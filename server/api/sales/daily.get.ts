import { SalesService } from '../../services/sales.service';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const date = query.date ? new Date(query.date as string) : new Date();
  
  return await SalesService.getDailySales(date);
});